import React from 'react';
import SymbolSelector from '../components/SymbolSelector';

interface CryptoDataContainerProps {
  className?: string;
}

export const CryptoDataContainer: React.FC<CryptoDataContainerProps> = ({ className = '' }) => {
  return (
    <div className={className}>
      <SymbolSelector />
    </div>
  );
}; 