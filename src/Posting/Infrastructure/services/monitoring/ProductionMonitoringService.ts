import { Result } from '../../../../Shared/domain/Result';

/**
 * Метрики производительности
 */
export interface PerformanceMetrics {
  aiRequestCount: number;
  cacheHitRate: number;
  averageResponseTime: number;
  errorRate: number;
  tokensUsed: number;
  tokensSaved: number;
  lastUpdated: Date;
}

/**
 * Системные метрики
 */
export interface SystemMetrics {
  memoryUsage: number;
  activeConnections: number;
  queueSize: number;
  uptime: number;
}

/**
 * API Usage метрики
 */
export interface APIUsageMetrics {
  openaiRequests: number;
  rateLimitHits: number;
  quotaRemaining: number;
  costEstimate: number;
}

/**
 * Сводка состояния системы
 */
export interface SystemHealthStatus {
  status: 'healthy' | 'degraded' | 'critical';
  issues: string[];
  performance: PerformanceMetrics;
  system: SystemMetrics;
  apiUsage: APIUsageMetrics;
  timestamp: Date;
}

/**
 * Сервис мониторинга для production среды
 */
export class ProductionMonitoringService {
  private static instance: ProductionMonitoringService;
  private metrics: Map<string, any> = new Map();
  private alerts: Array<{ level: 'warning' | 'error' | 'critical'; message: string; timestamp: Date }> = [];
  private startTime = Date.now();

  // Rate limiting tracking
  private requestCounts = new Map<string, { count: number; resetTime: number }>();
  
  // Performance tracking
  private requestTimes: number[] = [];
  private maxMetricsHistory = 1000;

  private constructor() {
    this.initializeMetrics();
  }

  public static getInstance(): ProductionMonitoringService {
    if (!ProductionMonitoringService.instance) {
      ProductionMonitoringService.instance = new ProductionMonitoringService();
    }
    return ProductionMonitoringService.instance;
  }

  /**
   * Инициализация метрик
   */
  private initializeMetrics(): void {
    this.metrics.set('aiRequests', 0);
    this.metrics.set('cacheHits', 0);
    this.metrics.set('cacheMisses', 0);
    this.metrics.set('errors', 0);
    this.metrics.set('tokensUsed', 0);
    this.metrics.set('tokensSaved', 0);
    this.metrics.set('openaiRequests', 0);
    this.metrics.set('rateLimitHits', 0);
    
    console.info('[ProductionMonitoringService] Мониторинг инициализирован');
  }

  /**
   * Записывает AI запрос
   */
  public recordAIRequest(duration: number, tokens: number, cached: boolean = false): void {
    this.metrics.set('aiRequests', this.metrics.get('aiRequests') + 1);
    
    if (cached) {
      this.metrics.set('cacheHits', this.metrics.get('cacheHits') + 1);
      this.metrics.set('tokensSaved', this.metrics.get('tokensSaved') + tokens);
    } else {
      this.metrics.set('cacheMisses', this.metrics.get('cacheMisses') + 1);
      this.metrics.set('tokensUsed', this.metrics.get('tokensUsed') + tokens);
      this.metrics.set('openaiRequests', this.metrics.get('openaiRequests') + 1);
    }

    // Записываем время отклика
    this.requestTimes.push(duration);
    if (this.requestTimes.length > this.maxMetricsHistory) {
      this.requestTimes.shift();
    }

    // Проверяем пороговые значения
    this.checkPerformanceThresholds(duration, tokens);
  }

  /**
   * Записывает ошибку
   */
  public recordError(error: Error, context: string): void {
    this.metrics.set('errors', this.metrics.get('errors') + 1);
    
    const alert = {
      level: 'error' as const,
      message: `${context}: ${error.message}`,
      timestamp: new Date()
    };
    
    this.alerts.push(alert);
    
    // Ограничиваем историю алертов
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }

    console.error(`[ProductionMonitoringService] ${alert.message}`);
  }

  /**
   * Записывает rate limit hit
   */
  public recordRateLimit(service: string): void {
    this.metrics.set('rateLimitHits', this.metrics.get('rateLimitHits') + 1);
    
    const alert = {
      level: 'warning' as const,
      message: `Rate limit hit для ${service}`,
      timestamp: new Date()
    };
    
    this.alerts.push(alert);
    console.warn(`[ProductionMonitoringService] ${alert.message}`);
  }

  /**
   * Проверка rate limiting для сервиса
   */
  public checkRateLimit(service: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const key = `${service}_rate_limit`;
    
    const current = this.requestCounts.get(key);
    
    if (!current || now > current.resetTime) {
      // Новое окно или сброс
      this.requestCounts.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }
    
    if (current.count >= maxRequests) {
      this.recordRateLimit(service);
      return false;
    }
    
    current.count++;
    return true;
  }

  /**
   * Проверяет пороговые значения производительности
   */
  private checkPerformanceThresholds(duration: number, tokens: number): void {
    // Проверяем время отклика
    if (duration > 10000) { // 10 секунд
      this.alerts.push({
        level: 'warning',
        message: `Медленный AI запрос: ${duration}ms`,
        timestamp: new Date()
      });
    }

    // Проверяем расход токенов
    if (tokens > 2000) {
      this.alerts.push({
        level: 'warning',
        message: `Высокое потребление токенов: ${tokens}`,
        timestamp: new Date()
      });
    }

    // Проверяем общую нагрузку
    const totalRequests = this.metrics.get('aiRequests');
    const totalErrors = this.metrics.get('errors');
    
    if (totalRequests > 0 && (totalErrors / totalRequests) > 0.1) { // 10% error rate
      this.alerts.push({
        level: 'critical',
        message: `Высокий уровень ошибок: ${Math.round((totalErrors / totalRequests) * 100)}%`,
        timestamp: new Date()
      });
    }
  }

  /**
   * Получает текущие метрики производительности
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    const totalRequests = this.metrics.get('aiRequests');
    const cacheHits = this.metrics.get('cacheHits');
    const cacheMisses = this.metrics.get('cacheMisses');
    
    const cacheHitRate = totalRequests > 0 ? cacheHits / totalRequests : 0;
    const averageResponseTime = this.requestTimes.length > 0 
      ? this.requestTimes.reduce((a, b) => a + b, 0) / this.requestTimes.length 
      : 0;
    
    const errorRate = totalRequests > 0 ? this.metrics.get('errors') / totalRequests : 0;

    return {
      aiRequestCount: totalRequests,
      cacheHitRate,
      averageResponseTime,
      errorRate,
      tokensUsed: this.metrics.get('tokensUsed'),
      tokensSaved: this.metrics.get('tokensSaved'),
      lastUpdated: new Date()
    };
  }

  /**
   * Получает системные метрики
   */
  public getSystemMetrics(): SystemMetrics {
    const memoryUsage = process.memoryUsage?.() ? 
      process.memoryUsage().heapUsed / 1024 / 1024 : 0; // MB

    return {
      memoryUsage,
      activeConnections: this.requestCounts.size,
      queueSize: 0, // TODO: Implement if needed
      uptime: Date.now() - this.startTime
    };
  }

  /**
   * Получает метрики использования API
   */
  public getAPIUsageMetrics(): APIUsageMetrics {
    const openaiRequests = this.metrics.get('openaiRequests');
    const tokensUsed = this.metrics.get('tokensUsed');
    
    // Примерная стоимость (GPT-3.5-turbo: ~$0.002/1K tokens)
    const costEstimate = (tokensUsed / 1000) * 0.002;

    return {
      openaiRequests,
      rateLimitHits: this.metrics.get('rateLimitHits'),
      quotaRemaining: 1000000 - tokensUsed, // Примерная квота
      costEstimate
    };
  }

  /**
   * Получает общее состояние системы
   */
  public getSystemHealth(): SystemHealthStatus {
    const performance = this.getPerformanceMetrics();
    const system = this.getSystemMetrics();
    const apiUsage = this.getAPIUsageMetrics();

    // Определяем состояние системы
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    const issues: string[] = [];

    // Проверяем критические показатели
    if (performance.errorRate > 0.2) {
      status = 'critical';
      issues.push(`Критический уровень ошибок: ${Math.round(performance.errorRate * 100)}%`);
    } else if (performance.errorRate > 0.1) {
      status = 'degraded';
      issues.push(`Повышенный уровень ошибок: ${Math.round(performance.errorRate * 100)}%`);
    }

    if (performance.averageResponseTime > 5000) {
      status = status === 'critical' ? 'critical' : 'degraded';
      issues.push(`Медленные ответы: ${Math.round(performance.averageResponseTime)}ms`);
    }

    if (apiUsage.rateLimitHits > 0) {
      if (status === 'healthy') status = 'degraded';
      issues.push(`Rate limiting активен: ${apiUsage.rateLimitHits} hits`);
    }

    if (system.memoryUsage > 512) { // 512MB
      if (status === 'healthy') status = 'degraded';
      issues.push(`Высокое потребление памяти: ${Math.round(system.memoryUsage)}MB`);
    }

    return {
      status,
      issues,
      performance,
      system,
      apiUsage,
      timestamp: new Date()
    };
  }

  /**
   * Получает последние алерты
   */
  public getRecentAlerts(limit: number = 10): Array<{ level: string; message: string; timestamp: Date }> {
    return this.alerts.slice(-limit).reverse();
  }

  /**
   * Логирует сводку производительности
   */
  public logPerformanceSummary(): void {
    const metrics = this.getPerformanceMetrics();
    const health = this.getSystemHealth();

    console.info('[ProductionMonitoringService] Performance Summary:');
    console.info(`  🔥 AI Requests: ${metrics.aiRequestCount}`);
    console.info(`  ⚡ Cache Hit Rate: ${Math.round(metrics.cacheHitRate * 100)}%`);
    console.info(`  ⏱️ Avg Response: ${Math.round(metrics.averageResponseTime)}ms`);
    console.info(`  ❌ Error Rate: ${Math.round(metrics.errorRate * 100)}%`);
    console.info(`  🪙 Tokens Used: ${metrics.tokensUsed} (Saved: ${metrics.tokensSaved})`);
    console.info(`  💰 Est. Cost: $${health.apiUsage.costEstimate.toFixed(4)}`);
    console.info(`  🏥 Health: ${health.status.toUpperCase()}`);

    if (health.issues.length > 0) {
      console.warn('  ⚠️ Issues:');
      health.issues.forEach(issue => {
        console.warn(`    - ${issue}`);
      });
    }
  }

  /**
   * Сброс метрик (для тестирования)
   */
  public reset(): void {
    this.metrics.clear();
    this.alerts = [];
    this.requestCounts.clear();
    this.requestTimes = [];
    this.initializeMetrics();
    
    console.info('[ProductionMonitoringService] Мониторинг сброшен');
  }
}
