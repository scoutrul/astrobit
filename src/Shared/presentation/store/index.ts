import { create } from 'zustand'
import { StoreState } from '../../domain/types'

export const useStore = create<StoreState>((set, get) => ({
  // Crypto data state
  cryptoData: [],
  timeframe: '1d',
  symbol: 'BTCUSDT',
  isLoading: false,
  error: null,
  
  // Multi-symbol state
  selectedSymbols: ['BTCUSDT'],
  normalizeMode: false,
  symbolColors: new Map<string, string>(),
  
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
  
  setSymbol: (symbol: string) => {
    set({ symbol });
    // Обновляем selectedSymbols, если текущий символ не в списке
    const { selectedSymbols } = get();
    if (!selectedSymbols.includes(symbol)) {
      set({ selectedSymbols: [symbol, ...selectedSymbols.slice(0, 9)] }); // Максимум 10 символов
    }
  },
  
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
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  // Multi-symbol actions
  setSelectedSymbols: (symbols: string[]) => {
    set({ selectedSymbols: symbols });
    // Обновляем основной symbol, если список не пустой
    if (symbols.length > 0) {
      set({ symbol: symbols[0] });
    }
  },
  
  addSymbol: (symbol: string) => {
    const { selectedSymbols } = get();
    if (!selectedSymbols.includes(symbol) && selectedSymbols.length < 10) {
      set({ selectedSymbols: [...selectedSymbols, symbol] });
    }
  },
  
  removeSymbol: (symbol: string) => {
    const { selectedSymbols } = get();
    const filtered = selectedSymbols.filter(s => s !== symbol);
    set({ selectedSymbols: filtered });
    // Если удалили текущий символ, обновляем основной
    if (filtered.length > 0 && get().symbol === symbol) {
      set({ symbol: filtered[0] });
    }
  },
  
  setNormalizeMode: (enabled: boolean) => set({ normalizeMode: enabled }),
  
  setSymbolColor: (symbol: string, color: string) => {
    const { symbolColors } = get();
    const newColors = new Map(symbolColors);
    newColors.set(symbol, color);
    set({ symbolColors: newColors });
  }
})); 