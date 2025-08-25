import { AstronomicalDataLoader } from './astronomicalDataLoader';

export interface AstronomicalEvent {
  timestamp: number;
  type: 'moon_phase' | 'planet_aspect' | 'solar_event' | 'lunar_eclipse' | 'solar_eclipse' | 'comet_event' | 'meteor_shower';
  name: string;
  description: string;
  significance: 'low' | 'medium' | 'high';
  price?: number; // For chart overlay
  constellation?: string;
  icon?: string;
}

export class AstronomicalEventsService {
  /**
   * Получить астрономические события для заданного периода
   */
  getEventsForPeriod(startDate: Date, endDate: Date): AstronomicalEvent[] {
    const events: AstronomicalEvent[] = [];
    
    try {
      // Получаем события из JSON файлов через загрузчик
      const jsonEvents = AstronomicalDataLoader.getEventsForPeriod(startDate, endDate);
      
      // Конвертируем JSON события в формат AstronomicalEvent
      jsonEvents.forEach((jsonEvent: any) => {
        const eventName = jsonEvent.name || 'Неизвестное событие';
        
        const event: AstronomicalEvent = {
          timestamp: new Date(jsonEvent.date).getTime(),
          type: this.mapJsonTypeToEventType(jsonEvent.type || ''),
          name: eventName,
          description: jsonEvent.description || '',
          significance: (jsonEvent.significance as 'low' | 'medium' | 'high') || 'medium',
          constellation: jsonEvent.constellation,
          icon: jsonEvent.icon
        };
        events.push(event);
      });

    } catch (error) {
      console.error('[AstronomicalEvents] Ошибка загрузки событий из JSON:', error);
      
      // Fallback на старые данные если JSON не загрузился
      events.push(...this.getFallbackEvents(startDate, endDate));
    }

    return events.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Получить фазу луны для конкретной даты (упрощенная версия)
   */
  getMoonPhaseForDate(date: Date): string {
    try {
      // Упрощенный расчет на основе известного цикла
      const lunarCycle = 29.53; // дней
      const knownNewMoon = new Date('2024-12-30').getTime(); // известное новолуние
      
      const daysSinceNewMoon = (date.getTime() - knownNewMoon) / (1000 * 60 * 60 * 24);
      const phasePosition = (daysSinceNewMoon % lunarCycle) / lunarCycle;
      
      if (phasePosition < 0.125) return '🌑 Новолуние';
      if (phasePosition < 0.875) return '🌕 Полнолуние';
      return '🌑 Новолуние';
      
    } catch (error) {
      console.error('[AstronomicalEvents] Ошибка определения фазы луны:', error);
      return '🌙 Неизвестно';
    }
  }

  /**
   * Получить статистику по событиям
   */
  getEventStatistics(): Record<string, number> {
    try {
      return AstronomicalDataLoader.getEventStatistics();
    } catch (error) {
      console.error('[AstronomicalEvents] Ошибка получения статистики:', error);
      return {};
    }
  }

  /**
   * Получить общее количество событий
   */
  getTotalEventCount(): number {
    try {
      return AstronomicalDataLoader.getTotalEventCount();
    } catch (error) {
      console.error('[AstronomicalEvents] Ошибка подсчета событий:', error);
      return 0;
    }
  }

  /**
   * Получить события по типу
   */
  getEventsByType(type: string): AstronomicalEvent[] {
    try {
      const jsonEvents = AstronomicalDataLoader.getEventsByType(type);
      return jsonEvents.map((jsonEvent: any) => {
        const eventName = jsonEvent.name || 'Неизвестное событие';
        
        return {
          timestamp: new Date(jsonEvent.date).getTime(),
          type: this.mapJsonTypeToEventType(type),
          name: eventName,
          description: jsonEvent.description || '',
          significance: (jsonEvent.significance as 'low' | 'medium' | 'high') || 'medium',
          constellation: jsonEvent.constellation,
          icon: jsonEvent.icon
        };
      });
    } catch (error) {
      console.error('[AstronomicalEvents] Ошибка получения событий по типу:', error);
      return [];
    }
  }

  /**
   * Получить события по значимости
   */
  getEventsBySignificance(significance: 'low' | 'medium' | 'high'): AstronomicalEvent[] {
    try {
      const jsonEvents = AstronomicalDataLoader.getEventsBySignificance(significance);
      return jsonEvents.map((jsonEvent: any) => {
        const eventName = jsonEvent.name || 'Неизвестное событие';
        
        return {
          timestamp: new Date(jsonEvent.date).getTime(),
          type: this.mapJsonTypeToEventType(jsonEvent.type || 'moon_phase'),
          name: eventName,
          description: jsonEvent.description || '',
          significance: (jsonEvent.significance as 'low' | 'medium' | 'high') || 'medium',
          constellation: jsonEvent.constellation,
          icon: jsonEvent.icon
        };
      });
    } catch (error) {
      console.error('[AstronomicalEvents] Ошибка получения событий по значимости:', error);
      return [];
    }
  }

  /**
   * Получить события по категории
   */
  getEventsByCategory(category: string): AstronomicalEvent[] {
    try {
      const jsonEvents = AstronomicalDataLoader.getEventsByCategory(category);
      return jsonEvents.map((jsonEvent: any) => {
        const eventName = jsonEvent.name || 'Неизвестное событие';
        
        return {
          timestamp: new Date(jsonEvent.date).getTime(),
          type: this.mapJsonTypeToEventType(jsonEvent.type || 'moon_phase'),
          name: eventName,
          description: jsonEvent.description || '',
          significance: (jsonEvent.significance as 'low' | 'medium' | 'high') || 'medium',
          constellation: jsonEvent.constellation,
          icon: jsonEvent.icon
        };
      });
    } catch (error) {
      console.error('[AstronomicalEvents] Ошибка получения событий по категории:', error);
      return [];
    }
  }

  /**
   * Маппинг типа из JSON в тип события
   */
  private mapJsonTypeToEventType(jsonType: string): AstronomicalEvent['type'] {
    switch (jsonType) {
      case 'moon_phase':
        return 'moon_phase';
      case 'planet_aspect':
        return 'planet_aspect';
      case 'solar_event':
        return 'solar_event';
      case 'lunar_eclipse':
        return 'lunar_eclipse';
      case 'solar_eclipse':
        return 'solar_eclipse';
      case 'comet_event':
        return 'comet_event';
      case 'meteor_shower':
        return 'meteor_shower';
      default:
        return 'moon_phase';
    }
  }

  /**
   * Fallback события если JSON не загрузился
   */
  private getFallbackEvents(startDate: Date, endDate: Date): AstronomicalEvent[] {
    const events: AstronomicalEvent[] = [];
    
    // Добавляем базовые лунные фазы как fallback
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const phase = this.getMoonPhaseForDate(currentDate);
      if (phase.includes('Новолуние') || phase.includes('Полнолуние')) {
        events.push({
          timestamp: currentDate.getTime(),
          type: 'moon_phase',
          name: phase.includes('Новолуние') ? 'Новолуние' : 'Полнолуние',
          description: phase,
          significance: 'high'
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return events;
  }
}

export const astronomicalEventsService = new AstronomicalEventsService(); 