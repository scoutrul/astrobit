import { UseCase } from '../../../Shared/application/UseCase';
import { Result } from '../../../Shared/domain/Result';
import { IChartRepository } from '../../Domain/repositories/IChartRepository';
import { Chart } from '../../Domain/entities/Chart';
import { ChartData } from '../../Domain/value-objects/ChartData';

export interface UpdateChartDataRequest {
  chartId: string;
  data: Array<{
    time: number;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    value?: number;
  }>;
  markers?: Array<{
    time: number;
    position: 'aboveBar' | 'belowBar' | 'inBar';
    color: string;
    text: string;
    size: number;
  }>;
}

export interface UpdateChartDataResponse {
  chart: Chart;
  dataCount: number;
  markerCount: number;
  message: string;
}

export class UpdateChartDataUseCase extends UseCase<UpdateChartDataRequest, UpdateChartDataResponse> {
  constructor(private readonly chartRepository: IChartRepository) {
    super();
  }

  async execute(request: UpdateChartDataRequest): Promise<Result<UpdateChartDataResponse>> {
    try {
      // Validate request
      const validationResult = this.validateRequest(request);
      if (validationResult.isFailure) {
        return Result.fail(validationResult.error);
      }

      // Get existing chart
      const chartResult = await this.chartRepository.getChart(request.chartId);
      
      if (chartResult.isFailure) {
        return Result.fail(`Failed to get chart: ${chartResult.error}`);
      }

      if (!chartResult.value) {
        return Result.fail(`Chart not found: ${request.chartId}`);
      }

      // Create new chart data
      const chartData = ChartData.createFromCandlestickData(
        request.data as any,
        request.markers || []
      );

      // Update chart with new data
      const updateResult = await this.chartRepository.updateChartData(request.chartId, chartData);
      
      if (updateResult.isFailure) {
        return Result.fail(`Failed to update chart data: ${updateResult.error}`);
      }

      const updatedChart = updateResult.value;

      const response: UpdateChartDataResponse = {
        chart: updatedChart,
        dataCount: chartData.getDataCount(),
        markerCount: chartData.getMarkerCount(),
        message: `Chart data updated successfully: ${chartData.getDataCount()} data points, ${chartData.getMarkerCount()} markers`
      };

      return Result.ok(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  protected validateRequest(request: UpdateChartDataRequest): Result<UpdateChartDataRequest> {
    if (!request.chartId || request.chartId.trim().length === 0) {
      return Result.fail('Chart ID is required');
    }

    if (!Array.isArray(request.data)) {
      return Result.fail('Data must be an array');
    }

    if (request.data.length === 0) {
      return Result.fail('Data array cannot be empty');
    }

    // Validate data points
    for (const point of request.data) {
      if (!point || typeof point !== 'object') {
        return Result.fail('Invalid data point');
      }

      if (!point.time || typeof point.time !== 'number') {
        return Result.fail('Data point must have a valid time');
      }

      // Check if it's candlestick data
      if ('open' in point || 'high' in point || 'low' in point || 'close' in point) {
        if (typeof point.open !== 'number' || typeof point.high !== 'number' || 
            typeof point.low !== 'number' || typeof point.close !== 'number') {
          return Result.fail('Candlestick data must have valid open, high, low, close values');
        }

        if (point.open <= 0 || point.high <= 0 || point.low <= 0 || point.close <= 0) {
          return Result.fail('Candlestick data must have positive values');
        }

        if (point.high < Math.max(point.open, point.close)) {
          return Result.fail('High must be greater than or equal to open and close');
        }

        if (point.low > Math.min(point.open, point.close)) {
          return Result.fail('Low must be less than or equal to open and close');
        }
      }

      // Check if it's line/area/bar data
      if ('value' in point) {
        if (typeof point.value !== 'number') {
          return Result.fail('Data point must have a valid value');
        }
      }
    }

    // Validate markers if provided
    if (request.markers) {
      if (!Array.isArray(request.markers)) {
        return Result.fail('Markers must be an array');
      }

      for (const marker of request.markers) {
        if (!marker || typeof marker !== 'object') {
          return Result.fail('Invalid marker');
        }

        if (!marker.time || typeof marker.time !== 'number') {
          return Result.fail('Marker must have a valid time');
        }

        if (!marker.position || !['aboveBar', 'belowBar', 'inBar'].includes(marker.position)) {
          return Result.fail('Marker must have a valid position');
        }

        if (!marker.color || typeof marker.color !== 'string') {
          return Result.fail('Marker must have a valid color');
        }

        if (!marker.text || typeof marker.text !== 'string') {
          return Result.fail('Marker must have a valid text');
        }

        if (!marker.size || typeof marker.size !== 'number' || marker.size <= 0) {
          return Result.fail('Marker must have a valid size');
        }
      }
    }

    return Result.ok(request);
  }

  private handleError(error: unknown): Result<never> {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return Result.fail(`UpdateChartDataUseCase error: ${errorMessage}`);
  }
} 