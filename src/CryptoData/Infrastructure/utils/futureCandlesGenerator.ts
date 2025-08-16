/**
 * Утилита для генерации будущих свечей
 * Создает адаптивное количество свечей вперед для размещения всех астрономических событий
 */

import { CryptoData } from '../../Domain/types';
import { AstronomicalEvent } from '../../../Astronomical/Domain/types';

// Кэш для предотвращения повторных вычислений
const combinationCache = new Map<string, CryptoData[]>();

/**
 * Вычисляет требуемое количество будущих свечей для размещения всех событий
 */
export function calculateRequiredFutureCandles(
  lastTime: Date,
  timeframe: string,
  astronomicalEvents: AstronomicalEvent[]
): number {
  // Кэш для предотвращения повторных вычислений
  const calculationCache = new Map<string, number>();

  // Если нет будущих событий, используем дефолтные 50 свечей
  if (astronomicalEvents.length === 0) {
    return 50;
  }

  // Проверяем кэш
  const cacheKey = `${lastTime.toISOString()}-${timeframe}-${astronomicalEvents.length}`;
  if (calculationCache.has(cacheKey)) {
    return calculationCache.get(cacheKey)!;
  }

  // Находим самое дальнее событие
  const futureEvents = astronomicalEvents.filter(event => 
    event.date > lastTime
  );

  if (futureEvents.length === 0) {
    return 50; // Дефолтное значение
  }

  const maxEventDate = new Date(Math.max(...futureEvents.map(e => e.date.getTime())));
  const timeDifferenceMs = maxEventDate.getTime() - lastTime.getTime();
  const timeDifferenceDays = Math.ceil(timeDifferenceMs / (1000 * 60 * 60 * 24));

  // Рассчитываем количество свечей в зависимости от таймфрейма
  let candlesPerDay = 1;
  switch (timeframe) {
    case '1h':
      candlesPerDay = 24;
      break;
    case '8h':
      candlesPerDay = 3;
      break;
    case '1d':
      candlesPerDay = 1;
      break;
    case '1w':
      candlesPerDay = 1/7;
      break;
    case '1M':
      candlesPerDay = 1/30;
      break;
  }

  const requiredCandles = Math.ceil(timeDifferenceDays * candlesPerDay);
  const finalCandles = Math.min(Math.max(requiredCandles, 50), 365); // Минимум 50, максимум 365 свечей

  // Кэшируем результат
  calculationCache.set(cacheKey, finalCandles);
  if (calculationCache.size > 100) {
    const keys = Array.from(calculationCache.keys());
    keys.slice(0, keys.length - 100).forEach(key => calculationCache.delete(key));
  }

  return finalCandles;
}

/**
 * Генерирует будущие свечи на основе последней исторической свечи
 */
export function generateFutureCandles(
  historicalData: CryptoData[],
  timeframe: string,
  count: number = 50
): CryptoData[] {
  if (historicalData.length === 0) {
    console.warn('[FutureCandlesGenerator] Нет исторических данных для генерации будущих свечей');
    return [];
  }

  const lastCandle = historicalData[historicalData.length - 1];
  const lastTime = new Date(lastCandle.time);

  const futureCandles: CryptoData[] = [];
  
  for (let i = 1; i <= count; i++) {
    const futureTime = calculateFutureTime(lastTime, timeframe, i);
    
    const futureCandle: CryptoData = {
      symbol: lastCandle.symbol,
      time: futureTime.toISOString(),
      open: lastCandle.close, // Используем последнюю цену как открытие
      high: lastCandle.close, // Все цены одинаковые
      low: lastCandle.close,
      close: lastCandle.close,
      volume: 0 // Нулевой объем для будущих свечей
    };
    
    futureCandles.push(futureCandle);
  }

  return futureCandles;
}

/**
 * Вычисляет время для будущей свечи на основе таймфрейма
 */
function calculateFutureTime(lastTime: Date, timeframe: string, offset: number): Date {
  const futureTime = new Date(lastTime);
  
  switch (timeframe) {
    case '1h':
      futureTime.setHours(futureTime.getHours() + offset);
      break;
    case '8h':
      futureTime.setHours(futureTime.getHours() + (offset * 8));
      break;
    case '1d':
      futureTime.setDate(futureTime.getDate() + offset);
      break;
    case '1w':
      futureTime.setDate(futureTime.getDate() + (offset * 7));
      break;
    case '1M':
      futureTime.setMonth(futureTime.getMonth() + offset);
      break;
    default:
      // По умолчанию считаем как дневной таймфрейм
      futureTime.setDate(futureTime.getDate() + offset);
  }
  
  return futureTime;
}

/**
 * Объединяет исторические и будущие свечи с адаптивным количеством
 */
export function combineHistoricalAndFutureCandles(
  historicalData: CryptoData[],
  timeframe: string,
  astronomicalEvents: AstronomicalEvent[] = []
): CryptoData[] {
  if (historicalData.length === 0) {
    return historicalData;
  }

  // Создаем ключ кэша для объединения
  const lastCandle = historicalData[historicalData.length - 1];
  const lastTime = new Date(lastCandle.time);
  const eventsKey = astronomicalEvents.map(e => `${e.name}-${e.date.toISOString()}`).join('|');
  const combinationCacheKey = `${lastTime.toISOString()}-${timeframe}-${historicalData.length}-${eventsKey}`;
  
  // Проверяем кэш объединения
  if (combinationCache.has(combinationCacheKey)) {
    return combinationCache.get(combinationCacheKey)!;
  }

  // Вычисляем требуемое количество будущих свечей
  let requiredCandles = calculateRequiredFutureCandles(lastTime, timeframe, astronomicalEvents);
  
  // Ограничиваем будущие свечи до разумного предела (максимум 3 месяца в будущее)
  const now = new Date();
  const maxFutureDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 3 месяца
  
  if (lastTime > maxFutureDate) {
    console.warn(`[FutureCandlesGenerator] Последняя свеча слишком далеко в будущем: ${lastTime.toISOString()}, ограничиваем`);
    requiredCandles = Math.min(requiredCandles, 30); // Максимум 30 свечей
  }
  
  // Генерируем будущие свечи
  const futureCandles = generateFutureCandles(historicalData, timeframe, requiredCandles);
  const combinedData = [...historicalData, ...futureCandles];
  
  // Кэшируем результат объединения
  combinationCache.set(combinationCacheKey, combinedData);
  if (combinationCache.size > 50) {
    const keys = Array.from(combinationCache.keys());
    keys.slice(0, keys.length - 50).forEach(key => combinationCache.delete(key));
  }

  return combinedData;
} 