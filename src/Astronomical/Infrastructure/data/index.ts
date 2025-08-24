// Экспорт всех астрономических данных
export { default as eventTypes } from './eventTypes.json';
export { default as moonPhases } from './moonPhases.json';
export { default as planetaryEvents } from './planetaryEvents.json';
export { default as solarEvents } from './solarEvents.json';
export { default as lunarEclipses } from './lunarEclipses.json';
export { default as solarEclipses } from './solarEclipses.json';
export { default as cometEvents } from './cometEvents.json';
export { default as meteorShowers } from './meteorShowers.json';

// Экспорт загрузчика данных
export { AstronomicalDataLoader } from '../services/astronomicalDataLoader';
export type { 
  EventTypeData, 
  EventCategoryData, 
  AstronomicalEventData, 
  EventTypesMetadata 
} from '../services/astronomicalDataLoader';
