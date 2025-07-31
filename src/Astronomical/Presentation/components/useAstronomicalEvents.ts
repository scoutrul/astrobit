import { useState, useEffect } from 'react';
import { GetAstronomicalEventsUseCase, GetAstronomicalEventsRequest } from '../../Application';
import { AstronomicalEvent } from '../../Domain';

/**
 * Результат работы hook'а астрономических событий
 */
export interface UseAstronomicalEventsResult {
  events: AstronomicalEvent[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  period: {
    startDate: Date;
    endDate: Date;
  } | null;
}

/**
 * React hook для работы с астрономическими событиями
 * Адаптирует use cases для React компонентов
 */
export function useAstronomicalEvents(
  getAstronomicalEventsUseCase: GetAstronomicalEventsUseCase,
  startDate: Date,
  endDate: Date,
  types?: string[],
  significance?: 'low' | 'medium' | 'high',
  limit?: number
): UseAstronomicalEventsResult {
  const [events, setEvents] = useState<AstronomicalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [period, setPeriod] = useState<{ startDate: Date; endDate: Date } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchEvents = async () => {
      if (!startDate || !endDate) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const request: GetAstronomicalEventsRequest = {
          startDate,
          endDate,
          types,
          significance,
          limit
        };

        const result = await getAstronomicalEventsUseCase.execute(request);

        if (!isMounted) return;

        if (result.isSuccess) {
          const response = result.value;
          setEvents(response.events);
          setTotalCount(response.totalCount);
          setPeriod(response.period);
        } else {
          setError(result.error);
        }
      } catch (err) {
        if (!isMounted) return;
        
        const errorMsg = err instanceof Error ? err.message : 'Неизвестная ошибка';
        setError(errorMsg);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchEvents();

    return () => {
      isMounted = false;
    };
  }, [getAstronomicalEventsUseCase, startDate, endDate, types, significance, limit]);

  return {
    events,
    loading,
    error,
    totalCount,
    period
  };
} 