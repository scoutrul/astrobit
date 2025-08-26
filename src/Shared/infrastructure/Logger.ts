/**
 * Универсальный логгер для отладки
 * Использует console.info для лучшей видимости в Playwright и браузере
 */
export class Logger {
  private static instance: Logger;

  private constructor() {
    // Конструктор оставлен для совместимости
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  // Основные методы логирования
  info(_message: string, ..._args: any[]): void {
    // Логирование отключено
  }

  warn(_message: string, ..._args: any[]): void {
    // Логирование отключено
  }

  error(_message: string, ..._args: any[]): void {
    // Логирование отключено
  }

  debug(_message: string, ..._args: any[]): void {
    // Логирование отключено
  }

  // Специальные методы для разных контекстов
  component(_componentName: string, _message: string, ..._args: any[]): void {
    // Логирование отключено
  }

  repository(_repoName: string, _message: string, ..._args: any[]): void {
    // Логирование отключено
  }

  service(_serviceName: string, _message: string, ..._args: any[]): void {
    // Логирование отключено
  }

  useCase(_useCaseName: string, _message: string, ..._args: any[]): void {
    // Логирование отключено
  }

  // Метод для логирования объектов
  object(_label: string, _obj: any): void {
    // Логирование отключено
  }

  // Метод для логирования массивов
  array(_label: string, _arr: any[]): void {
    // Логирование отключено
  }

  // Метод для логирования ошибок
  exception(_message: string, _error: any): void {
    // Логирование отключено
  }
}

// Экспортируем синглтон для удобства
export const logger = Logger.getInstance();
