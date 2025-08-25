import { DependencyContainer } from '../../../Shared/infrastructure/DependencyContainer';
import { ICryptoDataRepository } from '../../Domain/repositories/ICryptoDataRepository';
import { BinanceApiService } from '../external-services/BinanceApiService';
import { BinanceWebSocketService } from '../external-services/BinanceWebSocketService';
import { BinanceCryptoDataRepository } from '../repositories/BinanceCryptoDataRepository';
import { GetCryptoDataUseCase } from '../../Application/use-cases/GetCryptoDataUseCase';
import { SubscribeToRealTimeDataUseCase } from '../../Application/use-cases/SubscribeToRealTimeDataUseCase';

export class CryptoDataDependencyConfig {
  static configure(container: DependencyContainer): void {
    try {
      console.log('🔧 [CryptoDataDependencyConfig] Начинаем конфигурацию...');
      
      // Регистрируем Binance API сервис как синглтон
      console.log('🔧 [CryptoDataDependencyConfig] Регистрируем BinanceApiService...');
      container.register<BinanceApiService>('BinanceApiService', () => {
        try {
          return BinanceApiService.getInstance();
        } catch (error) {
          console.error('[CryptoDataDependencyConfig] Ошибка получения BinanceApiService:', error);
          throw error;
        }
      });

      // Регистрируем Binance WebSocket сервис как синглтон
      console.log('🔧 [CryptoDataDependencyConfig] Регистрируем BinanceWebSocketService...');
      container.register<BinanceWebSocketService>('BinanceWebSocketService', () => {
        try {
          return BinanceWebSocketService.getInstance();
        } catch (error) {
          console.error('[CryptoDataDependencyConfig] Ошибка получения BinanceWebSocketService:', error);
          throw error;
        }
      });

      // Регистрируем репозиторий
      console.log('🔧 [CryptoDataDependencyConfig] Регистрируем репозиторий...');
      container.register<ICryptoDataRepository>('ICryptoDataRepository', () => {
        try {
          const apiService = container.resolve<BinanceApiService>('BinanceApiService');
          return new BinanceCryptoDataRepository(apiService);
        } catch (error) {
          console.error('[CryptoDataDependencyConfig] Ошибка создания репозитория:', error);
          throw error;
        }
      });

      // Регистрируем Use Cases
      console.log('🔧 [CryptoDataDependencyConfig] Регистрируем use cases...');
      container.register<GetCryptoDataUseCase>('GetCryptoDataUseCase', () => {
        try {
          const repository = container.resolve<ICryptoDataRepository>('ICryptoDataRepository');
          return new GetCryptoDataUseCase(repository);
        } catch (error) {
          console.error('[CryptoDataDependencyConfig] Ошибка создания GetCryptoDataUseCase:', error);
          throw error;
        }
      });

      container.register<SubscribeToRealTimeDataUseCase>('SubscribeToRealTimeDataUseCase', () => {
        try {
          return new SubscribeToRealTimeDataUseCase();
        } catch (error) {
          console.error('[CryptoDataDependencyConfig] Ошибка создания SubscribeToRealTimeDataUseCase:', error);
          throw error;
        }
      });
      
      console.log('✅ [CryptoDataDependencyConfig] Конфигурация завершена');
    } catch (error) {
      console.error('❌ [CryptoDataDependencyConfig] Критическая ошибка конфигурации:', error);
      throw error;
    }
  }
} 