import { Result } from '../../../Shared/domain/Result';
import { Chart } from '../entities/Chart';
import { ChartConfig } from '../value-objects/ChartConfig';
import { ChartData } from '../value-objects/ChartData';

export interface ChartSearchCriteria {
  symbol?: string;
  timeframe?: string;
  chartType?: string;
  theme?: string;
}

export interface IChartRepository {
  /**
   * Создать новый график
   */
  createChart(symbol: string, timeframe: string, config: ChartConfig): Promise<Result<Chart>>;

  /**
   * Получить график по ID
   */
  getChart(id: string): Promise<Result<Chart | null>>;

  /**
   * Получить график по символу и таймфрейму
   */
  getChartBySymbol(symbol: string, timeframe: string): Promise<Result<Chart | null>>;

  /**
   * Обновить данные графика
   */
  updateChartData(chartId: string, data: ChartData): Promise<Result<Chart>>;

  /**
   * Обновить конфигурацию графика
   */
  updateChartConfig(chartId: string, config: ChartConfig): Promise<Result<Chart>>;

  /**
   * Обновить состояние графика
   */
  updateChartState(chartId: string, state: {
    isReady?: boolean;
    isLoading?: boolean;
    error?: string | null;
  }): Promise<Result<Chart>>;

  /**
   * Обновить взаимодействие с графиком
   */
  updateChartInteraction(chartId: string, interaction: {
    isMouseOver?: boolean;
    mousePosition?: { x: number; y: number } | null;
    selectedPoint?: any | null;
    visibleRange?: { from: number; to: number } | null;
  }): Promise<Result<Chart>>;

  /**
   * Найти графики по критериям
   */
  findByCriteria(criteria: ChartSearchCriteria): Promise<Result<Chart[]>>;

  /**
   * Получить все графики
   */
  getAllCharts(): Promise<Result<Chart[]>>;

  /**
   * Удалить график
   */
  deleteChart(chartId: string): Promise<Result<void>>;

  /**
   * Очистить все графики
   */
  clearAllCharts(): Promise<Result<void>>;

  /**
   * Получить статистику графиков
   */
  getChartStatistics(): Promise<Result<{
    totalCharts: number;
    activeCharts: number;
    chartsWithData: number;
    chartsWithErrors: number;
  }>>;

  /**
   * Сохранить график в кэш
   */
  saveToCache(chart: Chart): Promise<Result<void>>;

  /**
   * Загрузить график из кэша
   */
  loadFromCache(chartId: string): Promise<Result<Chart | null>>;

  /**
   * Очистить кэш
   */
  clearCache(): Promise<Result<void>>;
} 