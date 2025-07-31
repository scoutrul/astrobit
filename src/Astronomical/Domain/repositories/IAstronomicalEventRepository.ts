import { Result } from '../../../Shared/domain';
import { AstronomicalEvent } from '../entities/AstronomicalEvent';
import { EventType } from '../value-objects/EventType';

/**
 * Критерии поиска астрономических событий
 */
export interface AstronomicalEventSearchCriteria {
  startDate?: Date;
  endDate?: Date;
  types?: EventType[];
  significance?: 'low' | 'medium' | 'high';
  limit?: number;
}

/**
 * Интерфейс репозитория для астрономических событий
 */
export interface IAstronomicalEventRepository {
  /**
   * Найти события по критериям поиска
   */
  findByCriteria(criteria: AstronomicalEventSearchCriteria): Promise<Result<AstronomicalEvent[]>>;

  /**
   * Найти события в указанном периоде
   */
  findByPeriod(startDate: Date, endDate: Date): Promise<Result<AstronomicalEvent[]>>;

  /**
   * Найти события определенного типа
   */
  findByType(type: EventType): Promise<Result<AstronomicalEvent[]>>;

  /**
   * Найти события по дате
   */
  findByDate(date: Date): Promise<Result<AstronomicalEvent[]>>;

  /**
   * Получить текущую фазу луны
   */
  getCurrentMoonPhase(): Promise<Result<string>>;

  /**
   * Получить фазу луны для указанной даты
   */
  getMoonPhaseForDate(date: Date): Promise<Result<string>>;
} 