import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';
import { useCryptoData } from '../../hooks/useCryptoData';
import { useStore } from '../../store';
import { CryptoData } from '../../types';

interface ChartProps {
  height?: number;
  className?: string;
}

export default function SimpleChart({ height = 400, className = '' }: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const [isChartReady, setIsChartReady] = useState(false);
  
  // Get current symbol and timeframe from store
  const { symbol, timeframe } = useStore();
  
  // Use enhanced Bybit API
  const {
    data: cryptoData,
    loading,
    error,
    lastUpdated,
    isAuthenticated,
    apiConfig
  } = useCryptoData(symbol, timeframe);

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

    // Create area series - using working API
    const areaSeries = chart.addAreaSeries({
      topColor: 'rgba(16, 185, 129, 0.3)',
      bottomColor: 'rgba(16, 185, 129, 0.05)',
      lineColor: 'rgba(16, 185, 129, 1)',
      lineWidth: 2,
    });

    chartRef.current = chart;
    seriesRef.current = areaSeries;
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
      seriesRef.current = null;
      setIsChartReady(false);
    };
  }, [height]);

  // Update chart data
  useEffect(() => {
    if (!isChartReady || !seriesRef.current || !cryptoData.length) return;

    try {
      const chartData = cryptoData.map((item: CryptoData) => ({
        time: item.time,
        value: item.close,
      }));

      seriesRef.current.setData(chartData);

      // Fit chart to data
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }

      console.log(`[Chart] Updated with ${chartData.length} data points`);
    } catch (error) {
      console.error('[Chart] Error updating chart data:', error);
    }
  }, [cryptoData, isChartReady]);

  return (
    <div className={`relative ${className}`}>
      {/* Chart Container */}
      <div ref={chartContainerRef} className="w-full" style={{ height }} />
      
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
          <div className="bg-slate-800 rounded-lg p-4 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
            <span className="text-slate-300">Loading chart data...</span>
          </div>
        </div>
      )}
      
      {/* Error Display */}
      {error && (
        <div className="absolute top-4 right-4 bg-red-900/80 border border-red-700 rounded-lg p-3 max-w-sm">
          <div className="text-red-200 text-sm">
            <div className="font-medium">Chart Error</div>
            <div>{error}</div>
          </div>
        </div>
      )}
      
      {/* Chart Info Overlay */}
      <div className="absolute top-4 left-4 bg-slate-800/80 rounded-lg p-3 text-sm">
        <div className="text-slate-300 space-y-1">
          <div className="font-medium text-slate-200">{symbol} • {timeframe}</div>
          <div>Data Points: {cryptoData.length}</div>
          {lastUpdated && (
            <div>Updated: {lastUpdated.toLocaleTimeString()}</div>
          )}
        </div>
      </div>
      
      {/* API Status */}
      <div className="absolute bottom-4 right-4 bg-slate-800/80 rounded-lg p-2 text-xs">
        <div className="text-slate-400 flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isAuthenticated ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
          <span>{isAuthenticated ? 'Authenticated' : 'Public API'}</span>
        </div>
      </div>
      
      {/* Enhanced API Info */}
      {apiConfig && (
        <div className="absolute bottom-4 left-4 bg-slate-800/80 rounded-lg p-2 text-xs">
          <div className="text-slate-400 space-y-1">
            <div>API: Bybit Enhanced</div>
            <div>Testnet: {apiConfig.testnet ? 'Yes' : 'No'}</div>
            <div>Auth: {apiConfig.secret !== 'not set' ? 'Yes' : 'No'}</div>
          </div>
        </div>
      )}
    </div>
  );
} 