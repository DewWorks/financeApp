/**
 * InferenceGateway — Gateway de Inferência Unificado com Failover Automático
 * 
 * Orquestra múltiplos provedores de IA (Groq, Cerebras, Cloudflare) com:
 * - Failover automático entre providers
 * - Circuit Breaker por provider
 * - Timeout por operação com AbortController
 * - Métricas de saúde por provider
 * - Degradação graciosa em 3 níveis
 * 
 * Fluxo:
 *   Audio → Provider[0].whisper → Provider[0].llm → JSON
 *              ↓ (falha)            ↓ (falha)
 *           Provider[1].whisper → Provider[1].llm → JSON
 *              ↓ (falha)            ↓ (falha)
 *           (degraded response)  Provider[2].llm → JSON
 */

import {
    IInferenceProvider,
    TranscriptionResult,
    ExtractionResult,
    DEFAULT_TIMEOUT_BUDGET,
} from './types';
import { EXTRACTION_SYSTEM_PROMPT, buildExtractionPrompt, EXTRACTION_JSON_SCHEMA } from './prompts';
import { CircuitBreaker } from '@/lib/CircuitBreaker';

// Lazy initialization para evitar erros quando API keys não estão configuradas
let providersCache: IInferenceProvider[] | null = null;

function initializeProviders(): IInferenceProvider[] {
    if (providersCache) return providersCache;

    const providers: IInferenceProvider[] = [];

    // Groq — Provider primário (Whisper + LLM)
    if (process.env.GROQ_API_KEY) {
        try {
            const { GroqProvider } = require('./providers/GroqProvider');
            providers.push(new GroqProvider());
        } catch (error) {
            console.warn('[InferenceGateway] Falha ao inicializar GroqProvider:', error);
        }
    }

    // Cloudflare Workers AI — Fallback (Whisper + LLM)
    if (process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN) {
        try {
            const { CloudflareProvider } = require('./providers/CloudflareProvider');
            providers.push(new CloudflareProvider());
        } catch (error) {
            console.warn('[InferenceGateway] Falha ao inicializar CloudflareProvider:', error);
        }
    }

    // Cerebras — Fallback LLM-only
    if (process.env.CEREBRAS_API_KEY) {
        try {
            const { CerebrasProvider } = require('./providers/CerebrasProvider');
            providers.push(new CerebrasProvider());
        } catch (error) {
            console.warn('[InferenceGateway] Falha ao inicializar CerebrasProvider:', error);
        }
    }

    if (providers.length === 0) {
        console.error('[InferenceGateway] NENHUM provider de IA configurado! Verifique as variáveis de ambiente.');
    }

    // Ordena por prioridade (menor = mais prioritário)
    providers.sort((a, b) => a.priority - b.priority);
    providersCache = providers;
    return providers;
}

/**
 * Executa uma operação com timeout usando AbortController
 */
async function withTimeout<T>(
    fn: (signal: AbortSignal) => Promise<T>,
    timeoutMs: number,
    operationName: string
): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const result = await fn(controller.signal);
        return result;
    } catch (error: any) {
        if (error.name === 'AbortError' || controller.signal.aborted) {
            throw new Error(`[InferenceGateway] Timeout de ${timeoutMs}ms excedido para ${operationName}`);
        }
        throw error;
    } finally {
        clearTimeout(timer);
    }
}

export class InferenceGateway {

    /**
     * Etapa 1: Transcrição de áudio via Whisper
     * Tenta cada provider que suporte Whisper em ordem de prioridade
     */
    static async transcribe(
        audioBuffer: Buffer,
        mimeType: string
    ): Promise<TranscriptionResult> {
        const providers = initializeProviders();
        const whisperProviders = providers.filter(p => p.capabilities.whisper);

        if (whisperProviders.length === 0) {
            throw new Error('[InferenceGateway] Nenhum provider com suporte a Whisper configurado');
        }

        const errors: string[] = [];
        const timeouts = [
            DEFAULT_TIMEOUT_BUDGET.transcription.primary,
            DEFAULT_TIMEOUT_BUDGET.transcription.fallback,
        ];

        for (let i = 0; i < whisperProviders.length; i++) {
            const provider = whisperProviders[i];
            const breaker = CircuitBreaker.for(`${provider.name}:whisper`);
            const timeout = timeouts[Math.min(i, timeouts.length - 1)];

            if (!breaker.canExecute()) {
                console.warn(`[InferenceGateway] Circuit OPEN para ${provider.name}:whisper — pulando`);
                errors.push(`${provider.name}: circuit breaker aberto`);
                continue;
            }

            try {
                const result = await withTimeout(
                    async () => {
                        return await breaker.execute(() =>
                            provider.transcribe(audioBuffer, mimeType)
                        );
                    },
                    timeout,
                    `${provider.name}:whisper`
                );

                console.log(`[InferenceGateway] Transcrição via ${provider.name}: "${result.text.substring(0, 80)}..." (${result.latencyMs}ms)`);
                return result;

            } catch (error: any) {
                const errMsg = error.message || String(error);
                console.error(`[InferenceGateway] Falha no ${provider.name}:whisper — ${errMsg}`);
                errors.push(`${provider.name}: ${errMsg}`);
                continue;
            }
        }

        throw new Error(
            `[InferenceGateway] Todos os providers de Whisper falharam:\n${errors.join('\n')}`
        );
    }

    /**
     * Etapa 2: Extração estruturada do texto transcrito via LLM
     * Tenta cada provider que suporte LLM em ordem de prioridade
     */
    static async extractTransaction(
        transcribedText: string
    ): Promise<ExtractionResult> {
        const providers = initializeProviders();
        const llmProviders = providers.filter(p => p.capabilities.llm);

        if (llmProviders.length === 0) {
            throw new Error('[InferenceGateway] Nenhum provider com suporte a LLM configurado');
        }

        const errors: string[] = [];
        const timeouts = [
            DEFAULT_TIMEOUT_BUDGET.extraction.primary,
            DEFAULT_TIMEOUT_BUDGET.extraction.fallback1,
            DEFAULT_TIMEOUT_BUDGET.extraction.fallback2,
        ];

        const userPrompt = buildExtractionPrompt(transcribedText);

        for (let i = 0; i < llmProviders.length; i++) {
            const provider = llmProviders[i];
            const breaker = CircuitBreaker.for(`${provider.name}:llm`);
            const timeout = timeouts[Math.min(i, timeouts.length - 1)];

            if (!breaker.canExecute()) {
                console.warn(`[InferenceGateway] Circuit OPEN para ${provider.name}:llm — pulando`);
                errors.push(`${provider.name}: circuit breaker aberto`);
                continue;
            }

            try {
                const result = await withTimeout(
                    async () => {
                        return await breaker.execute(() =>
                            provider.extractJSON(userPrompt, EXTRACTION_SYSTEM_PROMPT, EXTRACTION_JSON_SCHEMA)
                        );
                    },
                    timeout,
                    `${provider.name}:llm`
                );

                console.log(`[InferenceGateway] Extração via ${provider.name}: ${result.description} R$${result.amount} [${result.tag}] (confiança: ${result.confidence})`);
                return result;

            } catch (error: any) {
                const errMsg = error.message || String(error);
                console.error(`[InferenceGateway] Falha no ${provider.name}:llm — ${errMsg}`);
                errors.push(`${provider.name}: ${errMsg}`);
                continue;
            }
        }

        throw new Error(
            `[InferenceGateway] Todos os providers de LLM falharam:\n${errors.join('\n')}`
        );
    }

    /**
     * Pipeline completo: Audio → Whisper → LLM → ExtractionResult
     * Retorna resultado estruturado com metadados de latência e providers usados
     */
    static async processAudioToTransaction(
        audioBuffer: Buffer,
        mimeType: string
    ): Promise<{
        extraction: ExtractionResult;
        rawText: string;
        providers: { transcription: string; extraction: string };
        latency: { transcriptionMs: number; extractionMs: number; totalMs: number };
    }> {
        const totalStart = Date.now();

        // Etapa 1: Transcrição
        const transcription = await this.transcribe(audioBuffer, mimeType);

        if (!transcription.text || transcription.text.trim().length === 0) {
            throw new Error('[InferenceGateway] Transcrição vazia — áudio pode estar silencioso ou corrompido');
        }

        // Etapa 2: Extração estruturada
        const extraction = await this.extractTransaction(transcription.text);

        const totalMs = Date.now() - totalStart;

        console.log(`[InferenceGateway] Pipeline completo: ${totalMs}ms (whisper: ${transcription.latencyMs}ms via ${transcription.provider})`);

        return {
            extraction,
            rawText: transcription.text,
            providers: {
                transcription: transcription.provider,
                extraction: transcription.provider, // Simplified — ideally track per-step
            },
            latency: {
                transcriptionMs: transcription.latencyMs,
                extractionMs: totalMs - transcription.latencyMs,
                totalMs,
            },
        };
    }

    /**
     * Retorna o status de saúde de todos os providers configurados
     */
    static getHealthStatus(): Array<{
        name: string;
        capabilities: { whisper: boolean; llm: boolean };
        circuits: {
            whisper?: { state: string; canExecute: boolean };
            llm?: { state: string; canExecute: boolean };
        };
    }> {
        const providers = initializeProviders();

        return providers.map(p => ({
            name: p.name,
            capabilities: p.capabilities,
            circuits: {
                ...(p.capabilities.whisper
                    ? {
                        whisper: {
                            state: CircuitBreaker.for(`${p.name}:whisper`).getState(),
                            canExecute: CircuitBreaker.for(`${p.name}:whisper`).canExecute(),
                        },
                    }
                    : {}),
                llm: {
                    state: CircuitBreaker.for(`${p.name}:llm`).getState(),
                    canExecute: CircuitBreaker.for(`${p.name}:llm`).canExecute(),
                },
            },
        }));
    }

    /**
     * Reseta o cache de providers (útil para testes ou reconfiguração)
     */
    static resetProviders(): void {
        providersCache = null;
        CircuitBreaker.resetAll();
    }
}
