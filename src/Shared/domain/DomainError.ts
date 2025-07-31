/**
 * Базовый класс для доменных ошибок
 */
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Ошибка валидации
 */
export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Ошибка бизнес-правила
 */
export class BusinessRuleError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Ошибка сущности не найдена
 */
export class EntityNotFoundError extends DomainError {
  constructor(entityName: string, id: string) {
    super(`${entityName} с ID ${id} не найден`);
  }
} 