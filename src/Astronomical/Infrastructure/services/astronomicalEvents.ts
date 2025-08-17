export interface AstronomicalEvent {
  timestamp: number;
  type: 'moon_phase' | 'planet_aspect' | 'solar_event' | 'lunar_eclipse' | 'solar_eclipse' | 'comet_event' | 'meteor_shower';
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
    
    // Добавляем лунные затмения
    events.push(...this.getLunarEclipses(startDate, endDate));
    
    // Добавляем солнечные затмения
    events.push(...this.getSolarEclipses(startDate, endDate));
    
    // Добавляем события комет
    events.push(...this.getCometEvents(startDate, endDate));
    
    // Добавляем метеорные потоки
    events.push(...this.getMeteorShowers(startDate, endDate));
    
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
      // Ошибка расчета лунных фаз
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
      },
      
      // Парады планет (выравнивания) 2022-2027
      { 
        date: new Date('2022-06-24'), 
        name: 'Парад 5 планет', 
        description: 'Выравнивание Меркурия, Венеры, Марса, Юпитера и Сатурна. Редкое астрономическое явление.',
        significance: 'high' as const
      },
      { 
        date: new Date('2023-03-28'), 
        name: 'Мини-парад планет', 
        description: 'Выравнивание Венеры, Марса, Юпитера и Урана в созвездии Овна.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2024-04-20'), 
        name: 'Парад 4 планет', 
        description: 'Выравнивание Венеры, Марса, Юпитера и Сатурна. Видимо невооруженным глазом.',
        significance: 'high' as const
      },
      { 
        date: new Date('2024-08-28'), 
        name: 'Парад 6 планет', 
        description: 'Большой парад: Меркурий, Венера, Марс, Юпитер, Сатурн и Нептун в одном секторе неба.',
        significance: 'high' as const
      },
      { 
        date: new Date('2025-01-21'), 
        name: 'Парад планет в Водолее', 
        description: 'Выравнивание 6 планет в созвездии Водолея - астрологически значимое событие.',
        significance: 'high' as const
      },
      { 
        date: new Date('2025-02-28'), 
        name: 'Мини-парад планет', 
        description: 'Выравнивание Венеры, Марса, Юпитера и Сатурна перед рассветом.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2025-08-11'), 
        name: 'Парад 6 планет', 
        description: 'Большое выравнивание всех внутренних планет и газовых гигантов.',
        significance: 'high' as const
      },
      { 
        date: new Date('2026-05-06'), 
        name: 'Мини-парад планет', 
        description: 'Выравнивание Меркурия, Венеры, Марса и Юпитера в вечернем небе.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2027-02-19'), 
        name: 'Парад 5 планет', 
        description: 'Выравнивание Меркурия, Венеры, Марса, Юпитера и Сатурна в созвездии Рыб.',
        significance: 'high' as const
      },
      { 
        date: new Date('2027-06-29'), 
        name: 'Большой парад планет', 
        description: 'Выравнивание 7 планет включая Уран - самое значимое событие десятилетия.',
        significance: 'high' as const
      },
      
      // Соединения планет (наиболее значимые)
      { 
        date: new Date('2022-05-01'), 
        name: 'Соединение Юпитера и Венеры', 
        description: 'Великое соединение двух ярчайших планет. Влияние на финансовые рынки.',
        significance: 'high' as const
      },
      { 
        date: new Date('2023-03-02'), 
        name: 'Соединение Венеры и Юпитера', 
        description: 'Соединение планет изобилия и красоты. Благоприятно для рынков роскоши.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2024-08-27'), 
        name: 'Соединение Марса и Юпитера', 
        description: 'Энергичное соединение планет действия и расширения. Влияние на энергетические рынки.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2025-01-18'), 
        name: 'Соединение Марса и Нептуна', 
        description: 'Мистическое соединение планет иллюзий и действия. Возможная неопределенность рынков.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2026-12-20'), 
        name: 'Великое соединение Юпитера и Сатурна', 
        description: 'Редкое великое соединение социальных планет. Происходит раз в 20 лет. Смена экономических циклов.',
        significance: 'high' as const
      },
      { 
        date: new Date('2027-04-11'), 
        name: 'Соединение Венеры и Сатурна', 
        description: 'Строгое соединение планет красоты и ограничений. Возможная коррекция рынков роскоши.',
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
      return '🌙 Неизвестно';
    }
  }

  /**
   * Получить лунные затмения
   */
  private getLunarEclipses(startDate: Date, endDate: Date): AstronomicalEvent[] {
    const events: AstronomicalEvent[] = [];
    
    // Реальные лунные затмения 2022-2027 (астрономические данные)
    const lunarEclipses = [
      // 2022 (прошедшие)
      { 
        date: new Date('2022-05-16'), 
        name: 'Полное лунное затмение', 
        description: 'Полное лунное затмение, видимое в Америке, Европе и Африке. Луна "кровавая".',
        significance: 'high' as const
      },
      { 
        date: new Date('2022-11-08'), 
        name: 'Полное лунное затмение', 
        description: 'Полное лунное затмение, видимое в Азии, Австралии и Тихом океане.',
        significance: 'high' as const
      },
      
      // 2023 (прошедшие)
      { 
        date: new Date('2023-05-05'), 
        name: 'Полутеневое лунное затмение', 
        description: 'Полутеневое лунное затмение, видимое в Азии и Австралии.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2023-10-28'), 
        name: 'Частичное лунное затмение', 
        description: 'Частичное лунное затмение, видимое в Европе, Азии и Австралии.',
        significance: 'high' as const
      },
      
      // 2024 (текущий год)
      { 
        date: new Date('2024-03-25'), 
        name: 'Полутеневое лунное затмение', 
        description: 'Полутеневое лунное затмение, видимое в Америке.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2024-09-18'), 
        name: 'Частичное лунное затмение', 
        description: 'Частичное лунное затмение, видимое в Америке и Тихом океане.',
        significance: 'high' as const
      },
      
      // 2025 (будущие прогнозы)
      { 
        date: new Date('2025-03-14'), 
        name: 'Полное лунное затмение', 
        description: 'Полное лунное затмение, видимое в Тихом океане и Америке.',
        significance: 'high' as const
      },
      { 
        date: new Date('2025-09-07'), 
        name: 'Полное лунное затмение', 
        description: 'Полное лунное затмение, видимое в Европе, Африке и Азии.',
        significance: 'high' as const
      },
      
      // 2026 (будущие прогнозы)
      { 
        date: new Date('2026-03-03'), 
        name: 'Полное лунное затмение', 
        description: 'Полное лунное затмение, видимое в Азии и Австралии.',
        significance: 'high' as const
      },
      { 
        date: new Date('2026-08-28'), 
        name: 'Частичное лунное затмение', 
        description: 'Частичное лунное затмение, видимое в Америке.',
        significance: 'high' as const
      },
      
      // 2027 (будущие прогнозы)
      { 
        date: new Date('2027-02-20'), 
        name: 'Полутеневое лунное затмение', 
        description: 'Полутеневое лунное затмение, видимое в Америке.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2027-07-18'), 
        name: 'Частичное лунное затмение', 
        description: 'Частичное лунное затмение, видимое в Азии и Австралии.',
        significance: 'high' as const
      },
      { 
        date: new Date('2027-08-17'), 
        name: 'Полутеневое лунное затмение', 
        description: 'Полутеневое лунное затмение, видимое в Азии.',
        significance: 'medium' as const
      }
    ];

    lunarEclipses.forEach(eclipse => {
      if (eclipse.date >= startDate && eclipse.date <= endDate) {
        events.push({
          timestamp: eclipse.date.getTime(),
          type: 'lunar_eclipse',
          name: eclipse.name,
          description: eclipse.description,
          significance: eclipse.significance
        });
      }
    });

    return events;
  }

  /**
   * Получить солнечные затмения
   */
  private getSolarEclipses(startDate: Date, endDate: Date): AstronomicalEvent[] {
    const events: AstronomicalEvent[] = [];
    
    // Реальные солнечные затмения 2022-2027 (астрономические данные)
    const solarEclipses = [
      // 2022 (прошедшие)
      { 
        date: new Date('2022-04-30'), 
        name: 'Частичное солнечное затмение', 
        description: 'Частичное солнечное затмение, видимое в южной части Южной Америки и Антарктиде.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2022-10-25'), 
        name: 'Частичное солнечное затмение', 
        description: 'Частичное солнечное затмение, видимое в Европе, северо-востоке Африки и Азии.',
        significance: 'medium' as const
      },
      
      // 2023 (прошедшие)
      { 
        date: new Date('2023-04-20'), 
        name: 'Гибридное солнечное затмение', 
        description: 'Редкое гибридное затмение (кольцевое/полное), видимое в Индийском и Тихом океанах.',
        significance: 'high' as const
      },
      { 
        date: new Date('2023-10-14'), 
        name: 'Кольцевое солнечное затмение', 
        description: 'Кольцевое солнечное затмение, видимое в Америке.',
        significance: 'high' as const
      },
      
      // 2024 (текущий год)
      { 
        date: new Date('2024-04-08'), 
        name: 'Полное солнечное затмение', 
        description: 'Полное солнечное затмение, видимое в Северной Америке. Великое американское затмение.',
        significance: 'high' as const
      },
      { 
        date: new Date('2024-10-02'), 
        name: 'Кольцевое солнечное затмение', 
        description: 'Кольцевое солнечное затмение, видимое в Тихом океане и южной части Америки.',
        significance: 'high' as const
      },
      
      // 2025 (будущие прогнозы)
      { 
        date: new Date('2025-03-29'), 
        name: 'Частичное солнечное затмение', 
        description: 'Частичное солнечное затмение, видимое в Атлантике, Европе и Азии.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2025-09-21'), 
        name: 'Частичное солнечное затмение', 
        description: 'Частичное солнечное затмение, видимое в Тихом океане и Новой Зеландии.',
        significance: 'medium' as const
      },
      
      // 2026 (будущие прогнозы)
      { 
        date: new Date('2026-02-17'), 
        name: 'Кольцевое солнечное затмение', 
        description: 'Кольцевое солнечное затмение, видимое в Антарктиде.',
        significance: 'high' as const
      },
      { 
        date: new Date('2026-08-12'), 
        name: 'Полное солнечное затмение', 
        description: 'Полное солнечное затмение, видимое в Гренландии, Исландии, Испании и России.',
        significance: 'high' as const
      },
      
      // 2027 (будущие прогнозы)
      { 
        date: new Date('2027-02-06'), 
        name: 'Кольцевое солнечное затмение', 
        description: 'Кольцевое солнечное затмение, видимое в южной части Америки и Атлантике.',
        significance: 'high' as const
      },
      { 
        date: new Date('2027-08-02'), 
        name: 'Полное солнечное затмение', 
        description: 'Полное солнечное затмение, видимое в Африке и Азии.',
        significance: 'high' as const
      }
    ];

    solarEclipses.forEach(eclipse => {
      if (eclipse.date >= startDate && eclipse.date <= endDate) {
        events.push({
          timestamp: eclipse.date.getTime(),
          type: 'solar_eclipse',
          name: eclipse.name,
          description: eclipse.description,
          significance: eclipse.significance
        });
      }
    });

    return events;
  }

  /**
   * Получить события прохода известных комет
   */
  private getCometEvents(startDate: Date, endDate: Date): AstronomicalEvent[] {
    const events: AstronomicalEvent[] = [];
    
    // Кометы и астероиды с известными орбитами 2022-2027
    const cometEvents = [
      // 2022 (прошедшие)
      { 
        date: new Date('2022-01-05'), 
        name: 'Комета Leonard (C/2021 A1)', 
        description: 'Ближайший подход кометы Leonard - самая яркая комета 2021-2022 года.',
        significance: 'high' as const
      },
      { 
        date: new Date('2022-07-14'), 
        name: 'Комета NEOWISE вблизи Солнца', 
        description: 'Периодическое приближение кометы NEOWISE к Солнцу.',
        significance: 'medium' as const
      },
      
      // 2023 (прошедшие)
      { 
        date: new Date('2023-02-01'), 
        name: 'Комета ZTF (C/2022 E3)', 
        description: 'Зеленая комета ZTF - ближайший подход к Земле за 50,000 лет.',
        significance: 'high' as const
      },
      { 
        date: new Date('2023-09-17'), 
        name: 'Комета Нишимура (C/2023 P1)', 
        description: 'Комета Нишимура проходит мимо Солнца - видима невооруженным глазом.',
        significance: 'high' as const
      },
      { 
        date: new Date('2023-10-14'), 
        name: 'Комета Энке (2P/Encke)', 
        description: 'Периодическое возвращение кометы Энке - короткопериодическая комета.',
        significance: 'medium' as const
      },
      
      // 2024 (текущий год)
      { 
        date: new Date('2024-04-21'), 
        name: 'Комета 12P/Понса-Брукса', 
        description: 'Комета "Дьявольских рогов" - максимальная яркость во время затмения.',
        significance: 'high' as const
      },
      { 
        date: new Date('2024-09-27'), 
        name: 'Комета Цучинских-ATLAS (C/2023 A3)', 
        description: 'Комета века - может стать самой яркой кометой за десятилетие.',
        significance: 'high' as const
      },
      { 
        date: new Date('2024-11-06'), 
        name: 'Комета Энке (2P/Encke)', 
        description: 'Возвращение кометы Энке - источник метеорного потока Тауриды.',
        significance: 'medium' as const
      },
      
      // 2025 (будущие прогнозы)
      { 
        date: new Date('2025-01-13'), 
        name: 'Комета 15P/Финлея', 
        description: 'Возвращение кометы Финлея - видима в телескопы.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2025-05-31'), 
        name: 'Комета 13P/Ольберса', 
        description: 'Возвращение кометы Ольберса - период обращения 69 лет.',
        significance: 'high' as const
      },
      { 
        date: new Date('2025-08-30'), 
        name: 'Комета 289P/Бланпэна', 
        description: 'Редкая комета Бланпэна - ближайший подход к Земле.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2025-11-17'), 
        name: 'Комета Энке (2P/Encke)', 
        description: 'Очередное возвращение кометы Энке.',
        significance: 'medium' as const
      },
      
      // 2026 (будущие прогнозы)
      { 
        date: new Date('2026-03-28'), 
        name: 'Комета 4P/Фэй', 
        description: 'Возвращение кометы Фэй - период обращения 7.5 лет.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2026-07-11'), 
        name: 'Астероид 2000 FL10', 
        description: 'Близкий пролет астероида 2000 FL10 мимо Земли.',
        significance: 'low' as const
      },
      { 
        date: new Date('2026-11-04'), 
        name: 'Комета 55P/Темпель-Туттля', 
        description: 'Источник метеорного потока Леониды - возвращение к Солнцу.',
        significance: 'high' as const
      },
      
      // 2027 (будущие прогнозы)
      { 
        date: new Date('2027-04-07'), 
        name: 'Комета 11P/Темпель-Свифта-LINEAR', 
        description: 'Возвращение кометы Темпель-Свифта-LINEAR.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2027-10-26'), 
        name: 'Комета 2P/Энке', 
        description: 'Комета Энке - последнее появление в нашем периоде прогнозов.',
        significance: 'medium' as const
      }
    ];

    cometEvents.forEach(comet => {
      if (comet.date >= startDate && comet.date <= endDate) {
        events.push({
          timestamp: comet.date.getTime(),
          type: 'comet_event',
          name: comet.name,
          description: comet.description,
          significance: comet.significance
        });
      }
    });

    return events;
  }

  /**
   * Получить метеорные потоки
   */
  private getMeteorShowers(startDate: Date, endDate: Date): AstronomicalEvent[] {
    const events: AstronomicalEvent[] = [];
    
    // Метеорные потоки 2022-2027 (точные даты пиков активности)
    const meteorShowers = [
      // 2022 (прошедшие события)
      { 
        date: new Date('2022-01-03'), 
        name: 'Квадрантиды (Quadrantids)', 
        description: 'Пик метеорного потока Квадрантиды - до 120 метеоров в час. Радиант в созвездии Волопаса.',
        significance: 'high' as const
      },
      { 
        date: new Date('2022-04-22'), 
        name: 'Лириды (Lyrids)', 
        description: 'Метеорный поток от кометы Тэтчер - до 18 метеоров в час.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2022-05-05'), 
        name: 'Эта-Аквариды (Eta Aquariids)', 
        description: 'Метеорный поток от кометы Галлея - до 60 метеоров в час в южном полушарии.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2022-07-30'), 
        name: 'Дельта Аквариды (Delta Aquariids)', 
        description: 'Южные Дельта Аквариды - до 25 метеоров в час.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2022-08-12'), 
        name: 'Персеиды (Perseids)', 
        description: 'Один из лучших метеорных потоков года - до 100 метеоров в час.',
        significance: 'high' as const
      },
      { 
        date: new Date('2022-10-08'), 
        name: 'Дракониды (Draconids)', 
        description: 'Переменный поток от кометы Джакобини-Циннера - обычно слабый, но может давать всплески.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2022-10-22'), 
        name: 'Ориониды (Orionids)', 
        description: 'Метеорный поток от кометы Галлея - до 75 метеоров в час.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2022-11-17'), 
        name: 'Леониды (Leonids)', 
        description: 'Поток от кометы Темпель-Туттля - обычно 15 метеоров/час, но может давать метеорные бури.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2022-12-14'), 
        name: 'Геминиды (Geminids)', 
        description: 'Лучший метеорный поток года - до 120 метеоров в час.',
        significance: 'high' as const
      },
      { 
        date: new Date('2022-12-22'), 
        name: 'Урсиды (Ursids)', 
        description: 'Метеорный поток от кометы Туттля - до 10 метеоров в час.',
        significance: 'low' as const
      },

      // 2023 (прошедшие события)
      { 
        date: new Date('2023-01-03'), 
        name: 'Квадрантиды (Quadrantids)', 
        description: 'Пик метеорного потока Квадрантиды - до 120 метеоров в час.',
        significance: 'high' as const
      },
      { 
        date: new Date('2023-04-22'), 
        name: 'Лириды (Lyrids)', 
        description: 'Метеорный поток от кометы Тэтчер - до 18 метеоров в час.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2023-05-05'), 
        name: 'Эта-Аквариды (Eta Aquariids)', 
        description: 'Метеорный поток от кометы Галлея - до 60 метеоров в час.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2023-07-30'), 
        name: 'Дельта Аквариды (Delta Aquariids)', 
        description: 'Южные Дельта Аквариды - до 25 метеоров в час.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2023-08-12'), 
        name: 'Персеиды (Perseids)', 
        description: 'Один из лучших метеорных потоков года - до 100 метеоров в час.',
        significance: 'high' as const
      },
      { 
        date: new Date('2023-10-08'), 
        name: 'Дракониды (Draconids)', 
        description: 'Переменный поток от кометы Джакобини-Циннера.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2023-10-22'), 
        name: 'Ориониды (Orionids)', 
        description: 'Метеорный поток от кометы Галлея - до 75 метеоров в час.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2023-11-17'), 
        name: 'Леониды (Leonids)', 
        description: 'Поток от кометы Темпель-Туттля - до 15 метеоров в час.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2023-12-14'), 
        name: 'Геминиды (Geminids)', 
        description: 'Лучший метеорный поток года - до 120 метеоров в час.',
        significance: 'high' as const
      },
      { 
        date: new Date('2023-12-22'), 
        name: 'Урсиды (Ursids)', 
        description: 'Метеорный поток от кометы Туттля - до 10 метеоров в час.',
        significance: 'low' as const
      },

      // 2024 (текущий год)
      { 
        date: new Date('2024-01-03'), 
        name: 'Квадрантиды (Quadrantids)', 
        description: 'Пик метеорного потока Квадрантиды - до 120 метеоров в час.',
        significance: 'high' as const
      },
      { 
        date: new Date('2024-04-22'), 
        name: 'Лириды (Lyrids)', 
        description: 'Метеорный поток от кометы Тэтчер - до 18 метеоров в час.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2024-05-05'), 
        name: 'Эта-Аквариды (Eta Aquariids)', 
        description: 'Метеорный поток от кометы Галлея - до 60 метеоров в час.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2024-07-30'), 
        name: 'Дельта Аквариды (Delta Aquariids)', 
        description: 'Южные Дельта Аквариды - до 25 метеоров в час.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2024-07-30'), 
        name: 'Альфа Каприкорниды (Alpha Capricornids)', 
        description: 'Метеорный поток с яркими болидами - до 5 метеоров в час.',
        significance: 'low' as const
      },
      { 
        date: new Date('2024-08-12'), 
        name: 'Персеиды (Perseids)', 
        description: 'Один из лучших метеорных потоков года - до 100 метеоров в час.',
        significance: 'high' as const
      },
      { 
        date: new Date('2024-10-08'), 
        name: 'Дракониды (Draconids)', 
        description: 'Переменный поток от кометы Джакобини-Циннера.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2024-10-22'), 
        name: 'Ориониды (Orionids)', 
        description: 'Метеорный поток от кометы Галлея - до 75 метеоров в час.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2024-11-17'), 
        name: 'Леониды (Leonids)', 
        description: 'Поток от кометы Темпель-Туттля - до 15 метеоров в час.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2024-12-14'), 
        name: 'Геминиды (Geminids)', 
        description: 'Лучший метеорный поток года - до 120 метеоров в час.',
        significance: 'high' as const
      },
      { 
        date: new Date('2024-12-22'), 
        name: 'Урсиды (Ursids)', 
        description: 'Метеорный поток от кометы Туттля - до 10 метеоров в час.',
        significance: 'low' as const
      },

      // 2025 (будущие прогнозы - ваши данные)
      { 
        date: new Date('2025-01-03'), 
        name: 'Квадрантиды (Quadrantids)', 
        description: 'Пиковая ночь 2-3 января - до 120 метеоров в час. Один из лучших потоков года.',
        significance: 'high' as const
      },
      { 
        date: new Date('2025-04-22'), 
        name: 'Лириды (Lyrids)', 
        description: 'Пик 21-22 апреля - метеорный поток от кометы Тэтчер, до 18 метеоров в час.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2025-05-04'), 
        name: 'Эта-Аквариды (Eta Aquariids)', 
        description: 'Пик 3-4 мая - метеорный поток от кометы Галлея, до 60 метеоров в час.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2025-07-30'), 
        name: 'Дельта Аквариды (Delta Aquariids)', 
        description: 'Пик 29-30 июля - Южные Дельта Аквариды, до 25 метеоров в час.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2025-07-30'), 
        name: 'Альфа Каприкорниды (Alpha Capricornids)', 
        description: 'Пик 30 июля - поток с яркими болидами, до 5 метеоров в час.',
        significance: 'low' as const
      },
      { 
        date: new Date('2025-08-12'), 
        name: 'Персеиды (Perseids)', 
        description: 'Пик 11-13 августа - активны 17 июля — 24 августа, до 100 метеоров в час.',
        significance: 'high' as const
      },
      { 
        date: new Date('2025-10-08'), 
        name: 'Дракониды (Draconids)', 
        description: 'Пик 8-9 октября - ожидается всплеск активности до ~400 метеоров/час! Исключительное событие.',
        significance: 'high' as const
      },
      { 
        date: new Date('2025-10-22'), 
        name: 'Ориониды (Orionids)', 
        description: 'Пик 22 октября - метеорный поток от кометы Галлея, до 75 метеоров в час.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2025-11-17'), 
        name: 'Леониды (Leonids)', 
        description: 'Пик 17 ноября - поток от кометы Темпель-Туттля, до 15 метеоров в час.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2025-12-14'), 
        name: 'Геминиды (Geminids)', 
        description: 'Пик 13-14 декабря - лучший метеорный поток года, до 120 метеоров в час.',
        significance: 'high' as const
      },
      { 
        date: new Date('2025-12-22'), 
        name: 'Урсиды (Ursids)', 
        description: 'Пик 21-22 декабря - метеорный поток от кометы Туттля, до 10 метеоров в час.',
        significance: 'low' as const
      },

      // 2026 (будущие прогнозы)
      { 
        date: new Date('2026-01-03'), 
        name: 'Квадрантиды (Quadrantids)', 
        description: 'Пик метеорного потока Квадрантиды - до 120 метеоров в час.',
        significance: 'high' as const
      },
      { 
        date: new Date('2026-04-22'), 
        name: 'Лириды (Lyrids)', 
        description: 'Метеорный поток от кометы Тэтчер - до 18 метеоров в час.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2026-05-05'), 
        name: 'Эта-Аквариды (Eta Aquariids)', 
        description: 'Метеорный поток от кометы Галлея - до 60 метеоров в час.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2026-07-30'), 
        name: 'Дельта Аквариды (Delta Aquariids)', 
        description: 'Южные Дельта Аквариды - до 25 метеоров в час.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2026-08-12'), 
        name: 'Персеиды (Perseids)', 
        description: 'Один из лучших метеорных потоков года - до 100 метеоров в час.',
        significance: 'high' as const
      },
      { 
        date: new Date('2026-10-08'), 
        name: 'Дракониды (Draconids)', 
        description: 'Переменный поток от кометы Джакобини-Циннера.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2026-10-22'), 
        name: 'Ориониды (Orionids)', 
        description: 'Метеорный поток от кометы Галлея - до 75 метеоров в час.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2026-11-17'), 
        name: 'Леониды (Leonids)', 
        description: 'Поток от кометы Темпель-Туттля - до 15 метеоров в час.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2026-12-14'), 
        name: 'Геминиды (Geminids)', 
        description: 'Лучший метеорный поток года - до 120 метеоров в час.',
        significance: 'high' as const
      },
      { 
        date: new Date('2026-12-22'), 
        name: 'Урсиды (Ursids)', 
        description: 'Метеорный поток от кометы Туттля - до 10 метеоров в час.',
        significance: 'low' as const
      },

      // 2027 (будущие прогнозы)
      { 
        date: new Date('2027-01-03'), 
        name: 'Квадрантиды (Quadrantids)', 
        description: 'Пик метеорного потока Квадрантиды - до 120 метеоров в час.',
        significance: 'high' as const
      },
      { 
        date: new Date('2027-04-22'), 
        name: 'Лириды (Lyrids)', 
        description: 'Метеорный поток от кометы Тэтчер - до 18 метеоров в час.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2027-05-05'), 
        name: 'Эта-Аквариды (Eta Aquariids)', 
        description: 'Метеорный поток от кометы Галлея - до 60 метеоров в час.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2027-07-30'), 
        name: 'Дельта Аквариды (Delta Aquariids)', 
        description: 'Южные Дельта Аквариды - до 25 метеоров в час.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2027-08-12'), 
        name: 'Персеиды (Perseids)', 
        description: 'Один из лучших метеорных потоков года - до 100 метеоров в час.',
        significance: 'high' as const
      },
      { 
        date: new Date('2027-10-08'), 
        name: 'Дракониды (Draconids)', 
        description: 'Переменный поток от кометы Джакобини-Циннера.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2027-10-22'), 
        name: 'Ориониды (Orionids)', 
        description: 'Метеорный поток от кометы Галлея - до 75 метеоров в час.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2027-11-17'), 
        name: 'Леониды (Leonids)', 
        description: 'Поток от кометы Темпель-Туттля - до 15 метеоров в час.',
        significance: 'medium' as const
      },
      { 
        date: new Date('2027-12-14'), 
        name: 'Геминиды (Geminids)', 
        description: 'Лучший метеорный поток года - до 120 метеоров в час.',
        significance: 'high' as const
      },
      { 
        date: new Date('2027-12-22'), 
        name: 'Урсиды (Ursids)', 
        description: 'Метеорный поток от кометы Туттля - до 10 метеоров в час.',
        significance: 'low' as const
      }
    ];

    meteorShowers.forEach(meteor => {
      if (meteor.date >= startDate && meteor.date <= endDate) {
        events.push({
          timestamp: meteor.date.getTime(),
          type: 'meteor_shower',
          name: meteor.name,
          description: meteor.description,
          significance: meteor.significance
        });
      }
    });

    return events;
  }
}

export const astronomicalEventsService = new AstronomicalEventsService(); 