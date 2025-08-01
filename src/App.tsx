import './index.css';
import { DependencyContainer } from './Shared/infrastructure';
import { LegacyChartAdapter } from './Charting/Presentation/adapters/LegacyChartAdapter';
import { LegacySymbolSelectorAdapter } from './UserInterface/Presentation/adapters/LegacySymbolSelectorAdapter';
import { LegacyTimeframeSelectorAdapter } from './UserInterface/Presentation/adapters/LegacyTimeframeSelectorAdapter';
import { CryptoDataDependencyConfig } from './CryptoData/Infrastructure/config/DependencyConfig';
import { ChartingDependencyConfig } from './Charting/Infrastructure/config/DependencyConfig';
import { AstronomicalDependencyConfig } from './Astronomical/Infrastructure/config/DependencyConfig';
import { UserInterfaceDependencyConfig } from './UserInterface/Infrastructure/config/DependencyConfig';
import { useLoadingStatus } from './hooks/useLoadingStatus';
import { useState } from 'react';

function App() {
  // Инициализация DI контейнера и регистрация зависимостей
  const container = DependencyContainer.getInstance();
  CryptoDataDependencyConfig.configure(container);
  ChartingDependencyConfig.configure(container);
  AstronomicalDependencyConfig.configure(container);
  UserInterfaceDependencyConfig.configure(container);

  // Получаем глобальный loading статус
  const { isLoading } = useLoadingStatus();

  // Состояние фильтров событий
  const [eventFilters, setEventFilters] = useState({
    lunar: true,
    solar: true,
    planetary: true,
    meteor: true
  });

  return (
    <div className="h-screen bg-slate-900 text-white flex flex-col">
      {/* Header - Fixed height with responsive padding */}
      <header className="h-16 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="container-responsive h-full flex items-center justify-between">
          <div className="flex items-center gap-4" style={{ gap: '1rem' }}>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
              AstroBit
            </h1>
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-400" style={{ gap: '0.5rem' }}>
              <span>•</span>
              <span>Cryptocurrency + Astronomical Analytics</span>
            </div>
          </div>
        </div>
      </header>

      {/* Unified Controls Panel - All controls in one flex container */}
      <div className="bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="container-responsive py-2 sm:py-3">
          <div className="flex flex-wrap items-center justify-start gap-2 sm:gap-3 md:gap-4">
            {/* Event Filters */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4">
              <span className="text-xs sm:text-sm text-gray-400 font-medium whitespace-nowrap hidden sm:inline">События:</span>
              
              {/* Лунные события */}
              <button
                onClick={() => setEventFilters(prev => ({ ...prev, lunar: !prev.lunar }))}
                className={`flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 rounded-md transition-all duration-200 focus:outline-none ${
                  eventFilters.lunar
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
                onClick={() => setEventFilters(prev => ({ ...prev, solar: !prev.solar }))}
                className={`flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 rounded-md transition-all duration-200 focus:outline-none ${
                  eventFilters.solar
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
                onClick={() => setEventFilters(prev => ({ ...prev, planetary: !prev.planetary }))}
                className={`flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 rounded-md transition-all duration-200 focus:outline-none ${
                  eventFilters.planetary
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
                onClick={() => setEventFilters(prev => ({ ...prev, meteor: !prev.meteor }))}
                className={`flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 rounded-md transition-all duration-200 focus:outline-none ${
                  eventFilters.meteor
                    ? 'bg-[#ec4899]/20 border border-[#ec4899] text-[#ec4899]'
                    : 'bg-[#1e293b] border border-[#334155] text-[#8b8f9b] hover:border-[#ec4899]/50 hover:text-[#ec4899]/70'
                }`}
              >
                <span className="text-xs sm:text-sm">☄️</span>
                <span className="text-xs font-medium hidden sm:inline">Метеоры</span>
                <span className="text-xs font-medium sm:hidden">М</span>
              </button>
            </div>

            {/* Symbol and Timeframe Selectors */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4">
              <LegacySymbolSelectorAdapter />
              <LegacyTimeframeSelectorAdapter isLoading={isLoading} />
            </div>
          </div>
        </div>
      </div>

      {/* Chart - Full height of remaining space */}
      <div className="flex-1 w-full overflow-hidden">
        <LegacyChartAdapter 
          className="w-full h-full" 
          eventFilters={eventFilters}
        />
      </div>
    </div>
  );
}

export default App; 