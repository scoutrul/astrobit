import { ExternalService } from '../../../Shared/infrastructure/ExternalService';
import { Result } from '../../../Shared/domain/Result';
import * as ccxt from 'ccxt';

export interface CcxtKlineData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CcxtSymbolInfo {
  symbol: string;
  base: string;
  quote: string;
  active: boolean;
  type: string;
  spot?: boolean;
  margin?: boolean;
  swap?: boolean;
  future?: boolean;
  option?: boolean;
}

export interface CcxtTickerData {
  symbol: string;
  timestamp: number;
  datetime: string;
  high: number;
  low: number;
  bid: number;
  ask: number;
  last: number;
  close: number;
  baseVolume: number;
  quoteVolume: number;
  percentage: number;
  change: number;
  average: number;
}

export type ExchangeType = 'binance' | 'bybit';

export class CcxtService extends ExternalService {
  private exchanges: Map<ExchangeType, ccxt.Exchange> = new Map();
  private isInitialized = false;

  constructor() {
    super();
    this.initializeExchanges();
  }

  private async initializeExchanges(): Promise<void> {
    try {
      // Инициализация Binance
      const binance = new ccxt.binance({
        enableRateLimit: true,
        options: {
          defaultType: 'spot', // используем спотовый рынок
        }
      });

      // Инициализация Bybit
      const bybit = new ccxt.bybit({
        enableRateLimit: true,
        options: {
          defaultType: 'spot', // используем спотовый рынок
        }
      });

      this.exchanges.set('binance', binance);
      this.exchanges.set('bybit', bybit);

      // Загружаем рынки для обеих бирж
      await Promise.all([
        binance.loadMarkets(),
        bybit.loadMarkets()
      ]);

      this.isInitialized = true;
      console.log('[CcxtService] Exchanges initialized successfully');
    } catch (error) {
      console.error('[CcxtService] Failed to initialize exchanges:', error);
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    return this.isInitialized;
  }

  async getKlineData(
    symbol: string, 
    timeframe: string, 
    limit: number = 1000,
    exchange: ExchangeType = 'binance'
  ): Promise<Result<CcxtKlineData[]>> {
    try {
      const exchangeInstance = this.exchanges.get(exchange);
      if (!exchangeInstance) {
        return Result.fail(`Exchange ${exchange} not found`);
      }

      // Получаем OHLCV данные
      const ohlcv = await exchangeInstance.fetchOHLCV(symbol, timeframe, undefined, limit);
      
      // Преобразуем в наш формат с проверкой типов
      const klineData: CcxtKlineData[] = ohlcv.map(([timestamp, open, high, low, close, volume]) => ({
        timestamp: Number(timestamp) || 0,
        open: Number(open) || 0,
        high: Number(high) || 0,
        low: Number(low) || 0,
        close: Number(close) || 0,
        volume: Number(volume) || 0
      }));

      return Result.ok(klineData);
    } catch (error) {
      console.error(`[CcxtService] Error fetching kline data for ${symbol}:`, error);
      return Result.fail(`Failed to fetch kline data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSymbols(exchange: ExchangeType = 'binance'): Promise<Result<CcxtSymbolInfo[]>> {
    try {
      const exchangeInstance = this.exchanges.get(exchange);
      if (!exchangeInstance) {
        return Result.fail(`Exchange ${exchange} not found`);
      }

      const markets = exchangeInstance.markets;
      const symbols: CcxtSymbolInfo[] = Object.values(markets).map(market => ({
        symbol: market.symbol,
        base: market.base,
        quote: market.quote,
        active: market.active,
        type: market.type,
        spot: market.spot,
        margin: market.margin,
        swap: market.swap,
        future: market.future,
        option: market.option
      }));

      return Result.ok(symbols);
    } catch (error) {
      console.error(`[CcxtService] Error fetching symbols for ${exchange}:`, error);
      return Result.fail(`Failed to fetch symbols: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSymbolInfo(symbol: string, exchange: ExchangeType = 'binance'): Promise<Result<CcxtSymbolInfo | null>> {
    try {
      const exchangeInstance = this.exchanges.get(exchange);
      if (!exchangeInstance) {
        return Result.fail(`Exchange ${exchange} not found`);
      }

      const market = exchangeInstance.markets[symbol];
      if (!market) {
        return Result.ok(null);
      }

      const symbolInfo: CcxtSymbolInfo = {
        symbol: market.symbol,
        base: market.base,
        quote: market.quote,
        active: market.active,
        type: market.type,
        spot: market.spot,
        margin: market.margin,
        swap: market.swap,
        future: market.future,
        option: market.option
      };

      return Result.ok(symbolInfo);
    } catch (error) {
      console.error(`[CcxtService] Error fetching symbol info for ${symbol}:`, error);
      return Result.fail(`Failed to fetch symbol info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCurrentPrice(symbol: string, exchange: ExchangeType = 'binance'): Promise<Result<number>> {
    try {
      const exchangeInstance = this.exchanges.get(exchange);
      if (!exchangeInstance) {
        return Result.fail(`Exchange ${exchange} not found`);
      }

      const ticker = await exchangeInstance.fetchTicker(symbol);
      return Result.ok(ticker.last);
    } catch (error) {
      console.error(`[CcxtService] Error fetching current price for ${symbol}:`, error);
      return Result.fail(`Failed to fetch current price: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTicker(symbol: string, exchange: ExchangeType = 'binance'): Promise<Result<CcxtTickerData>> {
    try {
      const exchangeInstance = this.exchanges.get(exchange);
      if (!exchangeInstance) {
        return Result.fail(`Exchange ${exchange} not found`);
      }

      const ticker = await exchangeInstance.fetchTicker(symbol);
      
      const tickerData: CcxtTickerData = {
        symbol: String(ticker.symbol) || '',
        timestamp: Number(ticker.timestamp) || 0,
        datetime: String(ticker.datetime) || '',
        high: Number(ticker.high) || 0,
        low: Number(ticker.low) || 0,
        bid: Number(ticker.bid) || 0,
        ask: Number(ticker.ask) || 0,
        last: Number(ticker.last) || 0,
        close: Number(ticker.close) || 0,
        baseVolume: Number(ticker.baseVolume) || 0,
        quoteVolume: Number(ticker.quoteVolume) || 0,
        percentage: Number(ticker.percentage) || 0,
        change: Number(ticker.change) || 0,
        average: Number(ticker.average) || 0
      };

      return Result.ok(tickerData);
    } catch (error) {
      console.error(`[CcxtService] Error fetching ticker for ${symbol}:`, error);
      return Result.fail(`Failed to fetch ticker: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async isExchangeAvailable(exchange: ExchangeType): Promise<boolean> {
    try {
      const exchangeInstance = this.exchanges.get(exchange);
      if (!exchangeInstance) {
        return false;
      }

      // Проверяем доступность биржи через простой запрос
      await exchangeInstance.fetchTicker('BTC/USDT');
      return true;
    } catch (error) {
      console.error(`[CcxtService] Exchange ${exchange} is not available:`, error);
      return false;
    }
  }

  async getSupportedExchanges(): Promise<ExchangeType[]> {
    const availableExchanges: ExchangeType[] = [];
    
    for (const exchange of ['binance', 'bybit'] as ExchangeType[]) {
      const isAvailable = await this.isExchangeAvailable(exchange);
      if (isAvailable) {
        availableExchanges.push(exchange);
      }
    }

    return availableExchanges;
  }

  async getSupportedTimeframes(exchange: ExchangeType = 'binance'): Promise<string[]> {
    try {
      const exchangeInstance = this.exchanges.get(exchange);
      if (!exchangeInstance) {
        return [];
      }

      return Object.keys(exchangeInstance.timeframes || {});
    } catch (error) {
      console.error(`[CcxtService] Error fetching timeframes for ${exchange}:`, error);
      return [];
    }
  }

  async getOrderBook(symbol: string, limit: number = 20, exchange: ExchangeType = 'binance'): Promise<Result<any>> {
    try {
      const exchangeInstance = this.exchanges.get(exchange);
      if (!exchangeInstance) {
        return Result.fail(`Exchange ${exchange} not found`);
      }

      const orderBook = await exchangeInstance.fetchOrderBook(symbol, limit);
      return Result.ok(orderBook);
    } catch (error) {
      console.error(`[CcxtService] Error fetching order book for ${symbol}:`, error);
      return Result.fail(`Failed to fetch order book: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRecentTrades(symbol: string, limit: number = 50, exchange: ExchangeType = 'binance'): Promise<Result<any[]>> {
    try {
      const exchangeInstance = this.exchanges.get(exchange);
      if (!exchangeInstance) {
        return Result.fail(`Exchange ${exchange} not found`);
      }

      const trades = await exchangeInstance.fetchTrades(symbol, undefined, limit);
      return Result.ok(trades);
    } catch (error) {
      console.error(`[CcxtService] Error fetching recent trades for ${symbol}:`, error);
      return Result.fail(`Failed to fetch recent trades: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Метод для получения данных с нескольких бирж одновременно
  async getMultiExchangeData(
    symbol: string, 
    timeframe: string, 
    limit: number = 1000
  ): Promise<Result<{ [exchange: string]: CcxtKlineData[] }>> {
    try {
      const results: { [exchange: string]: CcxtKlineData[] } = {};
      
      for (const exchange of ['binance', 'bybit'] as ExchangeType[]) {
        const isAvailable = await this.isExchangeAvailable(exchange);
        if (isAvailable) {
          const data = await this.getKlineData(symbol, timeframe, limit, exchange);
          if (data.isSuccess) {
            results[exchange] = data.value;
          }
        }
      }

      return Result.ok(results);
    } catch (error) {
      console.error(`[CcxtService] Error fetching multi-exchange data for ${symbol}:`, error);
      return Result.fail(`Failed to fetch multi-exchange data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Метод для получения лучшей цены с нескольких бирж
  async getBestPrice(symbol: string): Promise<Result<{ exchange: string; price: number; type: 'bid' | 'ask' }>> {
    try {
      let bestPrice = 0;
      let bestExchange = '';
      let bestType: 'bid' | 'ask' = 'bid';

      for (const exchange of ['binance', 'bybit'] as ExchangeType[]) {
        const isAvailable = await this.isExchangeAvailable(exchange);
        if (isAvailable) {
          const ticker = await this.getTicker(symbol, exchange);
          if (ticker.isSuccess) {
            const { bid, ask } = ticker.value;
            if (bid > bestPrice) {
              bestPrice = bid;
              bestExchange = exchange;
              bestType = 'bid';
            }
            if (ask > 0 && (bestPrice === 0 || ask < bestPrice)) {
              bestPrice = ask;
              bestExchange = exchange;
              bestType = 'ask';
            }
          }
        }
      }

      if (bestPrice === 0) {
        return Result.fail('No price data available from any exchange');
      }

      return Result.ok({ exchange: bestExchange, price: bestPrice, type: bestType });
    } catch (error) {
      console.error(`[CcxtService] Error fetching best price for ${symbol}:`, error);
      return Result.fail(`Failed to fetch best price: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 