import { DependencyContainer } from '../../../Shared/infrastructure/DependencyContainer';
import { ICryptoDataRepository } from '../../Domain/repositories/ICryptoDataRepository';
import { CcvxService } from '../external-services/CcvxService';
import { CcvxCryptoDataRepository } from '../repositories/CcvxCryptoDataRepository';
import { GetCryptoDataUseCase } from '../../Application/use-cases/GetCryptoDataUseCase';
import { GetSymbolsUseCase } from '../../Application/use-cases/GetSymbolsUseCase';

export class CryptoDataDependencyConfig {
  static configure(container: DependencyContainer): void {
    // Регистрация внешнего сервиса
    container.register<CcvxService>('CcvxService', () => new CcvxService());

    // Регистрация репозитория
    container.register<ICryptoDataRepository>('ICryptoDataRepository', () => 
      new CcvxCryptoDataRepository(container.resolve<CcvxService>('CcvxService'))
    );

    // Регистрация use cases
    container.register<GetCryptoDataUseCase>('GetCryptoDataUseCase', () =>
      new GetCryptoDataUseCase(container.resolve<ICryptoDataRepository>('ICryptoDataRepository'))
    );

    container.register<GetSymbolsUseCase>('GetSymbolsUseCase', () =>
      new GetSymbolsUseCase(container.resolve<ICryptoDataRepository>('ICryptoDataRepository'))
    );
  }
} 