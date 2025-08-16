import React from 'react';

interface PriceWidgetProps {
  symbol: string;
  price?: number;
  isLive?: boolean;
  isLoading?: boolean;
  className?: string;
}

export const PriceWidget: React.FC<PriceWidgetProps> = ({
  symbol,
  price,
  isLive = false,
  isLoading = false,
  className = ''
}) => {
  return (
    <div className={`absolute top-4 left-4 z-30 bg-[#0a0b1e]/95 backdrop-blur-sm border border-[#334155] rounded-lg px-4 py-3 shadow-lg ${className}`}>
      <div className="flex flex-col items-start gap-2">
        {/* Символ всегда показываем */}
        <div className="flex items-center gap-2">
          <div className="text-[#e2e8f0] font-semibold text-sm">
            {symbol || 'BTCUSDT'}
          </div>
          {!isLoading && price && (
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-[#10b981] animate-pulse' : 'bg-[#6b7280]'}`}
                 title={isLive ? 'Live данные' : 'Исторические данные'} />
          )}
        </div>

        {/* Цена - показываем только после загрузки */}
        {!isLoading && price ? (
          <>
            {/* Цена */}
            <div className="text-[#f7931a] font-bold text-xl">
              ${price.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </div>

            {/* Время последнего обновления */}
            <div className="text-[#8b8f9b] text-xs">
              {isLive ? 'Live' : 'История'} • {new Date().toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </div>
          </>
        ) : (
          <>
            {/* Пустое место для цены при загрузке */}
            <div className="text-[#f7931a] font-bold text-xl">
              &nbsp;
            </div>

            {/* Пустое место для времени при загрузке */}
            <div className="text-[#8b8f9b] text-xs">
              &nbsp;
            </div>
          </>
        )}
      </div>
    </div>
  );
}; 