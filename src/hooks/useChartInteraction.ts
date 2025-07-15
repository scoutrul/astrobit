import { useCallback, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { debounce, timestampToChartX, chartXToTimestamp } from '../utils/chartHelpers';

/**
 * Custom hook for managing chart interactions and timeline synchronization
 * Implements Direct Transform Mapping with debouncing
 */
export function useChartInteraction() {
  const {
    chartRange,
    timelineConfig,
    setChartRange
  } = useStore();
  
  const chartRefreshTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const timelineRefreshTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  /**
   * Debounced chart range update to maintain 60fps performance
   */
  const debouncedSetChartRange = useCallback(
    debounce((newRange: { from: number; to: number }) => {
      setChartRange(newRange);
    }, 16), // 16ms for 60fps
    [setChartRange]
  );
  
  /**
   * Handle chart zoom event
   */
  const handleChartZoom = useCallback((zoomLevel: number, centerTime?: number) => {
    const currentTimeSpan = chartRange.to - chartRange.from;
    const newTimeSpan = currentTimeSpan * zoomLevel;
    
    const center = centerTime || (chartRange.from + chartRange.to) / 2;
    const halfSpan = newTimeSpan / 2;
    
    const newRange = {
      from: center - halfSpan,
      to: center + halfSpan
    };
    
    debouncedSetChartRange(newRange);
  }, [chartRange, debouncedSetChartRange]);
  
  /**
   * Handle chart pan event
   */
  const handleChartPan = useCallback((deltaTime: number) => {
    const newRange = {
      from: chartRange.from + deltaTime,
      to: chartRange.to + deltaTime
    };
    
    debouncedSetChartRange(newRange);
  }, [chartRange, debouncedSetChartRange]);
  
  /**
   * Handle timeline click to center chart on specific time
   */
  const handleTimelineClick = useCallback((timestamp: number) => {
    const timeSpan = chartRange.to - chartRange.from;
    const halfSpan = timeSpan / 2;
    
    const newRange = {
      from: timestamp - halfSpan,
      to: timestamp + halfSpan
    };
    
    setChartRange(newRange);
  }, [chartRange, setChartRange]);
  
  /**
   * Convert timestamp to chart X coordinate
   */
  const getChartX = useCallback((timestamp: number, chartWidth: number) => {
    return timestampToChartX(timestamp, chartRange, chartWidth);
  }, [chartRange]);
  
  /**
   * Convert chart X coordinate to timestamp
   */
  const getTimestamp = useCallback((x: number, chartWidth: number) => {
    return chartXToTimestamp(x, chartRange, chartWidth);
  }, [chartRange]);
  
  /**
   * Calculate visible time range with buffer for smooth scrolling
   */
  const getVisibleTimeRange = useCallback((bufferPercent: number = 0.1) => {
    const timeSpan = chartRange.to - chartRange.from;
    const buffer = timeSpan * bufferPercent;
    
    return {
      from: chartRange.from - buffer,
      to: chartRange.to + buffer
    };
  }, [chartRange]);
  
  /**
   * Check if timestamp is visible in current chart range
   */
  const isTimeVisible = useCallback((timestamp: number, bufferPercent: number = 0) => {
    const range = getVisibleTimeRange(bufferPercent);
    return timestamp >= range.from && timestamp <= range.to;
  }, [getVisibleTimeRange]);
  
  /**
   * Get chart viewport info for responsive timeline
   */
  const getChartViewport = useCallback((chartElement?: HTMLElement) => {
    const element = chartElement || document.querySelector('.chart-container');
    const rect = element?.getBoundingClientRect();
    
    return {
      width: rect?.width || 800,
      height: rect?.height || 400,
      timeSpan: chartRange.to - chartRange.from,
      pixelsPerMs: (rect?.width || 800) / (chartRange.to - chartRange.from)
    };
  }, [chartRange]);
  
  /**
   * Synchronize timeline position with chart
   */
  const syncTimelinePosition = useCallback((chartElement?: HTMLElement, timelineElement?: HTMLElement) => {
    if (!chartElement || !timelineElement) return;
    
    const chartRect = chartElement.getBoundingClientRect();
    const timelineRect = timelineElement.getBoundingClientRect();
    
    // Ensure timeline matches chart width and position
    if (timelineRect.width !== chartRect.width || timelineRect.left !== chartRect.left) {
      timelineElement.style.width = `${chartRect.width}px`;
      timelineElement.style.marginLeft = `${chartRect.left - timelineRect.left}px`;
    }
  }, []);
  
  /**
   * Handle mouse/touch interactions on chart
   */
  const createChartInteractionHandlers = useCallback((chartWidth: number) => {
    let isDragging = false;
    let lastX = 0;
         // let lastTimestamp = 0; // Reserved for future touch support
    
          const handleMouseDown = (event: MouseEvent) => {
        isDragging = true;
        lastX = event.clientX;
        // lastTimestamp would be used for touch velocity calculations
      };
    
    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = event.clientX - lastX;
      const deltaTime = -deltaX * (chartRange.to - chartRange.from) / chartWidth;
      
      handleChartPan(deltaTime);
      lastX = event.clientX;
    };
    
    const handleMouseUp = () => {
      isDragging = false;
    };
    
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const zoomFactor = event.deltaY > 0 ? 1.1 : 0.9;
      const centerTime = getTimestamp(event.offsetX, chartWidth);
      handleChartZoom(zoomFactor, centerTime);
    };
    
    return {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onWheel: handleWheel
    };
  }, [chartRange, getTimestamp, handleChartPan, handleChartZoom]);
  
  /**
   * Clean up timeouts on unmount
   */
  useEffect(() => {
    return () => {
      if (chartRefreshTimeoutRef.current) {
        clearTimeout(chartRefreshTimeoutRef.current);
      }
      if (timelineRefreshTimeoutRef.current) {
        clearTimeout(timelineRefreshTimeoutRef.current);
      }
    };
  }, []);
  
  return {
    // Chart range
    chartRange,
    timelineConfig,
    
    // Interaction handlers
    handleChartZoom,
    handleChartPan,
    handleTimelineClick,
    createChartInteractionHandlers,
    
    // Coordinate conversion
    getChartX,
    getTimestamp,
    
    // Visibility helpers
    getVisibleTimeRange,
    isTimeVisible,
    
    // Viewport info
    getChartViewport,
    
    // Synchronization
    syncTimelinePosition,
    
    // Computed values
    timeSpan: chartRange.to - chartRange.from,
    centerTime: (chartRange.from + chartRange.to) / 2,
  };
} 