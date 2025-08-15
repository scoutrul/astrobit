import { useState, useEffect, useRef } from 'react';
import { AstronomicalEvent, astronomicalEventsService } from '../../Infrastructure/services/astronomicalEvents';

interface UseAstronomicalEventsResult {
  events: AstronomicalEvent[];
  loading: boolean;
  error: string | null;
  currentMoonPhase: string;
}

export function useAstronomicalEvents(
  startDate: Date, 
  endDate: Date
): UseAstronomicalEventsResult {
  const [events, setEvents] = useState<AstronomicalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMoonPhase, setCurrentMoonPhase] = useState<string>('🌙');
  
  // Используем ref для предотвращения повторных вычислений
  const calculatedRef = useRef<{
    startDate: number;
    endDate: number;
    events: AstronomicalEvent[];
    moonPhase: string;
  } | null>(null);

  useEffect(() => {
    const calculateEvents = async () => {
      try {
        // Проверяем, не вычисляли ли мы уже события для этих дат
        const startTime = startDate.getTime();
        const endTime = endDate.getTime();
        
        if (calculatedRef.current && 
            calculatedRef.current.startDate === startTime && 
            calculatedRef.current.endDate === endTime) {
          setEvents(calculatedRef.current.events);
          setCurrentMoonPhase(calculatedRef.current.moonPhase);
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        // Рассчитываем события
        const calculatedEvents = astronomicalEventsService.getEventsForPeriod(startDate, endDate);
        
        // Получаем текущую фазу луны
        const moonPhase = astronomicalEventsService.getMoonPhaseForDate(new Date());
        
        // Кэшируем результаты
        calculatedRef.current = {
          startDate: startTime,
          endDate: endTime,
          events: calculatedEvents,
          moonPhase
        };

        setEvents(calculatedEvents);
        setCurrentMoonPhase(moonPhase);

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Ошибка расчета астрономических событий';
        console.error('[useAstronomicalEvents] ❌ Ошибка:', err);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    if (startDate && endDate) {
      calculateEvents();
    }
  }, [startDate, endDate]); // Используем сами объекты Date, они теперь стабилизированы

  return {
    events,
    loading,
    error,
    currentMoonPhase
  };
} 