import { ExternalService } from '../../../Shared/infrastructure/ExternalService';

export interface CcvxKlineData {
  symbol: string;
  timeframe: string;
  data: Array<{
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
}

export interface CcvxSymbolInfo {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: 'TRADING' | 'BREAK';
  minPrice: number;
  maxPrice: number;
  tickSize: number;
  minQty: number;
  maxQty: number;
  stepSize: number;
}

export class CcvxService extends ExternalService {
  private readonly supportedExchanges = ['bybit', 'binance'];
  private readonly defaultExchange = 'bybit';

  constructor() {
    super();
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Проверяем доступность сервиса
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Получить данные свечей с указанной биржи
   */
  async getKlineData(
    symbol: string, 
    timeframe: string, 
    limit: number = 1000,
    exchange: string = this.defaultExchange
  ): Promise<CcvxKlineData> {
    try {
      // Валидация параметров
      if (!this.supportedExchanges.includes(exchange)) {
        throw new Error(`Unsupported exchange: ${exchange}. Supported: ${this.supportedExchanges.join(', ')}`);
      }

      // Здесь будет реальная интеграция с ccvx
      // Пока возвращаем мок данные
      const mockData = this.generateMockKlineData(symbol, timeframe, limit);
      
      return {
        symbol,
        timeframe,
        data: mockData
      };
    } catch (error) {
      throw new Error(`Failed to get kline data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Получить список доступных символов
   */
  async getSymbols(exchange: string = this.defaultExchange): Promise<CcvxSymbolInfo[]> {
    try {
      if (!this.supportedExchanges.includes(exchange)) {
        throw new Error(`Unsupported exchange: ${exchange}. Supported: ${this.supportedExchanges.join(', ')}`);
      }

      // Возвращаем список поддерживаемых символов
      return this.getSupportedSymbols();
    } catch (error) {
      throw new Error(`Failed to get symbols: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Получить информацию о символе
   */
  async getSymbolInfo(symbol: string, exchange: string = this.defaultExchange): Promise<CcvxSymbolInfo | null> {
    try {
      const symbols = await this.getSymbols(exchange);
      return symbols.find(s => s.symbol === symbol) || null;
    } catch (error) {
      throw new Error(`Failed to get symbol info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Получить текущую цену символа
   */
  async getCurrentPrice(symbol: string, exchange: string = this.defaultExchange): Promise<number> {
    try {
      const klineData = await this.getKlineData(symbol, '1h', 1, exchange);
      return klineData.data[0]?.close || 0;
    } catch (error) {
      throw new Error(`Failed to get current price: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Проверить доступность биржи
   */
  async isExchangeAvailable(exchange: string): Promise<boolean> {
    return this.supportedExchanges.includes(exchange);
  }

  /**
   * Получить список поддерживаемых бирж
   */
  getSupportedExchanges(): string[] {
    return [...this.supportedExchanges];
  }

  /**
   * Генерация мок данных для тестирования
   */
  private generateMockKlineData(symbol: string, timeframe: string, limit: number) {
    const data = [];
    const now = new Date();
    const timeframeMs = this.getTimeframeMilliseconds(timeframe);
    
    for (let i = limit - 1; i >= 0; i--) {
      const timestamp = now.getTime() - (i * timeframeMs);
      const basePrice = this.getBasePriceForSymbol(symbol);
      const volatility = 0.02; // 2% volatility
      
      const open = basePrice * (1 + (Math.random() - 0.5) * volatility);
      const high = open * (1 + Math.random() * volatility);
      const low = open * (1 - Math.random() * volatility);
      const close = open * (1 + (Math.random() - 0.5) * volatility);
      const volume = Math.random() * 1000000 + 100000;

      data.push({
        timestamp,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: parseFloat(volume.toFixed(2))
      });
    }

    return data;
  }

  /**
   * Получить миллисекунды для таймфрейма
   */
  private getTimeframeMilliseconds(timeframe: string): number {
    const timeframes: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '8h': 8 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000,
      '1M': 30 * 24 * 60 * 60 * 1000
    };
    return timeframes[timeframe] || timeframes['1d'];
  }

  /**
   * Получить базовую цену для символа
   */
  private getBasePriceForSymbol(symbol: string): number {
    const basePrices: Record<string, number> = {
      'BTCUSDT': 45000,
      'ETHUSDT': 3000,
      'BNBUSDT': 300,
      'XRPUSDT': 0.5,
      'ADAUSDT': 0.4,
      'SOLUSDT': 100,
      'DOTUSDT': 7,
      'AVAXUSDT': 25,
      'LINKUSDT': 15,
      'MATICUSDT': 0.8,
      'UNIUSDT': 6,
      'AAVEUSDT': 200,
      'COMPUSDT': 50,
      'MKRUSDT': 1500,
      'CRVUSDT': 0.5
    };
    return basePrices[symbol] || 100;
  }

  /**
   * Получить список поддерживаемых символов
   */
  private getSupportedSymbols(): CcvxSymbolInfo[] {
    const symbols = [
      'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT',
      'SOLUSDT', 'DOTUSDT', 'AVAXUSDT', 'LINKUSDT', 'MATICUSDT',
      'UNIUSDT', 'AAVEUSDT', 'COMPUSDT', 'MKRUSDT', 'CRVUSDT'
    ];

    return symbols.map(symbol => ({
      symbol,
      baseAsset: symbol.replace('USDT', ''),
      quoteAsset: 'USDT',
      status: 'TRADING' as const,
      minPrice: 0.0001,
      maxPrice: 1000000,
      tickSize: 0.0001,
      minQty: 0.0001,
      maxQty: 1000000,
      stepSize: 0.0001
    }));
  }
} 