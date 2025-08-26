import { Result } from '../../../../Shared/domain/Result';
import { ProductionMonitoringService } from '../monitoring/ProductionMonitoringService';

/**
 * Конфигурация rate limiting
 */
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  burstAllowance?: number;
  skipSuccessful?: boolean;
}

/**
 * Информация о rate limit статусе
 */
export interface RateLimitStatus {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

/**
 * Политики rate limiting для разных сервисов
 */
export enum RateLimitPolicy {
  OPENAI_API = 'openai_api',
  CONTENT_GENERATION = 'content_generation',
  TAG_SUGGESTIONS = 'tag_suggestions',
  ARCHIVE_ACCESS = 'archive_access'
}

/**
 * Сервис rate limiting для защиты от перегрузки
 */
export class RateLimitingService {
  private static instance: RateLimitingService;
  private limits = new Map<string, { count: number; resetTime: number; config: RateLimitConfig }>();
  private monitoring: ProductionMonitoringService;

  // Предустановленные политики
  private readonly policies: Map<RateLimitPolicy, RateLimitConfig> = new Map([
    [RateLimitPolicy.OPENAI_API, {
      maxRequests: 20,        // 20 запросов
      windowMs: 60 * 1000,    // в минуту
      burstAllowance: 5       // + 5 burst запросов
    }],
    [RateLimitPolicy.CONTENT_GENERATION, {
      maxRequests: 10,        // 10 генераций
      windowMs: 60 * 1000,    // в минуту
      burstAllowance: 2
    }],
    [RateLimitPolicy.TAG_SUGGESTIONS, {
      maxRequests: 50,        // 50 запросов
      windowMs: 60 * 1000,    // в минуту
      skipSuccessful: true    // не считаем успешные кэшированные запросы
    }],
    [RateLimitPolicy.ARCHIVE_ACCESS, {
      maxRequests: 100,       // 100 доступов
      windowMs: 60 * 1000,    // в минуту
      burstAllowance: 10
    }]
  ]);

  private constructor() {
    this.monitoring = ProductionMonitoringService.getInstance();
    console.info('[RateLimitingService] Rate limiting сервис инициализирован');
  }

  public static getInstance(): RateLimitingService {
    if (!RateLimitingService.instance) {
      RateLimitingService.instance = new RateLimitingService();
    }
    return RateLimitingService.instance;
  }

  /**
   * Проверяет rate limit для определенной политики
   */
  public checkLimit(policy: RateLimitPolicy, identifier: string = 'default'): RateLimitStatus {
    const config = this.policies.get(policy);
    if (!config) {
      console.warn(`[RateLimitingService] Неизвестная политика: ${policy}`);
      return {
        allowed: true,
        limit: 0,
        remaining: 0,
        resetTime: new Date()
      };
    }

    return this.checkCustomLimit(`${policy}_${identifier}`, config);
  }

  /**
   * Проверяет rate limit с кастомной конфигурацией
   */
  public checkCustomLimit(key: string, config: RateLimitConfig): RateLimitStatus {
    const now = Date.now();
    const current = this.limits.get(key);

    // Инициализация или сброс окна
    if (!current || now > current.resetTime) {
      const newResetTime = now + config.windowMs;
      this.limits.set(key, {
        count: 1,
        resetTime: newResetTime,
        config
      });

      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        resetTime: new Date(newResetTime)
      };
    }

    // Проверяем лимит
    const effectiveLimit = config.maxRequests + (config.burstAllowance || 0);
    const remaining = Math.max(0, effectiveLimit - current.count);

    if (current.count >= effectiveLimit) {
      // Rate limit exceeded
      this.monitoring.recordRateLimit(key);
      
      const retryAfter = Math.ceil((current.resetTime - now) / 1000);
      
      console.warn(`[RateLimitingService] Rate limit exceeded для ${key}: ${current.count}/${effectiveLimit}`);
      
      return {
        allowed: false,
        limit: effectiveLimit,
        remaining: 0,
        resetTime: new Date(current.resetTime),
        retryAfter
      };
    }

    // Увеличиваем счетчик
    current.count++;

    return {
      allowed: true,
      limit: effectiveLimit,
      remaining: remaining - 1,
      resetTime: new Date(current.resetTime)
    };
  }

  /**
   * Записывает успешный запрос (для skipSuccessful политик)
   */
  public recordSuccess(policy: RateLimitPolicy, identifier: string = 'default'): void {
    const config = this.policies.get(policy);
    if (!config?.skipSuccessful) {
      return;
    }

    const key = `${policy}_${identifier}`;
    const current = this.limits.get(key);

    if (current && current.count > 0) {
      current.count--;
      console.debug(`[RateLimitingService] Успешный запрос записан для ${key}, счетчик: ${current.count}`);
    }
  }

  /**
   * Применяет rate limiting с автоматической обработкой
   */
  public async withRateLimit<T>(
    policy: RateLimitPolicy,
    operation: () => Promise<T>,
    identifier: string = 'default',
    retryOptions?: { maxRetries?: number; baseDelay?: number }
  ): Promise<Result<T>> {
    const maxRetries = retryOptions?.maxRetries || 3;
    const baseDelay = retryOptions?.baseDelay || 1000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const status = this.checkLimit(policy, identifier);

      if (status.allowed) {
        try {
          const result = await operation();
          
          // Записываем успех для skipSuccessful политик
          this.recordSuccess(policy, identifier);
          
          return Result.ok(result);
        } catch (error) {
          // Если операция неудачна, не уменьшаем лимит
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.monitoring.recordError(
            new Error(`Rate limited operation failed: ${errorMessage}`),
            `${policy}_${identifier}`
          );
          
          return Result.fail(`Операция не удалась: ${errorMessage}`);
        }
      }

      // Rate limit exceeded
      if (attempt < maxRetries && status.retryAfter) {
        const delay = Math.min(status.retryAfter * 1000, baseDelay * Math.pow(2, attempt));
        console.info(`[RateLimitingService] Rate limit hit, ожидание ${delay}ms перед повтором (${attempt + 1}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      return Result.fail(`Rate limit exceeded для ${policy}. Retry after: ${status.retryAfter} seconds`);
    }

    return Result.fail(`Max retries exceeded для ${policy}`);
  }

  /**
   * Получает текущий статус всех активных лимитов
   */
  public getAllLimitsStatus(): Map<string, RateLimitStatus> {
    const statuses = new Map<string, RateLimitStatus>();
    const now = Date.now();

    for (const [key, current] of this.limits.entries()) {
      if (now <= current.resetTime) {
        const effectiveLimit = current.config.maxRequests + (current.config.burstAllowance || 0);
        const remaining = Math.max(0, effectiveLimit - current.count);

        statuses.set(key, {
          allowed: current.count < effectiveLimit,
          limit: effectiveLimit,
          remaining,
          resetTime: new Date(current.resetTime),
          retryAfter: current.count >= effectiveLimit ? Math.ceil((current.resetTime - now) / 1000) : undefined
        });
      }
    }

    return statuses;
  }

  /**
   * Обновляет политику rate limiting
   */
  public updatePolicy(policy: RateLimitPolicy, config: RateLimitConfig): void {
    this.policies.set(policy, config);
    console.info(`[RateLimitingService] Политика ${policy} обновлена:`, config);
  }

  /**
   * Получает конфигурацию политики
   */
  public getPolicyConfig(policy: RateLimitPolicy): RateLimitConfig | undefined {
    return this.policies.get(policy);
  }

  /**
   * Очищает все лимиты (для emergency cases)
   */
  public clearAllLimits(): void {
    this.limits.clear();
    console.warn('[RateLimitingService] Все rate limits очищены (emergency reset)');
  }

  /**
   * Получает статистику rate limiting
   */
  public getRateLimitStats(): {
    activeLimits: number;
    blockedRequests: number;
    totalPolicies: number;
    healthyLimits: number;
    exceededLimits: number;
  } {
    const allStatuses = this.getAllLimitsStatus();
    let exceededCount = 0;
    let blockedRequests = 0;

    for (const status of allStatuses.values()) {
      if (!status.allowed) {
        exceededCount++;
      }
      if (status.retryAfter) {
        blockedRequests++;
      }
    }

    return {
      activeLimits: allStatuses.size,
      blockedRequests,
      totalPolicies: this.policies.size,
      healthyLimits: allStatuses.size - exceededCount,
      exceededLimits: exceededCount
    };
  }

  /**
   * Логирует статистику rate limiting
   */
  public logRateLimitStats(): void {
    const stats = this.getRateLimitStats();
    
    console.info('[RateLimitingService] Rate Limiting Stats:');
    console.info(`  📊 Active Limits: ${stats.activeLimits}`);
    console.info(`  ✅ Healthy: ${stats.healthyLimits}`);
    console.info(`  ❌ Exceeded: ${stats.exceededLimits}`);
    console.info(`  🚫 Blocked Requests: ${stats.blockedRequests}`);
    console.info(`  📋 Total Policies: ${stats.totalPolicies}`);

    if (stats.exceededLimits > 0) {
      console.warn('  ⚠️ Некоторые лимиты превышены - проверьте load balancing');
    }
  }

  /**
   * Сброс сервиса (для тестирования)
   */
  public reset(): void {
    this.limits.clear();
    console.info('[RateLimitingService] Rate limiting сервис сброшен');
  }
}
