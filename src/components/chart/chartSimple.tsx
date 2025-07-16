import { useEffect, useRef, useState, useMemo } from 'react';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';
import { useCryptoData } from '../../hooks/useCryptoData';
import { useAstronomicalEvents } from '../../hooks/useAstronomicalEvents';
import { useStore } from '../../store';
import { CryptoData } from '../../types';
import EventFilters, { EventFiltersState } from '../ui/EventFilters';

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
  
  // Состояние фильтров астрономических событий
  const [eventFilters, setEventFilters] = useState<EventFiltersState>({
    lunar: true,      // Лунные события включены по умолчанию
    solar: true,      // Солнечные события включены по умолчанию  
    planetary: false, // Планетарные события отключены по умолчанию (чтобы не перегружать)
    meteor: false     // Метеорные потоки отключены по умолчанию
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
    events: allAstronomicalEvents,
    loading: astroLoading,
    error: astroError,
    currentMoonPhase
  } = useAstronomicalEvents(startDate, endDate);

  // Фильтрация событий по активным фильтрам
  const astronomicalEvents = useMemo(() => {
    // Сначала дедуплицируем события по timestamp + name
    const uniqueEvents = allAstronomicalEvents.filter((event, index, array) => {
      return array.findIndex(e => 
        e.timestamp === event.timestamp && 
        e.name === event.name
      ) === index;
    });
    
    // Проверяем что хотя бы один фильтр активен
    const anyFilterActive = eventFilters.lunar || eventFilters.solar || eventFilters.planetary || eventFilters.meteor;
    if (!anyFilterActive) {
      console.log('[EventFilters] Все фильтры отключены - скрываем все события');
      return []; // Если все фильтры отключены, не показываем ничего
    }
    
    // Фильтруем по типам событий
    const filtered = uniqueEvents.filter(event => {
      switch (event.type) {
        case 'moon_phase':
          return eventFilters.lunar;
        case 'solar_event':
          // Проверяем метеоры - они должны быть в отдельном фильтре
          if (event.name.includes('Геминиды') || event.name.includes('Персеиды') || event.name.includes('метеорный')) {
            return eventFilters.meteor; // Теперь показываем метеоры через отдельный фильтр
          }
          return eventFilters.solar;
        case 'planet_aspect':
          return eventFilters.planetary;
        default:
          return false; // Неизвестные типы не показываем
      }
    });
    
    console.log(`[EventFilters] Отфильтровано событий: ${filtered.length} из ${uniqueEvents.length} (дедуплицировано из ${allAstronomicalEvents.length})`);
    return filtered;
  }, [allAstronomicalEvents, eventFilters]);

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
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      
      const timeScale = chart.timeScale();
      const mouseTime = timeScale.coordinateToTime(mouseX);
      
      // Избегаем лишних обновлений состояния
      setTooltip(prev => {
        if (mouseTime && astronomicalEventsRef.current.length > 0) {
          // Ищем ближайшее событие в пределах разумного расстояния
          const nearestEvent = astronomicalEventsRef.current.find(event => {
            const eventTime = Math.floor(event.timestamp / 1000);
            const timeDiff = Math.abs((mouseTime as number) - eventTime);
            console.log(`[Tooltip] Checking event: ${event.name}, timeDiff: ${timeDiff} seconds (${Math.round(timeDiff/86400)} days)`);
            return timeDiff < 604800; // 7 дней в секундах
          });
          
          if (nearestEvent) {
            // Получаем x-координату маркера события на графике
            const eventTime = Math.floor(nearestEvent.timestamp / 1000);
            const eventX = timeScale.timeToCoordinate(eventTime as any);
            
            // Проверяем, находится ли курсор рядом с маркером по x (убираем ограничение по y)
            const xDistance = Math.abs(mouseX - (eventX || 0));
            const inEventArea = xDistance < 50; // Только проверка по x, тултип работает в любой части экрана
            
            if (inEventArea && eventX !== null) {
              console.log(`[Tooltip] Showing tooltip for: ${nearestEvent.name} at cursor position x=${mouseX}, y=${mouseY}`);
              
              // Тултип следует за курсором с небольшим смещением
              const tooltipX = mouseX + 15; // Смещение вправо от курсора
              const tooltipY = mouseY - 10; // Смещение вверх от курсора
              
              if (prev.visible && prev.title.includes(nearestEvent.name)) {
                // Обновляем только позицию, если тот же event
                return { 
                  ...prev, 
                  x: tooltipX, 
                  y: tooltipY
                };
              }
              
              // Форматируем дату события
              const eventDate = new Date(nearestEvent.timestamp);
              const formattedDate = eventDate.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              });
              
              return {
                x: tooltipX,
                y: tooltipY,
                title: `${nearestEvent.name} • ${formattedDate}`,
                description: nearestEvent.description,
                visible: true
              };
            } else {
              console.log(`[Tooltip] Event found but cursor not in area: ${nearestEvent.name}, xDist=${xDistance} (need <50px)`);
            }
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

  // Функция для конвертации таймфрейма в миллисекунды
  const getTimeframeInterval = (timeframe: string): number => {
    const intervals: Record<string, number> = {
      '1h': 60 * 60 * 1000,           // 1 час
      '8h': 8 * 60 * 60 * 1000,       // 8 часов
      '1d': 24 * 60 * 60 * 1000,      // 1 день
      '1w': 7 * 24 * 60 * 60 * 1000,  // 1 неделя
      '1M': 30 * 24 * 60 * 60 * 1000  // 1 месяц (приблизительно)
    };
    return intervals[timeframe] || intervals['1d']; // По умолчанию 1 день
  };

  // Обновление данных графика при изменении криптоданных
  useEffect(() => {
    if (!isChartReady || !seriesRef.current || !cryptoData.length) {
      console.log('[Chart] График не готов или нет данных');
      return;
    }

    try {
      console.log(`[Chart] Обновление данных графика: ${cryptoData.length} свечей`);
      
      // Преобразуем данные для lightweight-charts
      let chartData = cryptoData
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

      // Сохраняем количество реальных свечей ДО добавления пустых
      const realCandlesCount = chartData.length;

      // 🚀 СОЗДАНИЕ ПУСТЫХ СВЕЧЕЙ ДЛЯ БУДУЩИХ СОБЫТИЙ
      if (chartData.length > 0 && astronomicalEvents.length > 0) {
        const lastCandle = chartData[chartData.length - 1];
        const lastCandleTime = lastCandle!.time;
        const lastCandlePrice = lastCandle!.close;
        
        // Находим максимальную дату среди астрономических событий
        const maxEventTime = Math.max(...astronomicalEvents.map(event => Math.floor(event.timestamp / 1000)));
        
        if (maxEventTime > lastCandleTime) {
          console.log(`[Chart] 🎯 Создание пустых свечей для будущих событий до ${new Date(maxEventTime * 1000).toLocaleString()}`);
          
          const intervalMs = getTimeframeInterval(timeframe);
          const intervalSeconds = intervalMs / 1000;
          
          // Добавляем буфер 20% от общего диапазона будущих событий
          const futureRange = maxEventTime - lastCandleTime;
          const bufferTime = Math.floor(futureRange * 0.2);
          const targetTime = maxEventTime + bufferTime;
          
          const emptyCandles = [];
          let currentTime = lastCandleTime + intervalSeconds;
          
          while (currentTime <= targetTime) {
            emptyCandles.push({
              time: currentTime,
              open: lastCandlePrice,
              high: lastCandlePrice,
              low: lastCandlePrice,
              close: lastCandlePrice
            });
            currentTime += intervalSeconds;
          }
          
          console.log(`[Chart] ✨ Добавлено ${emptyCandles.length} пустых свечей для будущих событий`);
          chartData = [...chartData, ...emptyCandles];
        }
      }
      console.log(`[Chart] Временной диапазон: ${new Date((chartData[0]?.time || 0) * 1000).toLocaleString()} - ${new Date((chartData[chartData.length - 1]?.time || 0) * 1000).toLocaleString()}`);

      if (chartData.length > 0) {
        // Устанавливаем данные
        seriesRef.current.setData(chartData as any);

        // 🎯 ВАЖНО: Масштабирование основывается только на реальных свечах, НЕ на пустых
        if (chartRef.current && realCandlesCount > 0) {
          const lastRealIndex = realCandlesCount - 1; // Индекс последней реальной свечи
          const visibleCandles = 50;
          const offsetCandles = Math.floor(visibleCandles * 0.25); // Сдвиг на четверть (12-13 свечей)
          
          // Базируем расчет на реальных свечах, БЕЗ расширения на пустые
          const firstVisibleIndex = Math.max(0, lastRealIndex - visibleCandles + 1);
          const lastVisibleIndex = lastRealIndex; // Заканчиваем точно на последней реальной свече
          
          try {
            // Сброс вертикального масштаба при смене данных
            if (seriesRef.current) {
              seriesRef.current.priceScale().applyOptions({
                autoScale: true
              });
            }
            
            chartRef.current.timeScale().setVisibleLogicalRange({
              from: firstVisibleIndex,
              to: lastVisibleIndex
            });
            
            console.log(`[Chart] 📏 Масштабирование на основе реальных свечей: ${firstVisibleIndex}-${lastVisibleIndex} (из ${realCandlesCount} реальных)`);
          } catch (error) {
            console.log('[Chart] Не удалось установить видимый диапазон, используем fitContent:', error);
            chartRef.current.timeScale().fitContent();
          }
        }

        console.log(`[Chart] График обновлён: ${chartData.length} свечей (включая пустые)`);
      } else {
        console.warn('[Chart] Нет валидных данных для отображения');
      }
    } catch (error) {
      console.error('[Chart] Ошибка обновления данных графика:', error);
    }
  }, [cryptoData, isChartReady, astronomicalEvents, timeframe]);

  // Добавление астрономических событий в виде маркеров
  useEffect(() => {
    // Обновляем ref с астрономическими событиями для использования в обработчиках
    astronomicalEventsRef.current = astronomicalEvents;
    
    if (!isChartReady || !seriesRef.current || !cryptoData?.length) {
      console.log('[Chart] График не готов или нет данных криптовалют');
      return;
    }
    
    // Если нет событий, очищаем маркеры но НЕ сбрасываем масштаб
    if (!astronomicalEvents.length) {
      console.log('[Chart] Нет астрономических событий - очищаем маркеры');
      seriesRef.current.setMarkers([]);
      return;
    }

    try {
      console.log(`[Chart] 🌙 Добавление ${astronomicalEvents.length} астрономических событий на график`);
      
      // Сохраняем текущий масштаб/позицию графика перед обновлением маркеров
      let savedRange = null;
      try {
        if (chartRef.current) {
          savedRange = chartRef.current.timeScale().getVisibleRange();
          console.log('[Chart] 💾 Сохранен текущий масштаб графика');
        }
      } catch (error) {
        console.log('[Chart] Не удалось сохранить масштаб:', error);
      }
      
      // Преобразуем астрономические события в маркеры для lightweight-charts
      const markers = astronomicalEvents
        .map((event) => {
          // Конвертируем timestamp в секунды (lightweight-charts ожидает секунды)
          const timeInSeconds = Math.floor(event.timestamp / 1000);
          
          // Выбираем иконку и цвет в зависимости от типа события
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
              if (event.name.includes('Меркурий') || event.name.includes('Меркурия')) {
                text = '☿'; // Символ Меркурия
                color = '#8b5cf6'; // Фиолетовый
              } else if (event.name.includes('Венер')) {
                text = '♀'; // Символ Венеры
                color = '#ec4899'; // Розовый
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
              } else if (event.name.includes('Геминиды') || event.name.includes('метеорный') || event.name.includes('Персеиды')) {
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

        // Восстанавливаем сохраненный масштаб (приоритет над расширением оси)
        if (savedRange && chartRef.current) {
          try {
            chartRef.current.timeScale().setVisibleRange(savedRange);
            console.log('[Chart] 🔄 Восстановлен сохраненный масштаб графика');
          } catch (error) {
            console.log('[Chart] Не удалось восстановить масштаб:', error);
          }
        } else {
          console.log('[Chart] 🔒 Масштаб не найден - сохраняем текущий пользовательский масштаб');
          // НЕ изменяем масштаб при обновлении фильтров - пользователь может иметь свой масштаб
        }
      } else {
        console.warn('[Chart] 🌙 Нет валидных астрономических событий для отображения');
      }
      
    } catch (error) {
      console.error('[Chart] ❌ Ошибка добавления астрономических событий:', error);
    }
  }, [astronomicalEvents, isChartReady, cryptoData]);

  return (
    <div className={`relative ${className}`}>
      {/* Панель фильтров событий */}
      <div className="absolute top-2 sm:top-4 left-2 right-2 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 z-20 flex justify-center">
        <div className="w-full sm:w-auto max-w-full overflow-hidden">
          <EventFilters 
            filters={eventFilters} 
            onChange={setEventFilters} 
          />
        </div>
      </div>
      
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
      
    
    </div>
  );
} 