import React, { useEffect, useState } from 'react';
import { AstronomicalEvent } from '../../Infrastructure/services/astronomicalEvents';
import { AstronomicalDataLoader } from '../../Infrastructure/services/astronomicalDataLoader';

interface UpcomingEventsProps {
  className?: string;
}

export const UpcomingEvents: React.FC<UpcomingEventsProps> = ({ className = '' }) => {
  const [upcomingEvents, setUpcomingEvents] = useState<AstronomicalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUpcomingEvents = () => {
      try {
        setLoading(true);
        
        // Получаем текущую дату
        const now = new Date();
        
        // Загружаем все события из JSON файлов (без ограничения по датам)
        const allEvents = AstronomicalDataLoader.getAllEvents();
        
        // Конвертируем в формат AstronomicalEvent
        const events: AstronomicalEvent[] = allEvents.map((jsonEvent: any) => ({
          timestamp: new Date(jsonEvent.date).getTime(),
          type: mapJsonTypeToEventType(jsonEvent.type || ''),
          name: jsonEvent.name || 'Неизвестное событие',
          description: jsonEvent.description || '',
          significance: (jsonEvent.significance as 'low' | 'medium' | 'high') || 'medium',
          constellation: jsonEvent.constellation,
          icon: jsonEvent.icon
        }));
        
        // Фильтруем только будущие события и сортируем по времени
        const futureEvents = events
          .filter(event => event.timestamp > now.getTime())
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(0, 8); // Берем только 8 ближайших
        
        // Отладочная информация
        console.log('[UpcomingEvents] Всего событий загружено:', allEvents.length);
        console.log('[UpcomingEvents] Будущих событий найдено:', events.filter(e => e.timestamp > now.getTime()).length);
        console.log('[UpcomingEvents] Отображаем событий:', futureEvents.length);
        console.log('[UpcomingEvents] Первые 8 событий:', futureEvents.map(e => ({ name: e.name, date: new Date(e.timestamp).toLocaleDateString() })));
        
        setUpcomingEvents(futureEvents);
      } catch (error) {
        console.error('[UpcomingEvents] Ошибка загрузки событий:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUpcomingEvents();
    
    // Обновляем события каждые 5 минут
    const interval = setInterval(loadUpcomingEvents, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Маппинг типов событий из JSON в EventType
  const mapJsonTypeToEventType = (type: string): AstronomicalEvent['type'] => {
    switch (type) {
      case 'moon_phase': return 'moon_phase';
      case 'planet_aspect': return 'planet_aspect';
      case 'solar_event': return 'solar_event';
      case 'lunar_eclipse': return 'lunar_eclipse';
      case 'solar_eclipse': return 'solar_eclipse';
      case 'comet_event': return 'comet_event';
      case 'meteor_shower': return 'meteor_shower';
      default: return 'solar_event';
    }
  };

  // Получаем иконку и цвет для события
  const getEventIconAndColor = (event: AstronomicalEvent) => {
    // Если у события уже есть иконка из JSON, используем её
    if (event.icon) {
      return { icon: event.icon, color: getColorBySignificance(event.significance) };
    }

    // Иначе используем дефолтные иконки по типу
    const iconMap: Record<AstronomicalEvent['type'], string> = {
      moon_phase: '🌙',
      planet_aspect: '🪐',
      solar_event: '☀️',
      lunar_eclipse: '🌑',
      solar_eclipse: '🌘',
      comet_event: '☄️',
      meteor_shower: '⭐'
    };

    return {
      icon: iconMap[event.type] || '🌟',
      color: getColorBySignificance(event.significance)
    };
  };

  // Получаем цвет по значимости события
  const getColorBySignificance = (significance: string): string => {
    switch (significance) {
      case 'high': return '#ef4444'; // red-500
      case 'medium': return '#f59e0b'; // amber-500
      case 'low': return '#10b981'; // emerald-500
      default: return '#6b7280'; // gray-500
    }
  };

  if (loading) {
    return (
      <div className={`container-fluid-responsive mt-4 ${className}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-[#334155] bg-[#0a0b1e] p-3 flex items-start gap-3 animate-pulse"
            >
              <div className="w-6 h-6 bg-[#334155] rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[#334155] rounded w-3/4"></div>
                <div className="h-3 bg-[#334155] rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (upcomingEvents.length === 0) {
    return (
      <div className={`container-fluid-responsive mt-4 ${className}`}>
        <div className="text-center text-[#8b8f9b] py-8">
          <div className="text-2xl mb-2">🌟</div>
          <div className="text-sm">Ближайшие астрономические события не найдены</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`container-fluid-responsive mt-4 ${className}`}>
      <div className="mb-3">
        <h3 className="text-[#e2e8f0] text-lg font-semibold">
          🌟 Ближайшие астрономические события
        </h3>
        <p className="text-[#8b8f9b] text-sm">
          Следующие 8 ближайших астрономических событий
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {upcomingEvents.map((event, idx) => {
          const { icon, color } = getEventIconAndColor(event);
          
          return (
            <div
              key={`${event.timestamp}-${idx}`}
              className="rounded-lg border border-[#334155] bg-[#0a0b1e] p-3 flex items-start gap-3 hover:border-[#475569] transition-colors"
              style={{ borderLeft: `3px solid ${color}` }}
            >
              <div className="text-lg" style={{ color }}>{icon}</div>
              <div className="min-w-0 flex-1">
                <div className="text-[#e2e8f0] text-sm font-semibold truncate">
                  {event.name}
                </div>
                <div className="text-[#8b8f9b] text-xs">
                  {new Date(event.timestamp).toLocaleString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                {event.description && (
                  <div className="text-[#a3a8b5] text-xs mt-1 overflow-hidden text-ellipsis line-clamp-2">
                    {event.description}
                  </div>
                )}
                {event.constellation && (
                  <div className="text-[#6b7280] text-xs mt-1">
                    {event.constellation}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
