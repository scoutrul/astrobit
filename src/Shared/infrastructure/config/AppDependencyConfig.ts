import { DependencyContainer } from '../DependencyContainer';
import { AstronomicalDependencyConfig } from '../../../Astronomical/Infrastructure/config/DependencyConfig';
import { CryptoDataDependencyConfig } from '../../../CryptoData/Infrastructure/config/DependencyConfig';
import { ChartingDependencyConfig } from '../../../Charting/Infrastructure/config/DependencyConfig';

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
    
    return container;
  }
} 