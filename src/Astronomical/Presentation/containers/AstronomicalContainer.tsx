import React, { useState } from 'react';
import { EventFilters } from '../components/EventFilters';

interface AstronomicalContainerProps {
  className?: string;
  eventFilters?: {
    lunar?: boolean;
    solar?: boolean;
    planetary?: boolean;
    meteor?: boolean;
  };
  onFiltersChange?: (filters: {
    lunar: boolean;
    solar: boolean;
    planetary: boolean;
    meteor: boolean;
  }) => void;
}

export const AstronomicalContainer: React.FC<AstronomicalContainerProps> = ({ 
  className = '',
  eventFilters = { lunar: true, solar: true, planetary: true, meteor: true },
  onFiltersChange
}) => {
  const [localEventFilters, setLocalEventFilters] = useState(eventFilters);

  const handleFiltersChange = (newFilters: {
    lunar: boolean;
    solar: boolean;
    planetary: boolean;
    meteor: boolean;
  }) => {
    setLocalEventFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  return (
    <div className={className}>
      <EventFilters 
        eventFilters={localEventFilters}
        onFiltersChange={handleFiltersChange}
      />
    </div>
  );
}; 