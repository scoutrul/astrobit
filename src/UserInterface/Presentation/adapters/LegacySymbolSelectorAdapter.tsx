import React from 'react';
import { useStore } from '../../../store';
import { SymbolSelector } from '../components/SymbolSelector';

export const LegacySymbolSelectorAdapter: React.FC = () => {
  const { symbol, setSymbol } = useStore();

  return (
    <SymbolSelector
      symbol={symbol}
      onSymbolChange={setSymbol}
    />
  );
}; 