import React from 'react';
import { useStore } from '../../../store';
import { TimeframeSelector } from '../components/TimeframeSelector';

interface LegacyTimeframeSelectorAdapterProps {
  isLoading?: boolean;
}

export const LegacyTimeframeSelectorAdapter: React.FC<LegacyTimeframeSelectorAdapterProps> = ({
  isLoading = false
}) => {
  const { timeframe, setTimeframe } = useStore();

  return (
    <TimeframeSelector
      timeframe={timeframe}
      onTimeframeChange={setTimeframe}
      isLoading={isLoading}
    />
  );
}; 