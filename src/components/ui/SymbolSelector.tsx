import { useState } from 'react'
import { useStore } from '../../store'

interface SymbolOption {
  symbol: string
  name: string
  category: 'major' | 'altcoins' | 'defi'
}

const symbolOptions: SymbolOption[] = [
  // Major cryptocurrencies
  { symbol: 'BTCUSDT', name: 'Bitcoin', category: 'major' },
  { symbol: 'ETHUSDT', name: 'Ethereum', category: 'major' },
  { symbol: 'BNBUSDT', name: 'BNB', category: 'major' },
  { symbol: 'XRPUSDT', name: 'XRP', category: 'major' },
  { symbol: 'ADAUSDT', name: 'Cardano', category: 'major' },
  
  // Popular Altcoins
  { symbol: 'SOLUSDT', name: 'Solana', category: 'altcoins' },
  { symbol: 'DOTUSDT', name: 'Polkadot', category: 'altcoins' },
  { symbol: 'AVAXUSDT', name: 'Avalanche', category: 'altcoins' },
  { symbol: 'LINKUSDT', name: 'Chainlink', category: 'altcoins' },
  { symbol: 'MATICUSDT', name: 'Polygon', category: 'altcoins' },
  
  // DeFi Tokens
  { symbol: 'UNIUSDT', name: 'Uniswap', category: 'defi' },
  { symbol: 'AAVEUSDT', name: 'Aave', category: 'defi' },
  { symbol: 'COMPUSDT', name: 'Compound', category: 'defi' },
  { symbol: 'MKRUSDT', name: 'Maker', category: 'defi' },
  { symbol: 'CRVUSDT', name: 'Curve', category: 'defi' },
]

function SymbolSelector() {
  const { symbol, setSymbol } = useStore()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<'major' | 'altcoins' | 'defi'>('major')

  const currentSymbolInfo = symbolOptions.find(opt => opt.symbol === symbol) || symbolOptions[0]
  const filteredOptions = symbolOptions.filter(option => option.category === selectedCategory)

  const handleSymbolChange = (newSymbol: string) => {
    setSymbol(newSymbol)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {/* Compact Selected Symbol Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-700 rounded-lg px-3 py-2 flex items-center gap-2 hover:bg-gray-700 transition-colors text-sm border border-gray-600"
        style={{ gap: '0.5rem' }}
      >
        <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
          <span className="text-xs font-bold text-black">
            {currentSymbolInfo.symbol.slice(0, 2)}
          </span>
        </div>
        <span className="font-medium text-white">{currentSymbolInfo.name}</span>
        <div className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Compact Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 rounded-lg border border-gray-600 shadow-xl z-50 min-w-[200px]">
          {/* Compact Category Selector */}
          <div className="p-2 border-b border-gray-600">
            <div className="flex gap-1 bg-gray-900 rounded-md p-1" style={{ gap: '0.25rem' }}>
              {(['major', 'altcoins', 'defi'] as const).map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                    selectedCategory === category
                      ? 'bg-emerald-500 text-black'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {category === 'major' ? 'Major' : category === 'altcoins' ? 'Alt' : 'DeFi'}
                </button>
              ))}
            </div>
          </div>

          {/* Compact Symbol Options */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.map((option) => (
              <button
                key={option.symbol}
                onClick={() => handleSymbolChange(option.symbol)}
                className={`w-full p-2 text-left flex items-center gap-2 hover:bg-gray-700 transition-colors text-sm ${
                  symbol === option.symbol ? 'bg-gray-700' : ''
                }`}
                style={{ gap: '0.5rem' }}
              >
                <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-black">
                    {option.symbol.slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">{option.name}</div>
                </div>
                {symbol === option.symbol && (
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

export default SymbolSelector 