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
      // Расширенные лунные фазы 2022-2027 (исторические данные + прогнозы)
      const knownMoonPhases = [
        // 2022 (исторические данные)
        { date: new Date('2022-01-02'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2022-01-17'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2022-02-01'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2022-02-16'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2022-03-02'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2022-03-18'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2022-04-01'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2022-04-16'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2022-06-14'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2022-07-13'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2022-08-12'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2022-09-10'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2022-10-09'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2022-11-08'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2022-12-08'), phase: 'Полнолуние', significance: 'high' as const },
        
        // 2023 (исторические данные)
        { date: new Date('2023-01-06'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2023-01-21'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2023-02-05'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2023-02-20'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2023-03-07'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2023-03-21'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2023-04-06'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2023-04-20'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2023-05-05'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2023-05-19'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2023-06-04'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2023-06-18'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2023-07-03'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2023-07-17'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2023-08-01'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2023-08-16'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2023-08-31'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2023-09-15'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2023-09-29'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2023-10-14'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2023-10-28'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2023-11-13'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2023-11-27'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2023-12-12'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2023-12-27'), phase: 'Полнолуние', significance: 'high' as const },
        
        // 2024 (текущий год)
        { date: new Date('2024-01-11'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2024-01-25'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2024-02-09'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2024-02-24'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2024-03-10'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2024-03-25'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2024-04-08'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2024-04-23'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2024-05-08'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2024-05-23'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2024-06-06'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2024-06-22'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2024-07-05'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2024-07-21'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2024-08-04'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2024-08-19'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2024-09-03'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2024-09-18'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2024-10-02'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2024-10-17'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2024-11-01'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2024-11-15'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2024-12-01'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2024-12-15'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2024-12-30'), phase: 'Новолуние', significance: 'high' as const },
        
        // 2025 (прогнозы)
        { date: new Date('2025-01-13'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2025-01-29'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2025-02-12'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2025-02-28'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2025-03-14'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2025-03-29'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2025-04-13'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2025-04-27'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2025-05-12'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2025-05-27'), phase: 'Новолуние', significance: 'high' as const },
        
        // 2025 прогноз - вторая половина года
        { date: new Date('2025-06-11'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2025-06-25'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2025-07-10'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2025-07-24'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2025-08-09'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2025-08-23'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2025-09-07'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2025-09-21'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2025-10-07'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2025-10-21'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2025-11-05'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2025-11-20'), phase: 'Новолуние', significance: 'high' as const },
        { date: new Date('2025-12-05'), phase: 'Полнолуние', significance: 'high' as const },
        { date: new Date('2025-12-19'), phase: 'Новолуние', significance: 'high' as const },
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
    
    // Расширенные планетарные события 2022-2027
    const planetaryEvents = [
      // 2022-2023 (исторические ретроградности Меркурия)
      { 
        date: new Date('2022-01-14'), 
        name: 'Начало ретроградного Меркурия', 
        description: 'Период осторожности в коммуникациях и технологиях.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2022-05-10'), 
        name: 'Начало ретроградного Меркурия', 
        description: 'Период осторожности в коммуникациях и технологиях.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2022-09-09'), 
        name: 'Начало ретроградного Меркурия', 
        description: 'Период осторожности в коммуникациях и технологиях.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2023-04-21'), 
        name: 'Начало ретроградного Меркурия', 
        description: 'Период осторожности в коммуникациях и технологиях.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2023-08-23'), 
        name: 'Начало ретроградного Меркурия', 
        description: 'Период осторожности в коммуникациях и технологиях.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2023-12-13'), 
        name: 'Начало ретроградного Меркурия', 
        description: 'Период осторожности в коммуникациях и технологиях.',
        significance: 'medium' as const
      },
      
      // 2024 (текущий год)
      { 
        date: new Date('2024-04-01'), 
        name: 'Начало ретроградного Меркурия', 
        description: 'Период осторожности в коммуникациях и технологиях.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2024-08-05'), 
        name: 'Начало ретроградного Меркурия', 
        description: 'Период осторожности в коммуникациях и технологиях.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2024-11-25'), 
        name: 'Начало ретроградного Меркурия', 
        description: 'Период осторожности в коммуникациях и технологиях.',
        significance: 'medium' as const
      },
      
      // 2025 (прогнозы)
      { 
        date: new Date('2025-03-15'), 
        name: 'Начало ретроградного Меркурия', 
        description: 'Период осторожности в коммуникациях и технологиях.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2025-07-18'), 
        name: 'Начало ретроградного Меркурия', 
        description: 'Период осторожности в коммуникациях и технологиях.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2025-11-09'), 
        name: 'Начало ретроградного Меркурия', 
        description: 'Период осторожности в коммуникациях и технологиях.',
        significance: 'medium' as const
      },
      
      // Ретроградности Венеры (реже, но важнее)
      { 
        date: new Date('2023-07-22'), 
        name: 'Начало ретроградной Венеры', 
        description: 'Период переосмысления отношений и финансов. Влияние на рынки красоты и роскоши.',
        significance: 'high' as const
      },
      { 
        date: new Date('2025-03-02'), 
        name: 'Начало ретроградной Венеры', 
        description: 'Период переосмысления отношений и финансов. Возможная волатильность на рынках.',
        significance: 'high' as const
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
    
    // Расширенные солнечные события 2022-2027
    const solarEvents = [
      // 2022 (исторические данные)
      { 
        date: new Date('2022-03-20'), 
        name: 'Весеннее равноденствие', 
        description: 'День равен ночи. Начало весны.',
        significance: 'high' as const
      },
      { 
        date: new Date('2022-06-21'), 
        name: 'Летнее солнцестояние', 
        description: 'Самый длинный день в году. Начало лета.',
        significance: 'high' as const
      },
      { 
        date: new Date('2022-09-23'), 
        name: 'Осеннее равноденствие', 
        description: 'День равен ночи. Начало осени.',
        significance: 'high' as const
      },
      { 
        date: new Date('2022-12-21'), 
        name: 'Зимнее солнцестояние', 
        description: 'Самый короткий день в году. Начало зимы.',
        significance: 'high' as const
      },
      
      // 2023 (исторические данные)
      { 
        date: new Date('2023-03-20'), 
        name: 'Весеннее равноденствие', 
        description: 'День равен ночи. Начало весны.',
        significance: 'high' as const
      },
      { 
        date: new Date('2023-06-21'), 
        name: 'Летнее солнцестояние', 
        description: 'Самый длинный день в году. Начало лета.',
        significance: 'high' as const
      },
      { 
        date: new Date('2023-09-23'), 
        name: 'Осеннее равноденствие', 
        description: 'День равен ночи. Начало осени.',
        significance: 'high' as const
      },
      { 
        date: new Date('2023-12-22'), 
        name: 'Зимнее солнцестояние', 
        description: 'Самый короткий день в году. Начало зимы.',
        significance: 'high' as const
      },
      
      // 2024 (текущий год)
      { 
        date: new Date('2024-03-20'), 
        name: 'Весеннее равноденствие', 
        description: 'День равен ночи. Начало весны.',
        significance: 'high' as const
      },
      { 
        date: new Date('2024-06-20'), 
        name: 'Летнее солнцестояние', 
        description: 'Самый длинный день в году. Начало лета.',
        significance: 'high' as const
      },
      { 
        date: new Date('2024-09-22'), 
        name: 'Осеннее равноденствие', 
        description: 'День равен ночи. Начало осени.',
        significance: 'high' as const
      },
      { 
        date: new Date('2024-12-21'), 
        name: 'Зимнее солнцестояние', 
        description: 'Самый короткий день в году. Начало зимы.',
        significance: 'high' as const
      },
      { 
        date: new Date('2024-12-14'), 
        name: 'Геминиды (метеорный поток)', 
        description: 'Пик метеорного потока Геминиды - до 120 метеоров в час.',
        significance: 'medium' as const
      },
      
      // 2025 (прогнозы)
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
        date: new Date('2025-12-21'), 
        name: 'Зимнее солнцестояние', 
        description: 'Самый короткий день в году. Начало зимы.',
        significance: 'high' as const
      },
      { 
        date: new Date('2025-08-12'), 
        name: 'Персеиды (метеорный поток)', 
        description: 'Пик метеорного потока Персеиды - до 100 метеоров в час.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2025-12-14'), 
        name: 'Геминиды (метеорный поток)', 
        description: 'Пик метеорного потока Геминиды - до 120 метеоров в час.',
        significance: 'medium' as const
      },
      
      // 2026 (прогнозы)
      { 
        date: new Date('2026-03-20'), 
        name: 'Весеннее равноденствие', 
        description: 'День равен ночи. Начало весны.',
        significance: 'high' as const
      },
      { 
        date: new Date('2026-06-21'), 
        name: 'Летнее солнцестояние', 
        description: 'Самый длинный день в году. Начало лета.',
        significance: 'high' as const
      },
      { 
        date: new Date('2026-09-23'), 
        name: 'Осеннее равноденствие', 
        description: 'День равен ночи. Начало осени.',
        significance: 'high' as const
      },
      { 
        date: new Date('2026-12-21'), 
        name: 'Зимнее солнцестояние', 
        description: 'Самый короткий день в году. Начало зимы.',
        significance: 'high' as const
      },
      
      // 2027 (прогнозы)
      { 
        date: new Date('2027-03-20'), 
        name: 'Весеннее равноденствие', 
        description: 'День равен ночи. Начало весны.',
        significance: 'high' as const
      },
      { 
        date: new Date('2027-06-21'), 
        name: 'Летнее солнцестояние', 
        description: 'Самый длинный день в году. Начало лета.',
        significance: 'high' as const
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