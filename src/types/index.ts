// Core Types for AstroBit Platform
export interface CryptoData {
  symbol: string;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

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

export interface TimelineConfig {
  height: number;
  position: 'top' | 'bottom';
  collapsible: boolean;
  binSize: number;
}

export interface StoreState {
  // Crypto data state
  cryptoData: CryptoData[];
  timeframe: string;
  symbol: string;
  isLoading: boolean;
  error: string | null;
  
  // Astronomical data state
  astroEvents: AstroEvent[];
  visibleEvents: AstroEvent[];
  timelineConfig: TimelineConfig;
  
  // Chart interaction state
  chartRange: {
    from: number;
    to: number;
  };
  
  // Actions
  setTimeframe: (timeframe: string) => void;
  setSymbol: (symbol: string) => void;
  setCryptoData: (data: CryptoData[]) => void;
  setAstroEvents: (events: AstroEvent[]) => void;
  setChartRange: (range: { from: number; to: number }) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface BybitKlineData {
  symbol: string;
  category: string;
  list: [string, string, string, string, string, string, string][]; // [startTime, openPrice, highPrice, lowPrice, closePrice, volume, turnover]
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