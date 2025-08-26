import { 
  IAIService, 
  GenerationOptions, 
  AIGenerationResult, 
  ValidationResult 
} from './IAIService';

enum CircuitState {
  CLOSED = 'CLOSED',     // Нормальная работа
  OPEN = 'OPEN',         // Сервис недоступен
  HALF_OPEN = 'HALF_OPEN' // Тестирование восстановления
}

interface CircuitBreakerConfig {
  failureThreshold: number;     // Количество ошибок для открытия
  recoveryTimeout: number;      // Время ожидания перед попыткой восстановления (мс)
  successThreshold: number;     // Количество успешных запросов для закрытия
  monitoringWindow: number;     // Окно мониторинга ошибок (мс)
}

interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  totalRequests: number;
  totalFailures: number;
}

export class CircuitBreakerAIService implements IAIService {
  private readonly config: CircuitBreakerConfig;
  private stats: CircuitBreakerStats;
  private readonly wrappedService: IAIService;
  private failures: Date[] = []; // Массив времени ошибок для скользящего окна

  constructor(
    wrappedService: IAIService, 
    config?: Partial<CircuitBreakerConfig>
  ) {
    this.wrappedService = wrappedService;
    this.config = {
      failureThreshold: config?.failureThreshold || 5,
      recoveryTimeout: config?.recoveryTimeout || 60000, // 1 минута
      successThreshold: config?.successThreshold || 3,
      monitoringWindow: config?.monitoringWindow || 300000, // 5 минут
      ...config
    };

    this.stats = {
      state: CircuitState.CLOSED,
      failureCount: 0,
      successCount: 0,
      totalRequests: 0,
      totalFailures: 0
    };

    console.info('[CircuitBreakerAIService] Инициализирован с конфигурацией:', this.config);
  }

  async generate(prompt: string, options?: GenerationOptions): Promise<AIGenerationResult> {
    this.stats.totalRequests++;

    // Проверяем состояние circuit breaker
    if (this.stats.state === CircuitState.OPEN) {
      if (this.shouldAttemptRecovery()) {
        this.stats.state = CircuitState.HALF_OPEN;
        this.stats.successCount = 0;
        console.info('[CircuitBreakerAIService] Переход в HALF_OPEN состояние для тестирования восстановления');
      } else {
        throw new Error(`Circuit breaker OPEN. Сервис недоступен. Попробуйте через ${this.getTimeUntilRecovery()}мс`);
      }
    }

    try {
      const result = await this.wrappedService.generate(prompt, options);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    if (this.stats.state === CircuitState.OPEN) {
      return false;
    }

    try {
      const result = await this.wrappedService.isAvailable();
      if (result) {
        this.onSuccess();
      } else {
        this.onFailure(new Error('Service unavailable'));
      }
      return result;
    } catch (error) {
      this.onFailure(error);
      return false;
    }
  }

  async getUsageStats() {
    const wrappedStats = await this.wrappedService.getUsageStats();
    return {
      ...wrappedStats,
      circuitBreaker: {
        state: this.stats.state,
        failureCount: this.stats.failureCount,
        successCount: this.stats.successCount,
        totalRequests: this.stats.totalRequests,
        totalFailures: this.stats.totalFailures,
        failureRate: this.stats.totalRequests > 0 ? 
          (this.stats.totalFailures / this.stats.totalRequests) * 100 : 0,
        timeUntilRecovery: this.stats.state === CircuitState.OPEN ? 
          this.getTimeUntilRecovery() : 0
      }
    };
  }

  validateContent(content: string): ValidationResult {
    return this.wrappedService.validateContent(content);
  }

  // Получение статистики Circuit Breaker
  getCircuitBreakerStats(): CircuitBreakerStats {
    return { ...this.stats };
  }

  // Принудительное открытие circuit breaker (для тестирования)
  forceOpen(): void {
    this.stats.state = CircuitState.OPEN;
    this.stats.lastFailureTime = new Date();
    console.warn('[CircuitBreakerAIService] Circuit breaker принудительно открыт');
  }

  // Принудительное закрытие circuit breaker
  forceClose(): void {
    this.stats.state = CircuitState.CLOSED;
    this.stats.failureCount = 0;
    this.stats.successCount = 0;
    this.failures = [];
    console.info('[CircuitBreakerAIService] Circuit breaker принудительно закрыт');
  }

  // Приватные методы
  private onSuccess(): void {
    this.stats.successCount++;
    this.stats.lastSuccessTime = new Date();

    // Очищаем старые ошибки из скользящего окна
    this.cleanupOldFailures();

    if (this.stats.state === CircuitState.HALF_OPEN) {
      console.info(`[CircuitBreakerAIService] Успешный запрос в HALF_OPEN (${this.stats.successCount}/${this.config.successThreshold})`);
      
      if (this.stats.successCount >= this.config.successThreshold) {
        this.stats.state = CircuitState.CLOSED;
        this.stats.failureCount = 0;
        this.failures = [];
        console.info('[CircuitBreakerAIService] Circuit breaker закрыт - сервис восстановлен');
      }
    }
  }

  private onFailure(error: any): void {
    this.stats.failureCount++;
    this.stats.totalFailures++;
    this.stats.lastFailureTime = new Date();
    this.failures.push(new Date());

    console.warn(`[CircuitBreakerAIService] Ошибка запроса (${this.stats.failureCount}/${this.config.failureThreshold}):`, error?.message || 'Unknown error');

    // Очищаем старые ошибки из скользящего окна
    this.cleanupOldFailures();

    // Проверяем, нужно ли открыть circuit breaker
    if (this.stats.state === CircuitState.CLOSED) {
      const recentFailures = this.failures.length;
      if (recentFailures >= this.config.failureThreshold) {
        this.stats.state = CircuitState.OPEN;
        console.error(`[CircuitBreakerAIService] Circuit breaker открыт - слишком много ошибок (${recentFailures})`);
      }
    } else if (this.stats.state === CircuitState.HALF_OPEN) {
      // В состоянии HALF_OPEN любая ошибка возвращает нас в OPEN
      this.stats.state = CircuitState.OPEN;
      this.stats.successCount = 0;
      console.warn('[CircuitBreakerAIService] Возврат в OPEN состояние после ошибки в HALF_OPEN');
    }
  }

  private shouldAttemptRecovery(): boolean {
    if (!this.stats.lastFailureTime) {
      return true;
    }

    const timeSinceLastFailure = Date.now() - this.stats.lastFailureTime.getTime();
    return timeSinceLastFailure >= this.config.recoveryTimeout;
  }

  private getTimeUntilRecovery(): number {
    if (!this.stats.lastFailureTime) {
      return 0;
    }

    const timeSinceLastFailure = Date.now() - this.stats.lastFailureTime.getTime();
    return Math.max(0, this.config.recoveryTimeout - timeSinceLastFailure);
  }

  private cleanupOldFailures(): void {
    const cutoffTime = Date.now() - this.config.monitoringWindow;
    this.failures = this.failures.filter(failureTime => 
      failureTime.getTime() > cutoffTime
    );
  }
}

// Factory для создания Circuit Breaker AI Service
export class CircuitBreakerAIServiceFactory {
  static create(
    wrappedService: IAIService,
    config?: Partial<CircuitBreakerConfig>
  ): CircuitBreakerAIService {
    return new CircuitBreakerAIService(wrappedService, config);
  }

  static createWithDefaultConfig(wrappedService: IAIService): CircuitBreakerAIService {
    return new CircuitBreakerAIService(wrappedService, {
      failureThreshold: 3,
      recoveryTimeout: 30000, // 30 секунд
      successThreshold: 2,
      monitoringWindow: 120000 // 2 минуты
    });
  }

  static createForProduction(wrappedService: IAIService): CircuitBreakerAIService {
    return new CircuitBreakerAIService(wrappedService, {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 минута
      successThreshold: 3,
      monitoringWindow: 300000 // 5 минут
    });
  }
}
