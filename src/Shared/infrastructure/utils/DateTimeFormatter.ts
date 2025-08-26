/**
 * Централизованная утилита для форматирования даты и времени в локальном часовом поясе
 */
export class DateTimeFormatter {
  private static readonly DEFAULT_LOCALE = 'ru-RU';
  private static overrideLocale: string | null = null;
  
  /**
   * Устанавливает локаль вручную (переопределяет автоматическое определение)
   */
  static setLocale(locale: string): void {
    this.overrideLocale = locale;
  }
  
  /**
   * Сбрасывает ручную настройку локали на автоматическое определение
   */
  static resetLocale(): void {
    this.overrideLocale = null;
  }
  
  /**
   * Получает текущую локаль
   */
  static getCurrentLocale(): string {
    return this.getLocale();
  }
  
  /**
   * Получает информацию о текущем часовом поясе пользователя
   */
  static getTimezoneInfo(): { name: string; offset: string } {
    const date = new Date();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offset = date.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(offset) / 60);
    const offsetMinutes = Math.abs(offset) % 60;
    const offsetSign = offset <= 0 ? '+' : '-';
    const offsetString = `UTC${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`;
    
    return {
      name: timeZone,
      offset: offsetString
    };
  }
  
  /**
   * Получает локаль пользователя из браузера или возвращает дефолтную
   */
  private static getLocale(): string {
    // Если установлена ручная локаль, используем её
    if (this.overrideLocale) {
      return this.overrideLocale;
    }
    
    // Пробуем получить локаль из браузера
    if (typeof navigator !== 'undefined') {
      return navigator.language || navigator.languages?.[0] || this.DEFAULT_LOCALE;
    }
    
    return this.DEFAULT_LOCALE;
  }
  
  /**
   * Форматирует дату и время для отображения пользователю
   */
  static formatDateTime(date: Date | number | string): string {
    const dateObj = this.normalizeDate(date);
    return dateObj.toLocaleString(this.getLocale(), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  /**
   * Форматирует только дату без времени
   */
  static formatDate(date: Date | number | string): string {
    const dateObj = this.normalizeDate(date);
    return dateObj.toLocaleDateString(this.getLocale(), {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Форматирует только время без даты
   */
  static formatTime(date: Date | number | string): string {
    const dateObj = this.normalizeDate(date);
    return dateObj.toLocaleTimeString(this.getLocale(), {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  /**
   * Короткий формат даты (ДД.ММ.ГГГГ)
   */
  static formatDateShort(date: Date | number | string): string {
    const dateObj = this.normalizeDate(date);
    return dateObj.toLocaleDateString(this.getLocale(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Короткий формат даты и времени (ДД.ММ.ГГГГ ЧЧ:ММ)
   */
  static formatDateTimeShort(date: Date | number | string): string {
    const dateObj = this.normalizeDate(date);
    return dateObj.toLocaleString(this.getLocale(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  /**
   * Форматирует время для графиков в зависимости от таймфрейма
   */
  static formatChartTime(timestamp: number | string | Date, timeframe?: string): string {
    const date = this.normalizeDate(timestamp);
    
    switch (timeframe) {
      case '1m':
      case '5m':
      case '15m':
      case '30m':
        return date.toLocaleTimeString(this.getLocale(), { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false
        });
      case '1h':
      case '4h':
      case '8h':
        return date.toLocaleString(this.getLocale(), { 
          month: '2-digit', 
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      case '1d':
      case '1w':
      case '1M':
        return date.toLocaleDateString(this.getLocale(), { 
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      default:
        return date.toLocaleDateString(this.getLocale());
    }
  }

  /**
   * Форматирует дату для селектов событий (название + дата)
   */
  static formatEventDate(date: Date | number | string): string {
    const dateObj = this.normalizeDate(date);
    return dateObj.toLocaleDateString(this.getLocale(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Форматирует цену с локализацией
   */
  static formatPrice(price: number, currency = 'USD'): string {
    return price.toLocaleString(this.getLocale(), {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
      style: 'currency',
      currency: currency
    });
  }

  /**
   * Форматирует число с локализацией (без валюты)
   */
  static formatNumber(value: number, fractionDigits = 2): string {
    return value.toLocaleString(this.getLocale(), {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits
    });
  }

  /**
   * Проверяет, что две даты относятся к одному дню
   */
  static isSameDay(date1: Date | number | string, date2: Date | number | string): boolean {
    const d1 = this.normalizeDate(date1);
    const d2 = this.normalizeDate(date2);
    
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  /**
   * Получить относительное время ("вчера", "сегодня", "завтра")
   */
  static getRelativeDay(date: Date | number | string): string {
    const dateObj = this.normalizeDate(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (this.isSameDay(dateObj, today)) {
      return 'сегодня';
    } else if (this.isSameDay(dateObj, yesterday)) {
      return 'вчера';
    } else if (this.isSameDay(dateObj, tomorrow)) {
      return 'завтра';
    } else {
      return this.formatDate(dateObj);
    }
  }

  /**
   * Приводит различные форматы даты к объекту Date
   */
  private static normalizeDate(date: Date | number | string): Date {
    if (date instanceof Date) {
      return date;
    } else if (typeof date === 'number') {
      // Если это timestamp в секундах (меньше года 2100)
      if (date < 4102444800) {
        return new Date(date * 1000);
      }
      // Иначе это timestamp в миллисекундах
      return new Date(date);
    } else if (typeof date === 'string') {
      return new Date(date);
    } else {
      throw new Error(`Неподдерживаемый формат даты: ${typeof date}`);
    }
  }

  /**
   * Форматирует дату для HTML input[type="datetime-local"]
   */
  static formatForDateTimeInput(date: Date | number | string): string {
    const dateObj = this.normalizeDate(date);
    return dateObj.toISOString().slice(0, 16);
  }

  /**
   * Форматирует для Lightweight Charts timeFormatter
   */
  static formatForChart(time: number): string {
    const date = new Date(time * 1000);
    return date.toLocaleString(this.getLocale(), {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
}
