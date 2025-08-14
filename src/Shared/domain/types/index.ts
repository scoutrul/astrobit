// Shared Domain Types

export interface StoreState {
  // Crypto data state
  cryptoData: any[]; // Will be properly typed when importing from CryptoData
  timeframe: string;
  symbol: string;
  isLoading: boolean;
  error: string | null;
  
  // Astronomical data state
  astroEvents: any[]; // Will be properly typed when importing from Astronomical
  visibleEvents: any[]; // Will be properly typed when importing from Astronomical
  timelineConfig: any; // Will be properly typed when importing from Astronomical
  
  // Chart interaction state
  chartRange: {
    from: number;
    to: number;
  };
  
  // Actions
  setTimeframe: (timeframe: string) => void;
  setSymbol: (symbol: string) => void;
  setCryptoData: (data: any[]) => void;
  setAstroEvents: (events: any[]) => void;
  setChartRange: (range: { from: number; to: number }) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
} 