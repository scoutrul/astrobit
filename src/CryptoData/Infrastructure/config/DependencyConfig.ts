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
      // Регистрируем Binance API сервис как синглтон
      container.register<BinanceApiService>('BinanceApiService', () => {
        try {
          return BinanceApiService.getInstance();
        } catch (error) {
          throw error;
        }
      });

      // Регистрируем Binance WebSocket сервис как синглтон
      container.register<BinanceWebSocketService>('BinanceWebSocketService', () => {
        try {
          return BinanceWebSocketService.getInstance();
        } catch (error) {
          throw error;
        }
      });

      // Регистрируем репозиторий
      container.register<ICryptoDataRepository>('ICryptoDataRepository', () => {
        try {
          const apiService = container.resolve<BinanceApiService>('BinanceApiService');
          return new BinanceCryptoDataRepository(apiService);
        } catch (error) {
          throw error;
        }
      });

      // Регистрируем Use Cases
      container.register<GetCryptoDataUseCase>('GetCryptoDataUseCase', () => {
        try {
          const repository = container.resolve<ICryptoDataRepository>('ICryptoDataRepository');
          return new GetCryptoDataUseCase(repository);
        } catch (error) {
          throw error;
        }
      });

      container.register<SubscribeToRealTimeDataUseCase>('SubscribeToRealTimeDataUseCase', () => {
        try {
          return new SubscribeToRealTimeDataUseCase();
        } catch (error) {
          throw error;
        }
      });
    } catch (error) {
      throw error;
    }
  }
} 