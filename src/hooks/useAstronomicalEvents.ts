import { useState, useEffect } from 'react';
import { AstronomicalEvent, astronomicalEventsService } from '../services/astronomicalEvents';

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

  useEffect(() => {
    const calculateEvents = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`[useAstronomicalEvents] 🌙 Расчет астрономических событий: ${startDate.toDateString()} - ${endDate.toDateString()}`);

        // Рассчитываем события
        const calculatedEvents = astronomicalEventsService.getEventsForPeriod(startDate, endDate);
        
        // Получаем текущую фазу луны
        const moonPhase = astronomicalEventsService.getMoonPhaseForDate(new Date());
        
        console.log(`[useAstronomicalEvents] ✨ Найдено ${calculatedEvents.length} астрономических событий`);
        console.log(`[useAstronomicalEvents] 🌙 Текущая фаза луны: ${moonPhase}`);

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
  }, [startDate.getTime(), endDate.getTime()]);

  return {
    events,
    loading,
    error,
    currentMoonPhase
  };
} 