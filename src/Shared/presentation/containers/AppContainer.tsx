import React, { useState } from 'react';
import { LegacyChartAdapter } from '../../../Charting/Presentation/adapters/LegacyChartAdapter';
import { CryptoDataContainer } from '../../../CryptoData/Presentation/containers/CryptoDataContainer';
import { ChartingContainer } from '../../../Charting/Presentation/containers/ChartingContainer';
import { AstronomicalContainer } from '../../../Astronomical/Presentation/containers/AstronomicalContainer';
import { SharedContainer } from './SharedContainer';

interface AppContainerProps {
  className?: string;
}

export const AppContainer: React.FC<AppContainerProps> = ({ className = '' }) => {
  // Состояние фильтров событий
  const [eventFilters, setEventFilters] = useState({
    lunar: true,
    solar: true,
    planetary: true,
    meteor: true
  });

  return (
    <div className={`h-screen bg-slate-900 text-white flex flex-col ${className}`}>
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
            <AstronomicalContainer 
              eventFilters={eventFilters}
              onFiltersChange={setEventFilters}
            />
          </div>

          {/* Second row: Symbol (left) + Timeframe (right) */}
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 md:gap-4">
            <CryptoDataContainer />
            <ChartingContainer />
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

      {/* Shared components */}
      <SharedContainer />
    </div>
  );
}; 