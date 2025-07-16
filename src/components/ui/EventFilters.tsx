import React from 'react';

export interface EventFiltersState {
  lunar: boolean;      // Лунные события (фазы луны, лунные затмения)
  solar: boolean;      // Солнечные события (солнцестояния, солнечные затмения)
  planetary: boolean;  // Планетарные события (ретроградности)
  meteor: boolean;     // Метеорные потоки (Геминиды, Персеиды)
}

interface EventFiltersProps {
  filters: EventFiltersState;
  onChange: (filters: EventFiltersState) => void;
}

const EventFilters: React.FC<EventFiltersProps> = ({ filters, onChange }) => {
  const handleToggle = (key: keyof EventFiltersState) => {
    onChange({
      ...filters,
      [key]: !filters[key]
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4 px-2 py-2 sm:px-3 md:px-4 bg-[#0a0b1e]/80 backdrop-blur-sm border border-[#334155] rounded-lg min-w-[100%] max-w-full">
      <span className="text-xs sm:text-sm text-[#8b8f9b] font-medium whitespace-nowrap">События:</span>
      
      {/* Лунные события */}
      <button
        onClick={() => handleToggle('lunar')}
        className={`flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 rounded-md transition-all duration-200 focus:outline-none ${
          filters.lunar
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
        onClick={() => handleToggle('solar')}
        className={`flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 rounded-md transition-all duration-200 focus:outline-none ${
          filters.solar
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
        onClick={() => handleToggle('planetary')}
        className={`flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 rounded-md transition-all duration-200 focus:outline-none ${
          filters.planetary
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
        onClick={() => handleToggle('meteor')}
        className={`flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 rounded-md transition-all duration-200 focus:outline-none ${
          filters.meteor
            ? 'bg-[#ec4899]/20 border border-[#ec4899] text-[#ec4899]'
            : 'bg-[#1e293b] border border-[#334155] text-[#8b8f9b] hover:border-[#ec4899]/50 hover:text-[#ec4899]/70'
        }`}
      >
        <span className="text-xs sm:text-sm">☄️</span>
        <span className="text-xs font-medium hidden sm:inline">Метеоры</span>
        <span className="text-xs font-medium sm:hidden">М</span>
      </button>
    </div>
  );
};

export default EventFilters; 