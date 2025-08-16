import { useState, useEffect } from 'react';
import { BinanceKlineWebSocketData } from '../../../CryptoData/Infrastructure/external-services/BinanceWebSocketService';

interface PriceWidgetState {
  price: number;
  symbol: string;
  timestamp: number;
  isLive: boolean;
}

interface UsePriceWidgetProps {
  symbol: string;
  realTimeData?: BinanceKlineWebSocketData | null;
  initialPrice?: number;
  isLoading?: boolean;
}

export const usePriceWidget = ({
  symbol,
  realTimeData,
  initialPrice,
  isLoading = false
}: UsePriceWidgetProps) => {
  const [priceState, setPriceState] = useState<PriceWidgetState | null>(null);
  const [isPriceLoading, setIsPriceLoading] = useState(true);

  // Обновление цены из WebSocket данных
  useEffect(() => {
    if (realTimeData && realTimeData.symbol === symbol) {
      console.log(`[usePriceWidget] 💰 Live price update:`, {
        symbol: realTimeData.symbol,
        price: realTimeData.close,
        timestamp: new Date(realTimeData.timestamp).toISOString()
      });
      
      setPriceState({
        price: realTimeData.close,
        symbol: realTimeData.symbol,
        timestamp: realTimeData.timestamp,
        isLive: true
      });
      setIsPriceLoading(false);
    }
  }, [realTimeData, symbol]);

  // Установка начальной цены из исторических данных
  useEffect(() => {
    if (initialPrice && !priceState && !isLoading) {
      setPriceState({
        price: initialPrice,
        symbol,
        timestamp: Date.now(),
        isLive: false
      });
      setIsPriceLoading(false);
    }
  }, [initialPrice, priceState, symbol, isLoading]);

  // Сброс состояния при смене символа
  useEffect(() => {
    setPriceState(null);
    setIsPriceLoading(true);
  }, [symbol]);

  return {
    price: priceState?.price,
    isLive: priceState?.isLive || false,
    isPriceLoading,
    timestamp: priceState?.timestamp
  };
}; 