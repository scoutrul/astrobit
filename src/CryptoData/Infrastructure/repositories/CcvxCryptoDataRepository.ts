import { Result } from '../../../Shared/domain/Result';
import { ICryptoDataRepository, CryptoDataSearchCriteria } from '../../Domain/repositories/ICryptoDataRepository';
import { CryptoData } from '../../Domain/entities/CryptoData';
import { Symbol } from '../../Domain/value-objects/Symbol';
import { Timeframe } from '../../Domain/value-objects/Timeframe';
import { CcvxService } from '../external-services/CcvxService';
import { TimeframeMapper } from '../utils/TimeframeMapper';

export class CcvxCryptoDataRepository implements ICryptoDataRepository {
  constructor(private readonly ccvxService: CcvxService) {}

  async getKlineData(symbol: Symbol, timeframe: Timeframe, limit: number): Promise<Result<CryptoData[]>> {
    try {
      const externalTimeframe = TimeframeMapper.mapToExternal(timeframe);
      const klineData = await this.ccvxService.getKlineData(symbol.value, externalTimeframe, limit);
      
      const cryptoData = klineData.data.map(item => 
        CryptoData.createTestData(
          symbol,
          timeframe,
          new Date(item.timestamp),
          item.open,
          item.high,
          item.low,
          item.close,
          item.volume
        )
      );

      return Result.ok(cryptoData);
    } catch (error) {
      return Result.fail(`Failed to get kline data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByCriteria(criteria: CryptoDataSearchCriteria): Promise<Result<CryptoData[]>> {
    try {
      if (!criteria.symbol || !criteria.timeframe) {
        return Result.fail('Symbol and timeframe are required for search criteria');
      }

      const limit = criteria.limit || criteria.timeframe.getRecommendedDataLimit();
      return await this.getKlineData(criteria.symbol, criteria.timeframe, limit);
    } catch (error) {
      return Result.fail(`Failed to find by criteria: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByPeriod(symbol: Symbol, timeframe: Timeframe, startDate: Date, endDate: Date): Promise<Result<CryptoData[]>> {
    try {
      // Получаем максимальное количество данных и фильтруем по периоду
      const maxLimit = 10000;
      const dataResult = await this.getKlineData(symbol, timeframe, maxLimit);
      
      if (dataResult.isFailure) {
        return dataResult;
      }

      const filteredData = dataResult.value.filter(item => 
        item.timestamp >= startDate && item.timestamp <= endDate
      );

      return Result.ok(filteredData);
    } catch (error) {
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
      return Result.fail(`Failed to get latest data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRecentData(symbol: Symbol, timeframe: Timeframe, count: number): Promise<Result<CryptoData[]>> {
    try {
      return await this.getKlineData(symbol, timeframe, count);
    } catch (error) {
      return Result.fail(`Failed to get recent data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSymbols(): Promise<Result<Symbol[]>> {
    try {
      const symbolsInfo = await this.ccvxService.getSymbols();
      const symbols = symbolsInfo.map(info => new Symbol(info.symbol));
      return Result.ok(symbols);
    } catch (error) {
      return Result.fail(`Failed to get symbols: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTimeframes(): Promise<Result<Timeframe[]>> {
    try {
      const timeframes = TimeframeMapper.getDomainTimeframes();
      return Result.ok(timeframes);
    } catch (error) {
      return Result.fail(`Failed to get timeframes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async isDataAvailable(symbol: Symbol, _timeframe: Timeframe): Promise<Result<boolean>> {
    try {
      // Проверяем доступность сервиса и символа
      const isServiceAvailable = await this.ccvxService.isAvailable();
      if (!isServiceAvailable) {
        return Result.ok(false);
      }

      const symbolsResult = await this.getSymbols();
      if (symbolsResult.isFailure) {
        return Result.ok(false);
      }

      const symbolExists = symbolsResult.value.some(s => s.equals(symbol));
      return Result.ok(symbolExists);
    } catch (error) {
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

      const totalRecords = data.length;
      const firstDate = data[0].timestamp;
      const lastDate = data[data.length - 1].timestamp;
      
      const totalVolume = data.reduce((sum, item) => sum + item.volume, 0);
      const averageVolume = totalVolume / totalRecords;
      
      const totalPrice = data.reduce((sum, item) => sum + item.close, 0);
      const averagePrice = totalPrice / totalRecords;

      return Result.ok({
        totalRecords,
        firstDate,
        lastDate,
        averageVolume,
        averagePrice
      });
    } catch (error) {
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
      const dataResult = await this.getKlineData(symbol, timeframe, 1000);
      
      if (dataResult.isFailure) {
        return Result.fail(dataResult.error);
      }

      const data = dataResult.value;
      const aggregatedData: Array<{ timestamp: Date; value: number }> = [];

      switch (aggregationType) {
        case 'sma':
          for (let i = period - 1; i < data.length; i++) {
            const window = data.slice(i - period + 1, i + 1);
            const average = window.reduce((sum, item) => sum + item.close, 0) / period;
            aggregatedData.push({
              timestamp: data[i].timestamp,
              value: average
            });
          }
          break;

        case 'ema':
          if (data.length > 0) {
            let ema = data[0].close;
            const multiplier = 2 / (period + 1);
            
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
          }
          break;

        case 'volume':
          for (let i = period - 1; i < data.length; i++) {
            const window = data.slice(i - period + 1, i + 1);
            const averageVolume = window.reduce((sum, item) => sum + item.volume, 0) / period;
            aggregatedData.push({
              timestamp: data[i].timestamp,
              value: averageVolume
            });
          }
          break;

        case 'price':
          for (const item of data) {
            aggregatedData.push({
              timestamp: item.timestamp,
              value: item.close
            });
          }
          break;
      }

      return Result.ok(aggregatedData);
    } catch (error) {
      return Result.fail(`Failed to get aggregated data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async saveData(_data: CryptoData[]): Promise<Result<void>> {
    try {
      // В реальной реализации здесь будет сохранение в кэш или локальное хранилище
      // Пока просто возвращаем успех
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(`Failed to save data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async clearCache(_symbol?: Symbol): Promise<Result<void>> {
    try {
      // В реальной реализации здесь будет очистка кэша
      // Пока просто возвращаем успех
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(`Failed to clear cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 