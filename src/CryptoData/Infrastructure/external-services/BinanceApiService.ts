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
  // В продакшене тоже используем относительный URL для избежания CORS
  private readonly baseUrl = '/binance-api/api/v3';

  constructor() {
    super();
  }

  static getInstance(): BinanceApiService {
    if (!BinanceApiService.instance) {
      BinanceApiService.instance = new BinanceApiService();
    }
    return BinanceApiService.instance;
  }

  async isAvailable(): Promise<boolean> {
    // Ждем завершения инициализации
    // The initialization logic is removed, so this method is now effectively a placeholder.
    // In a real scenario, you might check if the baseUrl is accessible or if there are
    // other indicators of service availability.
    return true; // Assuming availability for now, as initialization is removed.
  }

  async getKlineData(symbol: string, interval: string, limit: number = 1000): Promise<Result<any[]>> {
    try {
      const url = `${this.baseUrl}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const klineData = await response.json();
      return Result.ok(klineData);
    } catch (error) {
      return Result.fail(`Failed to fetch kline data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSymbols(): Promise<Result<BinanceSymbolInfo[]>> {
    try {
      const url = `${this.baseUrl}/exchangeInfo`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const symbols = data.symbols || [];
      return Result.ok(symbols);
    } catch (error) {
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