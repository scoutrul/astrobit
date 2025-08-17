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
      // Для избежания CORS проблем, просто помечаем как инициализированный
      // WebSocket соединение будет проверять доступность API
      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize Binance API: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  async getSupportedIntervals(): Promise<string[]> {
    return [
      '1m', '3m', '5m', '15m', '30m',
      '1h', '2h', '4h', '6h', '8h', '12h',
      '1d', '3d', '1w', '1M'
    ];
  }

} 