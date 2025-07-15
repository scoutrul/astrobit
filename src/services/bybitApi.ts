import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse, BybitKlineData, CryptoData } from '../types';

class BybitApiService {
  private client: AxiosInstance;
  private baseURL = 'https://api-testnet.bybit.com'; // Using testnet for development
  
  constructor() {
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[Bybit API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[Bybit API] Request error:', error);
        return Promise.reject(error);
      }
    );
    
    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[Bybit API] Response error:', error);
        if (error.response?.status === 429) {
          console.warn('[Bybit API] Rate limit exceeded');
        }
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Get kline/candlestick data for a symbol
   */
  async getKlineData(
    symbol: string,
    interval: string,
    limit: number = 200
  ): Promise<ApiResponse<CryptoData[]>> {
    try {
      const response: AxiosResponse<{
        retCode: number;
        retMsg: string;
        result: BybitKlineData;
      }> = await this.client.get('/v5/market/kline', {
        params: {
          category: 'spot',
          symbol,
          interval,
          limit,
        },
      });
      
      if (response.data.retCode !== 0) {
        return {
          success: false,
          error: response.data.retMsg || 'Unknown API error',
        };
      }
      
      // Transform Bybit data format to our internal format
      const cryptoData: CryptoData[] = response.data.result.list.map((item) => ({
        symbol,
        time: new Date(parseInt(item[0])).toISOString(),
        open: parseFloat(item[1]),
        high: parseFloat(item[2]),
        low: parseFloat(item[3]),
        close: parseFloat(item[4]),
        volume: parseFloat(item[5]),
      }));
      
      // Sort by time (oldest first)
      cryptoData.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
      
      return {
        success: true,
        data: cryptoData,
      };
    } catch (error) {
      console.error('[Bybit API] Error fetching kline data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }
  
  /**
   * Get available symbols
   */
  async getSymbols(): Promise<ApiResponse<string[]>> {
    try {
      const response = await this.client.get('/v5/market/instruments-info', {
        params: {
          category: 'spot',
          limit: 100,
        },
      });
      
      if (response.data.retCode !== 0) {
        return {
          success: false,
          error: response.data.retMsg || 'Unknown API error',
        };
      }
      
      const symbols = response.data.result.list
        .filter((item: any) => item.quoteCoin === 'USDT') // Only USDT pairs
        .map((item: any) => item.symbol);
      
      return {
        success: true,
        data: symbols,
      };
    } catch (error) {
      console.error('[Bybit API] Error fetching symbols:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }
  
  /**
   * Map timeframe to Bybit interval format
   */
  mapTimeframeToInterval(timeframe: string): string {
    const mapping: Record<string, string> = {
      '1m': '1',
      '5m': '5',
      '15m': '15',
      '30m': '30',
      '1h': '60',
      '4h': '240',
      '1d': 'D',
      '1w': 'W',
    };
    
    return mapping[timeframe] || 'D';
  }
}

// Export singleton instance
export const bybitApi = new BybitApiService(); 