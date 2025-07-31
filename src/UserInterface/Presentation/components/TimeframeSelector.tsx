import React from 'react';

interface TimeframeOption {
  value: string;
  label: string;
  description: string;
}

interface TimeframeSelectorProps {
  timeframe: string;
  onTimeframeChange: (timeframe: string) => void;
  className?: string;
  isLoading?: boolean;
}

const timeframeOptions: TimeframeOption[] = [
  {
    value: '1h', 
    label: '1ч',
    description: '1 час'
  },
  {
    value: '8h',
    label: '8ч', 
    description: '8 часов'
  },
  {
    value: '1d',
    label: '1д',
    description: '1 день'
  },
  {
    value: '1w',
    label: '1нед',
    description: '1 неделя'
  },
  {
    value: '1M',
    label: '1мес',
    description: '1 месяц'
  }
];

export const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({
  timeframe,
  onTimeframeChange,
  className = '',
  isLoading = false
}) => {
  const handleTimeframeChange = (newTimeframe: string) => {
    console.log(`[TimeframeSelector] Изменение таймфрейма: ${timeframe} → ${newTimeframe}`);
    onTimeframeChange(newTimeframe);
  };

  return (
    <div className={`flex flex-wrap gap-1 sm:gap-2 justify-center sm:justify-start ${className}`}>
      {timeframeOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => handleTimeframeChange(option.value)}
          className={`
            px-2 py-1 sm:px-3 sm:py-2 rounded-md sm:rounded-lg 
            text-xs sm:text-sm font-medium transition-all duration-200
            border border-gray-600 min-w-[2.5rem] sm:min-w-auto
            ${timeframe === option.value
              ? 'bg-orange-500 text-white border-orange-500 shadow-lg' 
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-gray-500'
            }
            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          title={option.description}
          disabled={isLoading}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}; 