/**
 * Базовый класс для всех доменных сущностей
 * Обеспечивает уникальную идентификацию и базовую функциональность
 */
export abstract class BaseEntity<T> {
  protected readonly _id: string;
  protected readonly _createdAt: Date;
  protected readonly _updatedAt: Date;

  constructor(id: string, createdAt?: Date, updatedAt?: Date) {
    this._id = id;
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
  }

  get id(): string {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Проверяет равенство сущностей по ID
   */
  equals(entity?: BaseEntity<T>): boolean {
    try {
      if (entity === null || entity === undefined) {
        return false;
      }

      if (this === entity) {
        return true;
      }

      return this._id === entity._id;
    } catch (error) {
      console.warn('[BaseEntity] Ошибка сравнения сущностей:', error);
      return false;
    }
  }

  /**
   * Абстрактный метод для клонирования сущности
   */
  abstract clone(): T;
} 