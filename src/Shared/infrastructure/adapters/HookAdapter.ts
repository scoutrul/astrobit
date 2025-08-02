import { useState, useEffect } from 'react';
import { StoreAdapter } from './StoreAdapter';
import { useStore } from '../../../store';

/**
 * HookAdapter - адаптер для обеспечения обратной совместимости
 * между новой архитектурой и существующими React хуками
 */
export class HookAdapter {
  private static instance: HookAdapter;
  private storeAdapter: StoreAdapter;

  private constructor() {
    this.storeAdapter = StoreAdapter.getInstance();
  }

  static getInstance(): HookAdapter {
    if (!HookAdapter.instance) {
      HookAdapter.instance = new HookAdapter();
    }
    return HookAdapter.instance;
  }

  // Legacy useCryptoData hook replacement
  createLegacyCryptoDataHook() {
    return (symbol: string, timeframe: string) => {
      const [data, setData] = useState<any[]>([]);
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState<string | null>(null);

      const fetchData = async () => {
        try {
          setLoading(true);
          setError(null);

          const useCase = this.storeAdapter.getCryptoDataUseCase();
          const result = await useCase.execute({
            symbol,
            timeframe,
            limit: 3000
          });

          if (result.isFailure) {
            setError(result.error);
            return;
          }

          // Конвертируем в старый формат для обратной совместимости
          const legacyData = result.value.data.map((cryptoData: any) => cryptoData.toApiFormat());
          setData(legacyData);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
          setLoading(false);
        }
      };

      useEffect(() => {
        fetchData();
      }, [symbol, timeframe]);

      return {
        data,
        loading,
        error,
        refetch: fetchData
      };
    };
  }

  // Legacy useSymbols hook replacement
  createLegacySymbolsHook() {
    return () => {
      const [symbols, setSymbols] = useState<any[]>([]);
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState<string | null>(null);

      const fetchSymbols = async () => {
        try {
          setLoading(true);
          setError(null);

          const useCase = this.storeAdapter.getSymbolsUseCase();
          const result = await useCase.execute();

          if (result.isFailure) {
            setError(result.error);
            return;
          }

          // Конвертируем в старый формат для обратной совместимости
          const legacySymbols = result.value.symbols.map((symbol: any) => ({
            symbol: symbol.toString(),
            name: symbol.getDisplayName(),
            category: symbol.getCategory()
          }));
          setSymbols(legacySymbols);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
          setLoading(false);
        }
      };

      useEffect(() => {
        fetchSymbols();
      }, []);

      return {
        symbols,
        loading,
        error,
        refetch: fetchSymbols
      };
    };
  }



  // Legacy useAstronomicalEvents hook replacement
  createLegacyAstronomicalEventsHook() {
    return () => {
      const [events, setEvents] = useState<any[]>([]);
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState<string | null>(null);

      const fetchEvents = async () => {
        try {
          setLoading(true);
          setError(null);

          // Здесь можно добавить GetAstronomicalEventsUseCase когда он будет создан
          // Пока возвращаем пустой массив
          setEvents([]);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
          setLoading(false);
        }
      };

      useEffect(() => {
        fetchEvents();
      }, []);

      return {
        events,
        loading,
        error,
        refetch: fetchEvents
      };
    };
  }

  // Utility hooks
  createStoreHook() {
    return () => {
      return useStore();
    };
  }

  createStoreSelectorHook<T>(selector: (state: any) => T) {
    return () => {
      return useStore(selector);
    };
  }

  // Debug hooks
  createDebugHook() {
    return () => {
      const [debugInfo, setDebugInfo] = useState<any>({});

      useEffect(() => {
        const updateDebugInfo = () => {
          setDebugInfo({
            storeState: this.storeAdapter.getStoreState(),
            containerRegistrations: this.storeAdapter.logContainerState(),
            timestamp: new Date().toISOString()
          });
        };

        updateDebugInfo();
        const interval = setInterval(updateDebugInfo, 5000);

        return () => clearInterval(interval);
      }, []);

      return debugInfo;
    };
  }
} 