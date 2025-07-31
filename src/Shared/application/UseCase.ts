import { Result } from '../domain';

/**
 * Базовый класс для всех use cases
 * Use cases содержат бизнес-логику приложения и координируют доменные объекты
 */
export abstract class UseCase<TRequest, TResponse> {
  /**
   * Выполняет use case
   */
  abstract execute(request: TRequest): Promise<Result<TResponse>>;

  /**
   * Валидирует входные данные
   */
  protected validateRequest(request: TRequest): Result<TRequest> {
    return Result.ok(request);
  }
}

/**
 * Use case без входных параметров
 */
export abstract class UseCaseWithoutRequest<TResponse> {
  /**
   * Выполняет use case
   */
  abstract execute(): Promise<Result<TResponse>>;
} 