import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { LegacyChartAdapter } from '../../../Charting/Presentation/adapters/LegacyChartAdapter';
import { CryptoDataContainer } from '../../../CryptoData/Presentation/containers/CryptoDataContainer';
import { ChartingContainer } from '../../../Charting/Presentation/containers/ChartingContainer';
import { AstronomicalContainer } from '../../../Astronomical/Presentation/containers/AstronomicalContainer';
import { SharedContainer } from './SharedContainer';
import { useMetrikaEvents } from '../hooks/useMetrikaEvents';
import { useStore } from '../store';

interface AppContainerProps {
  className?: string;
}

export const AppContainer: React.FC<AppContainerProps> = ({ className = '' }) => {
  // Яндекс.Метрика
  const metrika = useMetrikaEvents(104028714);
  
  // Получаем текущий символ из store
  const { symbol } = useStore();
  
  // Состояние для множественных графиков - по умолчанию пусто
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [symbolColors, setSymbolColors] = useState<Map<string, string>>(new Map());
  
  // Состояние фильтров событий
  const [eventFilters, setEventFilters] = useState({
    lunar: true,
    solar: true,
    planetary: true,
    meteor: true
  });
  
  // Палитра контрастных цветов
  const SYMBOL_COLORS = [
    '#f7931a', '#627eea', '#14f195', '#ff6b6b', '#00d4ff',
    '#ffd700', '#ff1493', '#00ff00', '#ff4500', '#9370db'
  ];

  // Обработчик изменения символов с автоматическим назначением цветов
  const handleSymbolsChange = useCallback((symbols: string[]) => {
    // Фильтруем основной символ из списка наложения
    const filteredSymbols = symbols.filter(s => s !== symbol);
    setSelectedSymbols(filteredSymbols);
    
    // Автоматически назначаем цвета новым символам, сохраняя существующие
    setSymbolColors(prev => {
      const newMap = new Map(prev);
      
      // Основной символ всегда получает первый цвет (индекс 0)
      if (symbol && !newMap.has(symbol)) {
        newMap.set(symbol, SYMBOL_COLORS[0]);
      }
      
      // Дополнительные символы получают цвета начиная с индекса 1
      const usedColors = new Set(Array.from(newMap.values()));
      let colorIndex = 1; // Начинаем с 1, так как 0 зарезервирован для основного
      
      filteredSymbols.forEach((symbolItem) => {
        if (!newMap.has(symbolItem)) {
          // Пропускаем уже использованные цвета
          while (colorIndex < SYMBOL_COLORS.length && 
                 usedColors.has(SYMBOL_COLORS[colorIndex])) {
            colorIndex++;
          }
          if (colorIndex < SYMBOL_COLORS.length) {
            newMap.set(symbolItem, SYMBOL_COLORS[colorIndex]);
            usedColors.add(SYMBOL_COLORS[colorIndex]);
            colorIndex++;
          } else {
            // Если все цвета использованы, используем циклический выбор
            const fallbackIndex = (newMap.size) % SYMBOL_COLORS.length;
            newMap.set(symbolItem, SYMBOL_COLORS[fallbackIndex]);
          }
        }
      });
      
      return newMap;
    });
  }, [symbol]);
  
  // Обработчик изменения цвета символа
  const handleColorChange = useCallback((symbol: string, color: string) => {
    setSymbolColors(prev => {
      const newMap = new Map(prev);
      newMap.set(symbol, color);
      return newMap;
    });
  }, []);

  // Обработчик изменения фильтров событий
  const handleEventFiltersChange = useCallback((newFilters: typeof eventFilters) => {
    setEventFilters(newFilters);
    
    // Отслеживаем изменение фильтров
    const activeFilters = Object.entries(newFilters)
      .filter(([_, active]) => active)
      .map(([key, _]) => key);
    
    metrika.trackFilter('astronomical_events', activeFilters.join(','), {
      filter_count: activeFilters.length
    });
  }, [metrika]);

  // Отслеживаем загрузку главной страницы
  useEffect(() => {
    metrika.trackPageView('main_page', {
      page_type: 'dashboard',
      filters_active: Object.values(eventFilters).filter(Boolean).length
    });
  }, [metrika, eventFilters]);

  return (
    <div className={`min-h-screen bg-slate-900 text-white flex flex-col ${className}`}>
      {/* Header - Two rows with logo, event filters, symbol and timeframe */}
      <header className="bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="container-fluid-responsive py-2 sm:py-3">
          {/* First row: Logo (left) + Event Filters (right) */}
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-3">
            {/* Logo - Left side */}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
              AstroBit
            </h1>
            
            {/* Event Filters - Right side */}
            <AstronomicalContainer 
              eventFilters={eventFilters}
              onFiltersChange={handleEventFiltersChange}
            />
          </div>

          {/* Second row: Symbol overlay (left) + Timeframe (right) */}
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 md:gap-4">
            <CryptoDataContainer 
              selectedSymbols={selectedSymbols}
              onSymbolsChange={handleSymbolsChange}
              symbolColors={symbolColors}
              onColorChange={handleColorChange}
            />
            <ChartingContainer />
          </div>
        </div>
      </header>

      {/* Chart + новости под ним: позволяем естественную высоту и скролл страницы */}
      <div className="w-full">
        <LegacyChartAdapter 
          className="w-full" 
          eventFilters={eventFilters}
          selectedSymbols={selectedSymbols.length > 0 ? selectedSymbols : undefined}
          symbolColors={symbolColors}
        />
      </div>

      {/* Shared components */}
      <SharedContainer />
    </div>
  );
};
