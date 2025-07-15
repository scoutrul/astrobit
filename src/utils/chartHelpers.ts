import { CryptoData } from '../types';

/**
 * Convert timestamp to chart X coordinate
 */
export function timestampToChartX(
  timestamp: number,
  chartTimeRange: { from: number; to: number },
  chartWidth: number
): number {
  const timeSpan = chartTimeRange.to - chartTimeRange.from;
  const relativeTime = timestamp - chartTimeRange.from;
  return (relativeTime / timeSpan) * chartWidth;
}

/**
 * Convert chart X coordinate to timestamp
 */
export function chartXToTimestamp(
  x: number,
  chartTimeRange: { from: number; to: number },
  chartWidth: number
): number {
  const timeSpan = chartTimeRange.to - chartTimeRange.from;
  const relativeX = x / chartWidth;
  return chartTimeRange.from + (relativeX * timeSpan);
}

/**
 * Convert CryptoData to Lightweight Charts format
 */
export function convertToLightweightChartsData(data: CryptoData[]) {
  return data.map(item => ({
    time: Math.floor(new Date(item.time).getTime() / 1000), // Lightweight Charts expects seconds
    open: item.open,
    high: item.high,
    low: item.low,
    close: item.close,
  }));
}

/**
 * Debounce function for chart interactions
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Calculate chart time range based on timeframe
 */
export function calculateTimeRange(timeframe: string): { from: number; to: number } {
  const now = Date.now();
  const timeframes: Record<string, number> = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '30m': 30 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '1w': 7 * 24 * 60 * 60 * 1000,
  };
  
  const interval = timeframes[timeframe] || timeframes['1d'];
  const count = 200; // Number of candles to show
  
  return {
    from: now - (interval * count),
    to: now
  };
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: number, timeframe: string): string {
  const date = new Date(timestamp);
  
  switch (timeframe) {
    case '1m':
    case '5m':
    case '15m':
    case '30m':
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      });
    case '1h':
    case '4h':
      return date.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        hour12: false
      });
    case '1d':
    case '1w':
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    default:
      return date.toLocaleDateString();
  }
}

/**
 * Calculate responsive timeline height
 */
export function getResponsiveTimelineHeight(): number {
  // Using CSS breakpoint logic: 768px is md breakpoint in Tailwind
  const isMobile = window.innerWidth < 768;
  return isMobile ? 30 : 40;
}

/**
 * Validate chart data integrity
 */
export function validateChartData(data: CryptoData[]): boolean {
  if (!data || data.length === 0) return false;
  
  return data.every(item => 
    typeof item.open === 'number' &&
    typeof item.high === 'number' &&
    typeof item.low === 'number' &&
    typeof item.close === 'number' &&
    typeof item.volume === 'number' &&
    item.high >= Math.max(item.open, item.close) &&
    item.low <= Math.min(item.open, item.close) &&
    !isNaN(item.open) &&
    !isNaN(item.high) &&
    !isNaN(item.low) &&
    !isNaN(item.close)
  );
} 