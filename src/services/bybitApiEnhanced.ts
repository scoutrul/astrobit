import axios, { AxiosInstance, AxiosResponse } from 'axios';
import CryptoJS from 'crypto-js';
import { ApiResponse, CryptoData } from '../types';

// Enhanced Bybit API Types
export interface BybitApiConfig {
  key?: string;
  secret?: string;
  testnet?: boolean;
  recvWindow?: number;
  baseURL?: string;
}

export interface BybitKlineResponse {
  retCode: number;
  retMsg: string;
  result: {
    symbol: string;
    category: string;
    list: [string, string, string, string, string, string, string][];
  };
  retExtInfo: Record<string, any>;
  time: number;
}

export interface BybitTickerResponse {
  retCode: number;
  retMsg: string;
  result: {
    list: Array<{
      symbol: string;
      bid1Price: string;
      bid1Size: string;
      ask1Price: string;
      ask1Size: string;
      lastPrice: string;
      prevPrice24h: string;
      price24hPcnt: string;
      highPrice24h: string;
      lowPrice24h: string;
      turnover24h: string;
      volume24h: string;
      usdIndexPrice: string;
    }>;
  };
  retExtInfo: Record<string, any>;
  time: number;
}

export interface BybitSymbolsResponse {
  retCode: number;
  retMsg: string;
  result: {
    list: Array<{
      symbol: string;
      baseCoin: string;
      quoteCoin: string;
      innovation: string;
      status: string;
      marginTrading: string;
      lotSizeFilter: {
        basePrecision: string;
        quotePrecision: string;
        minOrderQty: string;
        maxOrderQty: string;
        minOrderAmt: string;
        maxOrderAmt: string;
      };
      priceFilter: {
        minPrice: string;
        maxPrice: string;
        tickSize: string;
      };
    }>;
  };
  retExtInfo: Record<string, any>;
  time: number;
}

export interface BybitAccountResponse {
  retCode: number;
  retMsg: string;
  result: {
    unifiedMarginStatus: number;
    marginMode: string;
    updatedTime: string;
    dcpStatus: string;
    timeWindow: number;
    smpGroup: number;
    isMasterTrader: boolean;
    spotHedgingStatus: string;
  };
  retExtInfo: Record<string, any>;
  time: number;
}

class BybitApiEnhanced {
  private client: AxiosInstance;
  private config: BybitApiConfig;
  private baseURL: string;
  
  constructor(config: BybitApiConfig = {}) {
    this.config = {
      testnet: true, // Default to testnet for development
      recvWindow: 5000,
      ...config
    };
    
    // Set appropriate base URL
    this.baseURL = this.config.testnet 
      ? 'https://api-testnet.bybit.com'
      : (this.config.baseURL || 'https://api.bybit.com');
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Add request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        this.addAuthHeaders(config);
        console.log(`[Bybit API Enhanced] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[Bybit API Enhanced] Request error:', error);
        return Promise.reject(error);
      }
    );
    
    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        if (response.data?.retCode !== 0) {
          console.warn(`[Bybit API Enhanced] API Warning: ${response.data?.retMsg}`);
        }
        return response;
      },
      (error) => {
        console.error('[Bybit API Enhanced] Response error:', error);
        if (error.response?.status === 429) {
          console.warn('[Bybit API Enhanced] Rate limit exceeded');
        }
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Add authentication headers to requests
   */
  private addAuthHeaders(config: any): void {
    const timestamp = Date.now().toString();
    const recvWindow = this.config.recvWindow?.toString() || '5000';
    
    if (this.config.key && this.config.secret && 
        this.config.key !== 'secret' && this.config.secret !== 'secret') {
      config.headers['X-BAPI-API-KEY'] = this.config.key;
      config.headers['X-BAPI-TIMESTAMP'] = timestamp;
      config.headers['X-BAPI-RECV-WINDOW'] = recvWindow;
      
      // Create signature
      const signature = this.createSignature(config, timestamp, recvWindow);
      config.headers['X-BAPI-SIGN'] = signature;
    }
  }
  
  /**
   * Create HMAC SHA256 signature for API requests
   */
  private createSignature(config: any, timestamp: string, recvWindow: string): string {
    let queryString = '';
    
    if (config.method?.toLowerCase() === 'get' && config.params) {
      const searchParams = new URLSearchParams(config.params);
      queryString = searchParams.toString();
    } else if (config.method?.toLowerCase() === 'post' && config.data) {
      queryString = JSON.stringify(config.data);
    }
    
    const payload = timestamp + this.config.key + recvWindow + queryString;
    return CryptoJS.HmacSHA256(payload, this.config.secret!).toString(CryptoJS.enc.Hex);
  }
  
  /**
   * Get server time
   */
  async getServerTime(): Promise<ApiResponse<number>> {
    try {
      const response = await this.client.get('/v5/market/time');
      if (response.data.retCode === 0) {
        return {
          success: true,
          data: response.data.result.timeSecond * 1000, // Convert to milliseconds
        };
      } else {
        return {
          success: false,
          error: response.data.retMsg || 'Unknown API error',
        };
      }
    } catch (error) {
      console.error('[Bybit API Enhanced] Error getting server time:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }
  
  /**
   * Get kline/candlestick data for a symbol
   */
  async getKlineData(
    symbol: string,
    interval: string,
    limit: number = 200,
    category: string = 'spot'
  ): Promise<ApiResponse<CryptoData[]>> {
    try {
      const response: AxiosResponse<BybitKlineResponse> = await this.client.get('/v5/market/kline', {
        params: {
          category,
          symbol,
          interval: this.mapTimeframeToInterval(interval),
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
        time: new Date(parseInt(item[0])).toISOString().split('T')[0], // Return YYYY-MM-DD format
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
      console.error('[Bybit API Enhanced] Error fetching kline data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }
  
  /**
   * Get real-time ticker information
   */
  async getTicker(symbol: string, category: string = 'spot'): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<BybitTickerResponse> = await this.client.get('/v5/market/tickers', {
        params: { category, symbol },
      });
      
      if (response.data.retCode === 0 && response.data.result.list.length > 0) {
        return {
          success: true,
          data: response.data.result.list[0],
        };
      } else {
        return {
          success: false,
          error: response.data.retMsg || 'No ticker data found',
        };
      }
    } catch (error) {
      console.error('[Bybit API Enhanced] Error fetching ticker:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }
  
  /**
   * Get available symbols
   */
  async getSymbols(category: string = 'spot'): Promise<ApiResponse<string[]>> {
    try {
      const response: AxiosResponse<BybitSymbolsResponse> = await this.client.get('/v5/market/instruments-info', {
        params: { category, limit: 500 },
      });
      
      if (response.data.retCode === 0) {
        // Filter for USDT pairs only
        const usdtPairs = response.data.result.list
          .filter(item => item.quoteCoin === 'USDT' && item.status === 'Trading')
          .map(item => item.symbol);
        
        return {
          success: true,
          data: usdtPairs,
        };
      } else {
        return {
          success: false,
          error: response.data.retMsg || 'Unknown API error',
        };
      }
    } catch (error) {
      console.error('[Bybit API Enhanced] Error fetching symbols:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }
  
  /**
   * Get account information (requires authentication)
   */
  async getAccountInfo(): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<BybitAccountResponse> = await this.client.get('/v5/account/info');
      
      if (response.data.retCode === 0) {
        return {
          success: true,
          data: response.data.result,
        };
      } else {
        return {
          success: false,
          error: response.data.retMsg || 'Unknown API error',
        };
      }
    } catch (error) {
      console.error('[Bybit API Enhanced] Error fetching account info:', error);
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
      '3m': '3',
      '5m': '5',
      '15m': '15',
      '30m': '30',
      '1h': '60',
      '2h': '120',
      '4h': '240',
      '6h': '360',
      '12h': '720',
      '1d': 'D',
      '3d': '3D',
      '1w': 'W',
      '1M': 'M',
    };
    
    return mapping[timeframe] || 'D';
  }
  
  /**
   * Check if API is authenticated
   */
  isAuthenticated(): boolean {
    return !!(this.config.key && this.config.secret && 
              this.config.key !== 'secret' && this.config.secret !== 'secret');
  }
  
  /**
   * Get current configuration (without exposing secret)
   */
  getConfig(): Omit<BybitApiConfig, 'secret'> & { secret: string } {
    return { ...this.config, secret: this.config.secret ? '***' : 'not set' };
  }
  
  /**
   * Update API configuration
   */
  updateConfig(newConfig: Partial<BybitApiConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update base URL if testnet setting changed
    if (newConfig.testnet !== undefined) {
      this.baseURL = this.config.testnet 
        ? 'https://api-testnet.bybit.com'
        : (this.config.baseURL || 'https://api.bybit.com');
      
      this.client.defaults.baseURL = this.baseURL;
    }
  }
}

// Export singleton instance with environment configuration
const createBybitApi = () => {
  // Get configuration from environment variables (Vite requires VITE_ prefix)
  const config: BybitApiConfig = {
    key: import.meta.env.VITE_BYBIT_API_KEY || 'secret',
    secret: import.meta.env.VITE_BYBIT_API_SECRET || 'secret',
    testnet: import.meta.env.VITE_BYBIT_TESTNET === 'true' || true, // Default to testnet for safety
    recvWindow: parseInt(import.meta.env.VITE_BYBIT_RECV_WINDOW || '5000'),
  };
  
  return new BybitApiEnhanced(config);
};

export const bybitApiEnhanced = createBybitApi();

// Export class for custom instances
export { BybitApiEnhanced }; 