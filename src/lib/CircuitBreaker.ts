// ============================================================================
// Circuit Breaker — Resiliência para provedores de inferência AI
// ============================================================================
// Implementação in-memory adequada para ambientes serverless onde cada
// instância mantém seu próprio estado. Em caso de cold start, o circuit
// breaker reinicia no estado CLOSED (comportamento seguro).
// ============================================================================

import { CircuitState } from '@/services/ai/types';

/** Configuração do Circuit Breaker */
interface CircuitBreakerConfig {
  /** Número de falhas necessárias para abrir o circuito */
  failureThreshold: number;
  /** Janela de tempo para contagem de falhas (ms) */
  windowMs: number;
  /** Tempo de espera antes de tentar novamente após abertura (ms) */
  cooldownMs: number;
}

/** Configuração padrão do Circuit Breaker */
const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  windowMs: 60_000,
  cooldownMs: 30_000,
};

/**
 * Circuit Breaker para controle de resiliência de provedores de inferência.
 *
 * Padrão de estados:
 * - **CLOSED**: Operação normal, chamadas são encaminhadas ao provedor.
 * - **OPEN**: Circuito aberto após falhas excessivas, chamadas são bloqueadas.
 * - **HALF_OPEN**: Período de teste após cooldown, uma chamada é permitida.
 *
 * Transições:
 * - `CLOSED → OPEN`: Após atingir `failureThreshold` falhas dentro de `windowMs`.
 * - `OPEN → HALF_OPEN`: Automaticamente após `cooldownMs` ter decorrido.
 * - `HALF_OPEN → CLOSED`: Após uma chamada bem-sucedida.
 * - `HALF_OPEN → OPEN`: Após uma falha durante o teste.
 *
 * @example
 * ```typescript
 * const cb = CircuitBreaker.for('groq');
 *
 * try {
 *   const result = await cb.execute(() => provider.transcribe(audio, mime));
 *   console.log('Transcrição:', result.text);
 * } catch (error) {
 *   console.error('Falha no provedor groq:', error);
 * }
 * ```
 */
export class CircuitBreaker {
  // ── Registro estático de instâncias (singleton por provedor) ──────────
  private static readonly registry = new Map<string, CircuitBreaker>();

  /**
   * Retorna a instância singleton do Circuit Breaker para o provedor informado.
   * Se não existir, cria uma nova instância com a configuração fornecida.
   *
   * @param providerName - Nome único do provedor (ex: "groq", "openai")
   * @param config - Configuração opcional (usada apenas na criação)
   */
  static for(providerName: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    const existing = CircuitBreaker.registry.get(providerName);
    if (existing) return existing;

    const instance = new CircuitBreaker(providerName, {
      ...DEFAULT_CONFIG,
      ...config,
    });
    CircuitBreaker.registry.set(providerName, instance);
    return instance;
  }

  /**
   * Retorna todas as instâncias registradas de Circuit Breakers.
   * Útil para endpoints de health check e monitoramento.
   */
  static getAllInstances(): Map<string, CircuitBreaker> {
    return new Map(CircuitBreaker.registry);
  }

  /**
   * Reseta o registro global. Usar apenas em testes.
   */
  static resetAll(): void {
    CircuitBreaker.registry.clear();
  }

  // ── Estado interno ────────────────────────────────────────────────────
  private state: CircuitState = 'CLOSED';
  private failures: number[] = [];
  private lastFailureTime: number = 0;
  private successCount: number = 0;
  private totalCalls: number = 0;

  private constructor(
    public readonly providerName: string,
    private readonly config: CircuitBreakerConfig,
  ) {}

  // ── API pública ───────────────────────────────────────────────────────

  /**
   * Retorna o estado atual do circuit breaker, avaliando
   * automaticamente a transição de OPEN → HALF_OPEN se o
   * cooldown já tiver expirado.
   */
  getState(): CircuitState {
    if (this.state === 'OPEN' && this.hasCooldownElapsed()) {
      this.transitionTo('HALF_OPEN');
    }
    return this.state;
  }

  /**
   * Verifica se o circuit breaker permite execução no momento.
   * Não altera o estado — apenas consulta.
   *
   * @returns `true` se chamadas podem ser feitas ao provedor
   */
  canExecute(): boolean {
    const currentState = this.getState();
    return currentState === 'CLOSED' || currentState === 'HALF_OPEN';
  }

  /**
   * Executa uma função protegida pelo circuit breaker.
   * Bloqueia a chamada se o circuito estiver OPEN e registra
   * sucesso/falha automaticamente para gerenciar transições.
   *
   * @param fn - Função assíncrona a ser executada
   * @throws Error se o circuito estiver aberto
   * @throws Re-lança erros da função original após registrar a falha
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.canExecute()) {
      throw new Error(
        `[CircuitBreaker] Circuito ABERTO para o provedor "${this.providerName}". ` +
        `Aguardando cooldown de ${this.config.cooldownMs}ms antes de nova tentativa.`
      );
    }

    this.totalCalls++;

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  /**
   * Registra manualmente um sucesso.
   * Usado quando o controle de execução é feito externamente.
   *
   * - Em HALF_OPEN: transiciona para CLOSED (provedor recuperado).
   * - Em CLOSED: incrementa contador de sucesso.
   */
  recordSuccess(): void {
    this.successCount++;

    if (this.state === 'HALF_OPEN') {
      this.reset();
      this.transitionTo('CLOSED');
      console.log(
        `[CircuitBreaker] Provedor "${this.providerName}" recuperado. Circuito FECHADO.`
      );
    }
  }

  /**
   * Registra manualmente uma falha.
   * Usado quando o controle de execução é feito externamente.
   *
   * - Em HALF_OPEN: transiciona imediatamente para OPEN.
   * - Em CLOSED: adiciona à janela de falhas e avalia threshold.
   */
  recordFailure(): void {
    const now = Date.now();
    this.lastFailureTime = now;

    if (this.state === 'HALF_OPEN') {
      this.transitionTo('OPEN');
      console.warn(
        `[CircuitBreaker] Falha em HALF_OPEN para "${this.providerName}". ` +
        `Circuito reaberto. Próxima tentativa em ${this.config.cooldownMs}ms.`
      );
      return;
    }

    // Em CLOSED: adicionar falha à janela e verificar threshold
    this.failures.push(now);
    this.pruneOldFailures();

    if (this.failures.length >= this.config.failureThreshold) {
      this.transitionTo('OPEN');
      console.warn(
        `[CircuitBreaker] Threshold atingido para "${this.providerName}" ` +
        `(${this.failures.length}/${this.config.failureThreshold} falhas em ${this.config.windowMs}ms). ` +
        `Circuito ABERTO.`
      );
    }
  }

  /**
   * Retorna métricas do circuit breaker para monitoramento.
   */
  getMetrics(): {
    providerName: string;
    state: CircuitState;
    recentFailures: number;
    totalCalls: number;
    successCount: number;
    errorRate: number;
    lastFailureTime: number;
    config: CircuitBreakerConfig;
  } {
    this.pruneOldFailures();
    return {
      providerName: this.providerName,
      state: this.getState(),
      recentFailures: this.failures.length,
      totalCalls: this.totalCalls,
      successCount: this.successCount,
      errorRate: this.totalCalls > 0
        ? (this.totalCalls - this.successCount) / this.totalCalls
        : 0,
      lastFailureTime: this.lastFailureTime,
      config: { ...this.config },
    };
  }

  /**
   * Reseta o circuit breaker para o estado inicial.
   * Limpa todas as falhas e contadores.
   */
  reset(): void {
    this.failures = [];
    this.lastFailureTime = 0;
    this.successCount = 0;
    this.totalCalls = 0;
  }

  // ── Métodos internos ─────────────────────────────────────────────────

  /**
   * Verifica se o tempo de cooldown já passou desde a última falha.
   */
  private hasCooldownElapsed(): boolean {
    return Date.now() - this.lastFailureTime >= this.config.cooldownMs;
  }

  /**
   * Remove falhas fora da janela de tempo configurada.
   */
  private pruneOldFailures(): void {
    const cutoff = Date.now() - this.config.windowMs;
    this.failures = this.failures.filter((timestamp) => timestamp > cutoff);
  }

  /**
   * Realiza a transição de estado com log para rastreabilidade.
   */
  private transitionTo(newState: CircuitState): void {
    const previousState = this.state;
    this.state = newState;

    if (previousState !== newState) {
      console.log(
        `[CircuitBreaker] "${this.providerName}": ${previousState} → ${newState}`
      );
    }
  }
}
