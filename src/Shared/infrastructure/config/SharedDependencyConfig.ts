import { DependencyContainer } from '../DependencyContainer';

/**
 * Конфигурация зависимостей для Shared bounded context
 */
export class SharedDependencyConfig {
  static configure(_container: DependencyContainer): void {
    // Shared bounded context не имеет специфичных зависимостей
    // DependencyContainer уже зарегистрирован как синглтон
    console.log('[SharedDependencyConfig] Shared dependencies configured');
  }
} 