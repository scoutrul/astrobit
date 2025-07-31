import { Result } from '../domain';

/**
 * Базовый класс для внешних сервисов
 */
export abstract class ExternalService {
  /**
   * Обрабатывает ошибки внешних сервисов
   */
  protected handleExternalError(error: unknown): Result<never> {
    if (error instanceof Error) {
      return Result.fail(`Ошибка внешнего сервиса: ${error.message}`);
    }
    return Result.fail('Неизвестная ошибка внешнего сервиса');
  }

  /**
   * Проверяет доступность сервиса
   */
  abstract isAvailable(): Promise<boolean>;
} 