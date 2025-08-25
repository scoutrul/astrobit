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
      console.log('🔧 [AppDependencyConfig] Начинаем конфигурацию...');
      const container = DependencyContainer.getInstance();
      console.log('🔧 [AppDependencyConfig] DependencyContainer получен');
      
      // Конфигурация Astronomical контекста
      try {
        console.log('🔧 [AppDependencyConfig] Конфигурируем Astronomical...');
        AstronomicalDependencyConfig.configure(container);
        console.log('✅ [AppDependencyConfig] Astronomical сконфигурирован');
      } catch (error) {
        console.error('❌ [AppDependencyConfig] Ошибка конфигурации Astronomical:', error);
      }
      
      // Конфигурация CryptoData контекста
      try {
        console.log('🔧 [AppDependencyConfig] Конфигурируем CryptoData...');
        CryptoDataDependencyConfig.configure(container);
        console.log('✅ [AppDependencyConfig] CryptoData сконфигурирован');
      } catch (error) {
        console.error('❌ [AppDependencyConfig] Ошибка конфигурации CryptoData:', error);
      }

      // Конфигурация Charting контекста
      try {
        console.log('🔧 [AppDependencyConfig] Конфигурируем Charting...');
        ChartingDependencyConfig.configure(container);
        console.log('✅ [AppDependencyConfig] Charting сконфигурирован');
      } catch (error) {
        console.error('❌ [AppDependencyConfig] Ошибка конфигурации Charting:', error);
      }
      
      console.log('✅ [AppDependencyConfig] Конфигурация завершена');
      return container;
    } catch (error) {
      console.error('❌ [AppDependencyConfig] Критическая ошибка конфигурации:', error);
      throw error;
    }
  }
} 