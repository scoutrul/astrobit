/**
 * Простой Dependency Injection контейнер
 */
export class DependencyContainer {
  private static instance: DependencyContainer;
  private dependencies = new Map<string, any>();

  private constructor() {}

  static getInstance(): DependencyContainer {
    if (!DependencyContainer.instance) {
      DependencyContainer.instance = new DependencyContainer();
    }
    return DependencyContainer.instance;
  }

  /**
   * Регистрирует зависимость
   */
  register<T>(key: string, factory: () => T): void {
    this.dependencies.set(key, factory);
  }

  /**
   * Получает зависимость
   */
  resolve<T>(key: string): T {
    const factory = this.dependencies.get(key);
    if (!factory) {
      throw new Error(`Зависимость не найдена: ${key}`);
    }
    return factory();
  }

  /**
   * Проверяет, зарегистрирована ли зависимость
   */
  has(key: string): boolean {
    return this.dependencies.has(key);
  }

  /**
   * Очищает все зависимости
   */
  clear(): void {
    this.dependencies.clear();
  }
} 