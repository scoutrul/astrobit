import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../../../Shared/presentation/store'
import { DependencyContainer } from '../../../Shared/infrastructure/DependencyContainer'
import { BinanceApiService } from '../../Infrastructure/external-services/BinanceApiService'

interface SymbolOption {
  symbol: string
  name: string
}

// Топ-20 пар по рынку (USDT), статический список для быстрого выбора
const TOP20_OPTIONS: SymbolOption[] = [
  { symbol: 'BTCUSDT', name: 'Bitcoin' },
  { symbol: 'ETHUSDT', name: 'Ethereum' },
  { symbol: 'BNBUSDT', name: 'BNB' },
  { symbol: 'SOLUSDT', name: 'Solana' },
  { symbol: 'XRPUSDT', name: 'XRP' },
  { symbol: 'ADAUSDT', name: 'Cardano' },
  { symbol: 'DOGEUSDT', name: 'Dogecoin' },
  { symbol: 'TRXUSDT', name: 'TRON' },
  { symbol: 'TONUSDT', name: 'Toncoin' },
  { symbol: 'AVAXUSDT', name: 'Avalanche' },
  { symbol: 'LINKUSDT', name: 'Chainlink' },
  { symbol: 'MATICUSDT', name: 'Polygon' },
  { symbol: 'DOTUSDT', name: 'Polkadot' },
  { symbol: 'BCHUSDT', name: 'Bitcoin Cash' },
  { symbol: 'LTCUSDT', name: 'Litecoin' },
  { symbol: 'NEARUSDT', name: 'NEAR' },
  { symbol: 'ATOMUSDT', name: 'Cosmos' },
  { symbol: 'SHIBUSDT', name: 'Shiba Inu' },
  { symbol: 'ETCUSDT', name: 'Ethereum Classic' },
  { symbol: 'UNIUSDT', name: 'Uniswap' },
]

function SymbolSelector() {
  const { symbol, setSymbol } = useStore()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [searchResults, setSearchResults] = useState<SymbolOption[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const allSymbolsRef = useRef<{ symbol: string; baseAsset: string; quoteAsset: string }[] | null>(null)
  const searchTimeoutRef = useRef<number | null>(null)

  const currentSymbolInfo = useMemo<SymbolOption>(() => {
    const topHit = TOP20_OPTIONS.find(opt => opt.symbol === symbol)
    if (topHit) return topHit
    return { symbol, name: symbol.replace('USDT', '') }
  }, [symbol])

  const handleSymbolChange = (newSymbol: string) => {
    setSymbol(newSymbol)
    setIsOpen(false)
    setIsSearchFocused(false)
  }

  const ensureSymbolsLoaded = async () => {
    if (allSymbolsRef.current) return
    try {
      const container = DependencyContainer.getInstance()
      const api = container.resolve<BinanceApiService>('BinanceApiService')
      const result = await api.getSymbols()
      if (result.isSuccess) {
        allSymbolsRef.current = result.value
          .filter(s => s.quoteAsset === 'USDT' && s.status === 'TRADING' && s.isSpotTradingAllowed)
          .map(s => ({ symbol: s.symbol, baseAsset: s.baseAsset, quoteAsset: s.quoteAsset }))
      }
    } catch (e) {
      // fail silently
    }
  }

  // Поиск по вводу с debounce
  useEffect(() => {
    const doSearch = async () => {
      const q = searchQuery.trim().toUpperCase()
      if (q.length < 2) {
        setSearchResults([])
        setIsSearching(false)
        return
      }
      setIsSearching(true)
      await ensureSymbolsLoaded()
      const list = allSymbolsRef.current || []
      const results: SymbolOption[] = list
        .filter(s => s.baseAsset.includes(q) || s.symbol.includes(q))
        .slice(0, 20)
        .map(s => ({ symbol: s.symbol, name: s.symbol.replace('USDT', '') }))
      setSearchResults(results)
      setIsSearching(false)
    }

    if (searchTimeoutRef.current) window.clearTimeout(searchTimeoutRef.current)
    // @ts-ignore - setTimeout in browser returns number
    searchTimeoutRef.current = window.setTimeout(doSearch, 300)
    return () => {
      if (searchTimeoutRef.current) window.clearTimeout(searchTimeoutRef.current)
    }
  }, [searchQuery])

  const onSearchSubmit = async () => {
    const q = searchQuery.trim().toUpperCase().replace(/[^A-Z]/g, '')
    if (!q) return
    await ensureSymbolsLoaded()
    const list = allSymbolsRef.current || []
    const target = `${q}USDT`
    const exists = list.some(s => s.symbol === target)
    if (exists) {
      handleSymbolChange(target)
      setSearchResults([])
    }
  }

  return (
    <div className="relative flex items-center gap-2">
      {/* Кнопка выбора из топ-20 */}
      <div className="relative">
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

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 bg-gray-800 rounded-lg border border-gray-600 shadow-xl z-50 min-w-[220px] max-h-64 overflow-y-auto">
            {TOP20_OPTIONS.map((option) => (
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
                  <div className="text-xs text-gray-400">{option.symbol}</div>
                </div>
                {symbol === option.symbol && (
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Поле поиска монеты (USDT пара) */}
      <div className="relative">
        <div className="flex items-center bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 gap-2 min-w-[240px]">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearchSubmit()
            }}
            placeholder="Название монеты (например, DOGE)"
            className="bg-transparent outline-none text-sm text-white placeholder-gray-400 flex-1"
          />
          <span className="text-xs text-gray-400">USDT</span>
        </div>

        {/* Результаты поиска */}
        {isSearchFocused && (searchResults.length > 0 || (searchQuery.trim().length >= 2 && isSearching)) && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 rounded-lg border border-gray-600 shadow-xl z-50 max-h-64 overflow-y-auto">
            {isSearching && (
              <div className="p-2 text-xs text-gray-400">Поиск...</div>
            )}
            {!isSearching && searchResults.map((option) => (
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
                  <div className="text-xs text-gray-400">{option.symbol}</div>
                </div>
              </button>
            ))}
            {!isSearching && searchResults.length === 0 && searchQuery.trim().length >= 2 && (
              <div className="p-2 text-xs text-gray-400">Ничего не найдено</div>
            )}
          </div>
        )}
      </div>

      {/* Оверлей для закрытия выпадающего меню */}
      {(isOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

export default SymbolSelector