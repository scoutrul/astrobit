/**
 * Класс для обработки результатов операций
 * Позволяет безопасно обрабатывать успешные и неуспешные результаты
 */
export class Result<T> {
  private constructor(
    private readonly _isSuccess: boolean,
    private readonly _error?: string,
    private readonly _value?: T
  ) {
    if (_isSuccess && _error) {
      throw new Error('Успешный результат не может содержать ошибку');
    }
    if (!_isSuccess && !_error) {
      throw new Error('Неуспешный результат должен содержать ошибку');
    }
  }

  /**
   * Создает успешный результат
   */
  static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, undefined, value);
  }

  /**
   * Создает неуспешный результат
   */
  static fail<U>(error: string): Result<U> {
    return new Result<U>(false, error);
  }

  /**
   * Проверяет, является ли результат успешным
   */
  get isSuccess(): boolean {
    return this._isSuccess;
  }

  /**
   * Проверяет, является ли результат неуспешным
   */
  get isFailure(): boolean {
    return !this._isSuccess;
  }

  /**
   * Возвращает значение (только для успешных результатов)
   */
  get value(): T {
    if (!this._isSuccess) {
      throw new Error('Нельзя получить значение из неуспешного результата');
    }
    return this._value!;
  }

  /**
   * Возвращает ошибку (только для неуспешных результатов)
   */
  get error(): string {
    if (this._isSuccess) {
      throw new Error('Нельзя получить ошибку из успешного результата');
    }
    return this._error!;
  }

  /**
   * Выполняет функцию для успешного результата
   */
  onSuccess(fn: (value: T) => void): Result<T> {
    if (this._isSuccess) {
      fn(this._value!);
    }
    return this;
  }

  /**
   * Выполняет функцию для неуспешного результата
   */
  onFailure(fn: (error: string) => void): Result<T> {
    if (!this._isSuccess) {
      fn(this._error!);
    }
    return this;
  }
} 