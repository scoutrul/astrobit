import React, { useMemo } from 'react';
import { BinanceKlineWebSocketData } from '../../../CryptoData/Infrastructure/external-services/BinanceWebSocketService';
import { DateTimeFormatter } from '../../../Shared/infrastructure/utils/DateTimeFormatter';

interface LivePriceWidgetProps {
  symbol: string;
  realTimeData: BinanceKlineWebSocketData | null;
  isLoading?: boolean;
  className?: string;
}

export const LivePriceWidget: React.FC<LivePriceWidgetProps> = ({
  symbol,
  realTimeData,
  isLoading = false,
  className = ''
}) => {
  // Вычисляем изменение цены
  const priceChange = useMemo(() => {
    if (!realTimeData) return null;
    
    const change = realTimeData.close - realTimeData.open;
    const changePercent = (change / realTimeData.open) * 100;
    
    return {
      absolute: change,
      percent: changePercent,
      isPositive: change >= 0
    };
  }, [realTimeData, symbol]);

  // Проверяем соответствие символа в real-time данных
  const isDataForCurrentSymbol = realTimeData && 
    realTimeData.symbol.toLowerCase() === symbol.toLowerCase();

  // Скрываем виджет во время загрузки, если нет данных или данные для другого символа
  if (isLoading || !realTimeData || !isDataForCurrentSymbol) {
    return (
      <div className={`absolute top-4 left-4 z-10 bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 border border-gray-600 ${className}`}>
        <div className="flex flex-col space-y-1">
          <div className="text-xs text-gray-400 font-medium">{symbol}</div>
          <div className="text-lg font-mono text-gray-500">---.--</div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            <div className="text-xs text-gray-400">
              {isLoading ? 'Loading...' : 'Connecting...'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formattedPrice = DateTimeFormatter.formatNumber(realTimeData.close, 2);

  return (
    <div className={`absolute top-4 left-4 z-10 bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 border border-gray-600 shadow-lg ${className}`}>
      <div className="flex flex-col space-y-1">
        {/* Symbol */}
        <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">
          {symbol}
        </div>
        
        {/* Current Price */}
        <div className="text-lg font-mono text-white font-semibold">
          ${formattedPrice}
        </div>
        
        {/* Price Change */}
        {priceChange && (
          <div className="flex items-center space-x-2">
            <div className={`text-xs font-medium flex items-center space-x-1 ${
              priceChange.isPositive ? 'text-green-400' : 'text-red-400'
            }`}>
              <span className="text-[10px]">
                {priceChange.isPositive ? '▲' : '▼'}
              </span>
              <span>
                {priceChange.isPositive ? '+' : ''}
                {priceChange.absolute.toFixed(2)}
              </span>
            </div>
            
            <div className={`text-xs font-medium ${
              priceChange.isPositive ? 'text-green-400' : 'text-red-400'
            }`}>
              ({priceChange.isPositive ? '+' : ''}{priceChange.percent.toFixed(2)}%)
            </div>
          </div>
        )}
        
        {/* Status Indicator */}
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            realTimeData.isClosed ? 'bg-orange-400' : 'bg-green-400 animate-pulse'
          }`} />
          <div className="text-[10px] text-gray-400 uppercase tracking-wide">
            {realTimeData.isClosed ? 'Closed' : 'Live'}
          </div>
        </div>
      </div>
    </div>
  );
}; 