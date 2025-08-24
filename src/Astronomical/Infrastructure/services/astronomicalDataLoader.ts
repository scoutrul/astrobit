import eventTypesData from '../data/eventTypes.json';
import moonPhasesData from '../data/moonPhases.json';
import planetaryEventsData from '../data/planetaryEvents.json';
import solarEventsData from '../data/solarEvents.json';
import lunarEclipsesData from '../data/lunarEclipses.json';
import solarEclipsesData from '../data/solarEclipses.json';
import cometEventsData from '../data/cometEvents.json';
import meteorShowersData from '../data/meteorShowers.json';

/**
 * Интерфейс для типа события из JSON
 */
export interface EventTypeData {
  value: string;
  label: string;
  icon: string;
  description: string;
  category: string;
}

/**
 * Интерфейс для категории событий из JSON
 */
export interface EventCategoryData {
  name: string;
  color: string;
  description: string;
}

/**
 * Интерфейс для астрономического события из JSON
 */
export interface AstronomicalEventData {
  date: string;
  name: string;
  description: string;
  significance: string; // Более гибкий тип для JSON данных
  constellation?: string;
  icon?: string;
}

/**
 * Интерфейс для лунных фаз (совместим с AstronomicalEventData)
 */
export interface MoonPhaseData extends AstronomicalEventData {}

/**
 * Интерфейс для астрономического события с типом (используется в getEventsForPeriod)
 */
export interface AstronomicalEventDataWithType extends AstronomicalEventData {
  type: string;
}

/**
 * Интерфейс для метаданных JSON файлов
 */
export interface EventTypesMetadata {
  types: EventTypeData[];
  categories: Record<string, EventCategoryData>;
}

/**
 * Сервис для загрузки астрономических данных из JSON файлов
 */
export class AstronomicalDataLoader {
  /**
   * Получить типы событий и их категории
   */
  static getEventTypes(): EventTypesMetadata {
    return eventTypesData as EventTypesMetadata;
  }

  /**
   * Получить лунные фазы
   */
  static getMoonPhases(): MoonPhaseData[] {
    return moonPhasesData.moon_phases;
  }

  /**
   * Получить планетарные события
   */
  static getPlanetaryEvents(): AstronomicalEventData[] {
    return planetaryEventsData.planetary_events;
  }

  /**
   * Получить солнечные события
   */
  static getSolarEvents(): AstronomicalEventData[] {
    return solarEventsData.solar_events;
  }

  /**
   * Получить лунные затмения
   */
  static getLunarEclipses(): AstronomicalEventData[] {
    return lunarEclipsesData.lunar_eclipses;
  }

  /**
   * Получить солнечные затмения
   */
  static getSolarEclipses(): AstronomicalEventData[] {
    return solarEclipsesData.solar_eclipses;
  }

  /**
   * Получить кометные события
   */
  static getCometEvents(): AstronomicalEventData[] {
    return cometEventsData.comet_events;
  }

  /**
   * Получить метеорные потоки
   */
  static getMeteorShowers(): AstronomicalEventData[] {
    return meteorShowersData.meteor_showers;
  }

  /**
   * Получить все события определенного типа
   */
  static getEventsByType(type: string): AstronomicalEventData[] {
    switch (type) {
      case 'moon_phase':
        return this.getMoonPhases();
      case 'planet_aspect':
        return this.getPlanetaryEvents();
      case 'solar_event':
        return this.getSolarEvents();
      case 'lunar_eclipse':
        return this.getLunarEclipses();
      case 'solar_eclipse':
        return this.getSolarEclipses();
      case 'comet_event':
        return this.getCometEvents();
      case 'meteor_shower':
        return this.getMeteorShowers();
      default:
        return [];
    }
  }

  /**
   * Получить все события для определенного периода
   */
  static getEventsForPeriod(startDate: Date, endDate: Date): AstronomicalEventDataWithType[] {
    const allEvents: AstronomicalEventDataWithType[] = [
      // Лунные фазы
      ...this.getMoonPhases().map(event => ({ 
        ...event, 
        type: 'moon_phase'
      })),
      ...this.getPlanetaryEvents().map(event => ({ ...event, type: 'planet_aspect' })),
      ...this.getSolarEvents().map(event => ({ ...event, type: 'solar_event' })),
      ...this.getLunarEclipses().map(event => ({ ...event, type: 'lunar_eclipse' })),
      ...this.getSolarEclipses().map(event => ({ ...event, type: 'solar_eclipse' })),
      ...this.getCometEvents().map(event => ({ ...event, type: 'comet_event' })),
      ...this.getMeteorShowers().map(event => ({ ...event, type: 'meteor_shower' }))
    ];

    return allEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= startDate && eventDate <= endDate;
    });
  }

  /**
   * Получить события по значимости
   */
  static getEventsBySignificance(significance: 'low' | 'medium' | 'high'): AstronomicalEventData[] {
    const allEvents = [
      ...this.getMoonPhases(),
      ...this.getPlanetaryEvents(),
      ...this.getSolarEvents(),
      ...this.getLunarEclipses(),
      ...this.getSolarEclipses(),
      ...this.getCometEvents(),
      ...this.getMeteorShowers()
    ];

    return allEvents.filter(event => event.significance === significance);
  }

  /**
   * Получить события по категории
   */
  static getEventsByCategory(category: string): AstronomicalEventData[] {
    const eventTypes = this.getEventTypes();
    const typesInCategory = eventTypes.types
      .filter(type => type.category === category)
      .map(type => type.value);

    const allEvents: Array<AstronomicalEventDataWithType> = [
      ...this.getMoonPhases().map(event => ({ ...event, type: 'moon_phase' })),
      ...this.getPlanetaryEvents().map(event => ({ ...event, type: 'planet_aspect' })),
      ...this.getSolarEvents().map(event => ({ ...event, type: 'solar_event' })),
      ...this.getLunarEclipses().map(event => ({ ...event, type: 'lunar_eclipse' })),
      ...this.getSolarEclipses().map(event => ({ ...event, type: 'solar_eclipse' })),
      ...this.getCometEvents().map(event => ({ ...event, type: 'comet_event' })),
      ...this.getMeteorShowers().map(event => ({ ...event, type: 'meteor_shower' }))
    ];

    return allEvents.filter(event => typesInCategory.includes(event.type));
  }

  /**
   * Получить статистику по событиям
   */
  static getEventStatistics(): Record<string, number> {
    return {
      moon_phase: this.getMoonPhases().length,
      planet_aspect: this.getPlanetaryEvents().length,
      solar_event: this.getSolarEvents().length,
      lunar_eclipse: this.getLunarEclipses().length,
      solar_eclipse: this.getSolarEclipses().length,
      comet_event: this.getCometEvents().length,
      meteor_shower: this.getMeteorShowers().length
    };
  }

  /**
   * Получить общее количество событий
   */
  static getTotalEventCount(): number {
    return (
      this.getMoonPhases().length +
      this.getPlanetaryEvents().length +
      this.getSolarEvents().length +
      this.getLunarEclipses().length +
      this.getSolarEclipses().length +
      this.getCometEvents().length +
      this.getMeteorShowers().length
    );
  }

  /**
   * Найти самую раннюю дату среди всех астрономических событий
   */
  static getEarliestEventDate(): Date {
    const allEvents = [
      ...this.getMoonPhases(),
      ...this.getPlanetaryEvents(),
      ...this.getSolarEvents(),
      ...this.getLunarEclipses(),
      ...this.getSolarEclipses(),
      ...this.getCometEvents(),
      ...this.getMeteorShowers()
    ];

    if (allEvents.length === 0) {
      return new Date('2020-01-01'); // Fallback дата
    }

    const earliestDate = allEvents.reduce((earliest, event) => {
      const eventDate = new Date(event.date);
      return eventDate < earliest ? eventDate : earliest;
    }, new Date(allEvents[0].date));

    return earliestDate;
  }

  /**
   * Найти самую позднюю дату среди всех астрономических событий
   */
  static getLatestEventDate(): Date {
    const allEvents = [
      ...this.getMoonPhases(),
      ...this.getPlanetaryEvents(),
      ...this.getSolarEvents(),
      ...this.getLunarEclipses(),
      ...this.getSolarEclipses(),
      ...this.getCometEvents(),
      ...this.getMeteorShowers()
    ];

    if (allEvents.length === 0) {
      return new Date(); // Fallback на текущую дату
    }

    const latestDate = allEvents.reduce((latest, event) => {
      const eventDate = new Date(event.date);
      return eventDate > latest ? eventDate : latest;
    }, new Date(allEvents[0].date));

    return latestDate;
  }
}
