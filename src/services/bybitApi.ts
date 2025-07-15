import axios, { AxiosInstance, AxiosResponse } from 'axios';
import CryptoJS from 'crypto-js';
import { 
  ApiResponse, 
  CryptoData, 
  BybitResponse,
  BybitKlineData,
  BybitApiConfig,
  BybitTickerData,
  BybitOrderBookData,
  BybitSymbolInfo,
  BybitOrderRequest,
  BybitOrderResponse,
  BybitAccountInfo,
  BybitWalletBalance,
  BybitPosition
} from '../types';

class BybitApiService {
  private client: AxiosInstance;
  private config: BybitApiConfig;
  private baseURL: string;
  
  constructor(config: BybitApiConfig = {}) {
    this.config = {
      testnet: true, // Default to testnet for development
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
    limit: number = 200,
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
          error: apiResponse.error || 'No data received',
        };
      }
      
      // Transform Bybit data format to our internal format
      const cryptoData: CryptoData[] = apiResponse.data.list.map((item) => ({
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
      console.error('[Bybit API] Error fetching kline data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
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
   * Get order book data
   */
  async getOrderBook(symbol: string, category: string = 'spot', limit: number = 25): Promise<ApiResponse<BybitOrderBookData>> {
    try {
      const response = await this.client.get('/v5/market/orderbook', {
        params: { category, symbol, limit },
      });
      
      return this.handleBybitResponse(response);
    } catch (error) {
      console.error('[Bybit API] Error fetching order book:', error);
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
  
  /**
   * Get account information (requires authentication)
   */
  async getAccountInfo(): Promise<ApiResponse<BybitAccountInfo>> {
    try {
      const response = await this.client.get('/v5/account/info');
      return this.handleBybitResponse(response);
    } catch (error) {
      console.error('[Bybit API] Error fetching account info:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }
  
  /**
   * Get wallet balance (requires authentication)
   */
  async getWalletBalance(accountType: string = 'UNIFIED'): Promise<ApiResponse<BybitWalletBalance>> {
    try {
      const response = await this.client.get('/v5/account/wallet-balance', {
        params: { accountType },
      });
      return this.handleBybitResponse(response);
    } catch (error) {
      console.error('[Bybit API] Error fetching wallet balance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }
  
  /**
   * Create a new order (requires authentication)
   */
  async createOrder(orderData: BybitOrderRequest): Promise<ApiResponse<BybitOrderResponse>> {
    try {
      const response = await this.client.post('/v5/order/create', orderData);
      return this.handleBybitResponse(response);
    } catch (error) {
      console.error('[Bybit API] Error creating order:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }
  
  /**
   * Get positions (requires authentication)
   */
  async getPositions(category: string, symbol?: string): Promise<ApiResponse<BybitPosition[]>> {
    try {
      const params: any = { category };
      if (symbol) params.symbol = symbol;
      
      const response = await this.client.get('/v5/position/list', { params });
      return this.handleBybitResponse(response);
    } catch (error) {
      console.error('[Bybit API] Error fetching positions:', error);
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