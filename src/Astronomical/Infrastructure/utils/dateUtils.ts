/**
 * Утилиты для работы с датами астрономических событий
 */

// Импортируем все JSON данные
import moonPhasesData from '../data/moonPhases.json';
import planetaryEventsData from '../data/planetaryEvents.json';
import solarEventsData from '../data/solarEvents.json';
import lunarEclipsesData from '../data/lunarEclipses.json';
import solarEclipsesData from '../data/solarEclipses.json';
import cometEventsData from '../data/cometEvents.json';
import meteorShowersData from '../data/meteorShowers.json';

/**
 * Получает самую раннюю дату из всех астрономических событий
 */
export function getEarliestEventDate(): Date {
  const allDates: string[] = [];
  
  // Собираем все даты из всех файлов
  if (moonPhasesData.moon_phases) {
    allDates.push(...moonPhasesData.moon_phases.map(event => event.date));
  }
  
  if (planetaryEventsData.planetary_events) {
    allDates.push(...planetaryEventsData.planetary_events.map(event => event.date));
  }
  
  if (solarEventsData.solar_events) {
    allDates.push(...solarEventsData.solar_events.map(event => event.date));
  }
  
  if (lunarEclipsesData.lunar_eclipses) {
    allDates.push(...lunarEclipsesData.lunar_eclipses.map(event => event.date));
  }
  
  if (solarEclipsesData.solar_eclipses) {
    allDates.push(...solarEclipsesData.solar_eclipses.map(event => event.date));
  }
  
  if (cometEventsData.comet_events) {
    allDates.push(...cometEventsData.comet_events.map(event => event.date));
  }
  
  if (meteorShowersData.meteor_showers) {
    allDates.push(...meteorShowersData.meteor_showers.map(event => event.date));
  }

  if (allDates.length === 0) {
    return new Date('2020-01-01'); // Fallback дата
  }

  // Находим самую раннюю дату
  const earliestDate = allDates.reduce((earliest, dateStr) => {
    const eventDate = new Date(dateStr);
    return eventDate < earliest ? eventDate : earliest;
  }, new Date(allDates[0]));

  return earliestDate;
}

/**
 * Получает самую позднюю дату из всех астрономических событий
 */
export function getLatestEventDate(): Date {
  const allDates: string[] = [];
  
  // Собираем все даты из всех файлов
  if (moonPhasesData.moon_phases) {
    allDates.push(...moonPhasesData.moon_phases.map(event => event.date));
  }
  
  if (planetaryEventsData.planetary_events) {
    allDates.push(...planetaryEventsData.planetary_events.map(event => event.date));
  }
  
  if (solarEventsData.solar_events) {
    allDates.push(...solarEventsData.solar_events.map(event => event.date));
  }
  
  if (lunarEclipsesData.lunar_eclipses) {
    allDates.push(...lunarEclipsesData.lunar_eclipses.map(event => event.date));
  }
  
  if (solarEclipsesData.solar_eclipses) {
    allDates.push(...solarEclipsesData.solar_eclipses.map(event => event.date));
  }
  
  if (cometEventsData.comet_events) {
    allDates.push(...cometEventsData.comet_events.map(event => event.date));
  }
  
  if (meteorShowersData.meteor_showers) {
    allDates.push(...meteorShowersData.meteor_showers.map(event => event.date));
  }

  if (allDates.length === 0) {
    return new Date(); // Fallback на текущую дату
  }

  // Находим самую позднюю дату
  const latestDate = allDates.reduce((latest, dateStr) => {
    const eventDate = new Date(dateStr);
    return eventDate > latest ? eventDate : latest;
  }, new Date(allDates[0]));

  return latestDate;
}

/**
 * Вычисляет максимальную дату для отображения будущих событий в зависимости от таймфрейма
 */
export function getMaxFutureDateForTimeframe(timeframe: string): Date {
  const now = new Date();
  
  switch (timeframe) {
    case '1h':
    case '8h':
      // 1 неделя вперед
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    case '1d':
      // 2 недели вперед  
      return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    
    case '1w':
      // 2 месяца вперед
      return new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    
    case '1M':
      // год вперед
      return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    
    default:
      // По умолчанию 2 недели
      return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  }
}


