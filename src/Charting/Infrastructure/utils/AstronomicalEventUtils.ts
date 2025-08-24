export interface AstronomicalEvent {
  timestamp: number;
  name: string;
  description: string;
  type: string;
}

export interface ChartMarker {
  time: number;
  position: 'aboveBar' | 'belowBar' | 'inBar';
  color: string;
  text: string;
  size: number;
  eventData?: AstronomicalEvent; // Добавляем данные события
}

export class AstronomicalEventUtils {
  /**
   * Конвертирует астрономические события в маркеры для Lightweight Charts
   */
  static convertEventsToMarkers(events: AstronomicalEvent[]): ChartMarker[] {
    const markers = events
      .map((event) => {
        // Конвертируем timestamp в секунды (lightweight-charts ожидает секунды)
        const timeInSeconds = Math.floor(event.timestamp / 1000);
        
        // Выбираем иконку и цвет в зависимости от типа события
        const { text, color } = this.getEventIconAndColor(event);
        
        return {
          time: timeInSeconds as any, // Приведение типа для совместимости с lightweight-charts
          position: 'aboveBar' as const,
          color: color,
          text: text,
          size: 2, // Увеличенный размер для лучшей видимости
          eventData: event // Сохраняем данные события для ToolTip
        };
      })
      .filter(marker => marker.time > 0) // Фильтруем корректные временные метки
      .sort((a, b) => a.time - b.time); // Сортируем по времени

    return markers;
  }

  /**
   * Получает иконку и цвет для астрономического события
   */
  static getEventIconAndColor(event: AstronomicalEvent): { text: string; color: string } {
    let color = '#f7931a'; // Биткоин оранжевый по умолчанию
    let text = '';
    
    // Проверяем, что event.name существует
    if (!event.name) {
      console.warn('[AstronomicalEventUtils] Событие без имени:', event);
      return { text: '❓', color: '#6b7280' }; // Возвращаем fallback иконку
    }
    
    switch (event.type) {
      case 'moon_phase':
        if (event.name.includes('Полнолуние')) {
          text = '🌕'; // Полнолуние
          color = '#fbbf24'; // Золотистый
        } else if (event.name.includes('Новолуние')) {
          text = '🌑'; // Новолуние
          color = '#6b7280'; // Серый
        } else if (event.name.includes('Первая четверть')) {
          text = '🌓'; // Первая четверть
          color = '#94a3b8'; // Светло-серый
        } else if (event.name.includes('Последняя четверть')) {
          text = '🌗'; // Последняя четверть
          color = '#64748b'; // Темно-серый
        } else {
          text = '🌙'; // Общая луна
          color = '#e2e8f0'; // Светло-серый
        }
        break;
        
      case 'planet_aspect':
        if (event.name.includes('Парад') || event.name.includes('парад')) {
          if (event.name.includes('Большой парад') || event.name.includes('7 планет')) {
            text = '🪐'; // Большой парад планет (Сатурн как символ)
            color = '#7c3aed'; // Фиолетовый
          } else if (event.name.includes('6 планет')) {
            text = '🌌'; // Парад 6 планет
            color = '#3b82f6'; // Синий
          } else if (event.name.includes('5 планет')) {
            text = '⭐'; // Парад 5 планет
            color = '#f59e0b'; // Янтарный
          } else {
            text = '✨'; // Мини-парад планет
            color = '#10b981'; // Зеленый
          }
        } else if (event.name.includes('Соединение')) {
          if (event.name.includes('Великое соединение') || event.name.includes('Юпитера и Сатурна')) {
            text = '🔗'; // Великое соединение
            color = '#dc2626'; // Красный
          } else if (event.name.includes('Юпитер')) {
            text = '♃'; // Символ Юпитера
            color = '#f59e0b'; // Оранжевый
          } else if (event.name.includes('Венер')) {
            text = '♀'; // Символ Венеры
            color = '#ec4899'; // Розовый
          } else if (event.name.includes('Марс')) {
            text = '♂'; // Символ Марса
            color = '#ef4444'; // Красный
          } else {
            text = '🔗'; // Обычное соединение
            color = '#6b7280'; // Серый
          }
        } else if (event.name.includes('Меркурий') || event.name.includes('Меркурия')) {
          text = '☿'; // Символ Меркурия
          color = '#8b5cf6'; // Фиолетовый
        } else if (event.name.includes('Венер')) {
          text = '♀'; // Символ Венеры
          color = '#ec4899'; // Розовый
        } else {
          text = '✨'; // Звезды для других планетарных аспектов
          color = '#06b6d4'; // Циан
        }
        break;
        
      case 'solar_event':
        if (event.name.includes('затмение')) {
          text = '🌒'; // Затмение
          color = '#dc2626'; // Красный
        } else if (event.name.includes('солнцестояние')) {
          text = '☀️'; // Солнце
          color = '#f59e0b'; // Янтарный
        } else if (event.name.includes('равноденствие')) {
          text = '⚖️'; // Равноденствие
          color = '#10b981'; // Зеленый
        } else if (event.name.includes('Геминиды') || event.name.includes('метеорный') || event.name.includes('Персеиды')) {
          text = '☄️'; // Метеор
          color = '#8b5cf6'; // Фиолетовый
        } else {
          text = '☉'; // Символ солнца
          color = '#eab308'; // Желтый
        }
        break;
        
      case 'lunar_eclipse':
        if (event.name.includes('Полное')) {
          text = '🔴'; // Полное лунное затмение (красная луна)
          color = '#dc2626'; // Красный
        } else if (event.name.includes('Частичное')) {
          text = '🟠'; // Частичное лунное затмение
          color = '#f59e0b'; // Оранжевый
        } else {
          text = '🟡'; // Полутеневое затмение
          color = '#fbbf24'; // Желтый
        }
        break;
        
      case 'solar_eclipse':
        if (event.name.includes('Полное')) {
          text = '🌑'; // Полное солнечное затмение
          color = '#000000'; // Черный
        } else if (event.name.includes('Кольцевое')) {
          text = '⭕'; // Кольцевое затмение
          color = '#dc2626'; // Красный
        } else if (event.name.includes('Гибридное')) {
          text = '🔄'; // Гибридное затмение
          color = '#7c3aed'; // Фиолетовый
        } else {
          text = '🌗'; // Частичное затмение
          color = '#f59e0b'; // Оранжевый
        }
        break;
        
      case 'comet_event':
        if (event.name.includes('Комета')) {
          if (event.name.includes('Leonard') || event.name.includes('ZTF') || event.name.includes('Цучинских')) {
            text = '☄️'; // Яркие известные кометы
            color = '#f59e0b'; // Оранжевый
          } else {
            text = '🌟'; // Обычные кометы
            color = '#06b6d4'; // Циан
          }
        } else if (event.name.includes('Астероид')) {
          text = '🪨'; // Астероиды
          color = '#6b7280'; // Серый
        } else {
          text = '✨'; // Космические объекты
          color = '#8b5cf6'; // Фиолетовый
        }
        break;
        
      case 'meteor_shower':
        if (event.name.includes('Квадрантиды')) {
          text = '⭐'; // Квадрантиды - один из лучших потоков
          color = '#fbbf24'; // Золотистый
        } else if (event.name.includes('Персеиды')) {
          text = '☄️'; // Персеиды - самый известный поток
          color = '#f59e0b'; // Оранжевый
        } else if (event.name.includes('Геминиды')) {
          text = '💎'; // Геминиды - лучший поток года
          color = '#06b6d4'; // Циан
        } else if (event.name.includes('Дракониды') && event.description.includes('400')) {
          text = '🐉'; // Дракониды с всплеском активности
          color = '#dc2626'; // Красный для исключительного события
        } else if (event.name.includes('Лириды')) {
          text = '🎵'; // Лириды (от созвездия Лиры)
          color = '#a855f7'; // Фиолетовый
        } else if (event.name.includes('Леониды')) {
          text = '🦁'; // Леониды (от созвездия Льва)
          color = '#f59e0b'; // Янтарный
        } else if (event.name.includes('Ориониды')) {
          text = '🏹'; // Ориониды (от созвездия Ориона-охотника)
          color = '#10b981'; // Зеленый
        } else if (event.name.includes('Аквариды')) {
          text = '🌊'; // Аквариды (от созвездия Водолея)
          color = '#3b82f6'; // Синий
        } else if (event.name.includes('Каприкорниды')) {
          text = '🐐'; // Каприкорниды (от созвездия Козерога)
          color = '#6b7280'; // Серый
        } else if (event.name.includes('Урсиды')) {
          text = '🐻'; // Урсиды (от созвездия Малой Медведицы)
          color = '#8b5cf6'; // Фиолетовый
        } else {
          text = '☄️'; // Общий метеор
          color = '#8b5cf6'; // Фиолетовый
        }
        break;
        
      default:
        text = '⭐'; // Звезда по умолчанию
        color = '#f7931a';
    }

    return { text, color };
  }

  /**
   * Фильтрует события по активным фильтрам
   */
  static filterEventsByType(
    events: AstronomicalEvent[],
    filters: {
      lunar?: boolean;
      solar?: boolean;
      planetary?: boolean;
      meteor?: boolean;
    }
  ): AstronomicalEvent[] {
    return events.filter(event => {
      switch (event.type) {
        case 'moon_phase':
        case 'lunar_eclipse':
          return filters.lunar !== false;
        case 'solar_event':
        case 'solar_eclipse':
          return filters.solar !== false;
        case 'planet_aspect':
        case 'comet_event':
          return filters.planetary !== false;
        case 'meteor_shower':
          return filters.meteor !== false;
        default:
          return true;
      }
    });
  }

  /**
   * Дедуплицирует события по timestamp и name
   */
  static deduplicateEvents(events: AstronomicalEvent[]): AstronomicalEvent[] {
    return events.filter((event, index, array) => {
      return array.findIndex(e => 
        e.timestamp === event.timestamp && 
        e.name === event.name
      ) === index;
    });
  }

  /**
   * Находит максимальную дату среди астрономических событий
   */
  static getMaxEventTime(events: AstronomicalEvent[]): number {
    if (events.length === 0) return 0;
    return Math.max(...events.map(event => Math.floor(event.timestamp / 1000)));
  }

  /**
   * Создает tooltip данные для астрономического события
   */
  static createTooltipData(
    event: AstronomicalEvent,
    mouseX: number,
    mouseY: number
  ): {
    x: number;
    y: number;
    title: string;
    description: string;
    visible: boolean;
  } {
    return {
      x: mouseX,
      y: mouseY,
      title: event.name,
      description: event.description,
      visible: true
    };
  }

  /**
   * Группирует события по временным меткам с учетом таймфрейма
   */
  static groupEventsByTime(
    events: AstronomicalEvent[],
    timeframe: string
  ): Map<number, AstronomicalEvent[]> {
    const groupedEvents = new Map<number, AstronomicalEvent[]>();
    
    events.forEach(event => {
      const timeInSeconds = Math.floor(event.timestamp / 1000);
      const groupedTime = this.getGroupedTime(timeInSeconds, timeframe);
      
      if (!groupedEvents.has(groupedTime)) {
        groupedEvents.set(groupedTime, []);
      }
      groupedEvents.get(groupedTime)!.push(event);
    });
    
    return groupedEvents;
  }

  /**
   * Получает сгруппированное время для данного таймфрейма
   */
  private static getGroupedTime(timeInSeconds: number, timeframe: string): number {
    const date = new Date(timeInSeconds * 1000);
    
    switch (timeframe) {
      case '1h':
        // Группируем по часам
        date.setMinutes(0, 0, 0);
        break;
      case '8h':
        // Группируем по 8-часовым блокам
        const hour = date.getHours();
        const blockHour = Math.floor(hour / 8) * 8;
        date.setHours(blockHour, 0, 0, 0);
        break;
      case '1d':
        // Группируем по дням
        date.setHours(0, 0, 0, 0);
        break;
      case '1w':
        // Группируем по неделям (начало недели)
        const dayOfWeek = date.getDay();
        const daysToSubtract = dayOfWeek === 0 ? 0 : dayOfWeek;
        date.setDate(date.getDate() - daysToSubtract);
        date.setHours(0, 0, 0, 0);
        break;
      case '1M':
        // Группируем по месяцам (начало месяца)
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        break;
      default:
        // По умолчанию группируем по дням
        date.setHours(0, 0, 0, 0);
    }
    
    return Math.floor(date.getTime() / 1000);
  }

  /**
   * Находит все события на заданной временной метке
   */
  static findEventsAtTime(
    events: AstronomicalEvent[],
    timeInSeconds: number,
    timeframe: string
  ): AstronomicalEvent[] {
    console.log('[AstronomicalEventUtils] 🔍 findEventsAtTime called:', {
      eventsCount: events.length,
      timeInSeconds,
      timeISO: new Date(timeInSeconds * 1000).toISOString(),
      timeframe
    });

    const groupedTime = this.getGroupedTime(timeInSeconds, timeframe);
    const groupedEvents = this.groupEventsByTime(events, timeframe);
    
    console.log('[AstronomicalEventUtils] 📊 Grouping results:', {
      groupedTime,
      groupedTimeISO: new Date(groupedTime * 1000).toISOString(),
      groupedEventsKeys: Array.from(groupedEvents.keys()).map(k => new Date(k * 1000).toISOString()),
      foundEvents: groupedEvents.get(groupedTime) || []
    });
    
    return groupedEvents.get(groupedTime) || [];
  }

  /**
   * Создает tooltip данные для стэка событий
   */
  static createStackedTooltipData(
    events: AstronomicalEvent[],
    mouseX: number,
    mouseY: number
  ): {
    x: number;
    y: number;
    events: AstronomicalEvent[];
    visible: boolean;
  } {
    return {
      x: mouseX,
      y: mouseY,
      events: events.sort((a, b) => a.name.localeCompare(b.name)), // Сортируем по алфавиту
      visible: true
    };
  }
} 