export class TimeframeUtils {
  /**
   * Конвертирует таймфрейм в миллисекунды
   */
  static getTimeframeInterval(timeframe: string): number {
    const intervals: Record<string, number> = {
      '1h': 60 * 60 * 1000,           // 1 час
      '8h': 8 * 60 * 60 * 1000,       // 8 часов
      '1d': 24 * 60 * 60 * 1000,      // 1 день
      '1w': 7 * 24 * 60 * 60 * 1000,  // 1 неделя
      '1M': 30 * 24 * 60 * 60 * 1000  // 1 месяц (приблизительно)
    };
    return intervals[timeframe] || intervals['1d']; // По умолчанию 1 день
  }

  /**
   * Конвертирует таймфрейм в секунды
   */
  static getTimeframeIntervalSeconds(timeframe: string): number {
    return this.getTimeframeInterval(timeframe) / 1000;
  }

  /**
   * Получает рекомендуемый лимит данных для таймфрейма
   */
  static getRecommendedDataLimit(timeframe: string): number {
    const limits: Record<string, number> = {
      '1h': 3000,   // 3000 часов = ~4 месяца
      '8h': 1000,   // 1000 интервалов = ~3 месяца
      '1d': 500,    // 500 дней = ~1.5 года
      '1w': 200,    // 200 недель = ~4 года
      '1M': 100     // 100 месяцев = ~8 лет
    };
    return limits[timeframe] || limits['1d'];
  }

  /**
   * Вычисляет начальную дату на основе таймфрейма для полного покрытия графика
   */
  static getStartDateForTimeframe(timeframe: string): Date {
    const now = new Date();
    const startDate = new Date(now);
    
    switch (timeframe) {
      case '1h':
        startDate.setMonth(now.getMonth() - 2); // 2 месяца назад
        break;
      case '8h':
        startDate.setMonth(now.getMonth() - 6); // 6 месяцев назад
        break;
      case '1d':
        startDate.setFullYear(now.getFullYear() - 2); // 2 года назад
        break;
      case '1w':
        startDate.setFullYear(now.getFullYear() - 3); // 3 года назад
        break;
      case '1M':
        startDate.setFullYear(now.getFullYear() - 5); // 5 лет назад
        break;
      default:
        startDate.setFullYear(now.getFullYear() - 1); // По умолчанию 1 год назад
    }
    
    return startDate;
  }

  /**
   * Вычисляет конечную дату с прогнозом на будущее
   */
  static getEndDateWithForecast(monthsAhead: number = 3): Date {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(now.getMonth() + monthsAhead);
    return endDate;
  }

  /**
   * Создает пустые свечи для будущих событий
   */
  static createEmptyCandles(
    lastCandleTime: number,
    lastCandlePrice: number,
    timeframe: string,
    targetTime: number
  ): Array<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
  }> {
    const intervalSeconds = this.getTimeframeIntervalSeconds(timeframe);
    const emptyCandles = [];
    let currentTime = lastCandleTime + intervalSeconds;
    
    while (currentTime <= targetTime) {
      emptyCandles.push({
        time: currentTime,
        open: lastCandlePrice,
        high: lastCandlePrice,
        low: lastCandlePrice,
        close: lastCandlePrice
      });
      currentTime += intervalSeconds;
    }
    
    return emptyCandles;
  }

  /**
   * Создает буферные свечи для корректного масштабирования
   */
  static createBufferCandles(
    lastCandleTime: number,
    lastCandlePrice: number,
    timeframe: string,
    count: number = 15
  ): Array<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
  }> {
    const intervalSeconds = this.getTimeframeIntervalSeconds(timeframe);
    const bufferCandles = [];
    let currentTime = lastCandleTime + intervalSeconds;
    
    for (let i = 0; i < count; i++) {
      bufferCandles.push({
        time: currentTime,
        open: lastCandlePrice,
        high: lastCandlePrice,
        low: lastCandlePrice,
        close: lastCandlePrice
      });
      currentTime += intervalSeconds;
    }
    
    return bufferCandles;
  }

  /**
   * Вычисляет видимый диапазон для масштабирования
   */
  static calculateVisibleRange(
    totalCandles: number,
    realCandlesCount: number,
    visibleCandles: number = 50,
    quarterOffset: number = 0.25
  ): { from: number; to: number } {
    const offset = Math.floor(visibleCandles * quarterOffset);
    const lastRealIndex = realCandlesCount - 1;
    const centerIndex = lastRealIndex - offset;
    const halfVisible = Math.floor(visibleCandles / 2);
    const firstVisibleIndex = Math.max(0, centerIndex - halfVisible);
    const lastVisibleIndex = Math.min(totalCandles - 1, firstVisibleIndex + visibleCandles - 1);
    
    return {
      from: firstVisibleIndex,
      to: lastVisibleIndex
    };
  }

  /**
   * Валидирует данные OHLC
   */
  static validateOHLCData(data: {
    open: number;
    high: number;
    low: number;
    close: number;
  }): boolean {
    if (data.open <= 0 || data.high <= 0 || data.low <= 0 || data.close <= 0) {
      return false;
    }

    if (data.high < Math.max(data.open, data.close)) {
      return false;
    }

    if (data.low > Math.min(data.open, data.close)) {
      return false;
    }

    return true;
  }

  /**
   * Фильтрует и сортирует данные по времени, удаляет дубликаты
   */
  static processChartData<T extends { time: number }>(data: T[]): T[] {
    if (!data || data.length === 0) {
      return [];
    }

    // Фильтруем данные с валидным временем
    const validData = data.filter(item => item.time > 0);
    
    if (validData.length === 0) {
      return [];
    }

    // Сортируем по времени
    const sortedData = validData.sort((a, b) => a.time - b.time);
    
    // Удаляем дублирующиеся записи по времени
    const uniqueData: T[] = [];
    const seenTimes = new Set<number>();
    
    for (const item of sortedData) {
      if (!seenTimes.has(item.time)) {
        seenTimes.add(item.time);
        uniqueData.push(item);
      }
    }

    console.log('[TimeframeUtils] Data processing:', {
      originalLength: data.length,
      validLength: validData.length,
      sortedLength: sortedData.length,
      uniqueLength: uniqueData.length,
      firstTime: uniqueData[0]?.time,
      lastTime: uniqueData[uniqueData.length - 1]?.time
    });

    return uniqueData;
  }

  /**
   * Конвертирует timestamp в секунды для Lightweight Charts
   */
  static convertTimestampToSeconds(timestamp: number | string): number {
    if (typeof timestamp === 'string') {
      // Если это ISO строка, конвертируем в timestamp
      const date = new Date(timestamp);
      return Math.floor(date.getTime() / 1000);
    }
    // Если это уже timestamp в миллисекундах, конвертируем в секунды
    if (timestamp > 1000000000000) { // Если timestamp больше 2001 года
      return Math.floor(timestamp / 1000);
    }
    // Если это уже timestamp в секундах, возвращаем как есть
    return timestamp;
  }

  /**
   * Конвертирует timestamp в миллисекунды
   */
  static convertTimestampToMilliseconds(timestamp: number | string): number {
    if (typeof timestamp === 'string') {
      return parseInt(timestamp) * 1000;
    }
    return timestamp;
  }
} 