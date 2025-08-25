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
      console.log('🔧 [AstronomicalDependencyConfig] Начинаем конфигурацию...');
      
      // Регистрация репозитория
      console.log('🔧 [AstronomicalDependencyConfig] Регистрируем репозиторий...');
      container.register<IAstronomicalEventRepository>(
        'IAstronomicalEventRepository',
        () => new InMemoryAstronomicalEventRepository()
      );
      console.log('✅ [AstronomicalDependencyConfig] Репозиторий зарегистрирован');

      // Регистрация use cases
      console.log('🔧 [AstronomicalDependencyConfig] Регистрируем use cases...');
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
      
      console.log('✅ [AstronomicalDependencyConfig] Use cases зарегистрированы');
      console.log('✅ [AstronomicalDependencyConfig] Конфигурация завершена');
    } catch (error) {
      console.error('❌ [AstronomicalDependencyConfig] Ошибка конфигурации:', error);
      throw error;
    }
  }
} 