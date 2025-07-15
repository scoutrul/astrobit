import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

export default function ChartTest() {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: 600,
      height: 300,
    });

    console.log('Chart API methods:', Object.getOwnPropertyNames(chart));
    
    let series1: any = null;
    
    // Try different API methods to see what works
    try {
      series1 = (chart as any).addAreaSeries?.({
        topColor: 'rgba(16, 185, 129, 0.3)',
        bottomColor: 'rgba(16, 185, 129, 0.05)',
        lineColor: 'rgba(16, 185, 129, 1)',
        lineWidth: 2,
      });
      console.log('addAreaSeries works:', !!series1);
    } catch (e) {
      console.error('addAreaSeries failed:', e);
    }

    try {
      const series2 = (chart as any).addLineSeries?.({
        color: 'rgba(16, 185, 129, 1)',
        lineWidth: 2,
      });
      console.log('addLineSeries works:', !!series2);
    } catch (e) {
      console.error('addLineSeries failed:', e);
    }

    // Test simple area chart data
    const testData = [
      { time: '2023-01-01', value: 100 },
      { time: '2023-01-02', value: 110 },
      { time: '2023-01-03', value: 105 },
      { time: '2023-01-04', value: 120 },
      { time: '2023-01-05', value: 115 },
    ];

    if (series1) {
      series1.setData(testData);
    }

    return () => {
      chart.remove();
    };
  }, []);

  return (
    <div>
      <div ref={chartContainerRef} />
      <p style={{ color: 'white', padding: '10px' }}>
        Check console for API test results
      </p>
    </div>
  );
} 