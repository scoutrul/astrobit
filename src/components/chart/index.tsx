import { useEffect, useRef } from 'react'
import * as LightweightCharts from 'lightweight-charts'

function Chart() {
  const chartContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chartContainerRef.current) {
      const chart = LightweightCharts.createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 400,
        layout: {
          background: { type: LightweightCharts.ColorType.Solid, color: '#0f0f1a' },
          textColor: '#ffffff',
        },
        grid: {
          vertLines: { color: '#334158' },
          horzLines: { color: '#334158' },
        },
      });

      const candleSeries = chart.addSeries(LightweightCharts.CandlestickSeries);
      candleSeries.applyOptions({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });
      candleSeries.setData([
        { time: '2019-04-11', open: 80.01, high: 82.00, low: 79.00, close: 81.50 },
        { time: '2019-04-12', open: 96.63, high: 98.00, low: 95.00, close: 97.20 },
        // Add more dummy candle data
      ]);

      return () => {
        chart.remove()
      }
    }
  }, [])

  return <div ref={chartContainerRef} className="w-full" />
}

export default Chart 