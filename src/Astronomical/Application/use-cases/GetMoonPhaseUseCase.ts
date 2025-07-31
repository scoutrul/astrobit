import { UseCase, UseCaseWithoutRequest } from '../../../Shared/application';
import { Result } from '../../../Shared/domain';
import { IAstronomicalEventRepository } from '../../Domain';

/**
 * Ответ с фазой луны
 */
export interface GetMoonPhaseResponse {
  phase: string;
  date: Date;
}

/**
 * Use Case для получения текущей фазы луны
 */
export class GetCurrentMoonPhaseUseCase extends UseCaseWithoutRequest<GetMoonPhaseResponse> {
  constructor(
    private readonly astronomicalEventRepository: IAstronomicalEventRepository
  ) {
    super();
  }

  async execute(): Promise<Result<GetMoonPhaseResponse>> {
    try {
      const phaseResult = await this.astronomicalEventRepository.getCurrentMoonPhase();
      if (phaseResult.isFailure) {
        return Result.fail(phaseResult.error);
      }

      const response: GetMoonPhaseResponse = {
        phase: phaseResult.value,
        date: new Date()
      };

      return Result.ok(response);
    } catch (error) {
      return Result.fail(`Ошибка при получении фазы луны: ${error}`);
    }
  }
}

/**
 * Use Case для получения фазы луны для указанной даты
 */
export class GetMoonPhaseForDateUseCase extends UseCase<Date, GetMoonPhaseResponse> {
  constructor(
    private readonly astronomicalEventRepository: IAstronomicalEventRepository
  ) {
    super();
  }

  async execute(date: Date): Promise<Result<GetMoonPhaseResponse>> {
    try {
      // Валидация даты
      const validationResult = this.validateRequest(date);
      if (validationResult.isFailure) {
        return Result.fail(validationResult.error);
      }

      const phaseResult = await this.astronomicalEventRepository.getMoonPhaseForDate(date);
      if (phaseResult.isFailure) {
        return Result.fail(phaseResult.error);
      }

      const response: GetMoonPhaseResponse = {
        phase: phaseResult.value,
        date
      };

      return Result.ok(response);
    } catch (error) {
      return Result.fail(`Ошибка при получении фазы луны: ${error}`);
    }
  }

  protected validateRequest(date: Date): Result<Date> {
    if (!date || isNaN(date.getTime())) {
      return Result.fail('Некорректная дата');
    }

    return Result.ok(date);
  }
} 