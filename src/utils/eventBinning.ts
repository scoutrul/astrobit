import { AstroEvent, EventBin } from '../types';

/**
 * Event Binning with Collision Resolution
 * Implements O(k) complexity algorithm for event positioning
 */
export class EventBinner {
  private bins: Map<number, AstroEvent[]> = new Map();
  private binSize: number;
  
  constructor(binSize: number = 3600000) { // Default: 1 hour
    this.binSize = binSize;
  }
  
  /**
   * Clear all bins
   */
  clear(): void {
    this.bins.clear();
  }
  
  /**
   * Add event to appropriate bin
   * O(1) operation
   */
  addEvent(event: AstroEvent): void {
    const binIndex = Math.floor(event.timestamp / this.binSize);
    
    if (!this.bins.has(binIndex)) {
      this.bins.set(binIndex, []);
    }
    
    this.bins.get(binIndex)!.push(event);
  }
  
  /**
   * Get events in a specific time range
   * O(k) operation where k = number of events in range
   */
  getEventsInRange(startTime: number, endTime: number): AstroEvent[] {
    const events: AstroEvent[] = [];
    const startBin = Math.floor(startTime / this.binSize);
    const endBin = Math.floor(endTime / this.binSize);
    
    for (let binIndex = startBin; binIndex <= endBin; binIndex++) {
      const binEvents = this.bins.get(binIndex);
      if (binEvents) {
        // Filter events that are actually in the range
        const filteredEvents = binEvents.filter(
          event => event.timestamp >= startTime && event.timestamp <= endTime
        );
        events.push(...filteredEvents);
      }
    }
    
    return events.sort((a, b) => a.timestamp - b.timestamp);
  }
  
  /**
   * Get all events organized into bins
   */
  getAllBins(): EventBin[] {
    const bins: EventBin[] = [];
    
    for (const [binIndex, events] of this.bins.entries()) {
      if (events.length > 0) {
        const startTime = binIndex * this.binSize;
        const endTime = startTime + this.binSize;
        
        bins.push({
          timeRange: {
            start: startTime,
            end: endTime
          },
          events: events.sort((a, b) => a.timestamp - b.timestamp),
          position: {
            x: startTime, // Will be converted to chart coordinates
            y: 0 // Will be calculated based on timeline position
          }
        });
      }
    }
    
    return bins.sort((a, b) => a.timeRange.start - b.timeRange.start);
  }
  
  /**
   * Resolve collisions in a bin by stacking events vertically
   */
  resolveCollisions(bin: EventBin, timelineHeight: number): AstroEvent[] {
    const resolvedEvents: AstroEvent[] = [];
    const eventHeight = 20; // Height of each event marker
    const spacing = 4; // Spacing between events
    
    bin.events.forEach((event, index) => {
      const yOffset = (eventHeight + spacing) * (index % Math.floor(timelineHeight / (eventHeight + spacing)));
      
      resolvedEvents.push({
        ...event,
        coordinates: {
          x: bin.position.x,
          y: bin.position.y + yOffset
        }
      });
    });
    
    return resolvedEvents;
  }
  
  /**
   * Update bin size (e.g., when chart zoom changes)
   */
  updateBinSize(newBinSize: number): void {
    if (newBinSize !== this.binSize) {
      const allEvents: AstroEvent[] = [];
      
      // Collect all events
      for (const events of this.bins.values()) {
        allEvents.push(...events);
      }
      
      // Clear and rebuild bins
      this.clear();
      this.binSize = newBinSize;
      
      // Re-add all events
      allEvents.forEach(event => this.addEvent(event));
    }
  }
}

/**
 * Utility function to calculate optimal bin size based on chart zoom level
 */
export function calculateOptimalBinSize(
  chartTimeRange: { from: number; to: number },
  chartWidth: number
): number {
  const timeSpan = chartTimeRange.to - chartTimeRange.from;
  const pixelsPerMs = chartWidth / timeSpan;
  
  // Target: approximately 50-100 pixels per bin for optimal visual density
  const targetPixelsPerBin = 75;
  const targetBinSize = targetPixelsPerBin / pixelsPerMs;
  
  // Round to sensible time intervals
  const intervals = [
    60 * 1000,        // 1 minute
    5 * 60 * 1000,    // 5 minutes
    15 * 60 * 1000,   // 15 minutes
    30 * 60 * 1000,   // 30 minutes
    60 * 60 * 1000,   // 1 hour
    4 * 60 * 60 * 1000,   // 4 hours
    24 * 60 * 60 * 1000,  // 1 day
    7 * 24 * 60 * 60 * 1000,  // 1 week
  ];
  
  // Find the closest interval
  let bestInterval = intervals[0];
  let bestDiff = Math.abs(targetBinSize - bestInterval);
  
  for (const interval of intervals) {
    const diff = Math.abs(targetBinSize - interval);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestInterval = interval;
    }
  }
  
  return bestInterval;
} 