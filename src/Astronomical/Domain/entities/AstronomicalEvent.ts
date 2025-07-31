import { BaseEntity } from '../../../Shared/domain';
import { EventType } from '../value-objects/EventType';
import { EventSignificance } from '../value-objects/EventSignificance';

/**
 * Доменная сущность астрономического события
 */
export class AstronomicalEvent extends BaseEntity<AstronomicalEvent> {
  constructor(
    id: string,
    private readonly _timestamp: Date,
    private readonly _type: EventType,
    private readonly _name: string,
    private readonly _description: string,
    private readonly _significance: EventSignificance,
    private readonly _price?: number,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);
    this.validate();
  }

  get timestamp(): Date {
    return this._timestamp;
  }

  get type(): EventType {
    return this._type;
  }

  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get significance(): EventSignificance {
    return this._significance;
  }

  get price(): number | undefined {
    return this._price;
  }

  private validate(): void {
    if (!this._name || this._name.trim().length === 0) {
      throw new Error('Название события не может быть пустым');
    }

    if (!this._description || this._description.trim().length === 0) {
      throw new Error('Описание события не может быть пустым');
    }

    if (this._price !== undefined && this._price < 0) {
      throw new Error('Цена не может быть отрицательной');
    }
  }

  /**
   * Проверяет, произошло ли событие в указанную дату
   */
  occurredOn(date: Date): boolean {
    const eventDate = new Date(this._timestamp);
    return eventDate.toDateString() === date.toDateString();
  }

  /**
   * Проверяет, произошло ли событие в указанном периоде
   */
  occurredBetween(startDate: Date, endDate: Date): boolean {
    const eventDate = new Date(this._timestamp);
    return eventDate >= startDate && eventDate <= endDate;
  }

  /**
   * Проверяет, является ли событие значимым
   */
  isSignificant(): boolean {
    return this._significance.isHigh() || this._significance.isMedium();
  }

  /**
   * Создает копию события с обновленной ценой
   */
  withPrice(price: number): AstronomicalEvent {
    return new AstronomicalEvent(
      this.id,
      this._timestamp,
      this._type,
      this._name,
      this._description,
      this._significance,
      price,
      this.createdAt,
      new Date()
    );
  }

  clone(): AstronomicalEvent {
    return new AstronomicalEvent(
      this.id,
      this._timestamp,
      this._type,
      this._name,
      this._description,
      this._significance,
      this._price,
      this.createdAt,
      this.updatedAt
    );
  }
} 