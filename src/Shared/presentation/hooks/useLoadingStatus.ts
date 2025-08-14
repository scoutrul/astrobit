import { useCryptoData } from '../../../CryptoData/Presentation/hooks/useCryptoData';
import { useAstronomicalEvents } from '../../../Astronomical/Presentation/hooks/useAstronomicalEvents';
import { useStore } from '../store';
import { useMemo } from 'react';

export function useLoadingStatus() {
  const { symbol, timeframe } = useStore();
  
  // Стабилизируем даты для useAstronomicalEvents
  const dateRange = useMemo(() => {
    const now = Date.now();
    return {
      startDate: new Date(now - 365 * 24 * 60 * 60 * 1000), // 1 год назад
      endDate: new Date(now + 90 * 24 * 60 * 60 * 1000)    // 3 месяца вперед
    };
  }, []); // Пустой массив зависимостей - даты не должны меняться

  // Получаем криптоданные через хук
  const { loading: cryptoLoading } = useCryptoData(symbol, timeframe);
  
  // Получаем астрономические события с стабилизированными датами
  const { loading: astroLoading } = useAstronomicalEvents(
    dateRange.startDate,
    dateRange.endDate
  );

  // Комбинированный loading статус
  const isLoading = cryptoLoading || astroLoading;

  return { isLoading, cryptoLoading, astroLoading };
} 