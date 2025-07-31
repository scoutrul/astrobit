import { Result } from '../../../Shared/domain/Result';
import { IChartRepository, ChartSearchCriteria } from '../../Domain/repositories/IChartRepository';
import { Chart } from '../../Domain/entities/Chart';
import { ChartConfig } from '../../Domain/value-objects/ChartConfig';
import { ChartData } from '../../Domain/value-objects/ChartData';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';

export class LightweightChartsRepository implements IChartRepository {
  private charts: Map<string, Chart> = new Map();
  private chartInstances: Map<string, IChartApi> = new Map();
  private seriesInstances: Map<string, ISeriesApi<'Candlestick'>> = new Map();

  async createChart(symbol: string, timeframe: string, config: ChartConfig): Promise<Result<Chart>> {
    try {
      const chartId = `${symbol}_${timeframe}_${Date.now()}`;
      
      const chart = Chart.create(symbol, timeframe, config);
      
      this.charts.set(chartId, chart);
      
      return Result.ok(chart);
    } catch (error) {
      return Result.fail(`Failed to create chart: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getChart(id: string): Promise<Result<Chart | null>> {
    try {
      const chart = this.charts.get(id) || null;
      return Result.ok(chart);
    } catch (error) {
      return Result.fail(`Failed to get chart: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getChartBySymbol(symbol: string, timeframe: string): Promise<Result<Chart | null>> {
    try {
      // Ищем существующий график по символу и таймфрейму
      for (const [, chart] of this.charts.entries()) {
        if (chart.symbol === symbol && chart.timeframe === timeframe) {
          return Result.ok(chart);
        }
      }
      
      return Result.ok(null);
    } catch (error) {
      return Result.fail(`Failed to get chart by symbol: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateChartData(chartId: string, data: ChartData): Promise<Result<Chart>> {
    try {
      const chart = this.charts.get(chartId);
      if (!chart) {
        return Result.fail(`Chart not found: ${chartId}`);
      }

      const updatedChart = chart.withData(data);
      this.charts.set(chartId, updatedChart);

      // Обновляем данные в Lightweight Charts если экземпляр существует
      const seriesInstance = this.seriesInstances.get(chartId);
      if (seriesInstance && !data.isEmpty()) {
        const candlestickData = data.toCandlestickData();
        if (candlestickData.length > 0) {
          seriesInstance.setData(candlestickData as any);
        }
      }

      return Result.ok(updatedChart);
    } catch (error) {
      return Result.fail(`Failed to update chart data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateChartConfig(chartId: string, config: ChartConfig): Promise<Result<Chart>> {
    try {
      const chart = this.charts.get(chartId);
      if (!chart) {
        return Result.fail(`Chart not found: ${chartId}`);
      }

      const updatedChart = chart.withConfig(config);
      this.charts.set(chartId, updatedChart);

      // Обновляем конфигурацию в Lightweight Charts если экземпляр существует
      const chartInstance = this.chartInstances.get(chartId);
      if (chartInstance) {
        chartInstance.applyOptions(config.options as any);
      }

      return Result.ok(updatedChart);
    } catch (error) {
      return Result.fail(`Failed to update chart config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateChartState(chartId: string, state: {
    isReady?: boolean;
    isLoading?: boolean;
    error?: string | null;
  }): Promise<Result<Chart>> {
    try {
      const chart = this.charts.get(chartId);
      if (!chart) {
        return Result.fail(`Chart not found: ${chartId}`);
      }

      let updatedChart = chart;
      
      if (state.isReady !== undefined) {
        updatedChart = updatedChart.withReady(state.isReady);
      }
      
      if (state.isLoading !== undefined) {
        updatedChart = updatedChart.withLoading(state.isLoading);
      }
      
      if (state.error !== undefined) {
        updatedChart = updatedChart.withError(state.error);
      }

      this.charts.set(chartId, updatedChart);
      return Result.ok(updatedChart);
    } catch (error) {
      return Result.fail(`Failed to update chart state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateChartInteraction(chartId: string, interaction: {
    isMouseOver?: boolean;
    mousePosition?: { x: number; y: number } | null;
    selectedPoint?: any | null;
    visibleRange?: { from: number; to: number } | null;
  }): Promise<Result<Chart>> {
    try {
      const chart = this.charts.get(chartId);
      if (!chart) {
        return Result.fail(`Chart not found: ${chartId}`);
      }

      let updatedChart = chart;
      
      if (interaction.isMouseOver !== undefined) {
        updatedChart = updatedChart.withMouseOver(interaction.isMouseOver);
      }
      
      if (interaction.mousePosition !== undefined) {
        updatedChart = updatedChart.withMousePosition(interaction.mousePosition);
      }
      
      if (interaction.selectedPoint !== undefined) {
        updatedChart = updatedChart.withSelectedPoint(interaction.selectedPoint);
      }
      
      if (interaction.visibleRange !== undefined) {
        updatedChart = updatedChart.withVisibleRange(interaction.visibleRange);
      }

      this.charts.set(chartId, updatedChart);
      return Result.ok(updatedChart);
    } catch (error) {
      return Result.fail(`Failed to update chart interaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByCriteria(criteria: ChartSearchCriteria): Promise<Result<Chart[]>> {
    try {
      const charts: Chart[] = [];
      
      for (const chart of this.charts.values()) {
        let matches = true;
        
        if (criteria.symbol && chart.symbol !== criteria.symbol) {
          matches = false;
        }
        
        if (criteria.timeframe && chart.timeframe !== criteria.timeframe) {
          matches = false;
        }
        
        if (criteria.chartType && chart.config.type !== criteria.chartType) {
          matches = false;
        }
        
        if (criteria.theme && chart.config.theme !== criteria.theme) {
          matches = false;
        }
        
        if (matches) {
          charts.push(chart);
        }
      }
      
      return Result.ok(charts);
    } catch (error) {
      return Result.fail(`Failed to find charts by criteria: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllCharts(): Promise<Result<Chart[]>> {
    try {
      return Result.ok(Array.from(this.charts.values()));
    } catch (error) {
      return Result.fail(`Failed to get all charts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteChart(chartId: string): Promise<Result<void>> {
    try {
      const chart = this.charts.get(chartId);
      if (!chart) {
        return Result.fail(`Chart not found: ${chartId}`);
      }

      // Уничтожаем Lightweight Charts экземпляры
      const chartInstance = this.chartInstances.get(chartId);
      if (chartInstance) {
        chartInstance.remove();
        this.chartInstances.delete(chartId);
      }

      this.seriesInstances.delete(chartId);
      this.charts.delete(chartId);

      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to delete chart: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async clearAllCharts(): Promise<Result<void>> {
    try {
      // Уничтожаем все Lightweight Charts экземпляры
      for (const chartInstance of this.chartInstances.values()) {
        chartInstance.remove();
      }

      this.chartInstances.clear();
      this.seriesInstances.clear();
      this.charts.clear();

      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to clear all charts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getChartStatistics(): Promise<Result<{
    totalCharts: number;
    activeCharts: number;
    chartsWithData: number;
    chartsWithErrors: number;
  }>> {
    try {
      const charts = Array.from(this.charts.values());
      
      const statistics = {
        totalCharts: charts.length,
        activeCharts: charts.filter(chart => chart.isReady()).length,
        chartsWithData: charts.filter(chart => chart.hasData()).length,
        chartsWithErrors: charts.filter(chart => chart.hasError()).length
      };

      return Result.ok(statistics);
    } catch (error) {
      return Result.fail(`Failed to get chart statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async saveToCache(chart: Chart): Promise<Result<void>> {
    try {
      // В этой реализации кэш - это просто in-memory Map
      // В реальном приложении здесь была бы логика сохранения в localStorage или другой кэш
      this.charts.set(chart.id, chart);
      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to save chart to cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async loadFromCache(chartId: string): Promise<Result<Chart | null>> {
    try {
      const chart = this.charts.get(chartId) || null;
      return Result.ok(chart);
    } catch (error) {
      return Result.fail(`Failed to load chart from cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async clearCache(): Promise<Result<void>> {
    try {
      this.charts.clear();
      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to clear cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Методы для работы с Lightweight Charts экземплярами
  createChartInstance(container: HTMLElement, config: ChartConfig): IChartApi {
    const chartInstance = createChart(container, config.options as any);
    return chartInstance;
  }

  createSeriesInstance(chartInstance: IChartApi, chartType: string): ISeriesApi<'Candlestick'> {
    if (chartType === 'candlestick') {
      return chartInstance.addCandlestickSeries();
    }
    // Добавить поддержку других типов серий при необходимости
    return chartInstance.addCandlestickSeries();
  }

  storeChartInstance(chartId: string, chartInstance: IChartApi): void {
    this.chartInstances.set(chartId, chartInstance);
  }

  storeSeriesInstance(chartId: string, seriesInstance: ISeriesApi<'Candlestick'>): void {
    this.seriesInstances.set(chartId, seriesInstance);
  }

  getChartInstance(chartId: string): IChartApi | undefined {
    return this.chartInstances.get(chartId);
  }

  getSeriesInstance(chartId: string): ISeriesApi<'Candlestick'> | undefined {
    return this.seriesInstances.get(chartId);
  }
} 