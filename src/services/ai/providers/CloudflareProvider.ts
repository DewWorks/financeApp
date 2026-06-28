/**
 * Cloudflare Workers AI Provider — Fallback Whisper + LLM
 * 
 * Hardware: Edge GPU network (H100s, H200s) com Infire engine
 * Free tier: 10.000 Neurons/dia (sem cartão de crédito)
 * Whisper: @cf/openai/whisper (variável, 1-5s dependendo de cold start)
 * LLM: @cf/meta/llama-3.1-8b-instruct
 * API: REST própria (NÃO OpenAI-compatible nativo — usa fetch direto)
 * 
 * ⚠️ Latência variável — usado como fallback de último recurso
 */

import { IInferenceProvider, TranscriptionResult, ExtractionResult } from '../types';

const CF_API_BASE = 'https://api.cloudflare.com/client/v4/accounts';

export class CloudflareProvider implements IInferenceProvider {
    readonly name = 'cloudflare';
    readonly priority = 2;
    readonly capabilities = { whisper: true, llm: true, jsonMode: false };

    private accountId: string;
    private apiToken: string;
    private whisperModel: string;
    private llmModel: string;

    constructor() {
        const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
        const apiToken = process.env.CLOUDFLARE_API_TOKEN;

        if (!accountId || !apiToken) {
            throw new Error('[CloudflareProvider] CLOUDFLARE_ACCOUNT_ID e CLOUDFLARE_API_TOKEN são obrigatórios');
        }

        this.accountId = accountId;
        this.apiToken = apiToken;
        this.whisperModel = process.env.CLOUDFLARE_WHISPER_MODEL || '@cf/openai/whisper';
        this.llmModel = process.env.CLOUDFLARE_LLM_MODEL || '@cf/meta/llama-3.1-8b-instruct';
    }

    async transcribe(audioBuffer: Buffer, _mimeType: string): Promise<TranscriptionResult> {
        const start = Date.now();
        const url = `${CF_API_BASE}/${this.accountId}/ai/run/${this.whisperModel}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiToken}`,
            },
            body: audioBuffer,
        });

        if (!response.ok) {
            const errorBody = await response.text().catch(() => 'Unknown error');
            throw new Error(`[CloudflareProvider] Whisper falhou (${response.status}): ${errorBody}`);
        }

        const data = await response.json() as {
            success: boolean;
            result: { text: string; vtt?: string };
            errors?: any[];
        };

        if (!data.success || !data.result?.text) {
            throw new Error(`[CloudflareProvider] Resposta inválida do Whisper: ${JSON.stringify(data.errors)}`);
        }

        const latencyMs = Date.now() - start;
        console.log(`[CloudflareProvider] Whisper transcription: ${latencyMs}ms, ${data.result.text.length} chars`);

        return {
            text: data.result.text.trim(),
            provider: this.name,
            latencyMs,
        };
    }

    async extractJSON(
        text: string,
        systemPrompt: string,
        _jsonSchema?: object
    ): Promise<ExtractionResult> {
        const start = Date.now();
        const url = `${CF_API_BASE}/${this.accountId}/ai/run/${this.llmModel}`;

        // Cloudflare Workers AI usa formato de messages similar ao OpenAI
        // mas sem JSON mode nativo — instruímos via prompt
        const promptWithJsonInstruction = `${systemPrompt}\n\nIMPORTANTE: Responda APENAS com JSON válido. Sem markdown, sem explicações, sem texto antes ou depois do JSON.`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: promptWithJsonInstruction },
                    { role: 'user', content: text },
                ],
                max_tokens: 512,
                temperature: 0,
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text().catch(() => 'Unknown error');
            throw new Error(`[CloudflareProvider] LLM falhou (${response.status}): ${errorBody}`);
        }

        const data = await response.json() as {
            success: boolean;
            result: { response: string };
            errors?: any[];
        };

        if (!data.success || !data.result?.response) {
            throw new Error(`[CloudflareProvider] Resposta inválida do LLM: ${JSON.stringify(data.errors)}`);
        }

        const latencyMs = Date.now() - start;
        const rawContent = data.result.response;

        console.log(`[CloudflareProvider] LLM extraction: ${latencyMs}ms`);

        // Cloudflare não tem JSON mode — precisa fazer parse manual
        const parsed = this.parseJsonFromText(rawContent);
        return this.validateExtraction(parsed);
    }

    /**
     * Extrai JSON de texto que pode conter markdown code blocks ou texto extra
     */
    private parseJsonFromText(text: any): any {
        if (typeof text !== 'string') {
            return text;
        }

        // Tenta parse direto primeiro
        try {
            return JSON.parse(text.trim());
        } catch {
            // Tenta extrair JSON de code blocks
            const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1].trim());
            }

            // Tenta encontrar o primeiro { ... } no texto
            const braceMatch = text.match(/\{[\s\S]*\}/);
            if (braceMatch) {
                return JSON.parse(braceMatch[0]);
            }

            throw new Error(`[CloudflareProvider] Não foi possível extrair JSON da resposta: ${text.substring(0, 200)}`);
        }
    }

    private validateExtraction(raw: any): ExtractionResult {
        return {
            type: raw.type || 'expense',
            description: raw.description || 'Transação',
            amount: Math.abs(Number(raw.amount) || 0),
            date: raw.date || 'TODAY',
            tag: raw.tag || 'Outros',
            confidence: Math.min(1, Math.max(0, Number(raw.confidence) || 0.5)),
        };
    }
}
