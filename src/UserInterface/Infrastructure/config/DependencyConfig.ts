import { DependencyContainer } from '../../../Shared/infrastructure/DependencyContainer';
import { IUserPreferenceRepository } from '../../Domain/repositories/IUserPreferenceRepository';
import { LocalStorageUserPreferenceRepository } from '../repositories/LocalStorageUserPreferenceRepository';
import { UpdateUserPreferenceUseCase } from '../../Application/use-cases/UpdateUserPreferenceUseCase';

export class UserInterfaceDependencyConfig {
  static configure(container: DependencyContainer): void {
    // Регистрируем репозиторий
    container.register<IUserPreferenceRepository>('IUserPreferenceRepository', () => 
      new LocalStorageUserPreferenceRepository()
    );

    // Регистрируем use cases
    container.register<UpdateUserPreferenceUseCase>('UpdateUserPreferenceUseCase', () =>
      new UpdateUserPreferenceUseCase(container.resolve<IUserPreferenceRepository>('IUserPreferenceRepository'))
    );
  }
} 