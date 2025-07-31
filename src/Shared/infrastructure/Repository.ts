import { Result } from '../domain';

/**
 * Базовый интерфейс для репозиториев
 */
export interface Repository<T> {
  /**
   * Найти сущность по ID
   */
  findById(id: string): Promise<Result<T | null>>;

  /**
   * Найти все сущности
   */
  findAll(): Promise<Result<T[]>>;

  /**
   * Сохранить сущность
   */
  save(entity: T): Promise<Result<T>>;

  /**
   * Обновить сущность
   */
  update(entity: T): Promise<Result<T>>;

  /**
   * Удалить сущность
   */
  delete(id: string): Promise<Result<void>>;
}

/**
 * Базовый интерфейс для репозиториев с поиском
 */
export interface SearchableRepository<T, TSearchCriteria> extends Repository<T> {
  /**
   * Найти сущности по критериям поиска
   */
  findByCriteria(criteria: TSearchCriteria): Promise<Result<T[]>>;
} 