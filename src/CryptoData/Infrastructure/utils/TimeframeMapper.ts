import { Timeframe, TimeframeValue } from '../../Domain/value-objects/Timeframe';

export class TimeframeMapper {
  private static readonly TIMEFRAME_MAP: Record<TimeframeValue, string> = {
    '1h': '1h',
    '8h': '8h', 
    '1d': '1d',
    '1w': '1w',
    '1M': '1M'
  };

  private static readonly REVERSE_TIMEFRAME_MAP: Record<string, TimeframeValue> = {
    '1h': '1h',
    '8h': '8h',
    '1d': '1d',
    '1w': '1w',
    '1M': '1M'
  };

  /**
   * Маппинг доменного таймфрейма в формат внешнего API
   */
  static mapToExternal(timeframe: Timeframe): string {
    return this.TIMEFRAME_MAP[timeframe.value];
  }

  /**
   * Маппинг строкового таймфрейма в доменный объект
   */
  static mapFromExternal(timeframeString: string): Timeframe {
    const mappedValue = this.REVERSE_TIMEFRAME_MAP[timeframeString];
    
    if (!mappedValue) {
      throw new Error(`Unsupported timeframe: ${timeframeString}. Supported: ${Object.keys(this.REVERSE_TIMEFRAME_MAP).join(', ')}`);
    }

    return new Timeframe(mappedValue);
  }

  /**
   * Проверить, поддерживается ли таймфрейм
   */
  static isSupported(timeframeString: string): boolean {
    return timeframeString in this.REVERSE_TIMEFRAME_MAP;
  }

  /**
   * Получить все поддерживаемые таймфреймы
   */
  static getSupportedTimeframes(): string[] {
    return Object.keys(this.REVERSE_TIMEFRAME_MAP);
  }

  /**
   * Получить доменные таймфреймы
   */
  static getDomainTimeframes(): Timeframe[] {
    return Object.values(this.TIMEFRAME_MAP).map(tf => new Timeframe(tf as TimeframeValue));
  }

  /**
   * Валидация таймфрейма
   */
  static validate(timeframeString: string): boolean {
    return this.isSupported(timeframeString);
  }

  /**
   * Получить миллисекунды для таймфрейма
   */
  static getMilliseconds(timeframeString: string): number {
    if (!this.isSupported(timeframeString)) {
      throw new Error(`Unsupported timeframe: ${timeframeString}`);
    }

    const timeframe = this.mapFromExternal(timeframeString);
    return timeframe.getMilliseconds();
  }

  /**
   * Получить рекомендуемый лимит данных для таймфрейма
   */
  static getRecommendedLimit(timeframeString: string): number {
    if (!this.isSupported(timeframeString)) {
      throw new Error(`Unsupported timeframe: ${timeframeString}`);
    }

    const timeframe = this.mapFromExternal(timeframeString);
    return timeframe.getRecommendedDataLimit();
  }
} 