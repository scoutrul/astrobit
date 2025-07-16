import { useEffect, useRef, useState, useMemo } from 'react';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';
import { useCryptoData } from '../../hooks/useCryptoData';
import { useAstronomicalEvents } from '../../hooks/useAstronomicalEvents';
import { useStore } from '../../store';
import { CryptoData } from '../../types';

interface ChartProps {
  height?: number;
  className?: string;
}

interface TooltipData {
  x: number;
  y: number;
  title: string;
  description: string;
  visible: boolean;
}

export default function SimpleChart({ height, className = '' }: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const astronomicalEventsRef = useRef<any[]>([]);
  const [isChartReady, setIsChartReady] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipData>({
    x: 0,
    y: 0,
    title: '',
    description: '',
    visible: false
  });
  
  // Получение текущего символа и таймфрейма из хранилища
  const { symbol, timeframe } = useStore();
  
  // Использование простого API Bybit
  const {
    data: cryptoData,
    loading,
    error
  } = useCryptoData(symbol, timeframe);

  // Мемоизируем расчет диапазона дат для астрономических событий
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    // Добавляем прогноз на 3 месяца вперед
    const endDate = new Date(now);
    endDate.setMonth(now.getMonth() + 3);
    
    let startDate = new Date(now);
    
    // Расчет начальной даты на основе таймфрейма для полного покрытия графика
    switch (timeframe) {
      case '1h':
        startDate.setMonth(now.getMonth() - 2); // 2 месяца назад
        break;
      case '8h':
        startDate.setMonth(now.getMonth() - 6); // 6 месяцев назад
        break;
      case '1d':
        startDate.setFullYear(now.getFullYear() - 2); // 2 года назад
        break;
      case '1w':
        startDate.setFullYear(now.getFullYear() - 3); // 3 года назад
        break;
      case '1M':
        startDate.setFullYear(now.getFullYear() - 5); // 5 лет назад
        break;
      default:
        startDate.setFullYear(now.getFullYear() - 1); // По умолчанию 1 год назад
    }
    
    return { startDate, endDate };
  }, [timeframe]); // Пересчитываем только при изменении таймфрейма
  
  // Получение астрономических событий
  const {
    events: astronomicalEvents,
    loading: astroLoading,
    error: astroError,
    currentMoonPhase
  } = useAstronomicalEvents(startDate, endDate);

  // Инициализация графика
  useEffect(() => {
    if (!chartContainerRef.current) return;

    console.log('[Chart] Инициализация графика...');

    // Автоматическое определение высоты контейнера
    const containerHeight = height || chartContainerRef.current.clientHeight || 400;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: containerHeight,
      layout: {
        background: { color: '#0a0b1e' },
        textColor: '#e2e8f0',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#334155',
        visible: true,
        autoScale: true,
      },
      timeScale: {
        borderColor: '#334155',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Создание свечной серии
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10b981', // Зелёный для роста
      downColor: '#ef4444', // Красный для падения
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;
    setIsChartReady(true);

    console.log('[Chart] График инициализирован');

    // Обработчик изменения размера
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        const newHeight = height || chartContainerRef.current.clientHeight || 400;
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: newHeight,
        });
      }
    };

    // Обработчик движения мыши для тултипов маркеров
    const handleMouseMove = (event: MouseEvent) => {
      if (!chartContainerRef.current) return;
      
      const rect = chartContainerRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Проверяем, находится ли курсор рядом с маркером
      // Это упрощенная проверка - в реальности нужно более сложная логика
      const timeScale = chart.timeScale();
      const mouseTime = timeScale.coordinateToTime(x);
      
      // Избегаем лишних обновлений состояния
      setTooltip(prev => {
        if (mouseTime && astronomicalEventsRef.current.length > 0) {
          // Ищем ближайшее событие
          const nearestEvent = astronomicalEventsRef.current.find(event => {
            const eventTime = Math.floor(event.timestamp / 1000);
            const timeDiff = Math.abs((mouseTime as number) - eventTime);
            return timeDiff < 86400; // В пределах дня
          });
          
          if (nearestEvent && y < 100) { // Проверяем, что курсор в верхней части графика
            if (prev.visible && prev.title === nearestEvent.name) {
              // Обновляем только позицию, если тот же event
              return { ...prev, x: x + 10, y: y - 10 };
            }
            return {
              x: x + 10,
              y: y - 10,
              title: nearestEvent.name,
              description: nearestEvent.description,
              visible: true
            };
          }
        }
        
        // Скрываем тултип, только если он был видим
        if (prev.visible) {
          return { ...prev, visible: false };
        }
        
        return prev;
      });
    };

    const handleMouseLeave = () => {
      setTooltip(prev => ({ ...prev, visible: false }));
    };

    window.addEventListener('resize', handleResize);
    chartContainerRef.current.addEventListener('mousemove', handleMouseMove);
    chartContainerRef.current.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartContainerRef.current) {
        chartContainerRef.current.removeEventListener('mousemove', handleMouseMove);
        chartContainerRef.current.removeEventListener('mouseleave', handleMouseLeave);
      }
      if (chart) {
        chart.remove();
      }
      chartRef.current = null;
      seriesRef.current = null;
      setIsChartReady(false);
    };
  }, [height]); // Убираем astronomicalEvents из зависимостей - график инициализируется только один раз

  // Обновление данных графика при изменении криптоданных
  useEffect(() => {
    if (!isChartReady || !seriesRef.current || !cryptoData.length) {
      console.log('[Chart] График не готов или нет данных');
      return;
    }

    try {
      console.log(`[Chart] Обновление данных графика: ${cryptoData.length} свечей`);
      
      // Преобразуем данные для lightweight-charts
      const chartData = cryptoData
        .map((item: CryptoData) => {
          // Валидация данных OHLC
          if (item.open <= 0 || item.high <= 0 || item.low <= 0 || item.close <= 0) {
            console.warn('[Chart] Пропущена свеча с некорректными данными:', item);
            return null;
          }
          
          if (item.high < Math.max(item.open, item.close) || 
              item.low > Math.min(item.open, item.close)) {
            console.warn('[Chart] Пропущена свеча с некорректными high/low:', item);
            return null;
          }

          // Преобразуем строковое время в число для lightweight-charts
          const timeNumber = parseInt(item.time);

          return {
            time: timeNumber,
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close,
          };
        })
        .filter(Boolean) // Удаляем null значения
        .sort((a, b) => a!.time - b!.time); // Сортировка по времени

      console.log(`[Chart] Валидных свечей: ${chartData.length}`);
      console.log(`[Chart] Временной диапазон: ${new Date((chartData[0]?.time || 0) * 1000).toLocaleString()} - ${new Date((chartData[chartData.length - 1]?.time || 0) * 1000).toLocaleString()}`);

      if (chartData.length > 0) {
        // Устанавливаем данные
        seriesRef.current.setData(chartData as any);

        // Подгоняем график под данные
        if (chartRef.current) {
          chartRef.current.timeScale().fitContent();
        }

        console.log(`[Chart] График обновлён: ${chartData.length} свечей`);
      } else {
        console.warn('[Chart] Нет валидных данных для отображения');
      }
    } catch (error) {
      console.error('[Chart] Ошибка обновления данных графика:', error);
    }
  }, [cryptoData, isChartReady]);

  // Добавление астрономических событий в виде маркеров
  useEffect(() => {
    // Обновляем ref с астрономическими событиями для использования в обработчиках
    astronomicalEventsRef.current = astronomicalEvents;
    
    if (!isChartReady || !seriesRef.current || !astronomicalEvents.length) {
      console.log('[Chart] График не готов или нет астрономических событий');
      return;
    }

    try {
      console.log(`[Chart] 🌙 Добавление ${astronomicalEvents.length} астрономических событий на график`);
      
      // Преобразуем астрономические события в маркеры для lightweight-charts
      const markers = astronomicalEvents
        .map((event) => {
          // Конвертируем timestamp в секунды (lightweight-charts ожидает секунды)
          const timeInSeconds = Math.floor(event.timestamp / 1000);
          
          // Выбираем иконку и цвет в зависимости от типа события
          let shape: 'circle' | 'square' | 'arrowUp' | 'arrowDown' = 'circle';
          let color = '#f7931a'; // Биткоин оранжевый по умолчанию
          let text = '';
          
          switch (event.type) {
            case 'moon_phase':
              if (event.name.includes('Полнолуние')) {
                text = '🌕'; // Полнолуние
                color = '#fbbf24'; // Золотистый
                shape = 'circle';
              } else if (event.name.includes('Новолуние')) {
                text = '🌑'; // Новолуние
                color = '#6b7280'; // Серый
                shape = 'circle';
              } else if (event.name.includes('Первая четверть')) {
                text = '🌓'; // Первая четверть
                color = '#94a3b8'; // Светло-серый
                shape = 'circle';
              } else if (event.name.includes('Последняя четверть')) {
                text = '🌗'; // Последняя четверть
                color = '#64748b'; // Темно-серый
                shape = 'circle';
              } else {
                text = '🌙'; // Общая луна
                color = '#e2e8f0'; // Светло-серый
                shape = 'circle';
              }
              break;
              
            case 'planet_aspect':
              if (event.name.includes('Меркурий') || event.name.includes('Меркурия')) {
                text = '☿'; // Символ Меркурия
                color = '#8b5cf6'; // Фиолетовый
                shape = 'square';
              } else if (event.name.includes('Венер')) {
                text = '♀'; // Символ Венеры
                color = '#ec4899'; // Розовый
                shape = 'square';
              } else {
                text = '✨'; // Звезды для планетарных аспектов
                color = '#06b6d4'; // Циан
                shape = 'square';
              }
              break;
              
            case 'solar_event':
              if (event.name.includes('затмение')) {
                text = '🌒'; // Затмение
                color = '#dc2626'; // Красный
                shape = 'arrowUp';
              } else if (event.name.includes('солнцестояние')) {
                text = '☀️'; // Солнце
                color = '#f59e0b'; // Янтарный
                shape = 'arrowUp';
              } else if (event.name.includes('равноденствие')) {
                text = '⚖️'; // Равноденствие
                color = '#10b981'; // Зеленый
                shape = 'arrowUp';
              } else if (event.name.includes('Геминиды') || event.name.includes('метеорный') || event.name.includes('Персеиды')) {
                text = '☄️'; // Метеор
                color = '#8b5cf6'; // Фиолетовый
                shape = 'arrowDown';
              } else {
                text = '☉'; // Символ солнца
                color = '#eab308'; // Желтый
                shape = 'arrowUp';
              }
              break;
              
            default:
              text = '⭐'; // Звезда по умолчанию
              color = '#f7931a';
              shape = 'circle';
          }

          return {
            time: timeInSeconds as any, // Приведение типа для совместимости с lightweight-charts
            position: 'aboveBar' as const,
            color: color,
            shape: shape,
            text: text,
            size: 2 // Увеличенный размер для лучшей видимости
          };
        })
        .filter(marker => marker.time > 0) // Фильтруем корректные временные метки
        .sort((a, b) => a.time - b.time); // Сортируем по времени

      if (markers.length > 0) {
        // Устанавливаем маркеры на серию
        seriesRef.current.setMarkers(markers as any);
        
        console.log(`[Chart] ✨ Добавлено ${markers.length} маркеров астрономических событий:`);
        markers.forEach(marker => {
          console.log(`  ${marker.text} ${new Date(marker.time * 1000).toLocaleDateString()} (${marker.color})`);
        });
      } else {
        console.warn('[Chart] 🌙 Нет валидных астрономических событий для отображения');
      }
      
    } catch (error) {
      console.error('[Chart] ❌ Ошибка добавления астрономических событий:', error);
    }
  }, [astronomicalEvents, isChartReady]);

  return (
    <div className={`relative ${className}`}>
      {/* График */}
      <div ref={chartContainerRef} className="w-full h-full" />
    
      {/* Тултип для астрономических событий */}
      {tooltip.visible && (
        <div 
          className="absolute z-10 bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 shadow-lg pointer-events-none"
          style={{ 
            left: `${tooltip.x}px`, 
            top: `${tooltip.y}px`,
            maxWidth: '300px'
          }}
        >
          <div className="text-[#e2e8f0] font-semibold text-sm mb-1">{tooltip.title}</div>
          <div className="text-[#8b8f9b] text-xs">{tooltip.description}</div>
        </div>
      )}

      {/* Текущая фаза луны */}
      {currentMoonPhase && (
        <div className="absolute top-4 right-4 bg-[#0a0b1e]/80 backdrop-blur-sm border border-[#334155] rounded-lg px-3 py-2">
          <div className="flex items-center gap-2 text-[#e2e8f0]">
            <span className="text-lg">{currentMoonPhase}</span>
            <span className="text-sm text-[#8b8f9b]">Текущая фаза</span>
          </div>
        </div>
      )}
      
      {/* Индикатор загрузки */}
      {(loading || astroLoading) && (
        <div className="absolute inset-0 bg-[#0a0b1e]/80 flex items-center justify-center">
          <div className="text-[#e2e8f0] text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f7931a] mx-auto mb-4"></div>
            <div>
              {loading && 'Загрузка данных криптовалют...'}
              {astroLoading && 'Расчет астрономических событий...'}
            </div>
          </div>
        </div>
      )}
      
      {/* Ошибка */}
      {(error || astroError) && (
        <div className="absolute inset-0 bg-[#0a0b1e]/80 flex items-center justify-center">
          <div className="text-center text-[#ef4444]">
            <div className="text-2xl mb-4">⚠️</div>
            <div className="font-semibold mb-2">Ошибка загрузки данных</div>
            <div className="text-sm text-[#8b8f9b]">
              {error && <div>Криптоданные: {error}</div>}
              {astroError && <div>Астрономические данные: {astroError}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Информация о количестве астрономических событий */}
      {astronomicalEvents.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-[#0a0b1e]/80 backdrop-blur-sm border border-[#334155] rounded-lg px-3 py-2">
          <div className="flex items-center gap-2 text-[#e2e8f0]">
            <span className="text-lg">🌟</span>
            <span className="text-sm text-[#8b8f9b]">
              {astronomicalEvents.length} астрономических событий
            </span>
          </div>
        </div>
      )}

      {/* Легенда астрономических событий */}
      <div className="absolute top-4 left-4 bg-[#0a0b1e]/80 backdrop-blur-sm border border-[#334155] rounded-lg px-3 py-2">
        <div className="text-[#e2e8f0] text-xs">
          <div className="font-semibold mb-2">Астрономические события:</div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div>🌕 Полнолуние</div>
            <div>🌑 Новолуние</div>
            <div>☀️ Солнцестояние</div>
            <div>⚖️ Равноденствие</div>
            <div>☿ Меркурий ℞</div>
            <div>♀ Венера ℞</div>
            <div>☄️ Метеоры</div>
          </div>
        </div>
      </div>
    </div>
  );
} 