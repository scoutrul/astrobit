import { Result } from '../../../Shared/domain/Result';
import { ICryptoDataRepository, CryptoDataSearchCriteria } from '../../Domain/repositories/ICryptoDataRepository';
import { CryptoData } from '../../Domain/entities/CryptoData';
import { Symbol } from '../../Domain/value-objects/Symbol';
import { Timeframe } from '../../Domain/value-objects/Timeframe';
import { CcxtService } from '../external-services/CcxtService';
import { TimeframeMapper } from '../utils/TimeframeMapper';

export class CcxtCryptoDataRepository implements ICryptoDataRepository {
  constructor(private readonly ccxtService: CcxtService) {}

  async getKlineData(symbol: Symbol, timeframe: Timeframe, limit: number): Promise<Result<CryptoData[]>> {
    try {
      // Проверяем доступность сервиса
      const isAvailable = await this.ccxtService.isAvailable();
      if (!isAvailable) {
        return Result.fail('CCXT service is not available');
      }

      // Получаем данные с Binance (основная биржа)
      const klineDataResult = await this.ccxtService.getKlineData(
        symbol.toString(),
        TimeframeMapper.mapToExternal(timeframe),
        limit,
        'binance'
      );

      if (klineDataResult.isFailure) {
        // Если Binance недоступен, пробуем Bybit
        const bybitDataResult = await this.ccxtService.getKlineData(
          symbol.toString(),
          TimeframeMapper.mapToExternal(timeframe),
          limit,
          'bybit'
        );

        if (bybitDataResult.isFailure) {
          return Result.fail(`Failed to fetch data from both exchanges: ${klineDataResult.error}, ${bybitDataResult.error}`);
        }

        return this.convertKlineDataToCryptoData(bybitDataResult.value, symbol, timeframe);
      }

      return this.convertKlineDataToCryptoData(klineDataResult.value, symbol, timeframe);
    } catch (error) {
      console.error('[CcxtCryptoDataRepository] Error in getKlineData:', error);
      return Result.fail(`Failed to get kline data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByCriteria(criteria: CryptoDataSearchCriteria): Promise<Result<CryptoData[]>> {
    try {
      const { symbol, timeframe, startDate, endDate, limit = 1000 } = criteria;
      
      if (!symbol || !timeframe) {
        return Result.fail('Symbol and timeframe are required for search criteria');
      }

      const klineDataResult = await this.getKlineData(symbol, timeframe, limit);
      if (klineDataResult.isFailure) {
        return Result.fail(klineDataResult.error);
      }

      let filteredData = klineDataResult.value;

      // Фильтрация по датам
      if (startDate || endDate) {
        filteredData = filteredData.filter(cryptoData => {
          const timestamp = cryptoData.timestamp.getTime();
          const start = startDate ? startDate.getTime() : 0;
          const end = endDate ? endDate.getTime() : Date.now();
          return timestamp >= start && timestamp <= end;
        });
      }

      return Result.ok(filteredData);
    } catch (error) {
      console.error('[CcxtCryptoDataRepository] Error in findByCriteria:', error);
      return Result.fail(`Failed to find by criteria: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByPeriod(symbol: Symbol, timeframe: Timeframe, startDate: Date, endDate: Date): Promise<Result<CryptoData[]>> {
    try {
      const criteria: CryptoDataSearchCriteria = {
        symbol,
        timeframe,
        startDate,
        endDate,
        limit: 5000 // Увеличиваем лимит для больших периодов
      };

      return this.findByCriteria(criteria);
    } catch (error) {
      console.error('[CcxtCryptoDataRepository] Error in findByPeriod:', error);
      return Result.fail(`Failed to find by period: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getLatestData(symbol: Symbol, timeframe: Timeframe): Promise<Result<CryptoData | null>> {
    try {
      const dataResult = await this.getKlineData(symbol, timeframe, 1);
      if (dataResult.isFailure) {
        return Result.fail(dataResult.error);
      }
      return Result.ok(dataResult.value[0] || null);
    } catch (error) {
      console.error('[CcxtCryptoDataRepository] Error in getLatestData:', error);
      return Result.fail(`Failed to get latest data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRecentData(symbol: Symbol, timeframe: Timeframe, count: number): Promise<Result<CryptoData[]>> {
    try {
      return this.getKlineData(symbol, timeframe, count);
    } catch (error) {
      console.error('[CcxtCryptoDataRepository] Error in getRecentData:', error);
      return Result.fail(`Failed to get recent data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSymbols(): Promise<Result<Symbol[]>> {
    try {
      // Получаем символы с Binance
      const binanceSymbolsResult = await this.ccxtService.getSymbols('binance');
      if (binanceSymbolsResult.isSuccess) {
        const symbols = binanceSymbolsResult.value
          .filter(info => info.active && info.spot) // Только активные спотовые пары
          .map(info => new Symbol(info.symbol));
        return Result.ok(symbols);
      }

      // Если Binance недоступен, пробуем Bybit
      const bybitSymbolsResult = await this.ccxtService.getSymbols('bybit');
      if (bybitSymbolsResult.isSuccess) {
        const symbols = bybitSymbolsResult.value
          .filter(info => info.active && info.spot)
          .map(info => new Symbol(info.symbol));
        return Result.ok(symbols);
      }

      return Result.fail('Failed to fetch symbols from both exchanges');
    } catch (error) {
      console.error('[CcxtCryptoDataRepository] Error in getSymbols:', error);
      return Result.fail(`Failed to get symbols: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTimeframes(): Promise<Result<Timeframe[]>> {
    try {
      // Получаем поддерживаемые таймфреймы с Binance
      const binanceTimeframes = await this.ccxtService.getSupportedTimeframes('binance');
      if (binanceTimeframes.length > 0) {
        const timeframes = binanceTimeframes
          .filter(tf => ['1h', '8h', '1d', '1w', '1M'].includes(tf))
          .map(tf => TimeframeMapper.mapFromExternal(tf));
        return Result.ok(timeframes);
      }

      // Если Binance недоступен, пробуем Bybit
      const bybitTimeframes = await this.ccxtService.getSupportedTimeframes('bybit');
      if (bybitTimeframes.length > 0) {
        const timeframes = bybitTimeframes
          .filter(tf => ['1h', '8h', '1d', '1w', '1M'].includes(tf))
          .map(tf => TimeframeMapper.mapFromExternal(tf));
        return Result.ok(timeframes);
      }

      return Result.fail('Failed to fetch timeframes from both exchanges');
    } catch (error) {
      console.error('[CcxtCryptoDataRepository] Error in getTimeframes:', error);
      return Result.fail(`Failed to get timeframes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async isDataAvailable(symbol: Symbol, _timeframe: Timeframe): Promise<Result<boolean>> {
    try {
      // Проверяем доступность данных через получение тикера
      const priceResult = await this.ccxtService.getCurrentPrice(symbol.toString(), 'binance');
      if (priceResult.isSuccess) {
        return Result.ok(true);
      }

      // Если Binance недоступен, пробуем Bybit
      const bybitPriceResult = await this.ccxtService.getCurrentPrice(symbol.toString(), 'bybit');
      return Result.ok(bybitPriceResult.isSuccess);
    } catch (error) {
      console.error('[CcxtCryptoDataRepository] Error in isDataAvailable:', error);
      return Result.ok(false);
    }
  }

  async getDataStatistics(symbol: Symbol, timeframe: Timeframe): Promise<Result<{
    totalRecords: number;
    firstDate: Date | null;
    lastDate: Date | null;
    averageVolume: number;
    averagePrice: number;
  }>> {
    try {
      const dataResult = await this.getKlineData(symbol, timeframe, 1000);
      if (dataResult.isFailure) {
        return Result.fail(dataResult.error);
      }

      const data = dataResult.value;
      if (data.length === 0) {
        return Result.ok({
          totalRecords: 0,
          firstDate: null,
          lastDate: null,
          averageVolume: 0,
          averagePrice: 0
        });
      }

      const prices = data.map(d => d.close);
      const volumes = data.map(d => d.volume);
      const timestamps = data.map(d => d.timestamp.getTime());

      const averageVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
      const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

      const statistics = {
        totalRecords: data.length,
        firstDate: new Date(Math.min(...timestamps)),
        lastDate: new Date(Math.max(...timestamps)),
        averageVolume,
        averagePrice
      };

      return Result.ok(statistics);
    } catch (error) {
      console.error('[CcxtCryptoDataRepository] Error in getDataStatistics:', error);
      return Result.fail(`Failed to get data statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAggregatedData(
    symbol: Symbol, 
    timeframe: Timeframe, 
    aggregationType: 'sma' | 'ema' | 'volume' | 'price', 
    period: number
  ): Promise<Result<Array<{ timestamp: Date; value: number }>>> {
    try {
      const dataResult = await this.getKlineData(symbol, timeframe, period * 2); // Получаем больше данных для расчета
      if (dataResult.isFailure) {
        return Result.fail(dataResult.error);
      }

      const data = dataResult.value;
      if (data.length < period) {
        return Result.fail(`Insufficient data for ${period}-period aggregation`);
      }

      const aggregatedData: Array<{ timestamp: Date; value: number }> = [];

      switch (aggregationType) {
        case 'sma':
          for (let i = period - 1; i < data.length; i++) {
            const slice = data.slice(i - period + 1, i + 1);
            const sma = slice.reduce((sum, d) => sum + d.close, 0) / period;
            aggregatedData.push({
              timestamp: data[i].timestamp,
              value: sma
            });
          }
          break;

        case 'ema':
          const multiplier = 2 / (period + 1);
          let ema = data[0].close;
          aggregatedData.push({
            timestamp: data[0].timestamp,
            value: ema
          });

          for (let i = 1; i < data.length; i++) {
            ema = (data[i].close * multiplier) + (ema * (1 - multiplier));
            aggregatedData.push({
              timestamp: data[i].timestamp,
              value: ema
            });
          }
          break;

        case 'volume':
          for (let i = period - 1; i < data.length; i++) {
            const slice = data.slice(i - period + 1, i + 1);
            const avgVolume = slice.reduce((sum, d) => sum + d.volume, 0) / period;
            aggregatedData.push({
              timestamp: data[i].timestamp,
              value: avgVolume
            });
          }
          break;

        case 'price':
          for (let i = 0; i < data.length; i++) {
            aggregatedData.push({
              timestamp: data[i].timestamp,
              value: data[i].close
            });
          }
          break;
      }

      return Result.ok(aggregatedData);
    } catch (error) {
      console.error('[CcxtCryptoDataRepository] Error in getAggregatedData:', error);
      return Result.fail(`Failed to get aggregated data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async saveData(_data: CryptoData[]): Promise<Result<void>> {
    // CCXT не поддерживает сохранение данных, только чтение
    return Result.ok();
  }

  async clearCache(_symbol?: Symbol): Promise<Result<void>> {
    // CCXT не поддерживает кэширование на уровне репозитория
    return Result.ok();
  }

  // Вспомогательные методы

  private convertKlineDataToCryptoData(
    klineData: any[], 
    symbol: Symbol, 
    _timeframe: Timeframe
  ): Result<CryptoData[]> {
    try {
      const cryptoDataArray: CryptoData[] = [];

      for (const kline of klineData) {
        const cryptoData = CryptoData.fromApiFormat({
          symbol: symbol.toString(),
          time: new Date(kline.timestamp).toISOString(),
          open: kline.open,
          high: kline.high,
          low: kline.low,
          close: kline.close,
          volume: kline.volume
        });

        cryptoDataArray.push(cryptoData);
      }

      return Result.ok(cryptoDataArray);
    } catch (error) {
      console.error('[CcxtCryptoDataRepository] Error converting kline data:', error);
      return Result.fail(`Failed to convert kline data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Методы для работы с несколькими биржами

  async getMultiExchangeKlineData(
    symbol: Symbol, 
    timeframe: Timeframe, 
    limit: number = 1000
  ): Promise<Result<{ [exchange: string]: CryptoData[] }>> {
    try {
      const multiDataResult = await this.ccxtService.getMultiExchangeData(
        symbol.toString(),
        TimeframeMapper.mapToExternal(timeframe),
        limit
      );

      if (multiDataResult.isFailure) {
        return Result.fail(multiDataResult.error);
      }

      const result: { [exchange: string]: CryptoData[] } = {};
      
      for (const [exchange, klineData] of Object.entries(multiDataResult.value)) {
        const cryptoDataResult = this.convertKlineDataToCryptoData(klineData, symbol, timeframe);
        if (cryptoDataResult.isSuccess) {
          result[exchange] = cryptoDataResult.value;
        }
      }

      return Result.ok(result);
    } catch (error) {
      console.error('[CcxtCryptoDataRepository] Error in getMultiExchangeKlineData:', error);
      return Result.fail(`Failed to get multi-exchange data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getBestPrice(symbol: Symbol): Promise<Result<{ exchange: string; price: number; type: 'bid' | 'ask' }>> {
    try {
      return await this.ccxtService.getBestPrice(symbol.toString());
    } catch (error) {
      console.error('[CcxtCryptoDataRepository] Error in getBestPrice:', error);
      return Result.fail(`Failed to get best price: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 