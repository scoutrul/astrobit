import { useStore } from '../../store'

interface TimeframeOption {
  value: string
  label: string
  description: string
  astronomical: string
}

// Simplified timeframes for astronomical correlation
const timeframeOptions: TimeframeOption[] = [
  { 
    value: '1h', 
    label: '1H', 
    description: 'Hourly',
    astronomical: 'Moon transits & fast lunar aspects'
  },
  { 
    value: '1d', 
    label: '1D', 
    description: 'Daily',
    astronomical: 'Daily lunar & planetary aspects'
  },
  { 
    value: '1w', 
    label: '1W', 
    description: 'Weekly',
    astronomical: 'Moon phases & planetary movements'
  },
  { 
    value: '1M', 
    label: '1M', 
    description: 'Monthly',
    astronomical: 'Complete lunar cycles'
  },
  { 
    value: '1Y', 
    label: '1Y', 
    description: 'Yearly',
    astronomical: 'Solar cycles & annual patterns'
  },
]

function TimeframeSelector() {
  const { timeframe, setTimeframe } = useStore()

  const handleTimeframeChange = (newTimeframe: string) => {
    setTimeframe(newTimeframe)
  }

  const currentOption = timeframeOptions.find(opt => opt.value === timeframe)

  return (
    <div className="space-y-4">
      {/* Timeframe Buttons */}
      <div className="grid grid-cols-5 gap-2">
        {timeframeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleTimeframeChange(option.value)}
            className={`
              relative px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200
              border border-[var(--border-color)]
              ${timeframe === option.value
                ? 'bg-[var(--accent-primary)] text-[var(--bg-primary)] border-[var(--accent-primary)] shadow-[var(--shadow-glow)]'
                : 'bg-[var(--bg-accent)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)]/50'
              }
            `}
          >
            <div className="text-center">
              <div className="font-semibold">{option.label}</div>
              <div className="text-xs opacity-75 mt-1">{option.description}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Astronomical Context */}
      {currentOption && (
        <div className="bg-[var(--bg-accent)]/50 rounded-lg p-4 border border-[var(--border-color)]">
          <div className="flex items-center space-x-2 mb-2">
            <div className="text-lg">🌙</div>
            <div className="text-sm font-medium text-[var(--text-primary)]">Astronomical Relevance</div>
          </div>
          <div className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {currentOption.astronomical}
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className="bg-[var(--bg-secondary)]/50 rounded-lg p-3 border border-[var(--border-color)]">
        <div className="text-xs text-[var(--text-muted)] space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-[var(--accent-primary)] rounded-full"></div>
            <span>Timeframes optimized for cosmic pattern analysis</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-[var(--accent-secondary)] rounded-full"></div>
            <span>Shorter periods may not reveal meaningful astronomical correlations</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TimeframeSelector 