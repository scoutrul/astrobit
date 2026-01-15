import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { 
  createChart, 
  IChartApi, 
  ISeriesApi, 
  Time, 
  UTCTimestamp,
  CandlestickData,
  Range
} from 'lightweight-charts';
import { TimeframeUtils } from '../../Infrastructure/utils/TimeframeUtils';
import { AstronomicalEventUtils, AstronomicalEvent } from '../../Infrastructure/utils/AstronomicalEventUtils';
import { DateTimeFormatter } from '../../../Shared/infrastructure/utils/DateTimeFormatter';
import { BinanceKlineWebSocketData } from '../../../CryptoData/Infrastructure/external-services/BinanceWebSocketService';

interface MultiChartOverlayProps {
  symbols: string[];
  timeframe: string;
  multiSymbolData: Array<{ symbol: string; data: CryptoData[] }>;
  symbolColors: Map<string, string>;
  astronomicalEvents: AstronomicalEvent[];
  eventFilters: {
    lunar?: boolean;
    solar?: boolean;
    planetary?: boolean;
    meteor?: boolean;
  };
  height?: number;
  realTimeData?: BinanceKlineWebSocketData | null;
  isLoading?: boolean;
}

interface CryptoData {
  symbol: string;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  visible?: boolean;
}

type CandleWithMeta = Omit<CandlestickData, 'time'> & {
  time: UTCTimestamp;
  volume?: number;
  visible?: boolean;
};

// Более контрастные цвета для графиков
const SYMBOL_COLORS = [
  '#f7931a', // Orange (BTC) - яркий оранжевый
  '#627eea', // Blue (ETH) - яркий синий
  '#14f195', // Green (SOL) - яркий зеленый
  '#ff6b6b', // Red - яркий красный
  '#00d4ff', // Cyan - яркий голубой
  '#ffd700', // Gold - золотой
  '#ff1493', // Deep Pink - яркий розовый
  '#00ff00', // Lime - лайм
  '#ff4500', // Orange Red - оранжево-красный
  '#9370db'  // Medium Purple - фиолетовый
];

export const MultiChartOverlay: React.FC<MultiChartOverlayProps> = ({
  symbols,
  timeframe,
  multiSymbolData,
  symbolColors,
  astronomicalEvents = [],
  eventFilters = { lunar: true, solar: true, planetary: true, meteor: true },
  height = 500,
  realTimeData = null,
  isLoading = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartsRef = useRef<Map<string, IChartApi>>(new Map());
  const seriesRef = useRef<Map<string, ISeriesApi<"Candlestick">>>(new Map());
  const masterChartRef = useRef<IChartApi | null>(null);
  const [hasData, setHasData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isProgrammaticRangeChangeRef = useRef(false);
  const initialRangeAppliedRef = useRef(false);

  // Стабилизируем фильтры событий
  const activeEventFilters = useMemo(() => eventFilters, [
    eventFilters.lunar,
    eventFilters.solar,
    eventFilters.planetary,
    eventFilters.meteor
  ]);

  // Стабилизируем астрономические события
  const stableAstronomicalEvents = useMemo(() => astronomicalEvents, [astronomicalEvents]);

  // Фильтруем события по активным фильтрам
  const filteredEvents = useMemo(() => {
    return AstronomicalEventUtils.filterEventsByType(stableAstronomicalEvents, activeEventFilters);
  }, [stableAstronomicalEvents, activeEventFilters]);

  // Конвертируем события в маркеры
  const markers = useMemo(() => {
    return AstronomicalEventUtils.convertEventsToMarkers(filteredEvents);
  }, [filteredEvents]);

  // Синхронизация timeScale: master график управляет остальными
  const syncTimeScale = useCallback((masterChart: IChartApi) => {
    const masterTimeScale = masterChart.timeScale();
    
    const handleVisibleRangeChange = (range: Range<Time> | null) => {
      if (isProgrammaticRangeChangeRef.current) {
        isProgrammaticRangeChangeRef.current = false;
        return;
      }

      if (range && typeof range.from === 'number' && typeof range.to === 'number') {
        // Синхронизируем все остальные графики
        chartsRef.current.forEach((chart) => {
          if (chart !== masterChart) {
            try {
              isProgrammaticRangeChangeRef.current = true;
              chart.timeScale().setVisibleRange({
                from: range.from as Time,
                to: range.to as Time
              });
            } catch (err) {
              // Игнорируем ошибки синхронизации
            }
          }
        });
      }
    };

    masterTimeScale.subscribeVisibleTimeRangeChange(handleVisibleRangeChange);
    
    return () => {
      masterTimeScale.unsubscribeVisibleTimeRangeChange(handleVisibleRangeChange);
    };
  }, []);

  // Инициализация графиков
  useEffect(() => {
    if (!containerRef.current || symbols.length === 0) {
      return;
    }

    // Очищаем старые графики
    chartsRef.current.forEach((chart) => {
      try {
        chart.remove();
      } catch (err) {
        // Игнорируем ошибки
      }
    });
    chartsRef.current.clear();
    seriesRef.current.clear();
    masterChartRef.current = null;
    initialRangeAppliedRef.current = false;

    // Получаем ширину контейнера один раз для всех графиков
    const containerWidth = containerRef.current!.clientWidth;

    // Создаем график для каждого символа
    symbols.forEach((symbol, index) => {
      const chartDiv = document.createElement('div');
      chartDiv.style.position = 'absolute';
      chartDiv.style.top = '0';
      chartDiv.style.left = '0';
      chartDiv.style.width = '100%';
      chartDiv.style.height = '100%';
      containerRef.current!.appendChild(chartDiv);

      const isMaster = index === 0; // Первый график - master

      const chart = createChart(chartDiv, {
        width: containerWidth, // Используем одинаковую ширину для всех
        height: height,
        layout: {
          background: { color: isMaster ? '#0a0b1e' : 'transparent' },
          textColor: '#e2e8f0'
        },
        grid: {
          vertLines: { color: isMaster ? '#1e293b' : 'transparent' },
          horzLines: { color: isMaster ? '#1e293b' : 'transparent' }
        },
        crosshair: {
          mode: 0,
          vertLine: {
            color: '#f7931a',
            width: 1,
            style: 2,
            visible: isMaster,
            labelVisible: isMaster
          },
          horzLine: {
            color: '#f7931a',
            width: 1,
            style: 2,
            visible: isMaster,
            labelVisible: isMaster
          }
        },
        handleScroll: {
          mouseWheel: isMaster,
          pressedMouseMove: isMaster
        },
        handleScale: {
          mouseWheel: isMaster,
          pinch: isMaster
        },
        rightPriceScale: {
          visible: false // Скрываем ценовые шкалы для всех графиков в режиме наложения
        },
        leftPriceScale: {
          visible: false
        },
        timeScale: {
          borderColor: '#334155', // Одинаковая граница для всех графиков
          timeVisible: true, // Показываем временную шкалу для всех
          secondsVisible: false,
          fixLeftEdge: true,
          fixRightEdge: true
        },
        localization: {
          timeFormatter: (time: Time) => {
            const numericTime =
              typeof time === 'number'
                ? time
                : TimeframeUtils.convertTimestampToSeconds(time as any);
            return DateTimeFormatter.formatForChart(numericTime);
          }
        }
      });

      // Создаем серию свечей
      // Используем цвет из Map, если он есть, иначе назначаем по индексу
      // Первый график (index 0) - основной, получает цвет 0
      // Остальные получают цвета начиная с 1
      let color: string;
      if (symbolColors?.has(symbol)) {
        color = symbolColors.get(symbol)!;
      } else {
        // Основной график (index 0) получает первый цвет
        // Дополнительные графики получают цвета начиная с индекса 1
        color = index === 0 ? SYMBOL_COLORS[0] : SYMBOL_COLORS[((index - 1) % (SYMBOL_COLORS.length - 1)) + 1];
      }
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: color,
        downColor: color,
        borderDownColor: color,
        borderUpColor: color,
        wickDownColor: color,
        wickUpColor: color,
        priceLineVisible: false,
        lastValueVisible: isMaster,
        // Все графики используют одну и ту же ценовую шкалу 'right' для синхронизации размеров
        priceScaleId: 'right'
      });

      // Для всех графиков в режиме наложения настраиваем одинаковые параметры
      try {
        // Убеждаемся, что ценовые шкалы скрыты для всех
        chart.priceScale('right').applyOptions({ visible: false });
        chart.priceScale('left').applyOptions({ visible: false });
        // Временная шкала одинаковая для всех
        chart.timeScale().applyOptions({
          timeVisible: true,
          borderColor: '#334155'
        });
      } catch (err) {
        // Игнорируем ошибки
      }

      chartsRef.current.set(symbol, chart);
      seriesRef.current.set(symbol, candlestickSeries);

      // Первый график - master
      if (isMaster) {
        masterChartRef.current = chart;
      }
    });

    // Обработчик изменения размера
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        chartsRef.current.forEach((chart) => {
          chart.applyOptions({ width });
        });
      }
    };

    // ResizeObserver для отслеживания изменений размера контейнера
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        chartsRef.current.forEach((chart) => {
          chart.applyOptions({ width });
        });
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', handleResize);

    // Настраиваем синхронизацию для master графика
    let syncCleanup: (() => void) | undefined;
    if (masterChartRef.current) {
      syncCleanup = syncTimeScale(masterChartRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      if (syncCleanup) {
        syncCleanup();
      }
      chartsRef.current.forEach((chart) => {
        try {
          chart.remove();
        } catch (err) {
          // Игнорируем ошибки
        }
      });
      chartsRef.current.clear();
      seriesRef.current.clear();
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbols.join(','), height, syncTimeScale, symbolColors]);

  // Обновление данных для каждого графика
  useEffect(() => {
    if (chartsRef.current.size === 0 || multiSymbolData.length === 0) {
      return;
    }

    try {
      multiSymbolData.forEach((dataset) => {
        const chart = chartsRef.current.get(dataset.symbol);
        const series = seriesRef.current.get(dataset.symbol);

        if (!chart || !series || !dataset.data || dataset.data.length === 0) {
          return;
        }

        // Конвертируем данные в формат Lightweight Charts
        const chartData: CandleWithMeta[] = dataset.data.map((item) => {
          const timeInSeconds = TimeframeUtils.convertTimestampToSeconds(item.time);
          const isVisible = item.visible !== false;

          return {
            time: timeInSeconds as UTCTimestamp,
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close,
            volume: item.volume,
            visible: isVisible
          };
        });

        // Фильтруем и сортируем данные
        const processedData = TimeframeUtils.processChartData<CandleWithMeta>(chartData);

        if (processedData.length > 0) {
          isProgrammaticRangeChangeRef.current = true;
          series.setData(processedData);
          setHasData(true);

          // Устанавливаем начальный диапазон только для master графика
          if (masterChartRef.current === chart && !initialRangeAppliedRef.current) {
            try {
              if (timeframe === '1h' || timeframe === '8h') {
                isProgrammaticRangeChangeRef.current = true;
                chart.timeScale().fitContent();
              } else {
                const lastRealCandleIndex = processedData.findIndex(
                  (c) => c.visible === false
                );
                const realCandleIndex = lastRealCandleIndex >= 0 
                  ? lastRealCandleIndex 
                  : Math.max(0, processedData.length - 50);
                const startIndex = Math.max(0, realCandleIndex - 150);
                const endIndex = Math.min(processedData.length - 1, realCandleIndex + 50);
                
                isProgrammaticRangeChangeRef.current = true;
                chart.timeScale().setVisibleLogicalRange({ from: startIndex, to: endIndex });
              }
              initialRangeAppliedRef.current = true;
            } catch (err) {
              // Игнорируем ошибки
            }
          }

          // Обновляем масштаб ценовой шкалы
          if (masterChartRef.current === chart) {
            try {
              const priceScale = chart.priceScale('right');
              priceScale.applyOptions({
                autoScale: true,
                scaleMargins: { top: 0.1, bottom: 0.1 }
              });
            } catch (err) {
              // Игнорируем ошибки
            }
          }
        }
      });
    } catch (err) {
      console.error('[MultiChartOverlay] ❌ Error updating data:', err);
      setError(err instanceof Error ? err.message : 'Ошибка обновления данных');
    }
  }, [multiSymbolData, timeframe]);

  // В режиме наложения не показываем астрономические события ни на одном графике
  useEffect(() => {
    if (seriesRef.current.size === 0 || symbols.length === 0) {
      return;
    }

    // Очищаем маркеры у всех графиков в режиме наложения
    symbols.forEach((symbol) => {
      const series = seriesRef.current.get(symbol);
      if (series) {
        try {
          series.setMarkers([]);
        } catch (err) {
          // Игнорируем ошибки
        }
      }
    });
  }, [markers, symbols]);

  // Обновление real-time данных
  useEffect(() => {
    if (!realTimeData || seriesRef.current.size === 0) {
      return;
    }

    const series = seriesRef.current.get(realTimeData.symbol);
    if (!series) {
      return;
    }

    try {
      // Проверяем, что timestamp - число
      let timestamp: number;
      if (typeof realTimeData.timestamp === 'number') {
        timestamp = realTimeData.timestamp;
      } else if (realTimeData.timestamp && typeof realTimeData.timestamp === 'object' && 'getTime' in realTimeData.timestamp) {
        // Если это объект Date
        timestamp = (realTimeData.timestamp as Date).getTime();
      } else {
        // Если это строка или другой формат, конвертируем
        timestamp = new Date(realTimeData.timestamp as any).getTime();
      }

      const timeInSeconds = Math.floor(timestamp / 1000);
      
      // Проверяем существующие данные, чтобы не обновлять старые свечи
      const existingData = series.data();
      if (existingData && existingData.length > 0) {
        const lastCandle = existingData[existingData.length - 1];
        const lastCandleTime = typeof lastCandle.time === 'number'
          ? lastCandle.time
          : TimeframeUtils.convertTimestampToSeconds(lastCandle.time as any);
        
        // Если новая свеча старше последней, не обновляем
        if (timeInSeconds < lastCandleTime) {
          return;
        }
      }

      const updatedCandle: CandleWithMeta = {
        time: timeInSeconds as UTCTimestamp,
        open: realTimeData.open,
        high: realTimeData.high,
        low: realTimeData.low,
        close: realTimeData.close
      };

      series.update(updatedCandle);
    } catch (err) {
      console.error('[MultiChartOverlay] ❌ Error updating real-time data:', err);
    }
  }, [realTimeData]);

  return (
    <div className="relative w-full" style={{ height: `${height}px` }}>
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          opacity: hasData ? 1 : 0,
          transition: 'opacity 120ms ease-out'
        }}
      />

      {error && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 bg-[#dc2626]/90 backdrop-blur-sm border border-[#dc2626] rounded-lg px-4 py-3 shadow-lg">
          <div className="text-[#fecaca] text-center">
            <div className="text-sm font-semibold mb-1">Ошибка</div>
            <div className="text-xs">{error}</div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-30 bg-[#0a0b1e]/90 backdrop-blur-sm border border-[#334155] rounded-lg px-4 py-3 shadow-lg">
          <div className="text-[#e2e8f0] text-center flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#f7931a]"></div>
            <div className="text-sm">Загрузка данных...</div>
          </div>
        </div>
      )}
    </div>
  );
};
