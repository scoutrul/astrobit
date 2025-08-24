import { create } from 'zustand'
import { StoreState } from '../../domain/types'

export const useStore = create<StoreState>((set, get) => ({
  // Crypto data state
  cryptoData: [],
  timeframe: '1d',
  symbol: 'BTCUSDT',
  isLoading: false,
  error: null,
  
  // Astronomical data state
  astroEvents: [],
  visibleEvents: [],
  timelineConfig: {
    height: 40, // Will be responsive: 40px desktop, 30px mobile
    position: 'bottom',
    collapsible: true,
    binSize: 3600000 // 1 hour in milliseconds
  },
  
  // Chart interaction state
  chartRange: {
    from: Date.now() - 150 * 24 * 60 * 60 * 1000, // Начинаем с последних 150 дней для фокуса на актуальных данных
    to: Date.now() + 90 * 24 * 60 * 60 * 1000 // 90 дней вперед для будущих событий
  },
  
  // Actions
  setTimeframe: (timeframe: string) => set({ timeframe }),
  
  setSymbol: (symbol: string) => set({ symbol }),
  
  setCryptoData: (data) => set({ cryptoData: data }),
  
  setAstroEvents: (events) => {
    set({ astroEvents: events });
    // Update visible events based on current chart range
    const { chartRange } = get();
    const visibleEvents = events.filter(event => 
      event.timestamp >= chartRange.from && event.timestamp <= chartRange.to
    );
    set({ visibleEvents });
  },
  
  setChartRange: (range) => {
    set({ chartRange: range });
    // Update visible events when chart range changes
    const { astroEvents } = get();
    const visibleEvents = astroEvents.filter(event => 
      event.timestamp >= range.from && event.timestamp <= range.to
    );
    set({ visibleEvents });
  },
  
  setError: (error) => set({ error }),
  
  setLoading: (loading) => set({ isLoading: loading })
})); 