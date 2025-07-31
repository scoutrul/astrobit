/**
 * Утилита для генерации будущих свечей
 * Создает 50 свечей вперед с текущей ценой для отображения предстоящих событий
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
 * Объединяет исторические и будущие свечи
 */
export function combineHistoricalAndFutureCandles(
  historicalData: CryptoData[],
  timeframe: string
): CryptoData[] {
  const futureCandles = generateFutureCandles(historicalData, timeframe);
  const combinedData = [...historicalData, ...futureCandles];
  
  console.log('[FutureCandlesGenerator] Объединенные данные:', {
    historical: historicalData.length,
    future: futureCandles.length,
    total: combinedData.length
  });
  
  return combinedData;
} 