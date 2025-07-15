import axios, { AxiosInstance, AxiosResponse } from 'axios';
import CryptoJS from 'crypto-js';
import { 
  ApiResponse, 
  CryptoData, 
  BybitResponse,
  BybitKlineData,
  BybitApiConfig,
  BybitTickerData,
  BybitSymbolInfo
} from '../types';

class BybitApiService {
  private client: AxiosInstance;
  private config: BybitApiConfig;
  private baseURL: string;
  
  constructor(config: BybitApiConfig = {}) {
    this.config = {
      testnet: false, // 🔒 PRODUCTION: Use real API for live data
      recvWindow: 5000,
      ...config
    };
    
    // Use environment variables if available, fallback to config
    const apiKey = config.key || 'secret';
    const apiSecret = config.secret || 'secret';
    const useTestnet = config.testnet;
    
    this.config.key = apiKey;
    this.config.secret = apiSecret;
    this.config.testnet = useTestnet;
    
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
      (response) => {
        if (response.data?.retCode !== 0) {
          console.warn(`[Bybit API] API Warning: ${response.data?.retMsg}`);
        }
        return response;
      },
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
   * Add authentication headers to requests
   */
  private addAuthHeaders(config: any): void {
    const timestamp = Date.now().toString();
    const recvWindow = this.config.recvWindow?.toString() || '5000';
    
    if (this.config.key && this.config.secret) {
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
   * Generic method to handle Bybit API responses
   */
  private async handleBybitResponse<T>(response: AxiosResponse<BybitResponse<T>>): Promise<ApiResponse<T>> {
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
  }
  
  /**
   * Get server time
   */
  async getServerTime(): Promise<ApiResponse<number>> {
    try {
      const response = await this.client.get('/v5/market/time');
      return this.handleBybitResponse(response);
    } catch (error) {
      console.error('[Bybit API] Error getting server time:', error);
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
    limit: number = 1000, // Увеличиваем лимит для большего количества данных
    category: string = 'spot'
  ): Promise<ApiResponse<CryptoData[]>> {
    try {
      const response: AxiosResponse<BybitResponse<BybitKlineData>> = await this.client.get('/v5/market/kline', {
        params: {
          category,
          symbol,
          interval: this.mapTimeframeToInterval(interval),
          limit,
        },
      });
      
      const apiResponse = await this.handleBybitResponse(response);
      
      if (!apiResponse.success || !apiResponse.data) {
        return {
          success: false,
          error: apiResponse.error || 'Нет данных',
        };
      }
      
      // Преобразуем данные Bybit в наш внутренний формат
      const cryptoData: CryptoData[] = apiResponse.data.list.map((item) => {
        const timestamp = parseInt(item[0]);
        
        return {
          symbol,
          time: Math.floor(timestamp / 1000).toString(), // Unix timestamp в секундах как строка
          open: parseFloat(item[1]),
          high: parseFloat(item[2]),
          low: parseFloat(item[3]),
          close: parseFloat(item[4]),
          volume: parseFloat(item[5]),
        };
      });
      
      // Сортировка по времени (от старого к новому)
      cryptoData.sort((a, b) => parseInt(a.time) - parseInt(b.time));
      
      // Удаляем дубликаты по времени
      const uniqueData = cryptoData.filter((item, index, arr) => 
        index === 0 || item.time !== arr[index - 1].time
      );
      
      console.log(`[Bybit API] Получено ${uniqueData.length} уникальных свечей для ${symbol} (${interval})`);
      console.log(`[Bybit API] Временной диапазон: ${new Date(parseInt(uniqueData[0]?.time || '0') * 1000).toLocaleString()} - ${new Date(parseInt(uniqueData[uniqueData.length - 1]?.time || '0') * 1000).toLocaleString()}`);
      
      return {
        success: true,
        data: uniqueData,
      };
    } catch (error) {
      console.error('[Bybit API] Ошибка получения данных свечей:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Сетевая ошибка',
      };
    }
  }
  
  /**
   * Get real-time ticker information
   */
  async getTicker(symbol: string, category: string = 'spot'): Promise<ApiResponse<BybitTickerData>> {
    try {
      const response = await this.client.get('/v5/market/tickers', {
        params: { category, symbol },
      });
      
      const apiResponse = await this.handleBybitResponse(response);
      
      if (apiResponse.success && apiResponse.data && typeof apiResponse.data === 'object' && 'list' in apiResponse.data && Array.isArray(apiResponse.data.list) && apiResponse.data.list[0]) {
        return {
          success: true,
          data: apiResponse.data.list[0],
        };
      } else {
        return {
          success: false,
          error: 'No ticker data found',
        };
      }
    } catch (error) {
      console.error('[Bybit API] Error fetching ticker:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Get available symbols
   */
  async getSymbols(category: string = 'spot'): Promise<ApiResponse<BybitSymbolInfo[]>> {
    try {
      const response = await this.client.get('/v5/market/instruments-info', {
        params: { category, limit: 500 },
      });
      
      const apiResponse = await this.handleBybitResponse(response);
      
      if (apiResponse.success && apiResponse.data && typeof apiResponse.data === 'object' && 'list' in apiResponse.data && Array.isArray(apiResponse.data.list)) {
        // Filter for USDT pairs only
        const usdtPairs = apiResponse.data.list.filter((item: any) => 
          item.quoteCoin === 'USDT' && item.status === 'Trading'
        );
        
        return {
          success: true,
          data: usdtPairs,
        };
      } else {
        return {
          success: false,
          error: apiResponse.error || 'No symbols data received',
        };
      }
    } catch (error) {
      console.error('[Bybit API] Error fetching symbols:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }
  
  // 🔒 SECURITY: All trading methods removed for read-only API access
  // Previously removed methods: getAccountInfo, getWalletBalance, createOrder, getPositions
  
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
   * Get current configuration
   */
  getConfig(): BybitApiConfig {
    return { ...this.config, secret: '***' }; // Hide secret in logs
  }
}

// Export singleton instance
export const bybitApi = new BybitApiService();

// Export class for custom instances
export { BybitApiService }; 