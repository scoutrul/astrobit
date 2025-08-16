import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import { TimeframeUtils } from '../../Infrastructure/utils/TimeframeUtils';
import { AstronomicalEventUtils, AstronomicalEvent } from '../../Infrastructure/utils/AstronomicalEventUtils';
import { BinanceKlineWebSocketData } from '../../../CryptoData/Infrastructure/external-services/BinanceWebSocketService';
import { CryptoData } from '../../../CryptoData/Domain/types';

interface ChartComponentProps {
  symbol: string;
  timeframe: string;
  height?: number;
  className?: string;
  cryptoData?: CryptoData[];
  astronomicalEvents?: AstronomicalEvent[];
  eventFilters?: {
    lunar?: boolean;
    solar?: boolean;
    planetary?: boolean;
    meteor?: boolean;
  };
  isLoading?: boolean;
  realTimeData?: BinanceKlineWebSocketData | null;
}

interface TooltipData {
  x: number;
  y: number;
  title?: string;
  description?: string;
  events?: AstronomicalEvent[];
  visible: boolean;
}

export const ChartComponent: React.FC<ChartComponentProps> = ({
  symbol,
  timeframe,
  height = 400,
  className = '',
  cryptoData = [],
  astronomicalEvents = [],
  eventFilters = { lunar: true, solar: true, planetary: true, meteor: true },
  isLoading = false,
  realTimeData = null
}) => {


  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartInstance, setChartInstance] = useState<IChartApi | null>(null);
  const [seriesInstance, setSeriesInstance] = useState<ISeriesApi<"Candlestick"> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData>({
    x: 0,
    y: 0,
    visible: false
  });
  
  // Состояние для текущей цены из WebSocket
  const [currentPrice, setCurrentPrice] = useState<{
    price: number;
    symbol: string;
    timestamp: number;
    isLive: boolean;
  } | null>(null);
  
  // Состояние загрузки для виджета цены
  const [isPriceLoading, setIsPriceLoading] = useState(true);
  
  // Состояние загрузки графика
  const [isChartLoading, setIsChartLoading] = useState(true);

  // Флаги и refs для управления зумом/скроллом без сбросов
  const hasUserInteractedRef = useRef(false);
  const isProgrammaticRangeChangeRef = useRef(false);
  const initialRangeAppliedRef = useRef(false);
  const lastManualRangeRef = useRef<{ from: number; to: number } | null>(null);

  // Стабилизируем фильтры событий, чтобы избежать лишних обновлений
  const activeEventFilters = useMemo(() => eventFilters, [
    eventFilters.lunar,
    eventFilters.solar,
    eventFilters.planetary,
    eventFilters.meteor
  ]);

  // Стабилизируем астрономические события, чтобы избежать лишних обновлений
  const stableAstronomicalEvents = useMemo(() => astronomicalEvents, [astronomicalEvents]);



  // Ключ для принудительного пересоздания компонента при смене symbol/timeframe
  const chartKey = `${symbol}-${timeframe}`;

  // Обработчик движения курсора для ToolTip
  const handleCrosshairMove = useCallback((param: any) => {
    // Проверяем наличие данных
    if (!param.point) {
      setTooltip(prev => ({ ...prev, visible: false }));
      return;
    }

    let timeInSeconds = 0;
    
    // Получаем время из разных источников
    if (param.seriesData && param.seriesData.time) {
      timeInSeconds = param.seriesData.time;
    } else if (param.time && typeof param.time === 'number') {
      if (param.time > 1000000000) {
        timeInSeconds = param.time; // Уже в секундах
      } else {
        timeInSeconds = Math.floor(param.time / 1000); // Конвертируем из миллисекунд
      }
    } else {
      setTooltip(prev => ({ ...prev, visible: false }));
      return;
    }
    
    // Динамический диапазон поиска в зависимости от таймфрейма
    let timeRange = 3600; // 1 час по умолчанию
    
    switch (timeframe) {
      case '1h':
        timeRange = 1800; // 30 минут для часового
        break;
      case '8h':
        timeRange = 14400; // 4 часа для 8-часового
        break;
      case '1d':
        timeRange = 86400; // 24 часа для дневного
        break;
      case '1w':
        timeRange = 604800; // 1 неделя для недельного
        break;
      case '1M':
        timeRange = 2592000; // 1 месяц для месячного
        break;
    }
    
    // Поиск событий вблизи времени
    const eventsNearTime = stableAstronomicalEvents.filter(event => {
      const eventTimeInSeconds = Math.floor(event.timestamp / 1000);
      const diff = Math.abs(eventTimeInSeconds - timeInSeconds);
      return diff <= timeRange;
    });
    
    if (eventsNearTime.length > 0) {
      // Есть события - показываем ToolTip мгновенно
      if (eventsNearTime.length === 1) {
        // Одно событие
        const event = eventsNearTime[0];
        setTooltip({
          x: param.point.x,
          y: param.point.y - 60,
          title: event.name,
          description: event.description,
          visible: true
        });
      } else {
        // Несколько событий - стэк
        setTooltip({
          x: param.point.x,
          y: param.point.y - 60,
          events: eventsNearTime,
          visible: true
        });
      }
    } else {
      // Нет событий - скрываем ToolTip мгновенно
      setTooltip(prev => ({ ...prev, visible: false }));
    }
  }, [timeframe, stableAstronomicalEvents]);

  // Инициализация графика
  useEffect(() => {
    if (!chartContainerRef.current) {
      return;
    }

    // Очищаем контейнер от любых существующих графиков
    const existingCharts = chartContainerRef.current.querySelectorAll('.tv-lightweight-charts');
    existingCharts.forEach(chart => chart.remove());

    // Очищаем старый график если он существует
    if (chartInstance) {
      try {
        chartInstance.remove();
      } catch (err) {
        // Chart was already disposed
      }
      setChartInstance(null);
      setSeriesInstance(null);
    }

    // Сбрасываем флаги при смене символа/таймфрейма
    hasUserInteractedRef.current = false;
    isProgrammaticRangeChangeRef.current = false;
    initialRangeAppliedRef.current = false;
    lastManualRangeRef.current = null;

    // Проверяем ширину контейнера
    if (chartContainerRef.current.clientWidth === 0) {
      const timer = setTimeout(() => {
        if (chartContainerRef.current) {
          setChartInstance(null);
        }
      }, 100);
      return () => clearTimeout(timer);
    }

    setError(null);

    try {
      // Создаем новый график
      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: height,
        layout: {
          background: { color: '#0a0b1e' },
          textColor: '#e2e8f0'
        },
        grid: {
          vertLines: { color: '#1e293b' },
          horzLines: { color: '#1e293b' }
        },
        crosshair: {
          mode: 0, // Режим 0 = свободное движение crosshair (не привязан к свечам)
          vertLine: {
            visible: false, // Скрываем вертикальную линию (индикатор цены)
            color: '#f7931a',
            width: 1,
            style: 2
          },
          horzLine: {
            visible: true, // ПОКАЗЫВАЕМ горизонтальную линию
            color: '#f7931a',
            width: 1,
            style: 2,
            labelVisible: true // Показываем лейбл с ценой
          }
        },
        rightPriceScale: {
          borderColor: '#334155',
          textColor: '#8b8f9b'
        },
        timeScale: {
          borderColor: '#334155',
          timeVisible: true,
          secondsVisible: false
        },
        // Настройки для crosshair по всему графику
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
          horzTouchDrag: true,
          vertTouchDrag: true
        },
        handleScale: {
          axisPressedMouseMove: true,
          mouseWheel: true,
          pinch: true
        }
      });

      // Создаем серию свечей
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderDownColor: '#ef4444',
        borderUpColor: '#10b981',
        wickDownColor: '#ef4444',
        wickUpColor: '#10b981'
      });

      // Применяем прозрачность для исторических свечей
      candlestickSeries.applyOptions({
        lastValueVisible: false, // Скрываем последнее значение цены
        priceLineVisible: false, // Скрываем линию цены
        // Делаем исторические свечи полупрозрачными
        upColor: 'rgba(16, 185, 129, 0.6)', // #10b981 с прозрачностью 60%
        downColor: 'rgba(239, 68, 68, 0.6)', // #ef4444 с прозрачностью 60%
        borderDownColor: 'rgba(239, 68, 68, 0.9)',
        borderUpColor: 'rgba(16, 185, 129, 0.9)',
        wickDownColor: 'rgba(239, 68, 68, 0.9)',
        wickUpColor: 'rgba(16, 185, 129, 0.9)'
      });

      setChartInstance(chart);
      setSeriesInstance(candlestickSeries);

      // Обработчик изменения размера
      const handleResize = () => {
        if (chartContainerRef.current && chart) {
          chart.applyOptions({
            width: chartContainerRef.current.clientWidth
          });
        }
      };

      window.addEventListener('resize', handleResize);

      // Подписка на изменение видимого диапазона для отслеживания пользовательского зума/скролла
      const timeScale = chart.timeScale();
      const handleVisibleRangeChange = (range: any) => {
        // Игнорируем собственные программные изменения диапазона
        if (isProgrammaticRangeChangeRef.current) {
          // Сбрасываем флаг только после первого уведомления от чарт-а
          isProgrammaticRangeChangeRef.current = false;
          return;
        }
        hasUserInteractedRef.current = true;
        if (range && typeof range.from === 'number' && typeof range.to === 'number') {
          lastManualRangeRef.current = { from: range.from, to: range.to };
        }
      };

      timeScale.subscribeVisibleTimeRangeChange(handleVisibleRangeChange);

      // Очистка при размонтировании
      return () => {
        window.removeEventListener('resize', handleResize);
        timeScale.unsubscribeVisibleTimeRangeChange(handleVisibleRangeChange);
        
        // Очищаем график из контейнера
        if (chartContainerRef.current) {
          const existingChart = chartContainerRef.current.querySelector('.tv-lightweight-charts');
          if (existingChart) {
            existingChart.remove();
          }
        }
      };
    } catch (err) {
      console.error('[ChartComponent] ❌ Chart initialization error:', err);
      setError(err instanceof Error ? err.message : 'Ошибка инициализации графика');
    }
  }, [chartKey, height]); // Зависим только от ключа и высоты

  // Стабилизируем данные криптовалют, чтобы избежать лишних обновлений
  const stableCryptoData = useMemo(() => {
    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Не используем данные если они загружаются
    // Это предотвращает использование старых кешированных данных при смене символа
    if (isLoading) {
      return [];
    }
    
    return cryptoData;
  }, [cryptoData, symbol, isLoading]);

  // Обновление данных криптовалют
  useEffect(() => {
    if (!seriesInstance || !stableCryptoData.length) {
      return;
    }



    try {
      // Конвертируем данные в формат Lightweight Charts
      const chartData = stableCryptoData.map(item => {
        const timeInSeconds = TimeframeUtils.convertTimestampToSeconds(item.time);
        const chartItem: any = {
          time: timeInSeconds as any,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume
        };
        
        // Если это будущая свеча (volume = 0), применяем прозрачность
        if (item.volume === 0 && (item.color || item.borderColor || item.wickColor)) {
          chartItem.color = item.color;
          chartItem.borderColor = item.borderColor;
          chartItem.wickColor = item.wickColor;
        }
        
        return chartItem;
      });

      // Фильтруем и сортируем данные
      const processedData = TimeframeUtils.processChartData(chartData);
      
      if (processedData.length > 0) {
        // Простое логирование цен для проверки
        console.log(`[ChartComponent] 💰 PRICE CHECK for ${symbol}:`, 
          `First: $${processedData[0]?.close} | ` +
          `Last: $${processedData[processedData.length - 1]?.close} | ` +
          `Length: ${processedData.length} | ` +
          `ChartKey: ${chartKey}`
        );
        
        seriesInstance.setData(processedData as any);

        // Зум с показом будущих событий - последняя реальная свеча по центру
        if (chartInstance && processedData.length > 0) {
          const totalDataPoints = processedData.length;
          
          // Минимальное количество точек для установки диапазона
          if (totalDataPoints < 2) {
            console.warn('[ChartComponent] ⚠️ Not enough data points for range setting:', totalDataPoints);
            return;
          }
          
          // Находим индекс последней реальной свечи (без фейковых)
          // Предполагаем, что фейковые свечи имеют volume = 0
          let lastRealCandleIndex = -1;
          for (let i = processedData.length - 1; i >= 0; i--) {
            const candle = processedData[i] as any;
            if (candle.volume && candle.volume > 0) {
              lastRealCandleIndex = i;
              break;
            }
          }
          
          // Если не нашли реальные свечи, используем последние 50
          const realCandleIndex = lastRealCandleIndex >= 0 ? lastRealCandleIndex : totalDataPoints - 1;
          
          // Показываем максимум 50 свечей
          const maxVisibleCandles = 50;
          
          // Вычисляем начальный индекс так, чтобы последняя реальная свеча была по центру
          const centerIndex = realCandleIndex;
          const halfVisible = Math.floor(maxVisibleCandles / 2);
          
          // Начальный индекс - половина видимых свечей до центра
          const startIndex = Math.max(0, centerIndex - halfVisible);
          
          // Конечный индекс - половина видимых свечей после центра
          let endIndex = Math.min(totalDataPoints - 1, centerIndex + halfVisible);
          
          // Убеждаемся, что endIndex больше startIndex
          if (endIndex <= startIndex) {
            endIndex = Math.min(totalDataPoints - 1, startIndex + 1);
          }
          
          // Дополнительная проверка валидности индексов
          if (startIndex >= totalDataPoints || endIndex >= totalDataPoints || startIndex < 0 || endIndex < 0) {
            console.warn('[ChartComponent] ⚠️ Invalid indices:', { startIndex, endIndex, totalDataPoints });
            return;
          }
          
          const firstTime = processedData[startIndex].time as number;
          const lastTime = processedData[endIndex].time as number;
          
          // Валидация диапазона времени
          if (firstTime >= lastTime) {
            console.warn('[ChartComponent] ⚠️ Invalid time range: firstTime >= lastTime', { firstTime, lastTime });
            return;
          }
          
          // Применяем начальный видимый диапазон только один раз, чтобы не сбрасывать зум пользователя при обновлениях
          if (!initialRangeAppliedRef.current) {
            isProgrammaticRangeChangeRef.current = true;
            const range = { from: firstTime as Time, to: lastTime as Time };
            
            try {
              chartInstance.timeScale().setVisibleRange(range as any);
              initialRangeAppliedRef.current = true;
            } catch (rangeError) {
              console.error('[ChartComponent] ❌ Error setting visible range:', rangeError, { range });
            }
          } else {
            // Если зум уже был применен, проверяем, не нужно ли его скорректировать
            const currentRange = chartInstance.timeScale().getVisibleRange();
            if (currentRange && typeof currentRange.from === 'number' && typeof currentRange.to === 'number') {
              // Проверяем, не выходит ли текущий зум за пределы данных
              const currentFrom = currentRange.from as number;
              const currentTo = currentRange.to as number;
              
              if (currentFrom < firstTime || currentTo > lastTime) {
                // Корректируем зум, чтобы он не выходил за пределы данных
                // Но только если границы данных корректны
                if (firstTime < lastTime) {
                  let correctedFrom = currentFrom;
                  let correctedTo = currentTo;
                  
                  // Корректируем только если выходим за границы
                  if (currentFrom < firstTime) {
                    correctedFrom = firstTime;
                  }
                  if (currentTo > lastTime) {
                    correctedTo = lastTime;
                  }
                  
                  // Дополнительная проверка: убеждаемся что диапазон корректен
                  if (correctedFrom < correctedTo && (correctedFrom !== currentFrom || correctedTo !== currentTo)) {
                    isProgrammaticRangeChangeRef.current = true;
                    const correctedRange = { from: correctedFrom as Time, to: correctedTo as Time };
                    
                    try {
                      chartInstance.timeScale().setVisibleRange(correctedRange as any);
                    } catch (rangeError) {
                      console.error('[ChartComponent] ❌ Error setting corrected range:', rangeError, { correctedRange });
                    }
                  }
                } else {
                  console.warn('[ChartComponent] ⚠️ Skipping range correction due to invalid data bounds', { firstTime, lastTime });
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('[ChartComponent] ❌ Error updating crypto data:', err);
      
      // Сбрасываем флаг, чтобы попытаться снова при следующем обновлении
      if (err instanceof Error && err.message.includes('right should be >= left')) {
        console.warn('[ChartComponent] 🔄 Resetting range flags due to range error');
        initialRangeAppliedRef.current = false;
      }
    }
  }, [seriesInstance, stableCryptoData, chartInstance]);

  // Обновление астрономических событий
  useEffect(() => {
    if (!chartInstance || !seriesInstance || !stableAstronomicalEvents.length) {
      return;
    }



    try {
      // Фильтруем события по активным фильтрам
      const filteredEvents = AstronomicalEventUtils.filterEventsByType(
        stableAstronomicalEvents,
        activeEventFilters
      );

      // Конвертируем события в маркеры
      const markers = AstronomicalEventUtils.convertEventsToMarkers(filteredEvents);

      if (markers.length > 0) {
        seriesInstance.setMarkers(markers as any);
      } else {
        seriesInstance.setMarkers([]);
      }
    } catch (err) {
      console.error('[ChartComponent] ❌ Error updating astronomical events:', err);
    }
  }, [seriesInstance, stableAstronomicalEvents, activeEventFilters]);

  // Обновление real-time данных
  useEffect(() => {
    if (!realTimeData || !seriesInstance || !chartInstance) {
      return;
    }

    // Обновляем текущую цену для виджета
    setCurrentPrice({
      price: realTimeData.close,
      symbol: realTimeData.symbol,
      timestamp: realTimeData.timestamp,
      isLive: true
    });
    setIsPriceLoading(false); // Отключаем загрузку когда получили live данные



    try {
      // Конвертируем WebSocket данные в формат для графика
      const timeInSeconds = Math.floor(realTimeData.timestamp / 1000);
      const currentTime = Math.floor(Date.now() / 1000);
      
      console.log(`[ChartComponent] 🔍 DEBUG: Real-time update:`, {
        originalTimestamp: realTimeData.timestamp,
        timeInSeconds,
        currentTime,
        timeDiff: currentTime - timeInSeconds,
        price: realTimeData.close,
        symbol: realTimeData.symbol,
        interval: realTimeData.interval
      });
      
      // ВРЕМЕННО ОТКЛЮЧАЕМ ПРОВЕРКУ возраста данных для демонстрации обновления свечей
      const maxAgeSeconds = 60; // 1 минута
      if (currentTime - timeInSeconds > maxAgeSeconds) {
        console.log(`[ChartComponent] ⚠️ Data is old but processing anyway for demo:`, {
          dataAge: currentTime - timeInSeconds,
          maxAge: maxAgeSeconds,
          dataTime: new Date(realTimeData.timestamp).toISOString(),
          currentTime: new Date().toISOString()
        });
        // return; // ВРЕМЕННО ОТКЛЮЧАЕМ для демонстрации
      }
      
      // СОЗДАНИЕ/ОБНОВЛЕНИЕ ТЕКУЩЕЙ ОТКРЫТОЙ СВЕЧИ
      console.log(`[ChartComponent] 🕯️ Creating/updating current open candle:`, {
        price: realTimeData.close,
        wsTimestamp: new Date(realTimeData.timestamp).toISOString(),
        interval: realTimeData.interval
      });
      
      try {
        // Получаем все данные серии
        const allData = seriesInstance.data() as any[];
        
        if (allData && allData.length > 0) {
          // Берем последнюю историческую свечу
          const lastHistoricalCandle = allData[allData.length - 1];
          
          // Вычисляем время для следующей свечи на основе таймфрейма
          let nextCandleTime: number;
          const intervalSeconds = {
            '1h': 3600,      // 1 час = 3600 секунд
            '1d': 86400,     // 1 день = 86400 секунд
            '1w': 604800,    // 1 неделя = 604800 секунд
            '1M': 2592000    // 1 месяц ≈ 30 дней
          };
          
          const interval = intervalSeconds[realTimeData.interval as keyof typeof intervalSeconds] || 3600;
          nextCandleTime = lastHistoricalCandle.time + interval;
          
          console.log(`[ChartComponent] 🕐 Next candle time calculated:`, {
            interval: realTimeData.interval,
            lastCandleTime: new Date(lastHistoricalCandle.time * 1000).toISOString(),
            nextCandleTime: new Date(nextCandleTime * 1000).toISOString(),
            intervalSeconds: interval
          });
          
          // Проверяем, есть ли уже "следующая" свеча
          const existingNextCandle = allData.find(candle => candle.time === nextCandleTime);
          
          if (existingNextCandle) {
            // Обновляем существующую следующую свечу - ПОЛНОСТЬЮ ПРОЗРАЧНУЮ
            const updatedCandle = {
              time: nextCandleTime as any,
              open: existingNextCandle.open, // Сохраняем оригинальный open
              high: Math.max(existingNextCandle.high, realTimeData.close), // Обновляем high
              low: Math.min(existingNextCandle.low, realTimeData.close), // Обновляем low
              close: realTimeData.close, // Обновляем close с live данными
              volume: existingNextCandle.volume, // Сохраняем volume
              // Делаем свечу полностью прозрачной
              color: 'rgba(0, 0, 0, 0)', // Полностью прозрачный цвет
              borderColor: 'rgba(0, 0, 0, 0)', // Прозрачная граница
              wickColor: 'rgba(0, 0, 0, 0)' // Прозрачный фитиль
            };
            
            seriesInstance.update(updatedCandle as any);
            console.log(`[ChartComponent] 🔄 Updated existing transparent next candle:`, {
              time: new Date(nextCandleTime * 1000).toISOString(),
              oldClose: existingNextCandle.close,
              newClose: realTimeData.close
            });
            
          } else {
            // Создаем новую свечу после последней исторической - ПОЛНОСТЬЮ ПРОЗРАЧНУЮ
            const newNextCandle = {
              time: nextCandleTime as any,
              open: realTimeData.close, // Открытие = текущая цена
              high: realTimeData.close, // High = текущая цена
              low: realTimeData.close, // Low = текущая цена  
              close: realTimeData.close, // Close = текущая цена
              volume: 0, // Начальный volume
              // Делаем свечу полностью прозрачной
              color: 'rgba(0, 0, 0, 0)', // Полностью прозрачный цвет
              borderColor: 'rgba(0, 0, 0, 0)', // Прозрачная граница
              wickColor: 'rgba(0, 0, 0, 0)' // Прозрачный фитиль
            };
            
            seriesInstance.update(newNextCandle as any);
            console.log(`[ChartComponent] ✨ Created new transparent next candle:`, {
              time: new Date(nextCandleTime * 1000).toISOString(),
              price: realTimeData.close,
              note: "New transparent open candle added after last historical candle"
            });
          }
          
        } else {
          console.log(`[ChartComponent] ⚠️ No historical data found to append current candle`);
        }
        
      } catch (error) {
        console.log(`[ChartComponent] ❌ Error creating/updating current candle:`, error);
      }
      
      

      // Автоматически скроллим к последней свече, если пользователь не взаимодействовал с графиком
      if (!hasUserInteractedRef.current) {
        const timeScale = chartInstance.timeScale();
        timeScale.scrollToPosition(0, false);
      }
    } catch (err) {
      console.error('[ChartComponent] ❌ Error updating real-time data:', err);
    }
  }, [realTimeData, seriesInstance, chartInstance]);

  // Установка начальной цены из исторических данных
  useEffect(() => {
    if (cryptoData.length > 0 && !currentPrice) {
      const lastCandle = cryptoData[cryptoData.length - 1];
      setCurrentPrice({
        price: lastCandle.close,
        symbol: lastCandle.symbol,
        timestamp: Date.now(),
        isLive: false
      });
      setIsPriceLoading(false); // Отключаем загрузку когда данные появились
      setIsChartLoading(false); // График загружен
    }
  }, [cryptoData, currentPrice]);

  // Обработчик событий графика (тултип при ховере)
  useEffect(() => {
    if (!chartInstance) return;



    // Мгновенный обработчик мыши для hover (без debounce)
    const handleMouseMove = (param: any) => {
      handleCrosshairMove(param);
    };

    // Подписываемся на движение курсора для тултипов
    chartInstance.subscribeCrosshairMove(handleMouseMove);

    return () => {
      chartInstance.unsubscribeCrosshairMove(handleMouseMove);
    };
  }, [chartInstance, handleCrosshairMove]);

  return (
    <div className={`relative ${className}`}>
      {/* Контейнер графика - должен быть первым для правильного позиционирования */}
      <div
        ref={chartContainerRef}
        style={{ 
          height: `${height}px`,
          minHeight: `${height}px`,
          width: '100%',
          minWidth: '100%'
        }}
        className="w-full"
      />

            {/* Виджет текущей цены - всегда видимый, но с разным содержимым */}
      <div className="absolute top-4 left-4 z-30 bg-[#0a0b1e]/95 backdrop-blur-sm border border-[#334155] rounded-lg px-4 py-3 shadow-lg">
        <div className="flex flex-col items-start gap-2">
          {/* Символ всегда показываем */}
          <div className="flex items-center gap-2">
            <div className="text-[#e2e8f0] font-semibold text-sm">
              {symbol || 'BTCUSDT'}
            </div>
            {!isChartLoading && currentPrice && (
              <div className={`w-2 h-2 rounded-full ${currentPrice.isLive ? 'bg-[#10b981] animate-pulse' : 'bg-[#6b7280]'}`}
                   title={currentPrice.isLive ? 'Live данные' : 'Исторические данные'} />
            )}
          </div>

          {/* Цена - показываем только после загрузки графика */}
          {!isChartLoading && currentPrice ? (
            <>
              {/* Цена */}
              <div className="text-[#f7931a] font-bold text-xl">
                ${currentPrice.price.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>

            </>
          ) : (
            <>
              {/* Пустое место для цены при загрузке */}
              <div className="text-[#f7931a] font-bold text-xl">
                &nbsp;
              </div>

            </>
          )}
        </div>
      </div>

      {/* Индикатор загрузки */}
      {isLoading && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-30 bg-[#0a0b1e]/90 backdrop-blur-sm border border-[#334155] rounded-lg px-4 py-3 shadow-lg">
          <div className="text-[#e2e8f0] text-center flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#f7931a]"></div>
            <div className="text-sm">Загрузка данных...</div>
          </div>
        </div>
      )}

      {/* Индикатор ошибки */}
      {error && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 bg-[#dc2626]/90 backdrop-blur-sm border border-[#dc2626] rounded-lg px-4 py-3 shadow-lg">
          <div className="text-[#fecaca] text-center">
            <div className="text-sm font-semibold mb-1">Ошибка</div>
            <div className="text-xs">{error}</div>
          </div>
        </div>
      )}

      {/* Тултип для астрономических событий */}
      {tooltip.visible && (
        <div 
          className="absolute z-10 bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 shadow-lg pointer-events-none astro-tooltip transition-instant opacity-instant tooltip-instant gpu-off tooltip-visible instant-response"
          style={{ 
            left: `${tooltip.x}px`, 
            top: `${tooltip.y}px`,
            maxWidth: '350px'
          }}
        >
          {tooltip.events ? (
            // Стэк событий
            <div className="space-y-2">
              <div className="text-[#e2e8f0] font-semibold text-sm mb-2 border-b border-[#334155] pb-1">
                События ({tooltip.events.length})
              </div>
              {tooltip.events.map((event, index) => (
                <div key={index} className="border-l-2 border-[#f7931a] pl-2">
                  <div className="text-[#e2e8f0] font-medium text-sm mb-1">
                    {event.name}
                  </div>
                  <div className="text-[#8b8f9b] text-xs mb-1">
                    {new Date(event.timestamp).toLocaleString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="text-[#8b8f9b] text-xs">
                    {event.description}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Одно событие
            <>
              <div className="text-[#e2e8f0] font-semibold text-sm mb-1">{tooltip.title}</div>
              <div className="text-[#8b8f9b] text-xs">{tooltip.description}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}; 

export default ChartComponent;