import { DependencyContainer } from '../Shared/infrastructure';
import { AstronomicalDependencyConfig } from '../Astronomical/Infrastructure/config/DependencyConfig';

/**
 * Общая конфигурация зависимостей приложения
 */
export class AppDependencyConfig {
  static configure(): DependencyContainer {
    const container = DependencyContainer.getInstance();

    // Конфигурация Astronomical контекста
    AstronomicalDependencyConfig.configure(container);

    // Здесь будут добавлены конфигурации других контекстов
    // CryptoDataDependencyConfig.configure(container);
    // ChartingDependencyConfig.configure(container);
    // UserInterfaceDependencyConfig.configure(container);

    return container;
  }
} 