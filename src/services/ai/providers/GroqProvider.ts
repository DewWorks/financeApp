/**
 * Groq Provider — Provider primário para Whisper + LLM
 * 
 * Hardware: LPU (Language Processing Unit) customizado
 * Whisper: ~260ms para 30s de áudio
 * LLM TTFT: ~45ms
 * Free tier: ~1.000 req/dia, ~30 RPM
 * API: OpenAI-compatible
 */

import OpenAI from 'openai';
import { IInferenceProvider, TranscriptionResult, ExtractionResult } from '../types';

export class GroqProvider implements IInferenceProvider {
    readonly name = 'groq';
    readonly priority = 1;
    readonly capabilities = { whisper: true, llm: true, jsonMode: true };

    private client: OpenAI;
    private whisperModel: string;
    private llmModel: string;

    constructor() {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            throw new Error('[GroqProvider] GROQ_API_KEY não definida');
        }

        this.client = new OpenAI({
            apiKey,
            baseURL: 'https://api.groq.com/openai/v1',
        });

        this.whisperModel = process.env.AI_WHISPER_MODEL || 'whisper-large-v3';
        this.llmModel = process.env.AI_LLM_MODEL || 'llama-3.3-70b-versatile';
    }

    async transcribe(audioBuffer: Buffer, mimeType: string): Promise<TranscriptionResult> {
        const start = Date.now();

        // Converte Buffer para File-like object para a API OpenAI
        const extension = this.getExtensionFromMime(mimeType);
        const file = new File([audioBuffer], `audio.${extension}`, { type: mimeType });

        const response = await this.client.audio.transcriptions.create({
            file,
            model: this.whisperModel,
            language: 'pt',
            response_format: 'text',
        });

        const latencyMs = Date.now() - start;
        const text = typeof response === 'string' ? response : (response as any).text || '';

        console.log(`[GroqProvider] Whisper transcription: ${latencyMs}ms, ${text.length} chars`);

        return {
            text: text.trim(),
            provider: this.name,
            latencyMs,
        };
    }

    async extractJSON(
        text: string,
        systemPrompt: string,
        jsonSchema?: object
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
            throw new Error('[GroqProvider] Resposta vazia do LLM');
        }

        console.log(`[GroqProvider] LLM extraction: ${latencyMs}ms`);

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

    private getExtensionFromMime(mimeType: string): string {
        const map: Record<string, string> = {
            'audio/webm': 'webm',
            'audio/ogg': 'ogg',
            'audio/mp3': 'mp3',
            'audio/mpeg': 'mp3',
            'audio/mp4': 'mp4',
            'audio/wav': 'wav',
            'audio/x-m4a': 'm4a',
            'audio/flac': 'flac',
        };
        return map[mimeType] || 'webm';
    }
}
