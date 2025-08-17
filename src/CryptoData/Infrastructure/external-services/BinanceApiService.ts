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
  // Условный URL в зависимости от режима
  private readonly baseUrl = import.meta.env.DEV 
    ? '/binance-api/api/v3'  // Прокси в dev режиме
    : 'https://api.binance.com/api/v3'; // Внешний API в production

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

  async getKlineData(
    symbol: string, 
    interval: string, 
    limit: number = 1000
  ): Promise<Result<BinanceKlineData[]>> {
    try {
      // Ждем завершения инициализации
      // The initialization logic is removed, so this method is now effectively a placeholder.
      // In a real scenario, you might check if the baseUrl is accessible or if there are
      // other indicators of service availability.
      if (!this.isAvailable()) { // Assuming availability for now
        return Result.fail('Binance API service is not available');
      }

      const url = `${this.baseUrl}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
      
      // Добавляем заголовки для предотвращения кэширования
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
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
      return Result.fail(`Failed to fetch kline data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSymbols(): Promise<Result<BinanceSymbolInfo[]>> {
    try {
      // Ждем завершения инициализации
      // The initialization logic is removed, so this method is now effectively a placeholder.
      // In a real scenario, you might check if the baseUrl is accessible or if there are
      // other indicators of service availability.
      if (!this.isAvailable()) { // Assuming availability for now
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