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
      {/* Selected Symbol Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#1a1d29] rounded-lg p-4 flex items-center justify-between hover:bg-[#262a36] transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#f7931a] rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-black">
              {currentSymbolInfo.symbol.slice(0, 2)}
            </span>
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-[#c9ccd3]">{currentSymbolInfo.name}</div>
            <div className="text-xs text-[#8b8f9b]">{currentSymbolInfo.symbol}</div>
          </div>
        </div>
        <div className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <svg className="w-4 h-4 text-[#8b8f9b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1d29] rounded-lg border border-[#262a36] shadow-xl z-50">
          {/* Category Selector */}
          <div className="p-3 border-b border-[#262a36]">
            <div className="flex space-x-1 bg-[#0a0b1e] rounded-lg p-1">
              {(['major', 'altcoins', 'defi'] as const).map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
                    selectedCategory === category
                      ? 'bg-[#f7931a] text-black'
                      : 'text-[#8b8f9b] hover:text-[#c9ccd3] hover:bg-[#1a1d29]'
                  }`}
                >
                  {category === 'major' ? 'Major' : category === 'altcoins' ? 'Altcoins' : 'DeFi'}
                </button>
              ))}
            </div>
          </div>

          {/* Symbol Options */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.map((option) => (
              <button
                key={option.symbol}
                onClick={() => handleSymbolChange(option.symbol)}
                className={`w-full p-3 text-left flex items-center space-x-3 hover:bg-[#262a36] transition-colors ${
                  symbol === option.symbol ? 'bg-[#262a36]' : ''
                }`}
              >
                <div className="w-6 h-6 bg-[#f7931a] rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-black">
                    {option.symbol.slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#c9ccd3]">{option.name}</div>
                  <div className="text-xs text-[#8b8f9b]">{option.symbol}</div>
                </div>
                {symbol === option.symbol && (
                  <div className="w-2 h-2 bg-[#f7931a] rounded-full"></div>
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