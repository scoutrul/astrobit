import { UseCase } from '../../../Shared/application/UseCase';
import { Result } from '../../../Shared/domain/Result';
import { IChartRepository } from '../../Domain/repositories/IChartRepository';
import { Chart } from '../../Domain/entities/Chart';
import { ChartConfig } from '../../Domain/value-objects/ChartConfig';

export interface RenderChartRequest {
  symbol: string;
  timeframe: string;
  width: number;
  height: number;
  theme?: 'dark' | 'light';
  chartType?: 'candlestick' | 'line' | 'area' | 'bar';
}

export interface RenderChartResponse {
  chart: Chart;
  isNew: boolean;
  message: string;
}

export class RenderChartUseCase extends UseCase<RenderChartRequest, RenderChartResponse> {
  constructor(private readonly chartRepository: IChartRepository) {
    super();
  }

  async execute(request: RenderChartRequest): Promise<Result<RenderChartResponse>> {
    try {
      // Validate request
      const validationResult = this.validateRequest(request);
      if (validationResult.isFailure) {
        return Result.fail(validationResult.error);
      }

      // Check if chart already exists
      const existingChartResult = await this.chartRepository.getChartBySymbol(
        request.symbol,
        request.timeframe
      );

      if (existingChartResult.isFailure) {
        return Result.fail(`Failed to check existing chart: ${existingChartResult.error}`);
      }

      let chart: Chart;
      let isNew = false;

      if (existingChartResult.value) {
        // Update existing chart configuration
        chart = existingChartResult.value;
        
        const newConfig = this.createChartConfig(request);
        const updateResult = await this.chartRepository.updateChartConfig(chart.id, newConfig);
        
        if (updateResult.isFailure) {
          return Result.fail(`Failed to update chart config: ${updateResult.error}`);
        }
        
        chart = updateResult.value;
      } else {
        // Create new chart
        const config = this.createChartConfig(request);
        const createResult = await this.chartRepository.createChart(
          request.symbol,
          request.timeframe,
          config
        );

        if (createResult.isFailure) {
          return Result.fail(`Failed to create chart: ${createResult.error}`);
        }

        chart = createResult.value;
        isNew = true;
      }

      const response: RenderChartResponse = {
        chart,
        isNew,
        message: isNew ? 'Chart created successfully' : 'Chart updated successfully'
      };

      return Result.ok(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  protected validateRequest(request: RenderChartRequest): Result<RenderChartRequest> {
    if (!request.symbol || request.symbol.trim().length === 0) {
      return Result.fail('Symbol is required');
    }

    if (!request.timeframe || request.timeframe.trim().length === 0) {
      return Result.fail('Timeframe is required');
    }

    const validTimeframes = ['1h', '8h', '1d', '1w', '1M'];
    if (!validTimeframes.includes(request.timeframe)) {
      return Result.fail(`Invalid timeframe: ${request.timeframe}. Valid timeframes are: ${validTimeframes.join(', ')}`);
    }

    if (request.width <= 0 || request.height <= 0) {
      return Result.fail('Width and height must be positive');
    }

    if (request.width > 10000 || request.height > 10000) {
      return Result.fail('Width and height must be less than 10000');
    }

    if (request.theme && !['dark', 'light'].includes(request.theme)) {
      return Result.fail('Theme must be either "dark" or "light"');
    }

    if (request.chartType && !['candlestick', 'line', 'area', 'bar'].includes(request.chartType)) {
      return Result.fail('Chart type must be one of: candlestick, line, area, bar');
    }

    return Result.ok(request);
  }

  private createChartConfig(request: RenderChartRequest): ChartConfig {
    const theme = request.theme || 'dark';
    const chartType = request.chartType || 'candlestick';

    if (theme === 'dark') {
      return ChartConfig.createDarkCandlestickConfig(request.width, request.height)
        .withType(chartType as any);
    } else {
      return ChartConfig.createLightCandlestickConfig(request.width, request.height)
        .withType(chartType as any);
    }
  }

  private handleError(error: unknown): Result<never> {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return Result.fail(`RenderChartUseCase error: ${errorMessage}`);
  }
} 