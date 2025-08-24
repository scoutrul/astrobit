import { useCryptoData } from '../../../CryptoData/Presentation/hooks/useCryptoData';
import { useAstronomicalEvents } from '../../../Astronomical/Presentation/hooks/useAstronomicalEvents';
import { useStore } from '../store';
import { useMemo } from 'react';
import { getEarliestEventDate } from '../../../Astronomical/Infrastructure/utils/dateUtils';

export function useLoadingStatus() {
  const { symbol, timeframe } = useStore();
  
  // Стабилизируем даты для useAstronomicalEvents
  const dateRange = useMemo(() => {
    const now = Date.now();
    return {
      startDate: getEarliestEventDate(), // Динамически определяем начало от самого раннего события
      endDate: new Date(now + 365 * 24 * 60 * 60 * 1000)    // 1 год вперед для будущих событий
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