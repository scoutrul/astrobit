import React from 'react';
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
  return (
    <div className={className}>
      <EventFilters 
        eventFilters={eventFilters}
        onFiltersChange={onFiltersChange}
      />
    </div>
  );
}; 