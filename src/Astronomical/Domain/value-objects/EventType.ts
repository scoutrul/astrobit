import { ValueObject } from '../../../Shared/domain';

/**
 * Типы астрономических событий
 */
export type AstronomicalEventType = 
  | 'moon_phase'
  | 'planet_aspect'
  | 'solar_event'
  | 'lunar_eclipse'
  | 'solar_eclipse'
  | 'comet_event'
  | 'meteor_shower';

/**
 * Value Object для типа астрономического события
 */
export class EventType extends ValueObject<EventType> {
  constructor(private readonly _value: AstronomicalEventType) {
    super();
    this.validate();
  }

  get value(): AstronomicalEventType {
    return this._value;
  }

  private validate(): void {
    const validTypes: AstronomicalEventType[] = [
      'moon_phase',
      'planet_aspect',
      'solar_event',
      'lunar_eclipse',
      'solar_eclipse',
      'comet_event',
      'meteor_shower'
    ];

    if (!validTypes.includes(this._value)) {
      throw new Error(`Неверный тип события: ${this._value}`);
    }
  }

  clone(): EventType {
    return new EventType(this._value);
  }

  /**
   * Проверяет, является ли событие лунным
   */
  isLunar(): boolean {
    return this._value === 'moon_phase' || this._value === 'lunar_eclipse';
  }

  /**
   * Проверяет, является ли событие солнечным
   */
  isSolar(): boolean {
    return this._value === 'solar_event' || this._value === 'solar_eclipse';
  }

  /**
   * Проверяет, является ли событие планетарным
   */
  isPlanetary(): boolean {
    return this._value === 'planet_aspect';
  }

  /**
   * Проверяет, является ли событие космическим
   */
  isCosmic(): boolean {
    return this._value === 'comet_event' || this._value === 'meteor_shower';
  }
} 