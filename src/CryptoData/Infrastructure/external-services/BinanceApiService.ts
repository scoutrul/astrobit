import { ExternalService } from '../../../Shared/infrastructure/ExternalService';
import { Result } from '../../../Shared/domain/Result';

export interface BinanceKlineData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface BinanceSymbolInfo {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: string;
  isSpotTradingAllowed: boolean;
}

export interface BinanceTickerData {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  count: number;
}

export class BinanceApiService extends ExternalService {
  private static instance: BinanceApiService | null = null;
  private readonly baseUrl = 'https://api.binance.com/api/v3';
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    super();
    this.initializationPromise = this.initialize();
  }

  static getInstance(): BinanceApiService {
    if (!BinanceApiService.instance) {
      BinanceApiService.instance = new BinanceApiService();
    }
    return BinanceApiService.instance;
  }

  private async initialize(): Promise<void> {
    try {
      console.log('[BinanceApiService] Starting initialization...');
      // Проверяем доступность API
      const response = await fetch(`${this.baseUrl}/ping`);
      if (response.ok) {
        this.isInitialized = true;
        console.log('[BinanceApiService] API initialized successfully');
      } else {
        throw new Error('Failed to ping Binance API');
      }
    } catch (error) {
      console.error('[BinanceApiService] Failed to initialize:', error);
      // Не выбрасываем ошибку, а просто помечаем как неинициализированный
      this.isInitialized = false;
    }
  }

  async isAvailable(): Promise<boolean> {
    // Ждем завершения инициализации
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
    return this.isInitialized;
  }

  async getKlineData(
    symbol: string, 
    interval: string, 
    limit: number = 1000
  ): Promise<Result<BinanceKlineData[]>> {
    try {
      // Ждем завершения инициализации
      if (this.initializationPromise) {
        await this.initializationPromise;
      }

      if (!this.isInitialized) {
        return Result.fail('Binance API service is not available');
      }

      const url = `${this.baseUrl}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        return Result.fail(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Binance возвращает массив массивов: [openTime, open, high, low, close, volume, closeTime, ...]
      const klineData: BinanceKlineData[] = data.map((item: any[]) => ({
        timestamp: item[0],
        open: parseFloat(item[1]),
        high: parseFloat(item[2]),
        low: parseFloat(item[3]),
        close: parseFloat(item[4]),
        volume: parseFloat(item[5])
      }));

      return Result.ok(klineData);
    } catch (error) {
      console.error(`[BinanceApiService] Error fetching kline data for ${symbol}:`, error);
      return Result.fail(`Failed to fetch kline data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSymbols(): Promise<Result<BinanceSymbolInfo[]>> {
    try {
      // Ждем завершения инициализации
      if (this.initializationPromise) {
        await this.initializationPromise;
      }

      if (!this.isInitialized) {
        return Result.fail('Binance API service is not available');
      }

      const url = `${this.baseUrl}/exchangeInfo`;
      const response = await fetch(url);
      
      if (!response.ok) {
        return Result.fail(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      const symbols: BinanceSymbolInfo[] = data.symbols
        .filter((symbol: any) => symbol.status === 'TRADING' && symbol.isSpotTradingAllowed)
        .map((symbol: any) => ({
          symbol: symbol.symbol,
          baseAsset: symbol.baseAsset,
          quoteAsset: symbol.quoteAsset,
          status: symbol.status,
          isSpotTradingAllowed: symbol.isSpotTradingAllowed
        }));

      return Result.ok(symbols);
    } catch (error) {
      console.error('[BinanceApiService] Error fetching symbols:', error);
      return Result.fail(`Failed to fetch symbols: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTicker(symbol: string): Promise<Result<BinanceTickerData>> {
    try {
      // Ждем завершения инициализации
      if (this.initializationPromise) {
        await this.initializationPromise;
      }

      if (!this.isInitialized) {
        return Result.fail('Binance API service is not available');
      }

      const url = `${this.baseUrl}/ticker/24hr?symbol=${symbol}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        return Result.fail(`HTTP ${response.status}: ${response.statusText}`);
      }

      const ticker: BinanceTickerData = await response.json();
      return Result.ok(ticker);
    } catch (error) {
      console.error(`[BinanceApiService] Error fetching ticker for ${symbol}:`, error);
      return Result.fail(`Failed to fetch ticker: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCurrentPrice(symbol: string): Promise<Result<number>> {
    try {
      // Ждем завершения инициализации
      if (this.initializationPromise) {
        await this.initializationPromise;
      }

      if (!this.isInitialized) {
        return Result.fail('Binance API service is not available');
      }

      const tickerResult = await this.getTicker(symbol);
      if (tickerResult.isFailure) {
        return Result.fail(tickerResult.error);
      }

      const price = parseFloat(tickerResult.value.lastPrice);
      return Result.ok(price);
    } catch (error) {
      console.error(`[BinanceApiService] Error fetching current price for ${symbol}:`, error);
      return Result.fail(`Failed to fetch current price: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSupportedIntervals(): Promise<string[]> {
    return [
      '1m', '3m', '5m', '15m', '30m',
      '1h', '2h', '4h', '6h', '8h', '12h',
      '1d', '3d', '1w', '1M'
    ];
  }

  async getOrderBook(symbol: string, limit: number = 20): Promise<Result<any>> {
    try {
      // Ждем завершения инициализации
      if (this.initializationPromise) {
        await this.initializationPromise;
      }

      if (!this.isInitialized) {
        return Result.fail('Binance API service is not available');
      }

      const url = `${this.baseUrl}/depth?symbol=${symbol}&limit=${limit}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        return Result.fail(`HTTP ${response.status}: ${response.statusText}`);
      }

      const orderBook = await response.json();
      return Result.ok(orderBook);
    } catch (error) {
      console.error(`[BinanceApiService] Error fetching order book for ${symbol}:`, error);
      return Result.fail(`Failed to fetch order book: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRecentTrades(symbol: string, limit: number = 50): Promise<Result<any[]>> {
    try {
      // Ждем завершения инициализации
      if (this.initializationPromise) {
        await this.initializationPromise;
      }

      if (!this.isInitialized) {
        return Result.fail('Binance API service is not available');
      }

      const url = `${this.baseUrl}/trades?symbol=${symbol}&limit=${limit}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        return Result.fail(`HTTP ${response.status}: ${response.statusText}`);
      }

      const trades = await response.json();
      return Result.ok(trades);
    } catch (error) {
      console.error(`[BinanceApiService] Error fetching recent trades for ${symbol}:`, error);
      return Result.fail(`Failed to fetch recent trades: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 