/**
 * Cerebras Provider — Fallback LLM-only (sem Whisper)
 * 
 * Hardware: Wafer-Scale Engine (WSE-3) — chip único massivo
 * Velocidade: 2.000–2.600+ tokens/seg — o LLM mais rápido disponível
 * Free tier: 1.000.000 tokens/dia (~30 RPM), sem cartão de crédito
 * API: OpenAI-compatible
 * 
 * ⚠️ NÃO suporta Whisper/transcrição de áudio
 */

import OpenAI from 'openai';
import { IInferenceProvider, TranscriptionResult, ExtractionResult } from '../types';

export class CerebrasProvider implements IInferenceProvider {
    readonly name = 'cerebras';
    readonly priority = 3;
    readonly capabilities = { whisper: false, llm: true, jsonMode: true };

    private client: OpenAI;
    private llmModel: string;

    constructor() {
        const apiKey = process.env.CEREBRAS_API_KEY;
        if (!apiKey) {
            throw new Error('[CerebrasProvider] CEREBRAS_API_KEY não definida');
        }

        this.client = new OpenAI({
            apiKey,
            baseURL: 'https://api.cerebras.ai/v1',
        });

        this.llmModel = process.env.CEREBRAS_LLM_MODEL || 'llama-3.3-70b';
    }

    async transcribe(_audioBuffer: Buffer, _mimeType: string): Promise<TranscriptionResult> {
        throw new Error('[CerebrasProvider] Whisper não suportado — use Groq ou Cloudflare para transcrição');
    }

    async extractJSON(
        text: string,
        systemPrompt: string,
        _jsonSchema?: object
    ): Promise<ExtractionResult> {
        const start = Date.now();

        const response = await this.client.chat.completions.create({
            model: this.llmModel,
            temperature: 0,
            max_tokens: 512,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: text },
            ],
        });

        const latencyMs = Date.now() - start;
        const content = response.choices[0]?.message?.content;

        if (!content) {
            throw new Error('[CerebrasProvider] Resposta vazia do LLM');
        }

        console.log(`[CerebrasProvider] LLM extraction: ${latencyMs}ms (${this.llmModel})`);

        const parsed = JSON.parse(content);
        return this.validateExtraction(parsed);
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
