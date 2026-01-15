import { useState, useEffect, useRef, useMemo } from 'react';
import { DependencyContainer } from '../../../Shared/infrastructure/DependencyContainer';
import { BinanceApiService } from '../../../CryptoData/Infrastructure/external-services/BinanceApiService';

interface SymbolOption {
  symbol: string;
  name: string;
}

// Более контрастные цвета для графиков
const SYMBOL_COLORS = [
  '#f7931a', // Orange (BTC) - яркий оранжевый
  '#627eea', // Blue (ETH) - яркий синий
  '#14f195', // Green (SOL) - яркий зеленый
  '#ff6b6b', // Red - яркий красный
  '#00d4ff', // Cyan - яркий голубой
  '#ffd700', // Gold - золотой
  '#ff1493', // Deep Pink - яркий розовый
  '#00ff00', // Lime - лайм
  '#ff4500', // Orange Red - оранжево-красный
  '#9370db'  // Medium Purple - фиолетовый
];

interface MultiSymbolSelectorProps {
  selectedSymbols: string[];
  onSymbolsChange: (symbols: string[]) => void;
  symbolColors?: Map<string, string>;
  onColorChange?: (symbol: string, color: string) => void;
  primarySymbol?: string; // Основной символ, который нельзя удалить
  onPrimarySymbolChange?: (symbol: string) => void; // Обработчик изменения основного символа
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
];

export const MultiSymbolSelector: React.FC<MultiSymbolSelectorProps> = ({
  selectedSymbols,
  onSymbolsChange,
  symbolColors,
  onColorChange,
  primarySymbol,
  onPrimarySymbolChange
}) => {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isPrimaryMenuOpen, setIsPrimaryMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [primarySearchQuery, setPrimarySearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isPrimarySearchFocused, setIsPrimarySearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<SymbolOption[]>([]);
  const [primarySearchResults, setPrimarySearchResults] = useState<SymbolOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPrimarySearching, setIsPrimarySearching] = useState(false);
  const allSymbolsRef = useRef<{ symbol: string; baseAsset: string; quoteAsset: string }[] | null>(null);
  const searchTimeoutRef = useRef<number | null>(null);
  const primarySearchTimeoutRef = useRef<number | null>(null);

  // Генерируем цвета для символов, если не переданы
  const colorsMap = useMemo(() => {
    const map = new Map<string, string>();
    // Основной символ всегда первый
    if (primarySymbol) {
      map.set(primarySymbol, symbolColors?.get(primarySymbol) || SYMBOL_COLORS[0]);
    }
    // Остальные символы
    selectedSymbols.forEach((symbol, index) => {
      if (symbolColors?.has(symbol)) {
        map.set(symbol, symbolColors.get(symbol)!);
      } else {
        map.set(symbol, SYMBOL_COLORS[(index + 1) % SYMBOL_COLORS.length]);
      }
    });
    return map;
  }, [selectedSymbols, symbolColors, primarySymbol]);

  const handleAddSymbol = (symbol: string) => {
    // Не добавляем, если это основной символ или уже есть в списке
    if (symbol === primarySymbol || selectedSymbols.includes(symbol)) {
      return;
    }
    onSymbolsChange([...selectedSymbols, symbol]);
    setIsAddMenuOpen(false);
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  const handleRemoveSymbol = (symbol: string) => {
    // Не удаляем основной символ
    if (symbol === primarySymbol) {
      return;
    }
    onSymbolsChange(selectedSymbols.filter(s => s !== symbol));
  };

  const ensureSymbolsLoaded = async () => {
    if (allSymbolsRef.current) return;
    try {
      const container = DependencyContainer.getInstance();
      const api = container.resolve<BinanceApiService>('BinanceApiService');
      const result = await api.getSymbols();
      if (result.isSuccess) {
        allSymbolsRef.current = result.value
          .filter(s => s.quoteAsset === 'USDT' && s.status === 'TRADING' && s.isSpotTradingAllowed)
          .map(s => ({ symbol: s.symbol, baseAsset: s.baseAsset, quoteAsset: s.quoteAsset }));
      }
    } catch (e) {
      // fail silently
    }
  };

  // Поиск по вводу с debounce
  useEffect(() => {
    const doSearch = async () => {
      const q = searchQuery.trim().toUpperCase();
      if (q.length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      await ensureSymbolsLoaded();
      const list = allSymbolsRef.current || [];
      const results: SymbolOption[] = list
        .filter(s => s.baseAsset.includes(q) || s.symbol.includes(q))
        .filter(s => !selectedSymbols.includes(s.symbol) && s.symbol !== primarySymbol) // Исключаем уже выбранные и основной
        .slice(0, 20)
        .map(s => ({ symbol: s.symbol, name: s.symbol.replace('USDT', '') }));
      setSearchResults(results);
      setIsSearching(false);
    }

    if (searchTimeoutRef.current) window.clearTimeout(searchTimeoutRef.current);
    // @ts-ignore - setTimeout in browser returns number
    searchTimeoutRef.current = window.setTimeout(doSearch, 300);
    return () => {
      if (searchTimeoutRef.current) window.clearTimeout(searchTimeoutRef.current);
    }
  }, [searchQuery, selectedSymbols]);

  const onSearchSubmit = async () => {
    const q = searchQuery.trim().toUpperCase().replace(/[^A-Z]/g, '');
    if (!q) return;
    await ensureSymbolsLoaded();
    const list = allSymbolsRef.current || [];
    const target = `${q}USDT`;
    const exists = list.some(s => s.symbol === target);
    if (exists && !selectedSymbols.includes(target) && target !== primarySymbol) {
      handleAddSymbol(target);
      setSearchResults([]);
    }
  };

  // Поиск для основного символа
  useEffect(() => {
    const doSearch = async () => {
      const q = primarySearchQuery.trim().toUpperCase();
      if (q.length < 2) {
        setPrimarySearchResults([]);
        setIsPrimarySearching(false);
        return;
      }
      setIsPrimarySearching(true);
      await ensureSymbolsLoaded();
      const list = allSymbolsRef.current || [];
      const results: SymbolOption[] = list
        .filter(s => s.baseAsset.includes(q) || s.symbol.includes(q))
        .slice(0, 20)
        .map(s => ({ symbol: s.symbol, name: s.symbol.replace('USDT', '') }));
      setPrimarySearchResults(results);
      setIsPrimarySearching(false);
    }

    if (primarySearchTimeoutRef.current) window.clearTimeout(primarySearchTimeoutRef.current);
    // @ts-ignore - setTimeout in browser returns number
    primarySearchTimeoutRef.current = window.setTimeout(doSearch, 300);
    return () => {
      if (primarySearchTimeoutRef.current) window.clearTimeout(primarySearchTimeoutRef.current);
    }
  }, [primarySearchQuery]);

  const onPrimarySearchSubmit = async () => {
    const q = primarySearchQuery.trim().toUpperCase().replace(/[^A-Z]/g, '');
    if (!q) return;
    await ensureSymbolsLoaded();
    const list = allSymbolsRef.current || [];
    const target = `${q}USDT`;
    const exists = list.some(s => s.symbol === target);
    if (exists && onPrimarySymbolChange) {
      onPrimarySymbolChange(target);
      setIsPrimaryMenuOpen(false);
      setPrimarySearchQuery('');
      setIsPrimarySearchFocused(false);
    }
  };

  const getSymbolName = (symbol: string): string => {
    const topHit = TOP20_OPTIONS.find(opt => opt.symbol === symbol);
    return topHit ? topHit.name : symbol.replace('USDT', '');
  };

  const getSymbolShortCode = (symbol: string): string => {
    // Извлекаем первые 3 буквы из символа (например, BTCUSDT -> BTC)
    return symbol.replace('USDT', '').substring(0, 3).toUpperCase();
  };

  return (
    <div className="flex flex-wrap items-center gap-2 w-full">
      {/* Основной символ (первый, нельзя удалить) */}
      {primarySymbol && (
        <div className="relative">
          <div 
            onClick={() => setIsPrimaryMenuOpen(!isPrimaryMenuOpen)}
            className="flex items-center gap-1.5 bg-gray-700 rounded-lg px-2.5 py-1.5 border border-gray-600 cursor-pointer hover:bg-gray-600 transition-colors"
          >
            {/* Цветной индикатор с кодом монеты */}
            <div
              className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
              style={{ backgroundColor: colorsMap.get(primarySymbol) || SYMBOL_COLORS[0] }}
            >
              <span className="text-[10px] font-bold text-black leading-none">
                {getSymbolShortCode(primarySymbol)}
              </span>
            </div>
            <span className="text-sm font-medium text-white">{getSymbolName(primarySymbol)}</span>
          </div>

          {isPrimaryMenuOpen && (
            <div className="absolute top-full left-0 mt-1 bg-gray-800 rounded-lg border border-gray-600 shadow-xl z-50" style={{ minWidth: '300px' }}>
              {/* Поле поиска внутри меню */}
              <div className="p-2 border-b border-gray-600">
                <div className="flex items-center bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 gap-2">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
                  </svg>
                  <input
                    value={primarySearchQuery}
                    onChange={(e) => setPrimarySearchQuery(e.target.value)}
                    onFocus={() => {
                      setIsPrimarySearchFocused(true);
                    }}
                    onBlur={() => {
                      // Не закрываем меню при потере фокуса поиска
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        onPrimarySearchSubmit();
                      }
                    }}
                    placeholder="Название монеты"
                    className="bg-transparent outline-none text-sm text-white placeholder-gray-400 flex-1 min-w-0"
                    autoFocus
                  />
                </div>
              </div>

              {/* Результаты поиска или топ-20 */}
              <div className="max-h-64 overflow-y-auto">
                {isPrimarySearchFocused && (primarySearchResults.length > 0 || (primarySearchQuery.trim().length >= 2 && isPrimarySearching)) ? (
                  <>
                    {isPrimarySearching && (
                      <div className="p-2 text-xs text-gray-400">Поиск...</div>
                    )}
                    {!isPrimarySearching && primarySearchResults.map((option) => (
                      <button
                        key={option.symbol}
                        onClick={() => {
                          if (onPrimarySymbolChange) {
                            onPrimarySymbolChange(option.symbol);
                          }
                          setIsPrimaryMenuOpen(false);
                          setPrimarySearchQuery('');
                          setIsPrimarySearchFocused(false);
                        }}
                        className={`w-full p-2 text-left flex items-center gap-2 hover:bg-gray-700 transition-colors text-sm ${
                          primarySymbol === option.symbol ? 'bg-gray-700' : ''
                        }`}
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
                        {primarySymbol === option.symbol && (
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                        )}
                      </button>
                    ))}
                    {!isPrimarySearching && primarySearchResults.length === 0 && primarySearchQuery.trim().length >= 2 && (
                      <div className="p-2 text-xs text-gray-400">Ничего не найдено</div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="p-2 text-xs text-gray-400 mb-1">Популярные:</div>
                    {TOP20_OPTIONS.map((option) => (
                      <button
                        key={option.symbol}
                        onClick={() => {
                          if (onPrimarySymbolChange) {
                            onPrimarySymbolChange(option.symbol);
                          }
                          setIsPrimaryMenuOpen(false);
                          setPrimarySearchQuery('');
                          setIsPrimarySearchFocused(false);
                        }}
                        className={`w-full p-2 text-left flex items-center gap-2 hover:bg-gray-700 transition-colors text-sm ${
                          primarySymbol === option.symbol ? 'bg-gray-700' : ''
                        }`}
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
                        {primarySymbol === option.symbol && (
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                        )}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Кнопка добавления слева с выпадающим меню */}
      <div className="relative">
        <button
          onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
          className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded transition-colors text-sm text-gray-300 flex-shrink-0"
          title="Добавить символ"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {isAddMenuOpen && (
          <div className="absolute top-full left-0 mt-1 bg-gray-800 rounded-lg border border-gray-600 shadow-xl z-50" style={{ minWidth: '300px' }}>
            {/* Поле поиска внутри меню */}
            <div className="p-2 border-b border-gray-600">
              <div className="flex items-center bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 gap-2">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    setIsSearchFocused(true);
                  }}
                  onBlur={() => {
                    // Не закрываем меню при потере фокуса поиска
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onSearchSubmit();
                    }
                  }}
                  placeholder="Название монеты (например, DOGE)"
                  className="bg-transparent outline-none text-sm text-white placeholder-gray-400 flex-1 min-w-0"
                  autoFocus
                />
                <span className="text-xs text-gray-400 flex-shrink-0">USDT</span>
              </div>
            </div>

            {/* Результаты поиска или топ-20 */}
            <div className="max-h-64 overflow-y-auto">
              {isSearchFocused && (searchResults.length > 0 || (searchQuery.trim().length >= 2 && isSearching)) ? (
                <>
                  {isSearching && (
                    <div className="p-2 text-xs text-gray-400">Поиск...</div>
                  )}
                  {!isSearching && searchResults.map((option) => (
                    <button
                      key={option.symbol}
                      onClick={() => handleAddSymbol(option.symbol)}
                      className="w-full p-2 text-left flex items-center gap-2 hover:bg-gray-700 transition-colors text-sm"
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
                </>
              ) : (
                <>
                  <div className="p-2 text-xs text-gray-400 mb-1">Популярные:</div>
                  {TOP20_OPTIONS.filter(opt => !selectedSymbols.includes(opt.symbol) && opt.symbol !== primarySymbol).map((option) => (
                    <button
                      key={option.symbol}
                      onClick={() => handleAddSymbol(option.symbol)}
                      className="w-full p-2 text-left flex items-center gap-2 hover:bg-gray-700 transition-colors text-sm"
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
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Выбранные символы (чипсы) */}
      {selectedSymbols.map((symbol, index) => {
        const color = colorsMap.get(symbol) || SYMBOL_COLORS[index % SYMBOL_COLORS.length];
        return (
          <div
            key={symbol}
            className="flex items-center gap-1.5 bg-gray-700 rounded-lg px-2.5 py-1.5 border border-gray-600"
          >
            {/* Цветной индикатор с кодом монеты */}
            <div
              className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
              style={{ backgroundColor: color }}
            >
              <span className="text-[10px] font-bold text-black leading-none">
                {getSymbolShortCode(symbol)}
              </span>
            </div>
            <span className="text-sm font-medium text-white">{getSymbolName(symbol)}</span>
            <button
              onClick={() => handleRemoveSymbol(symbol)}
              className="ml-1 text-gray-400 hover:text-white transition-colors"
              title="Удалить"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}

      {/* Оверлей для закрытия выпадающего меню */}
      {(isAddMenuOpen || isPrimaryMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsAddMenuOpen(false);
            setIsPrimaryMenuOpen(false);
            setSearchQuery('');
            setPrimarySearchQuery('');
            setIsSearchFocused(false);
            setIsPrimarySearchFocused(false);
          }}
        />
      )}
    </div>
  );
};
