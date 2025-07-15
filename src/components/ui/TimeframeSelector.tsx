import { useState, useEffect } from 'react'
import { useStore } from '../../store'

interface TimeframeOption {
  value: string
  label: string
  group: 'minutes' | 'hours' | 'days'
}

const timeframeOptions: TimeframeOption[] = [
  // Minutes
  { value: '1m', label: '1m', group: 'minutes' },
  { value: '3m', label: '3m', group: 'minutes' },
  { value: '5m', label: '5m', group: 'minutes' },
  { value: '15m', label: '15m', group: 'minutes' },
  { value: '30m', label: '30m', group: 'minutes' },
  
  // Hours
  { value: '1h', label: '1h', group: 'hours' },
  { value: '2h', label: '2h', group: 'hours' },
  { value: '4h', label: '4h', group: 'hours' },
  { value: '6h', label: '6h', group: 'hours' },
  { value: '12h', label: '12h', group: 'hours' },
  
  // Days
  { value: '1d', label: '1D', group: 'days' },
  { value: '3d', label: '3D', group: 'days' },
  { value: '1w', label: '1W', group: 'days' },
  { value: '1M', label: '1M', group: 'days' },
]

function TimeframeSelector() {
  const { timeframe, setTimeframe } = useStore()
  const [selectedGroup, setSelectedGroup] = useState<'minutes' | 'hours' | 'days'>('hours')

  // Update selected group when timeframe changes
  useEffect(() => {
    const option = timeframeOptions.find(opt => opt.value === timeframe)
    if (option) {
      setSelectedGroup(option.group)
    }
  }, [timeframe])

  const handleTimeframeChange = (newTimeframe: string) => {
    setTimeframe(newTimeframe)
  }

  const filteredOptions = timeframeOptions.filter(option => option.group === selectedGroup)

  return (
    <div className="bg-[#1a1d29] rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[#c9ccd3]">Timeframe</h3>
        <span className="text-xs text-[#8b8f9b]">Current: {timeframe}</span>
      </div>

      {/* Group Selector */}
      <div className="flex space-x-1 bg-[#0a0b1e] rounded-lg p-1">
        {(['minutes', 'hours', 'days'] as const).map((group) => (
          <button
            key={group}
            onClick={() => setSelectedGroup(group)}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
              selectedGroup === group
                ? 'bg-[#f7931a] text-black'
                : 'text-[#8b8f9b] hover:text-[#c9ccd3] hover:bg-[#1a1d29]'
            }`}
          >
            {group.charAt(0).toUpperCase() + group.slice(1)}
          </button>
        ))}
      </div>

      {/* Timeframe Options */}
      <div className="grid grid-cols-5 gap-2">
        {filteredOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleTimeframeChange(option.value)}
            className={`px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
              timeframe === option.value
                ? 'bg-[#f7931a] text-black'
                : 'bg-[#0a0b1e] text-[#8b8f9b] hover:text-[#c9ccd3] hover:bg-[#262a36] border border-[#262a36]'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Performance Info */}
      <div className="flex items-center justify-between text-xs text-[#8b8f9b]">
        <span>
          Data points: {selectedGroup === 'minutes' ? '200' : selectedGroup === 'hours' ? '168' : '90'}
        </span>
        <span>
          Period: {
            selectedGroup === 'minutes' 
              ? '~3-5 hours' 
              : selectedGroup === 'hours' 
                ? '~1 week' 
                : '~3 months'
          }
        </span>
      </div>
    </div>
  )
}

export default TimeframeSelector 