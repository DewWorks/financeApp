/**
 * POST /api/voice/transcribe
 * 
 * Pipeline completo de voz → transação:
 * 1. Recebe FormData com arquivo de áudio
 * 2. Valida formato e tamanho
 * 3. Whisper transcrição (Groq → Cloudflare fallback)
 * 4. LLM extração estruturada (Groq → Cerebras → Cloudflare fallback)
 * 5. Salva transação no MongoDB
 * 6. Retorna transação criada + metadados
 * 
 * Degradação graciosa:
 * - Nível 1: Pipeline completo → transação automática
 * - Nível 2: Whisper OK + LLM falhou → retorna texto + needsManualReview
 * - Nível 3: Tudo falhou → 202 Accepted + processamento assíncrono
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { getMongoClient } from "@/db/connectionDb";
import { InferenceGateway } from "@/services/ai/InferenceGateway";
import { resolveRelativeDate } from "@/services/ai/prompts";
import {
    SUPPORTED_AUDIO_TYPES,
    MAX_AUDIO_SIZE_BYTES,
    VoiceTranscribeResponse,
    VoiceTranscribeErrorResponse,
} from "@/services/ai/types";

import { SystemLogger } from "@/lib/SystemLogger";

// Timeout máximo para esta rota serverless (Vercel Pro)
export const maxDuration = 25;

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

async function getUserIdFromToken(): Promise<string | null> {
    const token = (await cookies()).get("auth_token")?.value;
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        return decoded.userId;
    } catch {
        return null;
    }
}

export async function POST(request: Request) {
    const startTime = Date.now();

    try {
        // 1. Autenticação
        const userId = await getUserIdFromToken();
        if (!userId) {
            return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
        }

        // 2. Extrair áudio do FormData
        const formData = await request.formData();
        const audioFile = formData.get("audio") as File | null;
        const locale = (formData.get("locale") as string) || "pt-BR";

        if (!audioFile) {
            return NextResponse.json(
                { success: false, error: "Campo 'audio' é obrigatório no FormData" },
                { status: 400 }
            );
        }

        // 3. Validação de formato e tamanho
        const mimeType = audioFile.type || "audio/webm";
        const baseMimeType = mimeType.split(';')[0];
        if (!SUPPORTED_AUDIO_TYPES.includes(baseMimeType as any)) {
            return NextResponse.json(
                { success: false, error: `Formato de áudio não suportado: ${mimeType}. Use: ${SUPPORTED_AUDIO_TYPES.join(", ")}` },
                { status: 400 }
            );
        }

        if (audioFile.size > MAX_AUDIO_SIZE_BYTES) {
            return NextResponse.json(
                { success: false, error: `Arquivo excede o tamanho máximo de ${MAX_AUDIO_SIZE_BYTES / 1024 / 1024}MB` },
                { status: 400 }
            );
        }

        if (audioFile.size === 0) {
            return NextResponse.json(
                { success: false, error: "Arquivo de áudio está vazio" },
                { status: 400 }
            );
        }

        // 4. Converter File para Buffer
        const arrayBuffer = await audioFile.arrayBuffer();
        const audioBuffer = Buffer.from(arrayBuffer);

        // 5. Executar pipeline de IA (Whisper → LLM)
        let rawText = "";
        try {
            const result = await InferenceGateway.processAudioToTransaction(audioBuffer, mimeType);
            rawText = result.rawText;

            // 6. Resolver datas relativas (TODAY, YESTERDAY, etc.)
            const resolvedDate = resolveRelativeDate(result.extraction.date);

            // 7. Salvar transação no MongoDB
            const client = await getMongoClient();
            const db = client.db("financeApp");

            const transaction = {
                userId: new ObjectId(userId),
                type: result.extraction.type,
                description: result.extraction.description,
                amount: result.extraction.amount,
                date: new Date(`${resolvedDate}T12:00:00.000Z`),
                tag: result.extraction.tag,
                provider: "voice" as const,
                createdAt: new Date(),
            };

            const insertResult = await db.collection("transactions").insertOne(transaction);

            // 8. Triggers assíncronos (não bloqueia a resposta)
            triggerAsyncSideEffects(userId, result.extraction.tag, result.extraction.amount);

            // 9. Resposta de sucesso
            const response: VoiceTranscribeResponse = {
                success: true,
                transaction: result.extraction,
                rawText: result.rawText,
                provider: result.providers,
                latency: result.latency,
            };

            console.log(`[VoiceTranscribe] Pipeline completo em ${Date.now() - startTime}ms — ${result.extraction.description} R$${result.extraction.amount}`);

            return NextResponse.json(response, { status: 201 });

        } catch (pipelineError: any) {
            // Degradação Nível 2: Whisper OK mas LLM falhou
            if (rawText && pipelineError.message?.includes('LLM')) {
                SystemLogger.warn(`[VoiceTranscribe] Degradação Nível 2 — texto transcrito mas extração falhou: ${pipelineError.message}`);

                return NextResponse.json({
                    success: false,
                    error: "Transcrição OK, mas não conseguimos extrair os dados automaticamente.",
                    rawText,
                    needsManualReview: true,
                } as VoiceTranscribeErrorResponse, { status: 207 }); // 207 Multi-Status
            }

            // Degradação Nível 3: Tudo falhou — enfileira para processamento assíncrono
            SystemLogger.error(`[VoiceTranscribe] Degradação Nível 3 — enfileirando para processamento assíncrono`, { error: pipelineError.message, stack: pipelineError.stack });

            try {
                const jobId = await queueForAsyncProcessing(userId, audioBuffer, mimeType);

                return NextResponse.json({
                    success: false,
                    error: "Todos os serviços de IA estão temporariamente indisponíveis.",
                    jobId,
                    needsManualReview: false,
                } as VoiceTranscribeErrorResponse, { status: 202 });
            } catch (queueError: any) {
                SystemLogger.error(`[VoiceTranscribe] Falha ao enfileirar job assíncrono`, { error: queueError.message });

                return NextResponse.json({
                    success: false,
                    error: "Serviços de IA indisponíveis. Por favor, tente novamente em alguns instantes.",
                } as VoiceTranscribeErrorResponse, { status: 503 });
            }
        }

    } catch (error: any) {
        SystemLogger.error("[VoiceTranscribe] Erro inesperado", { error: error.message, stack: error.stack });
        return NextResponse.json(
            { success: false, error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}

/**
 * Enfileira áudio para processamento assíncrono quando todos os providers falham.
 * Salva no MongoDB para ser processado por um cron job posterior.
 */
async function queueForAsyncProcessing(
    userId: string,
    audioBuffer: Buffer,
    mimeType: string
): Promise<string> {
    const client = await getMongoClient();
    const db = client.db("financeApp");

    const job = {
        userId: new ObjectId(userId),
        audioBase64: audioBuffer.toString("base64"),
        mimeType,
        status: "pending" as const,
        attempts: 0,
        maxAttempts: 5,
        createdAt: new Date(),
        lastAttemptAt: null,
        result: null,
        error: null,
    };

    const result = await db.collection("pending_voice_jobs").insertOne(job);

    console.log(`[VoiceTranscribe] Job ${result.insertedId} enfileirado para processamento assíncrono`);

    return result.insertedId.toString();
}

/**
 * Dispara side effects assíncronos sem bloquear a resposta.
 * Errors são logados mas nunca propagados.
 */
function triggerAsyncSideEffects(userId: string, category: string, amount: number): void {
    // Smart Alerts
    import("@/services/NotificationService").then(({ NotificationService }) => {
        new NotificationService().checkAndSendAlerts(userId).catch(e =>
            console.error("[VoiceTranscribe] Alert Error:", e)
        );
    }).catch(() => { });

    // Budget Guardian
    import("@/services/BudgetGuardianService").then(({ BudgetGuardianService }) => {
        BudgetGuardianService.checkThresholds(userId, category, amount).catch(e =>
            console.error("[VoiceTranscribe] BudgetGuardian Error:", e)
        );
    }).catch(() => { });
}
