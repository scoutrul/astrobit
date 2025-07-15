import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';
import { useCryptoData } from '../../hooks/useCryptoData';
import { useStore } from '../../store';
import { CryptoData } from '../../types';
import SymbolSelector from '../ui/SymbolSelector';

interface ChartProps {
  height?: number;
  className?: string;
}

export default function SimpleChart({ height = 400, className = '' }: ChartProps) {
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
    error,
    lastUpdated,
    isAuthenticated
  } = useCryptoData(symbol, timeframe);

  // Инициализация графика
  useEffect(() => {
    if (!chartContainerRef.current) return;

    console.log('[Chart] Инициализация графика...');

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
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
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: height,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      setIsChartReady(false);
    };
  }, [height]);

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

  return (
    <div className={`relative ${className}`} style={{ height: `${height}px` }}>
      {/* График */}
      <div ref={chartContainerRef} className="w-full h-full" />
      
      {/* SymbolSelector в верхнем левом углу */}
      <div className="absolute top-4 left-4 z-10 w-64">
        <SymbolSelector />
      </div>
      
      {/* Индикатор загрузки */}
      {loading && (
        <div className="absolute inset-0 bg-[#0a0b1e]/80 flex items-center justify-center">
          <div className="text-[#e2e8f0]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f7931a] mx-auto mb-4"></div>
            <div>Загрузка данных...</div>
          </div>
        </div>
      )}
      
      {/* Ошибка */}
      {error && (
        <div className="absolute inset-0 bg-[#0a0b1e]/80 flex items-center justify-center">
          <div className="text-center text-[#ef4444]">
            <div className="text-2xl mb-4">⚠️</div>
            <div className="font-semibold mb-2">Ошибка загрузки данных</div>
            <div className="text-sm text-[#8b8f9b]">{error}</div>
          </div>
        </div>
      )}
    </div>
  );
} 