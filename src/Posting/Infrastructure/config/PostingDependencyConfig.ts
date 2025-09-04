import { GenerateContentUseCase } from '../../Application/use-cases/ai/GenerateContentUseCase';
import { RealDataContextService } from '../services/RealDataContextService';
import { CachedAIService } from '../services/ai/CachedAIService';
import { CircuitBreakerAIService } from '../services/ai/CircuitBreakerAIService';
import { AnthropicAIService } from '../services/ai/AnthropicAIService';
// import { TagRepository } from '../services/TagRepository'; // Временно отключено
import { ProductionMonitoringService } from '../services/monitoring/ProductionMonitoringService';
import { RateLimitingService } from '../services/security/RateLimitingService';
import { EndToEndTester } from '../testing/EndToEndTester';

// Импорты других модулей
import { GetAstronomicalEventsUseCase } from '../../../Astronomical/Application/use-cases/GetAstronomicalEventsUseCase';
import { GetCryptoDataUseCase } from '../../../CryptoData/Application/use-cases/GetCryptoDataUseCase';

/**
 * Конфигурация зависимостей для модуля Posting
 */
export class PostingDependencyConfig {
  private static instance: PostingDependencyConfig;
  
  // Сервисы
  private _anthropicAIService?: AnthropicAIService;
  private _circuitBreakerAIService?: CircuitBreakerAIService;
  private _cachedAIService?: CachedAIService;
  private _tagRepository?: any; // Временно отключено
  private _realDataContextService?: RealDataContextService;
  
  // Use Cases
  private _generateContentUseCase?: GenerateContentUseCase;
  private _astronomicalEventsUseCase?: GetAstronomicalEventsUseCase;
  private _cryptoDataUseCase?: GetCryptoDataUseCase;
  
  // Production Services
  private _productionMonitoringService?: ProductionMonitoringService;
  private _rateLimitingService?: RateLimitingService;
  private _endToEndTester?: EndToEndTester;

  private constructor() {}

  public static getInstance(): PostingDependencyConfig {
    if (!PostingDependencyConfig.instance) {
      PostingDependencyConfig.instance = new PostingDependencyConfig();
    }
    return PostingDependencyConfig.instance;
  }

  /**
   * Инициализация Anthropic AI Service
   */
  public getAnthropicAIService(): AnthropicAIService {
    if (!this._anthropicAIService) {
      this._anthropicAIService = new AnthropicAIService();
      console.info('[PostingDependencyConfig] AnthropicAIService инициализирован');
    }
    return this._anthropicAIService;
  }

  /**
   * Инициализация Circuit Breaker AI Service
   */
  public getCircuitBreakerAIService(): CircuitBreakerAIService {
    if (!this._circuitBreakerAIService) {
      const baseService = this.getAnthropicAIService();
      this._circuitBreakerAIService = new CircuitBreakerAIService(baseService, {
        failureThreshold: 3,
        recoveryTimeout: 30000,
        successThreshold: 2,
        monitoringWindow: 60000
      });
      console.info('[PostingDependencyConfig] CircuitBreakerAIService инициализирован');
    }
    return this._circuitBreakerAIService;
  }

  /**
   * Инициализация Cached AI Service
   */
  public getCachedAIService(): CachedAIService {
    if (!this._cachedAIService) {
      const circuitBreakerService = this.getCircuitBreakerAIService();
      this._cachedAIService = new CachedAIService(circuitBreakerService, {
        maxMemoryEntries: 50,
        defaultTTL: 30 * 60 * 1000, // 30 минут
        enableSemanticSearch: true
      });
      console.info('[PostingDependencyConfig] CachedAIService инициализирован');
    }
    return this._cachedAIService;
  }

  /**
   * Инициализация Tag Repository
   */
  public getTagRepository(): any {
    // Временно отключено
    console.warn('[PostingDependencyConfig] TagRepository временно отключен');
    return null;
  }

  /**
   * Инициализация Astronomical Events Use Case
   */
  public getAstronomicalEventsUseCase(): GetAstronomicalEventsUseCase | null {
    if (!this._astronomicalEventsUseCase) {
      try {
        // Попытка импорта и инициализации Astronomical модуля
        // TODO: Здесь должна быть реальная инициализация репозитория
        // const astronomicalRepository = new AstronomicalEventRepository();
        // this._astronomicalEventsUseCase = new GetAstronomicalEventsUseCase(astronomicalRepository);
        
        console.warn('[PostingDependencyConfig] AstronomicalEventsUseCase не может быть инициализирован - отсутствует репозиторий');
        return null;
      } catch (error) {
        console.warn('[PostingDependencyConfig] Ошибка инициализации AstronomicalEventsUseCase:', error);
        return null;
      }
    }
    return this._astronomicalEventsUseCase;
  }

  /**
   * Инициализация Crypto Data Use Case
   */
  public getCryptoDataUseCase(): GetCryptoDataUseCase | null {
    if (!this._cryptoDataUseCase) {
      try {
        // Попытка импорта и инициализации CryptoData модуля
        // TODO: Здесь должна быть реальная инициализация репозитория
        // const cryptoDataRepository = new CryptoDataRepository();
        // this._cryptoDataUseCase = new GetCryptoDataUseCase(cryptoDataRepository);
        
        console.warn('[PostingDependencyConfig] CryptoDataUseCase не может быть инициализирован - отсутствует репозиторий');
        return null;
      } catch (error) {
        console.warn('[PostingDependencyConfig] Ошибка инициализации CryptoDataUseCase:', error);
        return null;
      }
    }
    return this._cryptoDataUseCase;
  }

  /**
   * Инициализация Real Data Context Service
   */
  public getRealDataContextService(): RealDataContextService | null {
    if (!this._realDataContextService) {
      const astronomicalUseCase = this.getAstronomicalEventsUseCase();
      const cryptoDataUseCase = this.getCryptoDataUseCase();

      if (astronomicalUseCase && cryptoDataUseCase) {
        this._realDataContextService = new RealDataContextService(
          astronomicalUseCase,
          cryptoDataUseCase
        );
        console.info('[PostingDependencyConfig] RealDataContextService инициализирован с полными зависимостями');
      } else {
        console.warn('[PostingDependencyConfig] RealDataContextService не может быть инициализирован - отсутствуют зависимости');
        console.warn(`  - AstronomicalEventsUseCase: ${!!astronomicalUseCase}`);
        console.warn(`  - CryptoDataUseCase: ${!!cryptoDataUseCase}`);
        return null;
      }
    }
    return this._realDataContextService;
  }

  /**
   * Инициализация Generate Content Use Case
   */
  public getGenerateContentUseCase(): GenerateContentUseCase {
    if (!this._generateContentUseCase) {
      const aiService = this.getCachedAIService();
      const realDataContextService = this.getRealDataContextService();
      
      this._generateContentUseCase = new GenerateContentUseCase(
        aiService,
        realDataContextService || undefined
      );
      
      const integrationStatus = realDataContextService ? 'с реальными данными' : 'без реальных данных (fallback)';
      console.info(`[PostingDependencyConfig] GenerateContentUseCase инициализирован ${integrationStatus}`);
    }
    return this._generateContentUseCase;
  }

  /**
   * Получает Production Monitoring Service
   */
  public getProductionMonitoringService(): ProductionMonitoringService {
    if (!this._productionMonitoringService) {
      this._productionMonitoringService = ProductionMonitoringService.getInstance();
      console.info('[PostingDependencyConfig] ProductionMonitoringService инициализирован');
    }
    return this._productionMonitoringService;
  }

  /**
   * Получает Rate Limiting Service
   */
  public getRateLimitingService(): RateLimitingService {
    if (!this._rateLimitingService) {
      this._rateLimitingService = RateLimitingService.getInstance();
      console.info('[PostingDependencyConfig] RateLimitingService инициализирован');
    }
    return this._rateLimitingService;
  }

  /**
   * Получает End-to-End Tester
   */
  public getEndToEndTester(): EndToEndTester {
    if (!this._endToEndTester) {
      this._endToEndTester = new EndToEndTester();
      console.info('[PostingDependencyConfig] EndToEndTester инициализирован');
    }
    return this._endToEndTester;
  }

  /**
   * Проверяет состояние интеграции с внешними модулями
   */
  public getIntegrationStatus(): {
    aiServicesReady: boolean;
    astronomicalIntegration: boolean;
    cryptoDataIntegration: boolean;
    realDataContextReady: boolean;
    tagSystemReady: boolean;
    productionServicesReady: boolean;
  } {
    return {
      aiServicesReady: !!this._cachedAIService,
      astronomicalIntegration: !!this.getAstronomicalEventsUseCase(),
      cryptoDataIntegration: !!this.getCryptoDataUseCase(),
      realDataContextReady: !!this.getRealDataContextService(),
      tagSystemReady: !!this._tagRepository,
      productionServicesReady: !!this._productionMonitoringService && !!this._rateLimitingService
    };
  }

  /**
   * Логирует подробную информацию о состоянии зависимостей
   */
  public logDependencyStatus(): void {
    const status = this.getIntegrationStatus();
    
    console.info('[PostingDependencyConfig] Статус зависимостей:');
    console.info(`  🤖 AI Services: ${status.aiServicesReady ? '✅' : '❌'}`);
    console.info(`  🌟 Astronomical: ${status.astronomicalIntegration ? '✅' : '❌'}`);
    console.info(`  💰 Crypto Data: ${status.cryptoDataIntegration ? '✅' : '❌'}`);
    console.info(`  🔗 Real Data Context: ${status.realDataContextReady ? '✅' : '❌'}`);
    console.info(`  🏷️ Tag System: ${status.tagSystemReady ? '✅' : '❌'}`);
    console.info(`  🏭 Production Services: ${status.productionServicesReady ? '✅' : '❌'}`);

    if (!status.realDataContextReady) {
      console.warn('[PostingDependencyConfig] ⚠️  Real Data Integration недоступна - используется fallback режим');
    } else {
      console.info('[PostingDependencyConfig] 🚀 Полная интеграция данных активна!');
    }

    if (status.productionServicesReady) {
      console.info('[PostingDependencyConfig] 🛡️ Production services готовы к мониторингу и защите!');
    }
  }

  /**
   * Очищает все инстансы (для тестирования)
   */
  public reset(): void {
    this._anthropicAIService = undefined;
    this._circuitBreakerAIService = undefined;
    this._cachedAIService = undefined;
    this._tagRepository = undefined;
    this._realDataContextService = undefined;
    this._generateContentUseCase = undefined;
    this._astronomicalEventsUseCase = undefined;
    this._cryptoDataUseCase = undefined;
    
    console.info('[PostingDependencyConfig] Все зависимости сброшены');
  }
}
