import { Result } from '../../../Shared/domain';
import { AstronomicalEvent } from '../entities/AstronomicalEvent';

/**
 * Интерфейс для астрономических расчетов
 */
export interface IAstronomicalCalculationService {
  /**
   * Рассчитать лунные фазы для периода
   */
  calculateMoonPhases(startDate: Date, endDate: Date): Promise<Result<AstronomicalEvent[]>>;

  /**
   * Рассчитать солнечные события для периода
   */
  calculateSolarEvents(startDate: Date, endDate: Date): Promise<Result<AstronomicalEvent[]>>;

  /**
   * Рассчитать планетарные аспекты для периода
   */
  calculatePlanetaryAspects(startDate: Date, endDate: Date): Promise<Result<AstronomicalEvent[]>>;

  /**
   * Рассчитать затмения для периода
   */
  calculateEclipses(startDate: Date, endDate: Date): Promise<Result<AstronomicalEvent[]>>;

  /**
   * Рассчитать метеорные потоки для периода
   */
  calculateMeteorShowers(startDate: Date, endDate: Date): Promise<Result<AstronomicalEvent[]>>;

  /**
   * Рассчитать события комет для периода
   */
  calculateCometEvents(startDate: Date, endDate: Date): Promise<Result<AstronomicalEvent[]>>;

  /**
   * Получить фазу луны для даты
   */
  getMoonPhase(date: Date): Promise<Result<string>>;
} 