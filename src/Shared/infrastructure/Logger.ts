/**
 * Универсальный логгер для отладки
 * Использует console.info для лучшей видимости в Playwright и браузере
 */
export class Logger {
  private static instance: Logger;
  private isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development' || 
                        import.meta.env?.MODE === 'development' ||
                        window.location.hostname === 'localhost';
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  // Основные методы логирования
  info(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.info(`ℹ️ [INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.warn(`⚠️ [WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.error(`❌ [ERROR] ${message}`, ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.info(`🔍 [DEBUG] ${message}`, ...args);
    }
  }

  // Специальные методы для разных контекстов
  component(componentName: string, message: string, ...args: any[]): void {
    this.info(`[${componentName}] ${message}`, ...args);
  }

  repository(repoName: string, message: string, ...args: any[]): void {
    this.info(`[${repoName}] ${message}`, ...args);
  }

  service(serviceName: string, message: string, ...args: any[]): void {
    this.info(`[${serviceName}] ${message}`, ...args);
  }

  useCase(useCaseName: string, message: string, ...args: any[]): void {
    this.info(`[${useCaseName}] ${message}`, ...args);
  }

  // Метод для логирования объектов
  object(label: string, obj: any): void {
    if (this.isDevelopment) {
      console.info(`📊 [OBJECT] ${label}:`, obj);
    }
  }

  // Метод для логирования массивов
  array(label: string, arr: any[]): void {
    if (this.isDevelopment) {
      console.info(`📋 [ARRAY] ${label} (${arr.length} items):`, arr);
    }
  }

  // Метод для логирования ошибок
  exception(message: string, error: any): void {
    if (this.isDevelopment) {
      console.error(`💥 [EXCEPTION] ${message}:`, error);
      if (error.stack) {
        console.error(`📚 Stack trace:`, error.stack);
      }
    }
  }
}

// Экспортируем синглтон для удобства
export const logger = Logger.getInstance();
