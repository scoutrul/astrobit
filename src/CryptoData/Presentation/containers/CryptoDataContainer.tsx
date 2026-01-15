import React, { useCallback } from 'react';
import { MultiSymbolSelector } from '../../../Charting/Presentation/components/MultiSymbolSelector';
import { useStore } from '../../../Shared/presentation/store';

interface CryptoDataContainerProps {
  className?: string;
  selectedSymbols?: string[];
  onSymbolsChange?: (symbols: string[]) => void;
  symbolColors?: Map<string, string>;
  onColorChange?: (symbol: string, color: string) => void;
}

export const CryptoDataContainer: React.FC<CryptoDataContainerProps> = ({ 
  className = '',
  selectedSymbols = [],
  onSymbolsChange,
  symbolColors,
  onColorChange
}) => {
  const { symbol, setSymbol } = useStore();

  // Обработчик изменения основного символа с удалением его из списка наложения
  const handlePrimarySymbolChange = useCallback((newSymbol: string) => {
    setSymbol(newSymbol);
    // Удаляем новый основной символ из списка наложения, если он там есть
    if (onSymbolsChange && selectedSymbols.includes(newSymbol)) {
      onSymbolsChange(selectedSymbols.filter(s => s !== newSymbol));
    }
  }, [setSymbol, onSymbolsChange, selectedSymbols]);

  return (
    <div className={className}>
      <MultiSymbolSelector
        selectedSymbols={selectedSymbols}
        onSymbolsChange={onSymbolsChange || (() => {})}
        symbolColors={symbolColors}
        onColorChange={onColorChange}
        primarySymbol={symbol}
        onPrimarySymbolChange={handlePrimarySymbolChange}
      />
    </div>
  );
}; 