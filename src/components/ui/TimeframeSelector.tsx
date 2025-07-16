import { useStore } from '../../store'

// Simplified timeframes for astronomical correlation
const timeframeOptions = [
  {
    value: '15m',
    label: '15м',
    description: '15 минут'
  },
  {
    value: '1h', 
    label: '1ч',
    description: '1 час'
  },
  {
    value: '4h',
    label: '4ч', 
    description: '4 часа'
  },
  {
    value: '1d',
    label: '1д',
    description: '1 день'
  }
  // Removed 1w timeframe due to data issues
]

function TimeframeSelector() {
  const { timeframe, setTimeframe } = useStore()

  const handleTimeframeChange = (newTimeframe: string) => {
    console.log(`[TimeframeSelector] Изменение таймфрейма: ${timeframe} → ${newTimeframe}`);
    setTimeframe(newTimeframe)
    
    // Принудительное обновление для отладки
    setTimeout(() => {
      console.log(`[TimeframeSelector] Таймфрейм установлен: ${useStore.getState().timeframe}`);
    }, 100);
  }

  return (
    <div className="flex gap-2" style={{ gap: '0.5rem' }}>
      {timeframeOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => handleTimeframeChange(option.value)}
          className={`
            px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
            border border-gray-600
            ${timeframe === option.value
              ? 'bg-emerald-500 text-black border-emerald-500'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white hover:border-emerald-500/50'
            }
          `}
        >
          <div className="text-center">
            <div className="font-semibold">{option.label}</div>
          </div>
        </button>
      ))}
    </div>
  )
}

export default TimeframeSelector 