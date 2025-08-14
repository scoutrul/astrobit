/**
 * Конфигурация внешних сервисов
 */
export interface ExternalServicesConfig {
  // Binance API
  binance: {
    baseUrl: string;
    testnet: boolean;
    apiKey?: string;
    secretKey?: string;
    recvWindow: number;
  };
  
  // Bybit API
  bybit: {
    baseUrl: string;
    testnet: boolean;
    apiKey?: string;
    secretKey?: string;
    recvWindow: number;
  };
  
  // Астрономические API
  astronomy: {
    baseUrl: string;
    apiKey?: string;
    timeout: number;
  };
  
  // WebSocket соединения
  websocket: {
    reconnectInterval: number;
    maxReconnectAttempts: number;
    heartbeatInterval: number;
  };
}

/**
 * Конфигурация по умолчанию
 */
export const defaultExternalServicesConfig: ExternalServicesConfig = {
  binance: {
    baseUrl: 'https://api.binance.com',
    testnet: false,
    recvWindow: 5000,
  },
  
  bybit: {
    baseUrl: 'https://api.bybit.com',
    testnet: false,
    recvWindow: 5000,
  },
  
  astronomy: {
    baseUrl: 'https://api.astronomyapi.com',
    timeout: 10000,
  },
  
  websocket: {
    reconnectInterval: 5000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000,
  },
};

/**
 * Получение конфигурации внешних сервисов
 */
export function getExternalServicesConfig(): ExternalServicesConfig {
  const config = { ...defaultExternalServicesConfig };
  
  // Переопределение из переменных окружения
  if (import.meta.env.VITE_BINANCE_API_KEY) {
    config.binance.apiKey = import.meta.env.VITE_BINANCE_API_KEY;
  }
  if (import.meta.env.VITE_BINANCE_SECRET_KEY) {
    config.binance.secretKey = import.meta.env.VITE_BINANCE_SECRET_KEY;
  }
  if (import.meta.env.VITE_BINANCE_TESTNET === 'true') {
    config.binance.testnet = true;
  }
  
  if (import.meta.env.VITE_BYBIT_API_KEY) {
    config.bybit.apiKey = import.meta.env.VITE_BYBIT_API_KEY;
  }
  if (import.meta.env.VITE_BYBIT_SECRET_KEY) {
    config.bybit.secretKey = import.meta.env.VITE_BYBIT_SECRET_KEY;
  }
  if (import.meta.env.VITE_BYBIT_TESTNET === 'true') {
    config.bybit.testnet = true;
  }
  
  if (import.meta.env.VITE_ASTRONOMY_API_KEY) {
    config.astronomy.apiKey = import.meta.env.VITE_ASTRONOMY_API_KEY;
  }
  
  return config;
} 