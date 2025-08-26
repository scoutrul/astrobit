import { DependencyContainer } from '../../../Shared/infrastructure';
import { IAstronomicalEventRepository } from '../../Domain';
import { 
  GetAstronomicalEventsUseCase,
  GetCurrentMoonPhaseUseCase,
  GetMoonPhaseForDateUseCase
} from '../../Application';
import { InMemoryAstronomicalEventRepository } from '../repositories/InMemoryAstronomicalEventRepository';

/**
 * Конфигурация зависимостей для Astronomical контекста
 */
export class AstronomicalDependencyConfig {
    static configure(container: DependencyContainer): void {
    try {
      // Регистрация репозитория
      container.register<IAstronomicalEventRepository>(
        'IAstronomicalEventRepository',
        () => new InMemoryAstronomicalEventRepository()
      );

      // Регистрация use cases
      container.register<GetAstronomicalEventsUseCase>(
        'GetAstronomicalEventsUseCase',
        () => new GetAstronomicalEventsUseCase(
          container.resolve<IAstronomicalEventRepository>('IAstronomicalEventRepository')
        )
      );

      container.register<GetCurrentMoonPhaseUseCase>(
        'GetCurrentMoonPhaseUseCase',
        () => new GetCurrentMoonPhaseUseCase(
          container.resolve<IAstronomicalEventRepository>('IAstronomicalEventRepository')
        )
      );

      container.register<GetMoonPhaseForDateUseCase>(
        'GetMoonPhaseForDateUseCase',
        () => new GetMoonPhaseForDateUseCase(
          container.resolve<IAstronomicalEventRepository>('IAstronomicalEventRepository')
        )
      );
    } catch (error) {
      throw error;
    }
  }
} 