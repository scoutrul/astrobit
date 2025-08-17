import { useStore } from '../../../Shared/presentation/store'

// Обновленные таймфреймы для астрономической корреляции
const timeframeOptions = [
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
]

function TimeframeSelector() {
  const { timeframe, setTimeframe } = useStore()

  const handleTimeframeChange = (newTimeframe: string) => {
    if (newTimeframe !== timeframe) {
      setTimeframe(newTimeframe);
      useStore.getState().setTimeframe(newTimeframe);
    }
  };

  return (
    <div className="flex flex-wrap gap-1 sm:gap-2 justify-center sm:justify-start">
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
          `}
          title={option.description}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export default TimeframeSelector 