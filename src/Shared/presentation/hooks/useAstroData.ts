import { useEffect, useCallback } from 'react';
import { useStore } from '../store';
import { astronomyService } from '../../../Astronomical/Infrastructure/services/astronomyService';
import { EventBinner, calculateOptimalBinSize } from '../../../Astronomical/Infrastructure/utils/eventBinning';

/**
 * Custom hook for managing astronomical data
 * Implements astronomical calculations, event binning, and timeline management
 */
export function useAstroData() {
  const {
    astroEvents,
    visibleEvents,
    timelineConfig,
    chartRange,
    setAstroEvents,
    // setChartRange - not used in this hook but available from store
  } = useStore();
  
  /**
   * Fetch astronomical events for current chart range
   */
  const fetchAstroData = useCallback(async () => {
    if (!chartRange.from || !chartRange.to) return;
    
    try {
      const startDate = new Date(chartRange.from);
      const endDate = new Date(chartRange.to);
      
      const events = await astronomyService.getAstronomicalEvents(startDate, endDate);
      
      setAstroEvents(events);
      // Ошибка загрузки астрономических данных
    } catch (error) {
      // Ошибка загрузки астрономических данных
    }
  }, [chartRange.from, chartRange.to, setAstroEvents]);
  
  /**
   * Create and manage event binner for collision resolution
   */
  const createEventBinner = useCallback((chartWidth: number = 800) => {
    const optimalBinSize = calculateOptimalBinSize(chartRange, chartWidth);
    const binner = new EventBinner(optimalBinSize);
    
    // Add all visible events to binner
    visibleEvents.forEach((event: any) => binner.addEvent(event));
    
    return binner;
  }, [chartRange, visibleEvents]);
  
  /**
   * Get binned events for timeline display
   */
  const getBinnedEvents = useCallback((chartWidth: number = 800) => {
    const binner = createEventBinner(chartWidth);
    return binner.getAllBins();
  }, [createEventBinner]);
  
  /**
   * Get events in a specific time range (for virtualization)
   */
  const getEventsInRange = useCallback((startTime: number, endTime: number) => {
    return astroEvents.filter((event: any) => 
      event.timestamp >= startTime && event.timestamp <= endTime
    );
  }, [astroEvents]);
  
  /**
   * Filter events by type
   */
  const getEventsByType = useCallback((eventType: string) => {
    return visibleEvents.filter((event: any) => event.type === eventType);
  }, [visibleEvents]);
  
  /**
   * Filter events by significance
   */
  const getEventsBySignificance = useCallback((significance: 'low' | 'medium' | 'high') => {
    return visibleEvents.filter((event: any) => event.significance === significance);
  }, [visibleEvents]);
  
  /**
   * Auto-fetch astronomical data when chart range changes
   */
  useEffect(() => {
    fetchAstroData();
  }, [fetchAstroData]);
  
  /**
   * Update astronomical data when chart range changes significantly
   */
  useEffect(() => {
    const timeSpan = chartRange.to - chartRange.from;
    const bufferTime = timeSpan * 0.1; // 10% buffer
    
    // Check if we need more data (when user scrolls/zooms)
    const hasEventsNearBoundaries = 
      astroEvents.some((event: any) =>
        event.timestamp <= chartRange.from + bufferTime ||
        event.timestamp >= chartRange.to - bufferTime
      );
    
    if (!hasEventsNearBoundaries) {
      fetchAstroData();
    }
  }, [chartRange, astroEvents, fetchAstroData]);
  
  return {
    astroEvents,
    visibleEvents,
    timelineConfig,
    chartRange,
    fetchAstroData,
    createEventBinner,
    getBinnedEvents,
    getEventsInRange,
    getEventsByType,
    getEventsBySignificance,
  };
} 