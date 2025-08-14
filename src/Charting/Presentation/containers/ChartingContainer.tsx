import React from 'react';
import TimeframeSelector from '../components/TimeframeSelector';

interface ChartingContainerProps {
  className?: string;
}

export const ChartingContainer: React.FC<ChartingContainerProps> = ({ className = '' }) => {
  return (
    <div className={className}>
      <TimeframeSelector />
    </div>
  );
}; 