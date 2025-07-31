import { Result } from '../../../Shared/domain/Result';
import { CryptoData } from '../entities/CryptoData';
import { Symbol } from '../value-objects/Symbol';
import { Timeframe } from '../value-objects/Timeframe';

export interface CryptoDataSearchCriteria {
  symbol?: Symbol;
  timeframe?: Timeframe;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface ICryptoDataRepository {
  /**
   * Получить данные свечей для указанного символа и таймфрейма
   */
  getKlineData(symbol: Symbol, timeframe: Timeframe, limit: number): Promise<Result<CryptoData[]>>;

  /**
   * Получить данные свечей с дополнительными критериями поиска
   */
  findByCriteria(criteria: CryptoDataSearchCriteria): Promise<Result<CryptoData[]>>;

  /**
   * Получить данные за определенный период
   */
  findByPeriod(symbol: Symbol, timeframe: Timeframe, startDate: Date, endDate: Date): Promise<Result<CryptoData[]>>;

  /**
   * Получить последние данные для символа
   */
  getLatestData(symbol: Symbol, timeframe: Timeframe): Promise<Result<CryptoData | null>>;

  /**
   * Получить данные за последние N периодов
   */
  getRecentData(symbol: Symbol, timeframe: Timeframe, count: number): Promise<Result<CryptoData[]>>;

  /**
   * Получить список всех доступных символов
   */
  getSymbols(): Promise<Result<Symbol[]>>;

  /**
   * Получить список всех доступных таймфреймов
   */
  getTimeframes(): Promise<Result<Timeframe[]>>;

  /**
   * Проверить доступность данных для символа
   */
  isDataAvailable(symbol: Symbol, timeframe: Timeframe): Promise<Result<boolean>>;

  /**
   * Получить статистику данных для символа
   */
  getDataStatistics(symbol: Symbol, timeframe: Timeframe): Promise<Result<{
    totalRecords: number;
    firstDate: Date | null;
    lastDate: Date | null;
    averageVolume: number;
    averagePrice: number;
  }>>;

  /**
   * Получить данные с агрегацией (например, для построения индикаторов)
   */
  getAggregatedData(
    symbol: Symbol, 
    timeframe: Timeframe, 
    aggregationType: 'sma' | 'ema' | 'volume' | 'price',
    period: number
  ): Promise<Result<Array<{ timestamp: Date; value: number }>>>;

  /**
   * Сохранить новые данные (для кэширования или локального хранения)
   */
  saveData(data: CryptoData[]): Promise<Result<void>>;

  /**
   * Очистить кэш для символа
   */
  clearCache(symbol?: Symbol): Promise<Result<void>>;
} 