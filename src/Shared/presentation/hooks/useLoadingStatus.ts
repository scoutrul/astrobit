import { useCryptoData } from '../../../CryptoData/Presentation/hooks/useCryptoData';
import { useAstronomicalEvents } from '../../../Astronomical/Presentation/hooks/useAstronomicalEvents';
import { useStore } from '../store';
import { useMemo } from 'react';
import { getMaxFutureDateForTimeframe } from '../../../Astronomical/Infrastructure/utils/dateUtils';

export function useLoadingStatus() {
  const { symbol, timeframe } = useStore();
  
  // Стабилизируем даты для useAstronomicalEvents
  const dateRange = useMemo(() => {
    const now = Date.now();
    return {
      startDate: new Date(now - 150 * 24 * 60 * 60 * 1000), // Последние 150 дней для фокуса на актуальных данных
      endDate: getMaxFutureDateForTimeframe(timeframe)       // Ограничиваем будущие события по таймфрейму
  };
  }, [timeframe]); // Теперь зависит от таймфрейма

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