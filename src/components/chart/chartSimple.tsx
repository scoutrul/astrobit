import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';
import { useCryptoData } from '../../hooks/useCryptoData';
import { useAstronomicalEvents } from '../../hooks/useAstronomicalEvents';
import { useStore } from '../../store';
import { CryptoData } from '../../types';

interface ChartProps {
  height?: number;
  className?: string;
}

export default function SimpleChart({ height, className = '' }: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [isChartReady, setIsChartReady] = useState(false);
  
  // Получение текущего символа и таймфрейма из хранилища
  const { symbol, timeframe } = useStore();
  
  // Использование простого API Bybit
  const {
    data: cryptoData,
    loading,
    error
  } = useCryptoData(symbol, timeframe);

  // Расчет диапазона дат для астрономических событий
  const getDateRange = () => {
    const now = new Date();
    const endDate = new Date(now);
    let startDate = new Date(now);
    
    // Расчет начальной даты на основе таймфрейма
    switch (timeframe) {
      case '15m':
        startDate.setDate(now.getDate() - 7); // 1 неделя
        break;
      case '1h':
        startDate.setDate(now.getDate() - 30); // 1 месяц
        break;
      case '4h':
        startDate.setDate(now.getDate() - 90); // 3 месяца
        break;
      case '1d':
        startDate.setFullYear(now.getFullYear() - 1); // 1 год
        break;
      default:
        startDate.setDate(now.getDate() - 30); // По умолчанию 1 месяц
    }
    
    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();
  
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

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chart) {
        chart.remove();
      }
      chartRef.current = null;
      seriesRef.current = null;
      setIsChartReady(false);
    };
  }, [height]); // Добавляем height в зависимости

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
              } else if (event.name.includes('Новолуние')) {
                text = '🌑'; // Новолуние
                color = '#6b7280'; // Серый
              } else if (event.name.includes('Первая четверть')) {
                text = '🌓'; // Первая четверть
                color = '#94a3b8'; // Светло-серый
              } else if (event.name.includes('Последняя четверть')) {
                text = '🌗'; // Последняя четверть
                color = '#64748b'; // Темно-серый
              } else {
                text = '🌙'; // Общая луна
                color = '#e2e8f0'; // Светло-серый
              }
              break;
              
            case 'planet_aspect':
              if (event.name.includes('Меркурий')) {
                text = '☿'; // Символ Меркурия
                color = '#8b5cf6'; // Фиолетовый
              } else {
                text = '✨'; // Звезды для планетарных аспектов
                color = '#06b6d4'; // Циан
              }
              break;
              
            case 'solar_event':
              if (event.name.includes('затмение')) {
                text = '🌒'; // Затмение
                color = '#dc2626'; // Красный
              } else if (event.name.includes('солнцестояние')) {
                text = '☀️'; // Солнце
                color = '#f59e0b'; // Янтарный
              } else if (event.name.includes('равноденствие')) {
                text = '⚖️'; // Равноденствие
                color = '#10b981'; // Зеленый
              } else if (event.name.includes('Геминиды') || event.name.includes('метеорный')) {
                text = '☄️'; // Метеор
                color = '#8b5cf6'; // Фиолетовый
              } else {
                text = '☉'; // Символ солнца
                color = '#eab308'; // Желтый
              }
              break;
              
            default:
              text = '⭐'; // Звезда по умолчанию
              color = '#f7931a';
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
    </div>
  );
} 