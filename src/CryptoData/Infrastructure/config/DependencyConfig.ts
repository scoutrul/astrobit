import { DependencyContainer } from '../../../Shared/infrastructure/DependencyContainer';
import { ICryptoDataRepository } from '../../Domain/repositories/ICryptoDataRepository';
import { BinanceApiService } from '../external-services/BinanceApiService';
import { BinanceWebSocketService } from '../external-services/BinanceWebSocketService';
import { BinanceCryptoDataRepository } from '../repositories/BinanceCryptoDataRepository';
import { GetCryptoDataUseCase } from '../../Application/use-cases/GetCryptoDataUseCase';
import { SubscribeToRealTimeDataUseCase } from '../../Application/use-cases/SubscribeToRealTimeDataUseCase';

export class CryptoDataDependencyConfig {
  static configure(container: DependencyContainer): void {
    // Регистрируем Binance API сервис как синглтон
    container.register<BinanceApiService>('BinanceApiService', () => BinanceApiService.getInstance());

    // Регистрируем Binance WebSocket сервис как синглтон
    container.register<BinanceWebSocketService>('BinanceWebSocketService', () => BinanceWebSocketService.getInstance());

    // Регистрируем репозиторий
    container.register<ICryptoDataRepository>('ICryptoDataRepository', () => {
      const apiService = container.resolve<BinanceApiService>('BinanceApiService');
      return new BinanceCryptoDataRepository(apiService);
    });

    // Регистрируем Use Cases
    container.register<GetCryptoDataUseCase>('GetCryptoDataUseCase', () => {
      const repository = container.resolve<ICryptoDataRepository>('ICryptoDataRepository');
      return new GetCryptoDataUseCase(repository);
    });

    container.register<SubscribeToRealTimeDataUseCase>('SubscribeToRealTimeDataUseCase', () => {
      return new SubscribeToRealTimeDataUseCase();
    });
  }
} 