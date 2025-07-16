export interface AstronomicalEvent {
  timestamp: number;
  type: 'moon_phase' | 'planet_aspect' | 'solar_event';
  name: string;
  description: string;
  significance: 'low' | 'medium' | 'high';
  price?: number; // For chart overlay
}

export class AstronomicalEventsService {
  /**
   * Получить астрономические события для заданного периода
   */
  getEventsForPeriod(startDate: Date, endDate: Date): AstronomicalEvent[] {
    const events: AstronomicalEvent[] = [];
    
    // Добавляем лунные фазы
    events.push(...this.getMoonPhases(startDate, endDate));
    
    // Добавляем планетарные аспекты (упрощенная версия)
    events.push(...this.getPlanetaryEvents(startDate, endDate));
    
    // Добавляем солнечные события
    events.push(...this.getSolarEvents(startDate, endDate));
    
    return events.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Рассчитать фазы луны для периода (упрощенная версия)
   */
  private getMoonPhases(startDate: Date, endDate: Date): AstronomicalEvent[] {
    const events: AstronomicalEvent[] = [];
    
    try {
      // Известные фазы луны на 2024-2025 (в качестве примера)
      const knownMoonPhases = [
        // Декабрь 2024
        { date: new Date('2024-12-01'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2024-12-08'), phase: 'Первая четверть', significance: 'medium' as const },
        { date: new Date('2024-12-15'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2024-12-22'), phase: 'Последняя четверть', significance: 'medium' as const },
        { date: new Date('2024-12-30'), phase: 'Новолуние', significance: 'high' as const },
        // Январь 2025
        { date: new Date('2025-01-06'), phase: 'Первая четверть', significance: 'medium' as const },
        { date: new Date('2025-01-13'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2025-01-21'), phase: 'Последняя четверть', significance: 'medium' as const },
        { date: new Date('2025-01-29'), phase: 'Новолуние', significance: 'high' as const },
        // Февраль 2025
        { date: new Date('2025-02-05'), phase: 'Первая четверть', significance: 'medium' as const },
        { date: new Date('2025-02-12'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2025-02-20'), phase: 'Последняя четверть', significance: 'medium' as const },
        { date: new Date('2025-02-28'), phase: 'Новолуние', significance: 'high' as const },
        // Март 2025
        { date: new Date('2025-03-06'), phase: 'Первая четверть', significance: 'medium' as const },
        { date: new Date('2025-03-14'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2025-03-22'), phase: 'Последняя четверть', significance: 'medium' as const },
        { date: new Date('2025-03-29'), phase: 'Новолуние', significance: 'high' as const },
      ];

      knownMoonPhases.forEach(moonPhase => {
        if (moonPhase.date >= startDate && moonPhase.date <= endDate) {
          events.push({
            timestamp: moonPhase.date.getTime(),
            type: 'moon_phase',
            name: moonPhase.phase,
            description: moonPhase.phase === 'Полнолуние' 
              ? 'Полная луна - пик эмоциональной энергии, возможны сильные движения рынка'
              : 'Новая луна - время для новых начинаний, часто начало новых трендов',
            significance: moonPhase.significance
          });
        }
      });

    } catch (error) {
      console.error('[AstronomicalEvents] Ошибка расчета лунных фаз:', error);
    }

    return events;
  }

  /**
   * Получить упрощенные планетарные события
   */
  private getPlanetaryEvents(startDate: Date, endDate: Date): AstronomicalEvent[] {
    const events: AstronomicalEvent[] = [];
    
    // Известные ретроградности Меркурия и другие важные события
    const planetaryEvents = [
      { 
        date: new Date('2024-12-13'), 
        name: 'Начало ретроградного Меркурия', 
        description: 'Период осторожности в коммуникациях и технологиях. Возможны технические сбои.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2025-01-01'), 
        name: 'Конец ретроградного Меркурия', 
        description: 'Меркурий возвращается к прямому движению. Улучшение коммуникаций.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2025-04-01'), 
        name: 'Начало ретроградного Меркурия', 
        description: 'Новый период осторожности в технологиях и коммуникациях.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2025-04-25'), 
        name: 'Конец ретроградного Меркурия', 
        description: 'Меркурий возвращается к прямому движению.',
        significance: 'medium' as const
      }
    ];

    planetaryEvents.forEach(event => {
      if (event.date >= startDate && event.date <= endDate) {
        events.push({
          timestamp: event.date.getTime(),
          type: 'planet_aspect',
          name: event.name,
          description: event.description,
          significance: event.significance
        });
      }
    });

    return events;
  }

  /**
   * Получить солнечные события (солнцестояния, равноденствия, затмения)
   */
  private getSolarEvents(startDate: Date, endDate: Date): AstronomicalEvent[] {
    const events: AstronomicalEvent[] = [];
    
    // Известные солнечные события на 2024-2025
    const solarEvents = [
      { 
        date: new Date('2024-12-21'), 
        name: 'Зимнее солнцестояние', 
        description: 'Самый короткий день в году. Начало зимы.',
        significance: 'high' as const
      },
      { 
        date: new Date('2025-03-20'), 
        name: 'Весеннее равноденствие', 
        description: 'День равен ночи. Начало весны.',
        significance: 'high' as const
      },
      { 
        date: new Date('2025-06-21'), 
        name: 'Летнее солнцестояние', 
        description: 'Самый длинный день в году. Начало лета.',
        significance: 'high' as const
      },
      { 
        date: new Date('2025-09-23'), 
        name: 'Осеннее равноденствие', 
        description: 'День равен ночи. Начало осени.',
        significance: 'high' as const
      },
      { 
        date: new Date('2024-12-14'), 
        name: 'Геминиды (метеорный поток)', 
        description: 'Пик метеорного потока Геминиды - до 120 метеоров в час.',
        significance: 'medium' as const
      },
    ];

    solarEvents.forEach(event => {
      if (event.date >= startDate && event.date <= endDate) {
        events.push({
          timestamp: event.date.getTime(),
          type: 'solar_event',
          name: event.name,
          description: event.description,
          significance: event.significance
        });
      }
    });

    return events;
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
      
      if (phasePosition < 0.1 || phasePosition > 0.9) return '🌑 Новолуние';
      if (phasePosition < 0.3) return '🌒 Растущая луна';
      if (phasePosition < 0.6) return '🌕 Полнолуние';
      return '🌘 Убывающая луна';
      
    } catch (error) {
      console.error('[AstronomicalEvents] Ошибка определения фазы луны:', error);
      return '🌙 Неизвестно';
    }
  }
}

export const astronomicalEventsService = new AstronomicalEventsService(); 