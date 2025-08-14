// Astronomical Domain Types

export interface AstroEvent {
  id: string;
  type: 'lunar_phase' | 'solar_eclipse' | 'lunar_eclipse' | 'planetary_aspect';
  timestamp: number;
  title: string;
  description: string;
  significance: 'low' | 'medium' | 'high';
  coordinates?: {
    x: number; // Chart coordinate
    y: number; // Timeline coordinate
  };
}

export interface AstronomicalEvent {
  id: string;
  name: string;
  date: Date;
  type: string;
  description: string;
  significance: string;
}

export interface TimelineConfig {
  height: number;
  position: 'top' | 'bottom';
  collapsible: boolean;
  binSize: number;
}

export interface EventBin {
  timeRange: {
    start: number;
    end: number;
  };
  events: AstroEvent[];
  position: {
    x: number;
    y: number;
  };
} 