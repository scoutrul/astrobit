import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi, Time, UTCTimestamp } from 'lightweight-charts';
import { TimeframeUtils } from '../../Infrastructure/utils/TimeframeUtils';
import { AstronomicalEventUtils, AstronomicalEvent } from '../../Infrastructure/utils/AstronomicalEventUtils';
import { BinanceKlineWebSocketData } from '../../../CryptoData/Infrastructure/external-services/BinanceWebSocketService';
import { LivePriceWidget } from './LivePriceWidget';

// Глушим отладочные логи в консоли (оставляем только ошибки)
const SILENCE_DEBUG_LOGS = true;
if (SILENCE_DEBUG_LOGS && typeof window !== 'undefined') {
  // @ts-ignore
  console.log = () => {};
  // @ts-ignore
  console.warn = () => {};
}

interface ChartComponentProps {
  symbol: string;
  timeframe: string;
  height?: number;
  className?: string;
  cryptoData?: Array<{
    symbol: string;
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    visible?: boolean;
  }>;
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

  // Флаги и refs для управления зумом/скроллом без сбросов
  const hasUserInteractedRef = useRef(false);
  const isProgrammaticRangeChangeRef = useRef(false);
  const initialRangeAppliedRef = useRef(false);
  const lastManualRangeRef = useRef<any>(null);

  // Стабилизируем фильтры событий, чтобы избежать лишних обновлений
  const activeEventFilters = useMemo(() => eventFilters, [
    eventFilters.lunar,
    eventFilters.solar,
    eventFilters.planetary,
    eventFilters.meteor
  ]);

  // Стабилизируем астрономические события, чтобы избежать лишних обновлений
  const stableAstronomicalEvents = useMemo(() => astronomicalEvents, [astronomicalEvents]);



  // Состояние для принудительного пересоздания графика
  const [forceRecreateKey, setForceRecreateKey] = useState(0);
  
  // Ключ для принудительного пересоздания компонента при смене symbol/timeframe
  // Добавляем timestamp для принудительного пересоздания
  const chartKey = useMemo(() => {
    const baseKey = `${symbol}-${timeframe}-${forceRecreateKey}`;
    return baseKey;
  }, [symbol, timeframe, forceRecreateKey]);
  
  // Сброс флагов при смене symbol/timeframe
  useEffect(() => {
    
    // Принудительно очищаем все данные и состояние
    setChartInstance(null);
    setSeriesInstance(null);
    
    // Сбрасываем forceRecreateKey при смене symbol/timeframe
    setForceRecreateKey(0);
    
    // Сбрасываем все refs
    hasUserInteractedRef.current = false;
    isProgrammaticRangeChangeRef.current = false;
    initialRangeAppliedRef.current = false;
    lastManualRangeRef.current = null;
    
    // Принудительно удаляем старый график при смене монеты
    if (chartInstance) {
      try {
        // Очищаем данные серии перед удалением
        if (seriesInstance) {
          try {
            seriesInstance.setData([]);
          } catch (err) {
            
          }
        }
        
        chartInstance.remove();
        
      } catch (err) {
        
      }
    }
    
    // Принудительно очищаем все данные из состояния
    
    
    // Очищаем контейнер от всех графиков
    if (chartContainerRef.current) {
      const existingCharts = chartContainerRef.current.querySelectorAll('.tv-lightweight-charts');
      existingCharts.forEach(chart => {
        try {
          chart.remove();
        } catch (err) {
          
        }
      });
      
    }
    
    // Принудительно вызываем пересоздание графика
    
  }, [symbol, timeframe]); // Убрал chartInstance из зависимостей

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
    } else if (param.point && param.point.x) {
      // Если нет времени, но есть позиция курсора, показываем тултип в позиции мыши
      setTooltip({
        x: param.point.x,
        y: param.point.y - 60,
        events: stableAstronomicalEvents.filter(event => {
          const eventTimeInSeconds = Math.floor(event.timestamp / 1000);
          const currentTime = Math.floor(Date.now() / 1000);
          const diff = Math.abs(eventTimeInSeconds - currentTime);
          return diff <= 86400; // Показываем события за последние 24 часа
        }),
        visible: true
      });
      return;
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

    // Принудительно очищаем старый график при смене symbol/timeframe
    if (chartInstance) {
      try {
        chartInstance.remove();
      } catch (err) {
        // Chart was already disposed
      }
      setChartInstance(null);
      setSeriesInstance(null);
    }

    // Очищаем существующие графики если они есть
    const existingCharts = chartContainerRef.current.querySelectorAll('.tv-lightweight-charts');
    existingCharts.forEach(chart => {
      try {
        chart.remove();
      } catch (err) {
        
      }
    });

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
          mode: 0,
          vertLine: {
            color: '#f7931a',
            width: 1,
            style: 2,
            visible: true,
            labelVisible: true
          },
          horzLine: {
            color: '#f7931a',
            width: 1,
            style: 2,
            visible: true,
            labelVisible: true
          }
        },
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true
        },
        handleScale: {
          mouseWheel: true,
          pinch: true
        },
        rightPriceScale: {
          borderColor: '#334155',
          textColor: '#8b8f9b'
        },
        timeScale: {
          borderColor: '#334155',
          timeVisible: true,
          secondsVisible: false,
          fixLeftEdge: true,
          fixRightEdge: true
        }
      });

      // Создаем серию свечей с поддержкой прозрачности
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderDownColor: '#ef4444',
        borderUpColor: '#10b981',
        wickDownColor: '#ef4444',
        wickUpColor: '#10b981'
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

  // Обновление данных криптовалют
  useEffect(() => {
    
    
    if (!seriesInstance || !cryptoData.length) {
      
      return;
    }

    // Проверяем, что график и серия все еще существуют
    if (!chartInstance || !seriesInstance) {
      
      return;
    }

    // Дополнительная проверка - убеждаемся, что в контейнере есть график
    if (chartContainerRef.current) {
      const charts = chartContainerRef.current.querySelectorAll('.tv-lightweight-charts');
      if (charts.length === 0) {
        
        return;
      }
    }

    // Проверяем, что график готов к обновлению (не в процессе инициализации)
    if (!initialRangeAppliedRef.current) {
      
      
      // Если у нас есть данные и серия, но график не инициализирован,
      // принудительно устанавливаем флаг и продолжаем
      if (cryptoData && cryptoData.length > 0) {
        
        initialRangeAppliedRef.current = true;
      } else {
        return;
      }
    }

    // При смене symbol принудительно обновляем данные
    

    // Дополнительная проверка - убеждаемся, что в контейнере только один график
    if (chartContainerRef.current) {
      const charts = chartContainerRef.current.querySelectorAll('.tv-lightweight-charts');
      if (charts.length > 1) {
        
        // Удаляем все кроме первого
        for (let i = 1; i < charts.length; i++) {
          charts[i].remove();
        }
      }
    }

    try {
      // Сохраняем текущий диапазон перед обновлением данных
      let savedRange = null;
      if (chartInstance && hasUserInteractedRef.current && lastManualRangeRef.current) {
        try {
          // Используем последний сохраненный диапазон пользователя
          savedRange = lastManualRangeRef.current;
          
        } catch (err) {
          
        }
      }
      
      // Берем данные для текущего символа, если поле symbol присутствует; иначе используем весь массив
      const sourceDataAll = (cryptoData as any[]) || [];
      const hasSymbolField = sourceDataAll.some((d) => d && typeof d.symbol !== 'undefined');
      let sourceData = sourceDataAll;
      if (hasSymbolField) {
        const filtered = sourceDataAll.filter((d) => String(d.symbol).toUpperCase() === String(symbol).toUpperCase());
        if (filtered.length > 0) {
          sourceData = filtered;
        } else {
          
        }
      }
      // Конвертируем данные в формат Lightweight Charts, включая невидимые свечи как прозрачные
      const chartData = sourceData.map((item: any) => {
        const timeInSeconds = TimeframeUtils.convertTimestampToSeconds(item.time);
        const isVisible = item.visible !== false;
        
        return {
          time: timeInSeconds as any,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume,
          // Делаем невидимые свечи прозрачными
          color: isVisible ? undefined : 'rgba(0,0,0,0)',
          borderColor: isVisible ? undefined : 'rgba(0,0,0,0)',
          wickColor: isVisible ? undefined : 'rgba(0,0,0,0)'
        };
      });

      // Фильтруем и сортируем данные
      const processedData = TimeframeUtils.processChartData(chartData);
      
      if (processedData.length > 0) {
        
        
        // Обновляем данные на графике
        try {
          // Дополнительная проверка - убеждаемся, что график все еще существует
          if (chartContainerRef.current && chartContainerRef.current.querySelector('.tv-lightweight-charts')) {
            // processedData уже построены из symbolData → это точно текущий символ
            if (processedData.length > 0) {
              // processedData валидны, продолжаем
            }
            
            // Принудительно очищаем старые данные перед установкой новых
            seriesInstance.setData([]);
            
            
            // Устанавливаем новые данные
            seriesInstance.setData(processedData as any);
            
          } else {
            
            return;
          }
        } catch (err) {
          console.error(`[Chart] ❌ Ошибка при установке данных:`, err);
          // Если произошла ошибка, возможно график удален
          if (err instanceof Error && err.message && err.message.includes('disposed')) {
            
            return;
          }
        }
        
        // Принудительно обновляем масштаб ценовой шкалы при смене symbol
        if (chartInstance) {
          try {
            const priceScale = chartInstance.priceScale('right');
            priceScale.applyOptions({
              autoScale: true,
              scaleMargins: { top: 0.1, bottom: 0.1 }
            });
            
          } catch (err) {
            
          }
        }

        // Зум с показом области перехода от реальных к фейковым свечам
        if (chartInstance && processedData.length > 0) {
          const totalDataPoints = processedData.length;
          
          // Находим индекс последней реальной свечи с учетом таймфрейма
          let lastRealCandleIndex = -1;
          const currentTime = Date.now() / 1000; // текущее время в секундах
          
          // Определяем максимальный возраст свечи для разных таймфреймов
          let maxCandleAge = 86400; // 1 день по умолчанию
          switch (timeframe) {
            case '1h':
              maxCandleAge = 3600; // 1 час
              break;
            case '8h':
              maxCandleAge = 28800; // 8 часов
              break;
            case '1d':
              maxCandleAge = 86400; // 1 день
              break;
            case '1w':
              maxCandleAge = 604800; // 1 неделя
              break;
            case '1M':
              maxCandleAge = 2592000; // 1 месяц
              break;
          }
          
          // Ищем последнюю реальную свечу, которая не старше максимального возраста
          for (let i = processedData.length - 1; i >= 0; i--) {
            const candle = processedData[i] as any;
            const candleTime = candle.time as number;
            const candleAge = currentTime - candleTime;
            
            // Проверяем видимость свечи и её возраст
            if (candle.visible !== false && candleAge <= maxCandleAge * 2) { // x2 для запаса
              lastRealCandleIndex = i;
              break;
            }
          }
          
          // Если не нашли подходящие свечи, используем последние 50 от конца
          const realCandleIndex = lastRealCandleIndex >= 0 ? lastRealCandleIndex : Math.max(0, totalDataPoints - 50);
          
          // Показываем 200 свечей как требуется в техзадании
          
          // Находим индекс сегодняшней даты (последняя реальная свеча)
          const todayIndex = realCandleIndex;
          
          // Вычисляем диапазон так, чтобы фокус был на сегодняшней дате
          // Показываем 150 реальных свечей (история) + 50 фейковых (будущее для событий)
          
          // Начальный индекс - показываем историю (150 реальных свечей назад от сегодня)
          const startIndex = Math.max(0, todayIndex - 150);
          
          // Конечный индекс - показываем фейковые свечи, но отодвигаем от края
          // Берем только половину от общего количества фейковых свечей
          const totalFakeCandles = totalDataPoints - todayIndex - 1; // общее количество фейковых свечей
          const visibleFakeCandles = Math.min(50, Math.floor(totalFakeCandles / 2)); // показываем половину или максимум 50
          const endIndex = Math.min(totalDataPoints - 1, todayIndex + visibleFakeCandles);
          
          // Логируем позиционирование для отладки
          // Подсчет и преобразование дат были использованы только для логирования — удалены
          
          
          const firstTime = processedData[startIndex].time as number;
          const lastTime = processedData[endIndex].time as number;
          
          // Восстанавливаем сохраненный диапазон или применяем начальный
          if (savedRange && hasUserInteractedRef.current) {
            // Восстанавливаем пользовательский диапазон
            try {
              isProgrammaticRangeChangeRef.current = true;
              chartInstance.timeScale().setVisibleRange(savedRange as any);
              
            } catch (err) {
              
              // Применяем дефолтный диапазон при ошибке
              isProgrammaticRangeChangeRef.current = true;
              const range = { from: firstTime as Time, to: lastTime as Time };
              chartInstance.timeScale().setVisibleRange(range as any);
            }
          } else if (!initialRangeAppliedRef.current) {
            // Применяем начальный диапазон только при первой загрузке
            isProgrammaticRangeChangeRef.current = true;
            const range = { from: firstTime as Time, to: lastTime as Time };
            chartInstance.timeScale().setVisibleRange(range as any);
            
            initialRangeAppliedRef.current = true;
          } else {
            // После первой загрузки сохраняем текущую позицию пользователя
            
          }
        }
      }
    } catch (err) {
      console.error('[ChartComponent] ❌ Error updating crypto data:', err);
    }
  }, [cryptoData, chartInstance, symbol, timeframe]); // Убрал seriesInstance из зависимостей

  // Обновление астрономических событий
  useEffect(() => {
    if (!chartInstance || !seriesInstance || !stableAstronomicalEvents.length) {
      return;
    }

    // Дополнительная проверка - убеждаемся, что в контейнере есть график
    if (chartContainerRef.current) {
      const charts = chartContainerRef.current.querySelectorAll('.tv-lightweight-charts');
      if (charts.length === 0) {
        
        return;
      }
    }

    // При смене symbol принудительно обновляем астрономические события
    

    // Проверяем, что в контейнере только один график
    if (chartContainerRef.current) {
      const charts = chartContainerRef.current.querySelectorAll('.tv-lightweight-charts');
      if (charts.length > 1) {
        
        return;
      }
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
        try {
          // Проверяем, что график все еще существует
          if (chartContainerRef.current && chartContainerRef.current.querySelector('.tv-lightweight-charts')) {
            seriesInstance.setMarkers(markers as any);
            
          } else {
            
          }
        } catch (err) {
          console.error(`[Chart] ❌ Ошибка при установке астрономических событий:`, err);
        }
      } else {
        try {
          if (chartContainerRef.current && chartContainerRef.current.querySelector('.tv-lightweight-charts')) {
            seriesInstance.setMarkers([]);
            
          }
        } catch (err) {
          console.error(`[Chart] ❌ Ошибка при очистке астрономических событий:`, err);
        }
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

    // Дополнительная проверка - убеждаемся, что в контейнере есть график
    if (chartContainerRef.current) {
      const charts = chartContainerRef.current.querySelectorAll('.tv-lightweight-charts');
      if (charts.length === 0) {
        
        return;
      }
    }

    // При смене symbol принудительно обновляем real-time данные
    

    // Проверяем, что в контейнере только один график
    if (chartContainerRef.current) {
      const charts = chartContainerRef.current.querySelectorAll('.tv-lightweight-charts');
      if (charts.length > 1) {
        
        return;
      }
    }

    // Проверяем, что график готов к обновлению
    try {
      const existingData = seriesInstance.data();
      if (!existingData || existingData.length === 0) {
        
        return; // Возвращаемся, чтобы не обновлять пустой график
      }
      
      // Проверяем последнюю свечу для валидации времени
      const lastCandle = existingData[existingData.length - 1];
      
      // Проверяем, что real-time данные не старше последней свечи
      const realTimeSeconds = Math.floor(realTimeData.timestamp / 1000);
      const lastCandleTime = lastCandle.time as number;
      
      // Добавляем небольшой запас времени (5 минут) для real-time данных
      const timeTolerance = 5 * 60; // 5 минут в секундах
      
      if (lastCandle && realTimeSeconds < (lastCandleTime - timeTolerance)) {
        
        return;
      }
      
      // Если данные немного старше, но в пределах допуска, все равно обновляем
      if (realTimeSeconds < lastCandleTime) {
        
      }
      
      // Дополнительная проверка: не обновляем позицию если пользователь взаимодействовал с графиком
      if (hasUserInteractedRef.current) {
        
        
        // Сохраняем текущую позицию перед обновлением
        try {
          const currentRange = chartInstance.timeScale().getVisibleRange();
          if (currentRange) {
            lastManualRangeRef.current = currentRange;
            
          }
        } catch (err) {
          
        }
      }
    } catch (err) {
      
      return;
    }

    try {
      // Конвертируем WebSocket данные в формат для графика
      const timeInSeconds = Math.floor(realTimeData.timestamp / 1000);
      

      
      // Проверяем валидность данных
      if (!realTimeData.open || !realTimeData.high || !realTimeData.low || !realTimeData.close) {
        
        return;
      }

      // Отладочная информация (только для закрытых свечей)
      if (realTimeData.isClosed) {
        
      }

      // Создаем обновленную свечу с правильным форматом времени
      const updatedCandle = {
        time: timeInSeconds as UTCTimestamp, // Правильный тип для LightweightCharts
        open: realTimeData.open,
        high: realTimeData.high,
        low: realTimeData.low,
        close: realTimeData.close
      };
      


      // Простое обновление - LightweightCharts сам разберется
      seriesInstance.update(updatedCandle);
      
      

      // НЕ автоматически скроллим при real-time обновлениях
      // Пользователь должен сам управлять позицией графика
      // Убираем автоматический скролл, чтобы не сбрасывать позицию пользователя
    } catch (err) {
      console.error('[ChartComponent] ❌ Error updating real-time data:', err);
    }
  }, [realTimeData, seriesInstance, chartInstance]);

  // Обработчик событий графика (тултип при ховере)
  useEffect(() => {
    if (!chartInstance) return;

    // Проверяем, что в контейнере только один график
    if (chartContainerRef.current) {
      const charts = chartContainerRef.current.querySelectorAll('.tv-lightweight-charts');
      if (charts.length > 1) {
        
        return;
      }
    }

    // Мгновенный обработчик мыши для hover (без debounce)
    const handleMouseMove = (param: any) => {
      handleCrosshairMove(param);
    };

    // Обработчик движения мыши для показа кроссшеира
    const handleMouseMoveOnChart = (event: MouseEvent) => {
      if (chartInstance && chartContainerRef.current) {
        const rect = chartContainerRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Показываем кроссшеир в позиции курсора
        const time = chartInstance.timeScale().coordinateToTime(x);
        if (time !== null && seriesInstance) {
          const price = seriesInstance.coordinateToPrice(y);
          if (price !== null) {
            chartInstance.setCrosshairPosition(price, time as Time, seriesInstance);
          }
        }
      }
    };

    // Подписываемся на движение курсора для тултипов
    chartInstance.subscribeCrosshairMove(handleMouseMove);

    // Включаем кроссшеир при наведении мыши
    const handleMouseEnter = () => {
      if (chartInstance) {
        chartInstance.applyOptions({
          crosshair: {
            mode: 0
          }
        });
      }
    };

    // Отключаем кроссшеир при уходе мыши
    const handleMouseLeave = () => {
      if (chartInstance) {
        chartInstance.applyOptions({
          crosshair: {
            mode: 0
          }
        });
      }
    };

    // Добавляем обработчики событий мыши
    if (chartContainerRef.current) {
      chartContainerRef.current.addEventListener('mouseenter', handleMouseEnter);
      chartContainerRef.current.addEventListener('mouseleave', handleMouseLeave);
      chartContainerRef.current.addEventListener('mousemove', handleMouseMoveOnChart);
    }

    return () => {
      chartInstance.unsubscribeCrosshairMove(handleMouseMove);
      if (chartContainerRef.current) {
        chartContainerRef.current.removeEventListener('mouseenter', handleMouseEnter);
        chartContainerRef.current.removeEventListener('mouseleave', handleMouseLeave);
        chartContainerRef.current.removeEventListener('mousemove', handleMouseMoveOnChart);
      }
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

      {/* Live Price Widget */}
      <LivePriceWidget 
        symbol={symbol}
        realTimeData={realTimeData}
        isLoading={isLoading}
      />

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