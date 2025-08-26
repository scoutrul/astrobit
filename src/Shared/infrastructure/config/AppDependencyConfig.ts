import { DependencyContainer } from '../DependencyContainer';
import { AstronomicalDependencyConfig } from '../../../Astronomical/Infrastructure/config/DependencyConfig';
import { CryptoDataDependencyConfig } from '../../../CryptoData/Infrastructure/config/DependencyConfig';
import { ChartingDependencyConfig } from '../../../Charting/Infrastructure/config/DependencyConfig';

/**
 * Общая конфигурация зависимостей приложения
 */
export class AppDependencyConfig {
  static configure(): DependencyContainer {
    try {
      const container = DependencyContainer.getInstance();
      
      // Конфигурация Astronomical контекста
      try {
        AstronomicalDependencyConfig.configure(container);
      } catch (error) {
        // Ошибка конфигурации Astronomical
      }
      
      // Конфигурация CryptoData контекста
      try {
        CryptoDataDependencyConfig.configure(container);
      } catch (error) {
        // Ошибка конфигурации CryptoData
      }

      // Конфигурация Charting контекста
      try {
        ChartingDependencyConfig.configure(container);
      } catch (error) {
        // Ошибка конфигурации Charting
      }
      
      return container;
    } catch (error) {
      throw error;
    }
  }
} 