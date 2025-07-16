import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';
import { useCryptoData } from '../../hooks/useCryptoData';
import { useAstronomicalEvents } from '../../hooks/useAstronomicalEvents';
import { useStore } from '../../store';
import { CryptoData } from '../../types';

interface ChartComponentProps {
  height?: number;
  className?: string;
}

export default function Chart({ height = 400, className = '' }: ChartComponentProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const [isChartReady, setIsChartReady] = useState(false);
  
  // Get current symbol and timeframe from store
  const { symbol, timeframe } = useStore();
  
  // Use hooks with store values
  const {
    data: cryptoData,
    loading: cryptoLoading,
    error: cryptoError,
    isAuthenticated
  } = useCryptoData(symbol, timeframe);
  
  // Calculate date range for astronomical events based on timeframe
  const getDateRange = () => {
    const now = new Date();
    const endDate = new Date(now);
    let startDate = new Date(now);
    
    // Calculate start date based on timeframe
    switch (timeframe) {
      case '15m':
        startDate.setHours(now.getHours() - 24); // 1 day for 15m data
        break;
      case '1h':
        startDate.setDate(now.getDate() - 7); // 1 week for hourly data
        break;
      case '4h':
        startDate.setDate(now.getDate() - 30); // 1 month for 4h data
        break;
      case '1d':
        startDate.setDate(now.getDate() - 90); // 3 months for daily data
        break;
      default:
        startDate.setDate(now.getDate() - 30); // default 1 month
    }
    
    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();
  
  // Get astronomical events for the current timeframe
  const {
    events: astroEvents,
    loading: astroLoading,
    error: astroError,
    currentMoonPhase
  } = useAstronomicalEvents(startDate, endDate);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height,
      layout: {
        background: { color: '#0B1426' },
        textColor: '#E2E8F0',
        fontSize: 12,
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      grid: {
        vertLines: { color: '#1E293B', style: 1, visible: true },
        horzLines: { color: '#1E293B', style: 1, visible: true },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#475569',
          width: 1,
          style: 2,
          visible: true,
        },
        horzLine: {
          color: '#475569',
          width: 1,
          style: 2,
          visible: true,
        },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#374151',
        fixLeftEdge: false,
        fixRightEdge: false,
      },
      rightPriceScale: {
        borderColor: '#374151',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    // Create area series
    const areaSeries = chart.addAreaSeries({
      topColor: 'rgba(16, 185, 129, 0.56)',
      bottomColor: 'rgba(16, 185, 129, 0.04)',
      lineColor: 'rgba(16, 185, 129, 1)',
      lineWidth: 2,
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = areaSeries;
    setIsChartReady(true);

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
      setIsChartReady(false);
    };
  }, [height]);

  // Update chart data when crypto data changes
  useEffect(() => {
    if (!isChartReady || !candlestickSeriesRef.current || !cryptoData.length) return;

    try {
      const chartData = cryptoData.map((item: CryptoData) => ({
        time: item.time as any,
        value: item.close,
      }));

      candlestickSeriesRef.current.setData(chartData);

      // Показываем последние 50 свечей со сдвигом на четверть от правого края
      if (chartRef.current && chartData.length > 0) {
        const lastIndex = chartData.length - 1;
        const visibleCandles = 50;
        const offsetCandles = Math.floor(visibleCandles * 0.25); // Сдвиг на четверть (12-13 свечей)
        
        const firstVisibleIndex = Math.max(0, lastIndex - visibleCandles + offsetCandles + 1);
        const lastVisibleIndex = lastIndex + offsetCandles;
        
        try {
          // Сброс вертикального масштаба при смене данных
          if (candlestickSeriesRef.current) {
            candlestickSeriesRef.current.priceScale().applyOptions({
              autoScale: true
            });
          }
          
          chartRef.current.timeScale().setVisibleLogicalRange({
            from: firstVisibleIndex,
            to: lastVisibleIndex
          });
        } catch (error) {
          console.log('[Chart] Не удалось установить видимый диапазон, используем fitContent:', error);
          chartRef.current.timeScale().fitContent();
        }
      }

      console.log(`[Chart] Updated with ${chartData.length} data points`);
    } catch (error) {
      console.error('[Chart] Error updating chart data:', error);
    }
  }, [cryptoData, isChartReady]);

  // Placeholder for future astronomical event integration

  const isLoading = cryptoLoading || astroLoading;
  const hasError = cryptoError || astroError;

  return (
    <div className={`relative ${className}`}>
      {/* Chart Container */}
      <div ref={chartContainerRef} className="w-full" style={{ height }} />
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
          <div className="bg-slate-800 rounded-lg p-4 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
            <span className="text-slate-300">Loading chart data...</span>
          </div>
        </div>
      )}
      
      {/* Error Display */}
      {hasError && (
        <div className="absolute top-4 right-4 bg-red-900/80 border border-red-700 rounded-lg p-3 max-w-sm">
          <div className="text-red-200 text-sm">
            <div className="font-medium">Chart Error</div>
            {cryptoError && <div>Crypto: {cryptoError}</div>}
            {astroError && <div>Astro: {astroError}</div>}
          </div>
        </div>
      )}
      
      {/* Chart Info Overlay */}
      <div className="absolute top-4 left-4 bg-slate-800/80 rounded-lg p-3 text-sm">
        <div className="text-slate-300 space-y-1">
          <div className="font-medium text-slate-200">{symbol} • {timeframe}</div>
          <div>Data Points: {cryptoData.length}</div>
          <div>Astro Events: {astroEvents.length}</div>
          <div>Current Moon: {currentMoonPhase}</div>
        </div>
      </div>
      
      {/* Astronomical Events Overlay */}
      {astroEvents.length > 0 && (
        <div className="absolute top-4 right-4 bg-slate-800/80 rounded-lg p-3 text-sm max-w-xs">
          <div className="font-medium text-slate-200 mb-2">🌙 Upcoming Events</div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {astroEvents.slice(0, 3).map((event, index) => (
              <div key={index} className="text-xs">
                <div className={`font-medium ${
                  event.significance === 'high' ? 'text-yellow-300' :
                  event.significance === 'medium' ? 'text-blue-300' : 'text-slate-300'
                }`}>
                  {event.name}
                </div>
                <div className="text-slate-400">
                  {new Date(event.timestamp).toLocaleDateString('ru-RU')}
                </div>
              </div>
            ))}
            {astroEvents.length > 3 && (
              <div className="text-slate-400 text-xs">
                +{astroEvents.length - 3} more events
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* API Status */}
      <div className="absolute bottom-4 right-4 bg-slate-800/80 rounded-lg p-2 text-xs">
        <div className="text-slate-400 flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isAuthenticated ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
          <span>{isAuthenticated ? 'Authenticated' : 'Public API'}</span>
        </div>
      </div>
      
      {/* Future: Event Tooltip */}
    </div>
  );
} 