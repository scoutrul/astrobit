import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, LineData, Time } from 'lightweight-charts';
import { logger } from '../../../Shared/infrastructure/Logger';

interface ChartComponentProps {
  width?: number;
  height?: number;
  data?: Array<{ timestamp: number; close: number }>;
  onChartReady?: (chart: IChartApi) => void;
}

export const ChartComponent: React.FC<ChartComponentProps> = ({
  width = 800,
  height = 400,
  data = [],
  onChartReady
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const [isChartReady, setIsChartReady] = useState(false);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    try {
      // Создаем график
      const chart = createChart(chartContainerRef.current, {
        width: width,
        height: height,
        layout: {
          background: { color: '#0a0b1e' },
          textColor: '#e2e8f0',
        },
        grid: {
          vertLines: { color: '#1e293b' },
          horzLines: { color: '#1e293b' },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
        },
      });

      chartRef.current = chart;

      // Создаем серию данных
      const lineSeries = chart.addLineSeries({
        color: '#f7931a',
        lineWidth: 2,
      });

      seriesRef.current = lineSeries;

      // Устанавливаем данные
      if (data && data.length > 0) {
        const chartData: LineData[] = data.map(item => ({
          time: (item.timestamp / 1000) as Time,
          value: item.close,
        }));

        lineSeries.setData(chartData);
        logger.info(`График создан с ${chartData.length} точками данных`);
      }

      // Уведомляем о готовности графика
      if (onChartReady) {
        onChartReady(chart);
      }

      setIsChartReady(true);

      // Очистка при размонтировании
      return () => {
        if (chart) {
          chart.remove();
        }
      };
    } catch (error) {
      logger.exception('Ошибка создания графика', error);
    }
  }, [width, height, data, onChartReady]);

  useEffect(() => {
    if (seriesRef.current && data && data.length > 0) {
      try {
        const chartData: LineData[] = data.map(item => ({
          time: (item.timestamp / 1000) as Time,
          value: item.close,
        }));

        seriesRef.current.setData(chartData);
        logger.info(`Данные графика обновлены: ${chartData.length} точек`);
      } catch (error) {
        logger.exception('Ошибка обновления данных графика', error);
      }
    }
  }, [data]);

  const handleResize = () => {
    if (chartRef.current && chartContainerRef.current) {
      chartRef.current.applyOptions({
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
      });
    }
  };

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="chart-container">
      <div 
        ref={chartContainerRef} 
        className="chart"
        style={{ 
          width: '100%', 
          height: height,
          position: 'relative'
        }}
      />
      {!isChartReady && (
        <div className="chart-loading">
          Загрузка графика...
        </div>
      )}
    </div>
  );
};