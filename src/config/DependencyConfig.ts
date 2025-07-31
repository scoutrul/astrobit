import { DependencyContainer } from '../Shared/infrastructure';
import { AstronomicalDependencyConfig } from '../Astronomical/Infrastructure/config/DependencyConfig';
import { CryptoDataDependencyConfig } from '../CryptoData/Infrastructure/config/DependencyConfig';
import { ChartingDependencyConfig } from '../Charting/Infrastructure/config/DependencyConfig';
import { UserInterfaceDependencyConfig } from '../UserInterface/Infrastructure/config/DependencyConfig';

/**
 * Общая конфигурация зависимостей приложения
 */
export class AppDependencyConfig {
  static configure(): DependencyContainer {
    const container = DependencyContainer.getInstance();
    
    // Конфигурация Astronomical контекста
    AstronomicalDependencyConfig.configure(container);
    
        // Конфигурация CryptoData контекста
    CryptoDataDependencyConfig.configure(container);

    // Конфигурация Charting контекста
    ChartingDependencyConfig.configure(container);

    // Конфигурация UserInterface контекста
    UserInterfaceDependencyConfig.configure(container);
    
    return container;
  }
} 