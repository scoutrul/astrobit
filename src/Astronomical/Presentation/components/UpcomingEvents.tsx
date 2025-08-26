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
        const events: AstronomicalEvent[] = allEvents.map((jsonEvent: any) => {
          const mappedType = mapJsonTypeToEventType(jsonEvent.type || '');
          
          return {
            timestamp: new Date(jsonEvent.date).getTime(),
            type: mappedType,
            name: jsonEvent.name || 'Неизвестное событие',
            description: jsonEvent.description || '',
            significance: (jsonEvent.significance as 'low' | 'medium' | 'high') || 'medium',
            constellation: jsonEvent.constellation,
            icon: jsonEvent.icon
          };
        });
        
        // Фильтруем только будущие события и сортируем по времени
        const futureEvents = events
          .filter(event => event.timestamp > now.getTime())
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(0, 8); // Берем только 8 ближайших
        
        setUpcomingEvents(futureEvents);
      } catch (error) {
        // Ошибка загрузки событий
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
      return { icon: event.icon, color: getColorByEventType(event) };
    }

    // Улучшенная система иконок по типу и названию события
    const getIconByEventName = (name: string, type: AstronomicalEvent['type']): string => {
      const lowerName = name.toLowerCase();
      
      // Лунные фазы
      if (type === 'moon_phase') {
        if (lowerName.includes('полнолуние') || lowerName.includes('полная луна')) {
          return '🌕';
        }
        if (lowerName.includes('новолуние') || lowerName.includes('новая луна')) {
          return '🌑';
        }
        return '🌙'; // дефолтная иконка для лунных фаз
      }
      
      // Солнечные события
      if (type === 'solar_event') {
        if (lowerName.includes('равноденствие')) return '🌍';
        if (lowerName.includes('солнцестояние')) return '☀️';
        if (lowerName.includes('апогей') || lowerName.includes('перигей')) return '🌞';
        return '☀️'; // дефолтная иконка для солнечных событий
      }
      
      // Лунные затмения
      if (type === 'lunar_eclipse') {
        if (lowerName.includes('полное')) return '🌑';
        if (lowerName.includes('частичное')) return '🌓';
        if (lowerName.includes('полутеневое')) return '🌗';
        return '🌑'; // дефолтная иконка для лунных затмений
      }
      
      // Солнечные затмения
      if (type === 'solar_eclipse') {
        if (lowerName.includes('полное')) return '☀️🌑';
        if (lowerName.includes('кольцевое')) return '💍';
        if (lowerName.includes('частичное')) return '☀️🌘';
        return '☀️🌑'; // дефолтная иконка для солнечных затмений
      }
      
      // Планетарные аспекты
      if (type === 'planet_aspect') {
        if (lowerName.includes('ретроград')) return '🔄';
        if (lowerName.includes('соединение') || lowerName.includes('парад')) return '🪐';
        if (lowerName.includes('оппозиция')) return '⚖️';
        if (lowerName.includes('тригон') || lowerName.includes('трин')) return '🔺';
        if (lowerName.includes('квадрат')) return '⬜';
        if (lowerName.includes('меркурий')) return '☿';
        if (lowerName.includes('венера')) return '♀️';
        if (lowerName.includes('марс')) return '♂️';
        if (lowerName.includes('юпитер')) return '♃';
        if (lowerName.includes('сатурн')) return '♄';
        if (lowerName.includes('уран')) return '♅';
        if (lowerName.includes('нептун')) return '♆';
        if (lowerName.includes('плутон')) return '♇';
        return '🪐'; // дефолтная иконка для планетарных событий
      }
      
      // Кометы
      if (type === 'comet_event') {
        if (lowerName.includes('комета')) return '☄️';
        if (lowerName.includes('астероид')) return '🪨';
        return '☄️'; // дефолтная иконка для комет
      }
      
      // Метеорные потоки
      if (type === 'meteor_shower') {
        if (lowerName.includes('лириды') || lowerName.includes('лира')) return '🎵';
        if (lowerName.includes('леониды') || lowerName.includes('лев')) return '🦁';
        if (lowerName.includes('ориониды') || lowerName.includes('орион')) return '🏹';
        if (lowerName.includes('аквариды') || lowerName.includes('водолей')) return '🌊';
        if (lowerName.includes('дракониды') || lowerName.includes('дракон')) return '🐉';
        if (lowerName.includes('геминиды') || lowerName.includes('близнецы')) return '💎';
        if (lowerName.includes('квадрантиды') || lowerName.includes('квадрант')) return '⭐';
        if (lowerName.includes('каприкорниды') || lowerName.includes('козерог')) return '🐐';
        if (lowerName.includes('урсиды') || lowerName.includes('малая медведица')) return '🐻';
        return '⭐'; // дефолтная иконка для метеорных потоков
      }
      
      // Дефолтные иконки по типу
      const iconMap: Record<AstronomicalEvent['type'], string> = {
        moon_phase: '🌙',
        planet_aspect: '🪐',
        solar_event: '☀️',
        lunar_eclipse: '🌑',
        solar_eclipse: '☀️🌑',
        comet_event: '☄️',
        meteor_shower: '⭐'
      };
      
      const defaultIcon = iconMap[type] || '🌟';
      return defaultIcon;
    };

    const result = {
      icon: getIconByEventName(event.name, event.type),
      color: getColorByEventType(event)
    };
    
    return result;
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

  // Получаем цвет по типу события (приоритет над значимостью)
  const getColorByEventType = (event: AstronomicalEvent): string => {
    const typeColors: Record<AstronomicalEvent['type'], string> = {
      moon_phase: '#fbbf24',      // yellow-400 - лунные фазы
      planet_aspect: '#8b5cf6',   // violet-500 - планетарные аспекты
      solar_event: '#f59e0b',     // amber-500 - солнечные события
      lunar_eclipse: '#dc2626',   // red-600 - лунные затмения
      solar_eclipse: '#ea580c',   // orange-600 - солнечные затмения
      comet_event: '#10b981',     // emerald-500 - кометы
      meteor_shower: '#3b82f6'    // blue-500 - метеорные потоки
    };
    
    return typeColors[event.type] || getColorBySignificance(event.significance);
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
