/**
 * Базовый класс для Value Objects
 * Value Objects не имеют идентификатора и сравниваются по значению
 */
export abstract class ValueObject<T> {
  /**
   * Проверяет равенство value objects по значению
   */
  equals(valueObject?: ValueObject<T>): boolean {
    if (valueObject === null || valueObject === undefined) {
      return false;
    }

    if (this === valueObject) {
      return true;
    }

    try {
      return JSON.stringify(this) === JSON.stringify(valueObject);
    } catch (error) {
      console.warn('[ValueObject] Ошибка JSON.stringify при сравнении:', error);
      return false;
    }
  }

  /**
   * Абстрактный метод для клонирования value object
   */
  abstract clone(): T;
} 