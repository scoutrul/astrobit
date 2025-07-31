import { ValueObject } from '../../../Shared/domain/ValueObject';

export type TimeframeValue = '1h' | '8h' | '1d' | '1w' | '1M';

export class Timeframe extends ValueObject<Timeframe> {
  constructor(private readonly _value: TimeframeValue) {
    super();
    this.validate();
  }

  get value(): TimeframeValue {
    return this._value;
  }

  private validate(): void {
    const validTimeframes: TimeframeValue[] = ['1h', '8h', '1d', '1w', '1M'];
    
    if (!validTimeframes.includes(this._value)) {
      throw new Error(`Invalid timeframe: ${this._value}. Valid timeframes are: ${validTimeframes.join(', ')}`);
    }
  }

  clone(): Timeframe {
    return new Timeframe(this._value);
  }

  equals(valueObject?: Timeframe): boolean {
    if (!valueObject) return false;
    return this._value === valueObject._value;
  }

  toString(): string {
    return this._value;
  }

  // Helper methods for common timeframes
  static OneHour(): Timeframe {
    return new Timeframe('1h');
  }

  static EightHours(): Timeframe {
    return new Timeframe('8h');
  }

  static OneDay(): Timeframe {
    return new Timeframe('1d');
  }

  static OneWeek(): Timeframe {
    return new Timeframe('1w');
  }

  static OneMonth(): Timeframe {
    return new Timeframe('1M');
  }

  // Get all available timeframes
  static getAllTimeframes(): Timeframe[] {
    return [
      Timeframe.OneHour(),
      Timeframe.EightHours(),
      Timeframe.OneDay(),
      Timeframe.OneWeek(),
      Timeframe.OneMonth()
    ];
  }

  // Get timeframes by category
  static getShortTermTimeframes(): Timeframe[] {
    return [
      Timeframe.OneHour(),
      Timeframe.EightHours()
    ];
  }

  static getMediumTermTimeframes(): Timeframe[] {
    return [
      Timeframe.OneDay(),
      Timeframe.OneWeek()
    ];
  }

  static getLongTermTimeframes(): Timeframe[] {
    return [
      Timeframe.OneMonth()
    ];
  }

  // Get display label for timeframe
  getDisplayLabel(): string {
    const labels: Record<TimeframeValue, string> = {
      '1h': '1ч',
      '8h': '8ч',
      '1d': '1д',
      '1w': '1нед',
      '1M': '1мес'
    };
    return labels[this._value];
  }

  // Get description for timeframe
  getDescription(): string {
    const descriptions: Record<TimeframeValue, string> = {
      '1h': '1 час',
      '8h': '8 часов',
      '1d': '1 день',
      '1w': '1 неделя',
      '1M': '1 месяц'
    };
    return descriptions[this._value];
  }

  // Get milliseconds for timeframe
  getMilliseconds(): number {
    const milliseconds: Record<TimeframeValue, number> = {
      '1h': 60 * 60 * 1000,
      '8h': 8 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000,
      '1M': 30 * 24 * 60 * 60 * 1000 // Approximate
    };
    return milliseconds[this._value];
  }

  // Get recommended data limit for timeframe
  getRecommendedDataLimit(): number {
    const limits: Record<TimeframeValue, number> = {
      '1h': 1000,
      '8h': 500,
      '1d': 300,
      '1w': 200,
      '1M': 100
    };
    return limits[this._value];
  }

  // Check if timeframe is short term
  isShortTerm(): boolean {
    return ['1h', '8h'].includes(this._value);
  }

  // Check if timeframe is medium term
  isMediumTerm(): boolean {
    return ['1d', '1w'].includes(this._value);
  }

  // Check if timeframe is long term
  isLongTerm(): boolean {
    return this._value === '1M';
  }
} 