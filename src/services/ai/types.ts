// ============================================================================
// Tipos e interfaces do sistema de inferência AI (gateway multi-provider)
// ============================================================================

/** Status de saúde de um provedor de inferência */
export type ProviderStatus = 'healthy' | 'degraded' | 'down';

/** Estado do Circuit Breaker para controle de resiliência */
export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

// ============================================================================
// Tipos de resultado
// ============================================================================

/**
 * Resultado da transcrição de áudio para texto.
 * Retornado por qualquer provedor que suporte Whisper ou equivalente.
 */
export interface TranscriptionResult {
  /** Texto transcrito do áudio */
  text: string;
  /** Nome do provedor que realizou a transcrição */
  provider: string;
  /** Latência da transcrição em milissegundos */
  latencyMs: number;
}

/**
 * Resultado da extração estruturada de uma transação financeira.
 * Obtido via LLM a partir do texto transcrito.
 */
export interface ExtractionResult {
  /** Tipo da transação: receita, despesa ou transferência */
  type: 'income' | 'expense' | 'transfer';
  /** Descrição da transação extraída do texto */
  description: string;
  /** Valor monetário da transação */
  amount: number;
  /** Data da transação no formato ISO (YYYY-MM-DD) */
  date: string;
  /** Categoria/tag atribuída à transação */
  tag: string;
  /** Nível de confiança da extração (0 a 1) */
  confidence: number;
}

/**
 * Resposta de sucesso do endpoint de transcrição por voz.
 * Inclui a transação extraída, texto bruto e métricas de latência.
 */
export interface VoiceTranscribeResponse {
  success: true;
  /** Transação financeira extraída do áudio */
  transaction: ExtractionResult;
  /** Texto bruto da transcrição antes da extração */
  rawText: string;
  /** Provedores utilizados em cada etapa do pipeline */
  provider: {
    transcription: string;
    extraction: string;
  };
  /** Métricas de latência de cada etapa */
  latency: {
    transcriptionMs: number;
    extractionMs: number;
    totalMs: number;
  };
}

/**
 * Resposta de erro do endpoint de transcrição por voz.
 * Pode conter texto parcial se a transcrição foi bem-sucedida
 * mas a extração falhou.
 */
export interface VoiceTranscribeErrorResponse {
  success: false;
  /** Mensagem de erro descritiva */
  error: string;
  /** Texto transcrito, presente se a transcrição teve sucesso mas a extração falhou */
  rawText?: string;
  /** Indica se a transação precisa de revisão manual */
  needsManualReview?: boolean;
  /** ID do job caso tenha sido enfileirado para processamento assíncrono */
  jobId?: string;
}

// ============================================================================
// Configuração de provedor
// ============================================================================

/**
 * Configuração completa de um provedor de inferência AI.
 * Define modelos, timeouts e capacidades disponíveis.
 */
export interface ProviderConfig {
  /** Nome identificador do provedor (ex: "groq", "openai", "together") */
  name: string;
  /** Chave de API para autenticação */
  apiKey: string;
  /** URL base da API do provedor */
  baseURL: string;
  /** Modelos disponíveis no provedor */
  models: {
    /** Modelo de transcrição Whisper (opcional, nem todo provedor suporta) */
    whisper?: string;
    /** Modelo LLM para extração estruturada */
    llm: string;
  };
  /** Timeouts em milissegundos para cada operação */
  timeouts: {
    /** Timeout para transcrição de áudio */
    transcription: number;
    /** Timeout para extração via LLM */
    extraction: number;
  };
  /** Capacidades suportadas pelo provedor */
  capabilities: {
    /** Suporte a transcrição Whisper */
    whisper: boolean;
    /** Suporte a inferência LLM */
    llm: boolean;
    /** Suporte a modo JSON estruturado */
    jsonMode: boolean;
  };
}

// ============================================================================
// Interface do provedor de inferência
// ============================================================================

/**
 * Contrato que todo provedor de inferência deve implementar.
 * Permite fallback transparente entre provedores diferentes.
 */
export interface IInferenceProvider {
  /** Nome identificador do provedor */
  readonly name: string;
  /** Prioridade de uso (menor = maior prioridade) */
  readonly priority: number;
  /** Capacidades suportadas pelo provedor */
  readonly capabilities: { whisper: boolean; llm: boolean; jsonMode: boolean };

  /**
   * Transcreve um buffer de áudio para texto.
   * @param audioBuffer - Buffer contendo os dados de áudio
   * @param mimeType - Tipo MIME do áudio (ex: "audio/webm")
   */
  transcribe(audioBuffer: Buffer, mimeType: string): Promise<TranscriptionResult>;

  /**
   * Extrai dados estruturados de um texto usando LLM.
   * @param text - Texto de entrada (geralmente transcrição)
   * @param systemPrompt - Prompt de sistema para guiar a extração
   * @param jsonSchema - Schema JSON opcional para validação da saída
   */
  extractJSON(text: string, systemPrompt: string, jsonSchema?: object): Promise<ExtractionResult>;
}

// ============================================================================
// Monitoramento de saúde do provedor
// ============================================================================

/**
 * Estado de saúde e métricas de um provedor de inferência.
 * Usado pelo sistema de fallback para decidir roteamento.
 */
export interface ProviderHealth {
  /** Nome do provedor */
  name: string;
  /** Status atual de saúde */
  status: ProviderStatus;
  /** Estado atual do circuit breaker */
  circuitState: CircuitState;
  /** Timestamp do último sucesso */
  lastSuccess?: Date;
  /** Timestamp da última falha */
  lastFailure?: Date;
  /** Latência média em milissegundos */
  avgLatencyMs: number;
  /** Taxa de erro (0 a 1, onde 1 = 100% de falhas) */
  errorRate: number;
}

// ============================================================================
// Configuração de timeout
// ============================================================================

/**
 * Budget de timeout para cada etapa do pipeline de voz.
 * Garante que o request total caiba dentro do limite serverless.
 */
export interface TimeoutBudget {
  /** Timeout para validação do áudio recebido (ms) */
  audioValidation: number;
  /** Timeouts para transcrição com fallback (ms) */
  transcription: { primary: number; fallback: number };
  /** Timeouts para extração com múltiplos fallbacks (ms) */
  extraction: { primary: number; fallback1: number; fallback2: number };
  /** Timeout para gravação no banco de dados (ms) */
  dbWrite: number;
}

/** Budget de timeout padrão para o pipeline de voz (total ~24.5s) */
export const DEFAULT_TIMEOUT_BUDGET: TimeoutBudget = {
  audioValidation: 500,
  transcription: { primary: 5000, fallback: 5000 },
  extraction: { primary: 4000, fallback1: 4000, fallback2: 4000 },
  dbWrite: 1500,
};

// ============================================================================
// Constantes de áudio
// ============================================================================

/** Tipos MIME de áudio suportados pelo pipeline de transcrição */
export const SUPPORTED_AUDIO_TYPES = [
  'audio/webm',
  'audio/ogg',
  'audio/mp3',
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'audio/x-m4a',
  'audio/flac',
] as const;

/** Tamanho máximo do arquivo de áudio em bytes (10 MB) */
export const MAX_AUDIO_SIZE_BYTES = 10 * 1024 * 1024;
