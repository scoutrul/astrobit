import { Result } from '../domain';

/**
 * Базовый класс для application services
 * Application services координируют несколько use cases
 */
export abstract class ApplicationService {
  /**
   * Обрабатывает ошибки и возвращает Result
   */
  protected handleError(error: unknown): Result<never> {
    if (error instanceof Error) {
      return Result.fail(error.message);
    }
    return Result.fail('Неизвестная ошибка');
  }
} 