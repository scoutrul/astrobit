import { ValueObject } from '../../../Shared/domain';

/**
 * Уровни значимости астрономических событий
 */
export type EventSignificanceLevel = 'low' | 'medium' | 'high';

/**
 * Value Object для значимости астрономического события
 */
export class EventSignificance extends ValueObject<EventSignificance> {
  constructor(private readonly _value: EventSignificanceLevel) {
    super();
    this.validate();
  }

  get value(): EventSignificanceLevel {
    return this._value;
  }

  private validate(): void {
    const validLevels: EventSignificanceLevel[] = ['low', 'medium', 'high'];

    if (!validLevels.includes(this._value)) {
      throw new Error(`Неверный уровень значимости: ${this._value}`);
    }
  }

  clone(): EventSignificance {
    return new EventSignificance(this._value);
  }

  /**
   * Проверяет, является ли значимость высокой
   */
  isHigh(): boolean {
    return this._value === 'high';
  }

  /**
   * Проверяет, является ли значимость средней
   */
  isMedium(): boolean {
    return this._value === 'medium';
  }

  /**
   * Проверяет, является ли значимость низкой
   */
  isLow(): boolean {
    return this._value === 'low';
  }

  /**
   * Сравнивает значимость с другой
   */
  isGreaterThan(other: EventSignificance): boolean {
    const levels: EventSignificanceLevel[] = ['low', 'medium', 'high'];
    return levels.indexOf(this._value) > levels.indexOf(other._value);
  }
} 