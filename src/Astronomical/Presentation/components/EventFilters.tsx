import React, { useState, useEffect } from 'react';

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
  const [localEventFilters, setLocalEventFilters] = useState({
    lunar: eventFilters.lunar ?? true,
    solar: eventFilters.solar ?? true,
    planetary: eventFilters.planetary ?? true,
    meteor: eventFilters.meteor ?? true
  });

  // Синхронизируем локальное состояние с пропсами
  useEffect(() => {
    setLocalEventFilters({
      lunar: eventFilters.lunar ?? true,
      solar: eventFilters.solar ?? true,
      planetary: eventFilters.planetary ?? true,
      meteor: eventFilters.meteor ?? true
    });
  }, [eventFilters]);

  // Уведомляем родительский компонент об изменениях
  useEffect(() => {
    onFiltersChange?.(localEventFilters);
  }, [localEventFilters, onFiltersChange]);

  return (
    <div className={`w-full bg-gray-800 border-b border-gray-700 flex-shrink-0 ${className}`}>
      <div className="container-responsive py-2 sm:py-3">
        <div className="flex flex-wrap items-center justify-start gap-2 sm:gap-3 md:gap-4">
          <span className="text-xs sm:text-sm text-gray-400 font-medium whitespace-nowrap hidden sm:inline">События:</span>
          
          {/* Лунные события */}
          <button
            onClick={() => setLocalEventFilters(prev => ({ ...prev, lunar: !prev.lunar }))}
            className={`flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 rounded-md transition-all duration-200 focus:outline-none ${
              localEventFilters.lunar
                ? 'bg-[#fbbf24]/20 border border-[#fbbf24] text-[#fbbf24]'
                : 'bg-[#1e293b] border border-[#334155] text-[#8b8f9b] hover:border-[#fbbf24]/50 hover:text-[#fbbf24]/70'
            }`}
          >
            <span className="text-xs sm:text-sm">🌙</span>
            <span className="text-xs font-medium hidden sm:inline">Лунные</span>
            <span className="text-xs font-medium sm:hidden">Л</span>
          </button>

          {/* Солнечные события */}
          <button
            onClick={() => setLocalEventFilters(prev => ({ ...prev, solar: !prev.solar }))}
            className={`flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 rounded-md transition-all duration-200 focus:outline-none ${
              localEventFilters.solar
                ? 'bg-[#f59e0b]/20 border border-[#f59e0b] text-[#f59e0b]'
                : 'bg-[#1e293b] border border-[#334155] text-[#8b8f9b] hover:border-[#f59e0b]/50 hover:text-[#f59e0b]/70'
            }`}
          >
            <span className="text-xs sm:text-sm">☀️</span>
            <span className="text-xs font-medium hidden sm:inline">Солнечные</span>
            <span className="text-xs font-medium sm:hidden">С</span>
          </button>

          {/* Планетарные события */}
          <button
            onClick={() => setLocalEventFilters(prev => ({ ...prev, planetary: !prev.planetary }))}
            className={`flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 rounded-md transition-all duration-200 focus:outline-none ${
              localEventFilters.planetary
                ? 'bg-[#8b5cf6]/20 border border-[#8b5cf6] text-[#8b5cf6]'
                : 'bg-[#1e293b] border border-[#334155] text-[#8b8f9b] hover:border-[#8b5cf6]/50 hover:text-[#8b5cf6]/70'
            }`}
          >
            <span className="text-xs sm:text-sm">☿</span>
            <span className="text-xs font-medium hidden sm:inline">Планетарные</span>
            <span className="text-xs font-medium sm:hidden">П</span>
          </button>

          {/* Метеорные потоки */}
          <button
            onClick={() => setLocalEventFilters(prev => ({ ...prev, meteor: !prev.meteor }))}
            className={`flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 rounded-md transition-all duration-200 focus:outline-none ${
              localEventFilters.meteor
                ? 'bg-[#ec4899]/20 border border-[#ec4899] text-[#ec4899]'
                : 'bg-[#1e293b] border border-[#334155] text-[#8b8f9b] hover:border-[#ec4899]/50 hover:text-[#ec4899]/70'
            }`}
          >
            <span className="text-xs sm:text-sm">☄️</span>
            <span className="text-xs font-medium hidden sm:inline">Метеоры</span>
            <span className="text-xs font-medium sm:hidden">М</span>
          </button>
        </div>
      </div>
    </div>
  );
}; 