import { ValueObject } from '../../../Shared/domain';
import { AstronomicalDataLoader } from '../../Infrastructure/services/astronomicalDataLoader';

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
  private static eventTypesData: any = null;

  constructor(private readonly _value: AstronomicalEventType) {
    super();
    this.validate();
  }

  get value(): AstronomicalEventType {
    return this._value;
  }

  private validate(): void {
    try {
      // Получаем валидные типы из JSON данных
      if (!EventType.eventTypesData) {
        EventType.eventTypesData = AstronomicalDataLoader.getEventTypes();
      }

      const validTypes = EventType.eventTypesData.types.map((type: any) => type.value);
      
      if (!validTypes.includes(this._value)) {
        throw new Error(`Неверный тип события: ${this._value}`);
      }
    } catch (error) {
      console.warn('[EventType] Ошибка загрузки JSON данных, используем fallback:', error);
      // Fallback на старые валидные типы если JSON не загрузился
      const fallbackTypes: AstronomicalEventType[] = [
        'moon_phase',
        'planet_aspect',
        'solar_event',
        'lunar_eclipse',
        'solar_eclipse',
        'comet_event',
        'meteor_shower'
      ];

      if (!fallbackTypes.includes(this._value)) {
        throw new Error(`Неверный тип события: ${this._value}`);
      }
    }
  }

  clone(): EventType {
    return new EventType(this._value);
  }

  /**
   * Получить метаданные типа события
   */
  getMetadata(): { label: string; icon: string; description: string; category: string } | null {
    try {
      if (!EventType.eventTypesData) {
        EventType.eventTypesData = AstronomicalDataLoader.getEventTypes();
      }

      const typeData = EventType.eventTypesData.types.find((type: any) => type.value === this._value);
      return typeData || null;
    } catch (error) {
      console.error('[EventType] Ошибка получения метаданных:', error);
      return null;
    }
  }

  /**
   * Получить категорию типа события
   */
  getCategory(): string {
    const metadata = this.getMetadata();
    return metadata?.category || 'unknown';
  }

  /**
   * Получить иконку типа события
   */
  getIcon(): string {
    const metadata = this.getMetadata();
    return metadata?.icon || '🌙';
  }

  /**
   * Получить описание типа события
   */
  getDescription(): string {
    const metadata = this.getMetadata();
    return metadata?.description || 'Астрономическое событие';
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

  /**
   * Получить все доступные типы событий
   */
  static getAllTypes(): AstronomicalEventType[] {
    try {
      if (!EventType.eventTypesData) {
        EventType.eventTypesData = AstronomicalDataLoader.getEventTypes();
      }

      return EventType.eventTypesData.types.map((type: any) => type.value);
    } catch (error) {
      // Fallback на старые типы
      return [
        'moon_phase',
        'planet_aspect',
        'solar_event',
        'lunar_eclipse',
        'solar_eclipse',
        'comet_event',
        'meteor_shower'
      ];
    }
  }

  /**
   * Получить все категории событий
   */
  static getAllCategories(): Record<string, { name: string; color: string; description: string }> {
    try {
      if (!EventType.eventTypesData) {
        EventType.eventTypesData = AstronomicalDataLoader.getEventTypes();
      }

      return EventType.eventTypesData.categories;
    } catch (error) {
      // Fallback на базовые категории
      return {
        lunar: {
          name: 'Лунные события',
          color: '#fbbf24',
          description: 'События, связанные с Луной'
        },
        solar: {
          name: 'Солнечные события',
          color: '#f59e0b',
          description: 'События, связанные с Солнцем'
        },
        planetary: {
          name: 'Планетарные события',
          color: '#8b5cf6',
          description: 'События, связанные с планетами'
        },
        cosmic: {
          name: 'Космические события',
          color: '#10b981',
          description: 'Кометы, метеоры, астероиды'
        }
      };
    }
  }
} 