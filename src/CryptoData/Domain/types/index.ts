// CryptoData Domain Types

export interface CryptoData {
  symbol: string;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  // Опциональные свойства для стилизации свечей
  color?: string;
  borderColor?: string;
  wickColor?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Bybit API V5 Response Structure
export interface BybitResponse<T> {
  retCode: number;
  retMsg: string;
  result: T;
  retExtInfo: Record<string, any>;
  time: number;
}

// Bybit API Configuration
export interface BybitApiConfig {
  key?: string;
  secret?: string;
  testnet?: boolean;
  recvWindow?: number;
  baseURL?: string;
}

// Enhanced Bybit Kline Data
export interface BybitKlineData {
  symbol: string;
  category: string;
  list: [string, string, string, string, string, string, string][]; // [startTime, openPrice, highPrice, lowPrice, closePrice, volume, turnover]
}

// Bybit Market Data Interfaces
export interface BybitTickerData {
  symbol: string;
  bid1Price: string;
  bid1Size: string;
  ask1Price: string;
  ask1Size: string;
  lastPrice: string;
  prevPrice24h: string;
  price24hPcnt: string;
  highPrice24h: string;
  lowPrice24h: string;
  turnover24h: string;
  volume24h: string;
  usdIndexPrice: string;
}

// Bybit Order Book Data
export interface BybitOrderBookData {
  s: string; // symbol
  b: [string, string][]; // bids
  a: [string, string][]; // asks
  ts: number; // timestamp
  u: number; // update id
}

// Bybit Symbol Information
export interface BybitSymbolInfo {
  symbol: string;
  baseCoin: string;
  quoteCoin: string;
  innovation: string;
  status: string;
  marginTrading: string;
  lotSizeFilter: {
    basePrecision: string;
    quotePrecision: string;
    minOrderQty: string;
    maxOrderQty: string;
    minOrderAmt: string;
    maxOrderAmt: string;
  };
  priceFilter: {
    minPrice: string;
    maxPrice: string;
    tickSize: string;
  };
}

// Bybit Order Request
export interface BybitOrderRequest {
  category: 'spot' | 'linear' | 'inverse' | 'option';
  symbol: string;
  side: 'Buy' | 'Sell';
  orderType: 'Market' | 'Limit';
  qty: string;
  price?: string;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
  orderLinkId?: string;
  isLeverage?: 0 | 1;
  orderFilter?: 'Order' | 'StopOrder';
  triggerPrice?: string;
  triggerDirection?: 1 | 2;
  triggerBy?: 'LastPrice' | 'IndexPrice' | 'MarkPrice';
  positionIdx?: 0 | 1 | 2;
  takeProfit?: string;
  stopLoss?: string;
  tpTriggerBy?: 'LastPrice' | 'IndexPrice' | 'MarkPrice';
  slTriggerBy?: 'LastPrice' | 'IndexPrice' | 'MarkPrice';
  reduceOnly?: boolean;
  closeOnTrigger?: boolean;
  mmp?: boolean;
}

// Bybit Order Response
export interface BybitOrderResponse {
  orderId: string;
  orderLinkId: string;
}

// Bybit Account Information
export interface BybitAccountInfo {
  unifiedMarginStatus: number;
  marginMode: string;
  updatedTime: string;
  dcpStatus: string;
  timeWindow: number;
  smpGroup: number;
  isMasterTrader: boolean;
  spotHedgingStatus: string;
}

// Bybit Wallet Balance
export interface BybitWalletBalance {
  accountType: string;
  coin: [{
    coin: string;
    equity: string;
    usdValue: string;
    walletBalance: string;
    free: string;
    locked: string;
    borrowAmount: string;
    available: string;
    unrealisedPnl: string;
    cumRealisedPnl: string;
  }];
}

// Bybit Position
export interface BybitPosition {
  positionIdx: number;
  riskId: number;
  riskLimitValue: string;
  symbol: string;
  side: string;
  size: string;
  avgPrice: string;
  positionValue: string;
  tradeMode: number;
  autoAddMargin: number;
  positionStatus: string;
  leverage: string;
  markPrice: string;
  liqPrice: string;
  bustPrice: string;
  positionIM: string;
  positionMM: string;
  positionBalance: string;
  tpslMode: string;
  takeProfit: string;
  stopLoss: string;
  trailingStop: string;
  unrealisedPnl: string;
  cumRealisedPnl: string;
  sessionAvgPrice: string;
  delta: string;
  gamma: string;
  vega: string;
  theta: string;
  underlyingPrice: string;
  createdTime: string;
  updatedTime: string;
}

// Event Binning Types
export interface EventBin {
  timeRange: {
    start: number;
    end: number;
  };
  events: any[]; // Will be properly typed when importing from Astronomical
  position: {
    x: number;
    y: number;
  };
} 