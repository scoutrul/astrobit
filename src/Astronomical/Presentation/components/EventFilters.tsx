import React, { useState, useEffect, useCallback } from 'react';
import { EventType } from '../../Domain/value-objects/EventType';

interface EventFiltersProps {
  eventFilters?: {
    lunar?: boolean;
    solar?: boolean;
    planetary?: boolean;
    meteor?: boolean;
  };
  onFiltersChange?: (filters: {
    lunar: boolean;
    solar: boolean;
    planetary: boolean;
    meteor: boolean;
  }) => void;
  className?: string;
}

export const EventFilters: React.FC<EventFiltersProps> = ({
  eventFilters = { lunar: true, solar: true, planetary: true, meteor: true },
  onFiltersChange,
  className = ''
}) => {
  // Инициализируем локальное состояние только один раз
  const [localEventFilters, setLocalEventFilters] = useState({
    lunar: eventFilters.lunar ?? true,
    solar: eventFilters.solar ?? true,
    planetary: eventFilters.planetary ?? true,
    meteor: eventFilters.meteor ?? true
  });

  // Получаем категории событий из JSON
  const [eventCategories, setEventCategories] = useState<Record<string, { name: string; color: string; description: string }>>({});

  // Загружаем категории событий при монтировании компонента
  useEffect(() => {
    try {
      const categories = EventType.getAllCategories();
      setEventCategories(categories);
    } catch (error) {
      console.error('[EventFilters] Ошибка загрузки категорий:', error);
      // Fallback на базовые категории
      setEventCategories({
        lunar: {
          name: 'Лунные события',
          color: '#fbbf24',
          description: 'События, связанные с Луной'
        },
        solar: {
          name: 'Солнечные события',
          color: '#f59e0b',
          description: 'События, связанные с Солнцем'
        },
        planetary: {
          name: 'Планетарные события',
          color: '#8b5cf6',
          description: 'События, связанные с планетами'
        },
        cosmic: {
          name: 'Космические события',
          color: '#10b981',
          description: 'Кометы, метеоры, астероиды'
        }
      });
    }
  }, []);

  // Синхронизируем локальное состояние с пропсами только при изменении пропсов
  useEffect(() => {
    const newFilters = {
      lunar: eventFilters.lunar ?? true,
      solar: eventFilters.solar ?? true,
      planetary: eventFilters.planetary ?? true,
      meteor: eventFilters.meteor ?? true
    };
    
    // Проверяем, действительно ли изменились фильтры
    if (JSON.stringify(newFilters) !== JSON.stringify(localEventFilters)) {
      setLocalEventFilters(newFilters);
    }
  }, [eventFilters.lunar, eventFilters.solar, eventFilters.planetary, eventFilters.meteor]);

  // Обработчик изменения фильтров
  const handleFilterChange = useCallback((filterType: keyof typeof localEventFilters) => {
    const newFilters = {
      ...localEventFilters,
      [filterType]: !localEventFilters[filterType]
    };
    
    setLocalEventFilters(newFilters);
    
    // Уведомляем родительский компонент
    onFiltersChange?.(newFilters);
  }, [localEventFilters, onFiltersChange]);

  // Получаем иконки для категорий
  const getCategoryIcon = (category: string): string => {
    try {
      const types = EventType.getAllTypes();
      const categoryTypes = types.filter(type => {
        const eventType = new EventType(type as any);
        return eventType.getCategory() === category;
      });
      
      if (categoryTypes.length > 0) {
        const eventType = new EventType(categoryTypes[0] as any);
        return eventType.getIcon();
      }
    } catch (error) {
      console.error('[EventFilters] Ошибка получения иконки категории:', error);
    }

    // Fallback иконки по категориям
    switch (category) {
      case 'lunar': return '🌙';
      case 'solar': return '☀️';
      case 'planetary': return '🪐';
      case 'cosmic': return '⭐';
      default: return '🌙';
    }
  };

  // Получаем цвет для категории
  const getCategoryColor = (category: string): string => {
    return eventCategories[category]?.color || '#6b7280';
  };

  // Получаем название для категории
  const getCategoryName = (category: string): string => {
    return eventCategories[category]?.name || category;
  };

  return (
    <div className={`w-full bg-gray-800 border-b border-gray-700 flex-shrink-0 ${className}`}>
      <div className="py-2 sm:py-3">
        <div className="flex flex-wrap items-center justify-start gap-2 sm:gap-3 md:gap-4">
          <span className="text-xs sm:text-sm text-gray-400 font-medium whitespace-nowrap hidden sm:inline">События:</span>
          
          {/* Лунные события */}
          <button
            onClick={() => handleFilterChange('lunar')}
            className={`flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 rounded-md transition-all duration-200 focus:outline-none relative group ${
              localEventFilters.lunar
                ? `bg-[${getCategoryColor('lunar')}]/20 border border-[${getCategoryColor('lunar')}] text-[${getCategoryColor('lunar')}]`
                : 'bg-[#1e293b] border border-[#334155] text-[#8b8f9b] hover:border-[#fbbf24]/50 hover:text-[#fbbf24]/70'
            }`}
          >
            <span className="text-xs sm:text-sm">{getCategoryIcon('lunar')}</span>
            <span className="text-xs font-medium hidden sm:inline">{getCategoryName('lunar')}</span>
            <span className="text-xs font-medium sm:hidden">Л</span>
          </button>

          {/* Солнечные события */}
          <button
            onClick={() => handleFilterChange('solar')}
            className={`flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 rounded-md transition-all duration-200 focus:outline-none relative group ${
              localEventFilters.solar
                ? `bg-[${getCategoryColor('solar')}]/20 border border-[${getCategoryColor('solar')}] text-[${getCategoryColor('solar')}]`
                : 'bg-[#1e293b] border border-[#334155] text-[#8b8f9b] hover:border-[#f59e0b]/50 hover:text-[#f59e0b]/70'
            }`}
          >
            <span className="text-xs sm:text-sm">{getCategoryIcon('solar')}</span>
            <span className="text-xs font-medium hidden sm:inline">{getCategoryName('solar')}</span>
            <span className="text-xs font-medium sm:hidden">С</span>
          </button>

          {/* Планетарные события */}
          <button
            onClick={() => handleFilterChange('planetary')}
            className={`flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 rounded-md transition-all duration-200 focus:outline-none relative group ${
              localEventFilters.planetary
                ? `bg-[${getCategoryColor('planetary')}]/20 border border-[${getCategoryColor('planetary')}] text-[${getCategoryColor('planetary')}]`
                : 'bg-[#1e293b] border border-[#334155] text-[#8b8f9b] hover:border-[#8b5cf6]/50 hover:text-[#8b5cf6]/70'
            }`}
          >
            <span className="text-xs sm:text-sm">{getCategoryIcon('planetary')}</span>
            <span className="text-xs font-medium hidden sm:inline">{getCategoryName('planetary')}</span>
            <span className="text-xs font-medium sm:hidden">П</span>
          </button>

          {/* Метеорные потоки */}
          <button
            onClick={() => handleFilterChange('meteor')}
            className={`flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 rounded-md transition-all duration-200 focus:outline-none relative group ${
              localEventFilters.meteor
                ? `bg-[${getCategoryColor('cosmic')}]/20 border border-[${getCategoryColor('cosmic')}] text-[${getCategoryColor('cosmic')}]`
                : 'bg-[#1e293b] border border-[#334155] text-[#8b8f9b] hover:border-[#10b981]/50 hover:text-[#10b981]/70'
            }`}
          >
            <span className="text-xs sm:text-sm">{getCategoryIcon('cosmic')}</span>
            <span className="text-xs font-medium hidden sm:inline">{getCategoryName('cosmic')}</span>
            <span className="text-xs font-medium sm:hidden">М</span>
          </button>
        </div>
      </div>
    </div>
  );
}; 