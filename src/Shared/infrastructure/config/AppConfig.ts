/**
 * Общая конфигурация приложения
 */
export interface AppConfig {
  // Основные настройки приложения
  appName: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  
  // Настройки API
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };
  
  // Настройки UI
  ui: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
  };
  
  // Настройки логирования
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableConsole: boolean;
    enableFile: boolean;
  };
}

/**
 * Конфигурация по умолчанию
 */
export const defaultAppConfig: AppConfig = {
  appName: 'AstroBit',
  version: '1.0.0',
  environment: (import.meta.env.MODE as AppConfig['environment']) || 'development',
  
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.astrobit.com',
    timeout: 30000,
    retryAttempts: 3,
  },
  
  ui: {
    theme: 'dark',
    language: 'ru',
    timezone: 'Europe/Moscow',
  },
  
  logging: {
    level: import.meta.env.MODE === 'production' ? 'warn' : 'debug',
    enableConsole: true,
    enableFile: false,
  },
};

/**
 * Получение конфигурации приложения
 */
export function getAppConfig(): AppConfig {
  // В будущем здесь можно добавить загрузку из файла или API
  return defaultAppConfig;
} 