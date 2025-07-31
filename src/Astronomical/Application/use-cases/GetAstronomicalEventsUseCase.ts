import { UseCase } from '../../../Shared/application';
import { Result } from '../../../Shared/domain';
import { 
  AstronomicalEvent, 
  AstronomicalEventSearchCriteria,
  IAstronomicalEventRepository 
} from '../../Domain';

/**
 * Запрос для получения астрономических событий
 */
export interface GetAstronomicalEventsRequest {
  startDate: Date;
  endDate: Date;
  types?: string[];
  significance?: 'low' | 'medium' | 'high';
  limit?: number;
}

/**
 * Ответ с астрономическими событиями
 */
export interface GetAstronomicalEventsResponse {
  events: AstronomicalEvent[];
  totalCount: number;
  period: {
    startDate: Date;
    endDate: Date;
  };
}

/**
 * Use Case для получения астрономических событий
 */
export class GetAstronomicalEventsUseCase extends UseCase<
  GetAstronomicalEventsRequest,
  GetAstronomicalEventsResponse
> {
  constructor(
    private readonly astronomicalEventRepository: IAstronomicalEventRepository
  ) {
    super();
  }

  async execute(request: GetAstronomicalEventsRequest): Promise<Result<GetAstronomicalEventsResponse>> {
    try {
      // Валидация запроса
      const validationResult = this.validateRequest(request);
      if (validationResult.isFailure) {
        return Result.fail(validationResult.error);
      }

      // Создание критериев поиска
      const criteria: AstronomicalEventSearchCriteria = {
        startDate: request.startDate,
        endDate: request.endDate,
        significance: request.significance,
        limit: request.limit
      };

      // Получение событий из репозитория
      const eventsResult = await this.astronomicalEventRepository.findByCriteria(criteria);
      if (eventsResult.isFailure) {
        return Result.fail(eventsResult.error);
      }

      const events = eventsResult.value;

      // Формирование ответа
      const response: GetAstronomicalEventsResponse = {
        events,
        totalCount: events.length,
        period: {
          startDate: request.startDate,
          endDate: request.endDate
        }
      };

      return Result.ok(response);
    } catch (error) {
      return Result.fail(`Ошибка при получении астрономических событий: ${error}`);
    }
  }

  protected validateRequest(request: GetAstronomicalEventsRequest): Result<GetAstronomicalEventsRequest> {
    if (!request.startDate || !request.endDate) {
      return Result.fail('Начальная и конечная даты обязательны');
    }

    if (request.startDate > request.endDate) {
      return Result.fail('Начальная дата не может быть позже конечной');
    }

    if (request.limit !== undefined && request.limit <= 0) {
      return Result.fail('Лимит должен быть положительным числом');
    }

    return Result.ok(request);
  }
} 