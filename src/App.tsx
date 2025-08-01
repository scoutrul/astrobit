import './index.css';
import { DependencyContainer } from './Shared/infrastructure';
import { LegacyChartAdapter } from './Charting/Presentation/adapters/LegacyChartAdapter';
import { LegacySymbolSelectorAdapter } from './UserInterface/Presentation/adapters/LegacySymbolSelectorAdapter';
import { LegacyTimeframeSelectorAdapter } from './UserInterface/Presentation/adapters/LegacyTimeframeSelectorAdapter';
import { ProjectModal } from './components/ui/ProjectModal';
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

  // Состояние модального окна
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  return (
    <div className="h-screen bg-slate-900 text-white flex flex-col">
      {/* Header - Two rows with logo, event filters, symbol and timeframe */}
      <header className="bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="container-responsive py-2 sm:py-3">
          {/* First row: Logo (left) + Event Filters (right) */}
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-3">
            {/* Logo - Left side */}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
              AstroBit
            </h1>
            
            {/* Event Filters - Right side */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4">
              {/* Лунные события */}
              <button
                onClick={() => setEventFilters(prev => ({ ...prev, lunar: !prev.lunar }))}
                className={`flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 rounded-md transition-all duration-200 focus:outline-none ${
                  eventFilters.lunar
                    ? 'bg-[#fbbf24]/20 border border-[#fbbf24] text-[#fbbf24]'
                    : 'bg-[#1e293b] border border-[#334155] text-[#8b8f9b]'
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
                    : 'bg-[#1e293b] border border-[#334155] text-[#8b8f9b]'
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
                    : 'bg-[#1e293b] border border-[#334155] text-[#8b8f9b]'
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
                    : 'bg-[#1e293b] border border-[#334155] text-[#8b8f9b]'
                }`}
              >
                <span className="text-xs sm:text-sm">☄️</span>
                <span className="text-xs font-medium hidden sm:inline">Метеоры</span>
                <span className="text-xs font-medium sm:hidden">М</span>
              </button>
            </div>
          </div>

          {/* Second row: Symbol (left) + Timeframe (right) */}
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 md:gap-4">
            <LegacySymbolSelectorAdapter />
            <LegacyTimeframeSelectorAdapter isLoading={isLoading} />
          </div>
        </div>
      </header>

      {/* Chart - Full remaining space */}
      <div className="flex-1 w-full overflow-hidden -mb-4">
        <LegacyChartAdapter 
          className="w-full h-full" 
          eventFilters={eventFilters}
        />
      </div>

      {/* Project Info Link - Fixed in bottom right corner */}
      <button
        onClick={() => setIsProjectModalOpen(true)}
        className="fixed bottom-4 right-4 z-40 bg-gray-800/80 backdrop-blur-sm border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700/80 transition-all duration-200 shadow-lg"
      >
        <div className="flex items-center gap-2">
          <span className="text-orange-400">ℹ️</span>
          <span className="hidden sm:inline">О проекте</span>
        </div>
      </button>

      {/* Project Modal */}
      <ProjectModal 
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
      />
    </div>
  );
}

export default App; 