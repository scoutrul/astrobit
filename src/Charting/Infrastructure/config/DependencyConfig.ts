import { DependencyContainer } from '../../../Shared/infrastructure/DependencyContainer';
import { IChartRepository } from '../../Domain/repositories/IChartRepository';
import { LightweightChartsRepository } from '../repositories/LightweightChartsRepository';
import { RenderChartUseCase } from '../../Application/use-cases/RenderChartUseCase';
import { UpdateChartDataUseCase } from '../../Application/use-cases/UpdateChartDataUseCase';

export class ChartingDependencyConfig {
  static configure(container: DependencyContainer): void {
    // Регистрируем репозиторий
    container.register<IChartRepository>('IChartRepository', () => 
      new LightweightChartsRepository()
    );

    // Регистрируем use cases
    container.register<RenderChartUseCase>('RenderChartUseCase', () =>
      new RenderChartUseCase(container.resolve<IChartRepository>('IChartRepository'))
    );

    container.register<UpdateChartDataUseCase>('UpdateChartDataUseCase', () =>
      new UpdateChartDataUseCase(container.resolve<IChartRepository>('IChartRepository'))
    );
  }
} 