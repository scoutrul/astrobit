import { DependencyContainer } from '../../../Shared/infrastructure/DependencyContainer';
import { ICryptoDataRepository } from '../../Domain/repositories/ICryptoDataRepository';
import { BinanceApiService } from '../external-services/BinanceApiService';
import { BinanceCryptoDataRepository } from '../repositories/BinanceCryptoDataRepository';
import { GetCryptoDataUseCase } from '../../Application/use-cases/GetCryptoDataUseCase';
import { GetSymbolsUseCase } from '../../Application/use-cases/GetSymbolsUseCase';

export class CryptoDataDependencyConfig {
  static configure(container: DependencyContainer): void {
    // Регистрируем Binance API сервис как синглтон
    container.register<BinanceApiService>('BinanceApiService', () => BinanceApiService.getInstance());
    
    // Регистрируем репозиторий с Binance API сервисом
    container.register<ICryptoDataRepository>('ICryptoDataRepository', () =>
      new BinanceCryptoDataRepository(container.resolve<BinanceApiService>('BinanceApiService'))
    );
    
    // Регистрируем use cases
    container.register<GetCryptoDataUseCase>('GetCryptoDataUseCase', () =>
      new GetCryptoDataUseCase(container.resolve<ICryptoDataRepository>('ICryptoDataRepository'))
    );
    
    container.register<GetSymbolsUseCase>('GetSymbolsUseCase', () =>
      new GetSymbolsUseCase(container.resolve<ICryptoDataRepository>('ICryptoDataRepository'))
    );
  }
} 