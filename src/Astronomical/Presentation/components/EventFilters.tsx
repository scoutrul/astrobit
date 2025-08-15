import React, { useState, useEffect, useCallback } from 'react';

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

  return (
    <div className={`w-full bg-gray-800 border-b border-gray-700 flex-shrink-0 ${className}`}>
      <div className="container-responsive py-2 sm:py-3">
        <div className="flex flex-wrap items-center justify-start gap-2 sm:gap-3 md:gap-4">
          <span className="text-xs sm:text-sm text-gray-400 font-medium whitespace-nowrap hidden sm:inline">События:</span>
          
          {/* Лунные события */}
          <button
            onClick={() => handleFilterChange('lunar')}
            title="Фильтр лунных событий (фазы луны, затмения)"
            className={`flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 rounded-md transition-all duration-200 focus:outline-none relative group ${
              localEventFilters.lunar
                ? 'bg-[#fbbf24]/20 border border-[#fbbf24] text-[#fbbf24]'
                : 'bg-[#1e293b] border border-[#334155] text-[#8b8f9b] hover:border-[#fbbf24]/50 hover:text-[#fbbf24]/70'
            }`}
          >
            <span className="text-xs sm:text-sm">🌙</span>
            <span className="text-xs font-medium hidden sm:inline">Лунные</span>
            <span className="text-xs font-medium sm:hidden">Л</span>
            
            {/* Тултип */}
            <div className="tooltip">
              Фильтр лунных событий
            </div>
          </button>

          {/* Солнечные события */}
          <button
            onClick={() => handleFilterChange('solar')}
            title="Фильтр солнечных событий (затмения, солнцестояния)"
            className={`flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 rounded-md transition-all duration-200 focus:outline-none relative group ${
              localEventFilters.solar
                ? 'bg-[#f59e0b]/20 border border-[#f59e0b] text-[#f59e0b]'
                : 'bg-[#1e293b] border border-[#334155] text-[#8b8f9b] hover:border-[#f59e0b]/50 hover:text-[#f59e0b]/70'
            }`}
          >
            <span className="text-xs sm:text-sm">☀️</span>
            <span className="text-xs font-medium hidden sm:inline">Солнечные</span>
            <span className="text-xs font-medium sm:hidden">С</span>
            
            {/* Тултип */}
            <div className="tooltip">
              Фильтр солнечных событий
            </div>
          </button>

          {/* Планетарные события */}
          <button
            onClick={() => handleFilterChange('planetary')}
            title="Фильтр планетарных событий (соединения, противостояния)"
            className={`flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 rounded-md transition-all duration-200 focus:outline-none relative group ${
              localEventFilters.planetary
                ? 'bg-[#8b5cf6]/20 border border-[#8b5cf6] text-[#8b5cf6]'
                : 'bg-[#1e293b] border border-[#334155] text-[#8b8f9b] hover:border-[#8b5cf6]/50 hover:text-[#8b5cf6]/70'
            }`}
          >
            <span className="text-xs sm:text-sm">🪐</span>
            <span className="text-xs font-medium hidden sm:inline">Планетарные</span>
            <span className="text-xs font-medium sm:hidden">П</span>
            
            {/* Тултип */}
            <div className="tooltip">
              Фильтр планетарных событий
            </div>
          </button>

          {/* Метеорные потоки */}
          <button
            onClick={() => handleFilterChange('meteor')}
            title="Фильтр метеорных потоков"
            className={`flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 rounded-md transition-all duration-200 focus:outline-none relative group ${
              localEventFilters.meteor
                ? 'bg-[#10b981]/20 border border-[#10b981] text-[#10b981]'
                : 'bg-[#1e293b] border border-[#334155] text-[#8b8f9b] hover:border-[#10b981]/50 hover:text-[#10b981]/70'
            }`}
          >
            <span className="text-xs sm:text-sm">☄️</span>
            <span className="text-xs font-medium hidden sm:inline">Метеоры</span>
            <span className="text-xs font-medium sm:hidden">М</span>
            
            {/* Тултип */}
            <div className="tooltip">
              Фильтр метеорных потоков
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}; 