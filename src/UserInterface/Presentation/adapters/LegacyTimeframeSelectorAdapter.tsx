import React from 'react';
import { useStore } from '../../../store';
import { TimeframeSelector } from '../components/TimeframeSelector';

export const LegacyTimeframeSelectorAdapter: React.FC = () => {
  const { timeframe, setTimeframe } = useStore();

  return (
    <TimeframeSelector
      timeframe={timeframe}
      onTimeframeChange={setTimeframe}
    />
  );
}; 