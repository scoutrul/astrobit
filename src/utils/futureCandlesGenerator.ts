/**
 * Утилита для генерации будущих свечей
 * Создает адаптивное количество свечей вперед для размещения всех астрономических событий
 */

export interface CryptoData {
  symbol: string;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface AstronomicalEvent {
  id: string;
  name: string;
  date: Date;
  type: string;
  description: string;
  significance: string;
}

/**
 * Вычисляет требуемое количество будущих свечей для размещения всех событий
 */
export function calculateRequiredFutureCandles(
  historicalData: CryptoData[],
  astronomicalEvents: AstronomicalEvent[],
  timeframe: string
): number {
  if (historicalData.length === 0) {
    console.warn('[FutureCandlesGenerator] Нет исторических данных для расчета будущих свечей');
    return 50; // Возвращаем дефолтное значение
  }

  const lastCandle = historicalData[historicalData.length - 1];
  const lastTime = new Date(lastCandle.time);
  
  // Фильтруем события в будущем
  const futureEvents = astronomicalEvents.filter(event => event.date > lastTime);
  
  if (futureEvents.length === 0) {
    console.log('[FutureCandlesGenerator] Нет будущих событий, используем дефолтные 50 свечей');
    return 50;
  }

  // Находим самое дальнее событие
  const maxEventDate = new Date(Math.max(...futureEvents.map(event => event.date.getTime())));
  
  // Вычисляем разницу во времени
  const timeDifference = maxEventDate.getTime() - lastTime.getTime();
  
  // Конвертируем разницу в количество свечей для данного таймфрейма
  const candlesNeeded = convertTimeDifferenceToCandles(timeDifference, timeframe);
  
  // Добавляем буфер для комфортного отображения
  const bufferCandles = 10;
  const totalCandles = candlesNeeded + bufferCandles;
  
  // Ограничиваем минимальным и максимальным значением
  const minCandles = 20;
  const maxCandles = 200;
  const finalCandles = Math.max(minCandles, Math.min(maxCandles, totalCandles));
  
  console.log('[FutureCandlesGenerator] Расчет требуемых свечей:', {
    lastTime: lastTime.toISOString(),
    maxEventDate: maxEventDate.toISOString(),
    timeDifferenceMs: timeDifference,
    timeDifferenceDays: timeDifference / (1000 * 60 * 60 * 24),
    futureEventsCount: futureEvents.length,
    candlesNeeded,
    bufferCandles,
    totalCandles,
    finalCandles,
    timeframe
  });
  
  return finalCandles;
}

/**
 * Конвертирует разницу во времени в количество свечей для данного таймфрейма
 */
function convertTimeDifferenceToCandles(timeDifferenceMs: number, timeframe: string): number {
  const msPerHour = 1000 * 60 * 60;
  const msPerDay = msPerHour * 24;
  const msPerWeek = msPerDay * 7;
  const msPerMonth = msPerDay * 30; // Приблизительно
  
  switch (timeframe) {
    case '1h':
      return Math.ceil(timeDifferenceMs / msPerHour);
    case '8h':
      return Math.ceil(timeDifferenceMs / (msPerHour * 8));
    case '1d':
      return Math.ceil(timeDifferenceMs / msPerDay);
    case '1w':
      return Math.ceil(timeDifferenceMs / msPerWeek);
    case '1M':
      return Math.ceil(timeDifferenceMs / msPerMonth);
    default:
      return Math.ceil(timeDifferenceMs / msPerDay); // По умолчанию дневной
  }
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
  
  console.log('[FutureCandlesGenerator] Генерация будущих свечей:', {
    symbol: lastCandle.symbol,
    timeframe,
    count,
    lastTime: lastTime.toISOString(),
    lastPrice: lastCandle.close
  });

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

  console.log('[FutureCandlesGenerator] Сгенерировано свечей:', futureCandles.length);
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
  // Вычисляем требуемое количество будущих свечей
  const requiredCandles = calculateRequiredFutureCandles(historicalData, astronomicalEvents, timeframe);
  
  // Генерируем будущие свечи
  const futureCandles = generateFutureCandles(historicalData, timeframe, requiredCandles);
  const combinedData = [...historicalData, ...futureCandles];
  
  console.log('[FutureCandlesGenerator] Объединенные данные:', {
    historical: historicalData.length,
    future: futureCandles.length,
    total: combinedData.length,
    requiredCandles,
    eventsCount: astronomicalEvents.length
  });
  
  return combinedData;
} 