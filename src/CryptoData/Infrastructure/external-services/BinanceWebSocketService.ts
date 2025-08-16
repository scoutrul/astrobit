import { ExternalService } from '../../../Shared/infrastructure/ExternalService';
import { Result } from '../../../Shared/domain/Result';

export interface BinanceKlineWebSocketData {
  symbol: string;
  interval: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isClosed: boolean;
}

export interface BinanceWebSocketMessage {
  stream: string;
  data: {
    e: string; // Event type
    E: number; // Event time
    s: string; // Symbol
    k: {
      t: number; // Kline start time
      T: number; // Kline close time
      s: string; // Symbol
      i: string; // Interval
      f: number; // First trade ID
      L: number; // Last trade ID
      o: string; // Open price
      h: string; // High price
      l: string; // Low price
      c: string; // Close price
      v: string; // Volume
      n: number; // Number of trades
      x: boolean; // Is this kline closed?
      q: string; // Quote asset volume
      V: string; // Taker buy base asset volume
      Q: string; // Taker buy quote asset volume
    };
  };
}

export class BinanceWebSocketService extends ExternalService {
  private static instance: BinanceWebSocketService | null = null;
  private ws: WebSocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private currentSubscription: { symbol: string; interval: string } | null = null;
  private messageHandlers: ((data: BinanceKlineWebSocketData) => void)[] = [];

  private constructor() {
    super();
  }

  static getInstance(): BinanceWebSocketService {
    if (!BinanceWebSocketService.instance) {
      BinanceWebSocketService.instance = new BinanceWebSocketService();
    }
    return BinanceWebSocketService.instance;
  }

  /**
   * Подписывается на kline данные для указанного символа и таймфрейма
   */
    async subscribeToKlineData(
    symbol: string,
    interval: string,
    onData: (data: BinanceKlineWebSocketData) => void
  ): Promise<Result<void>> {
    try {
      // Для недельных и месячных таймфреймов WebSocket обновления могут быть менее частыми
      // Логируем попытку подключения
      console.log(`[WebSocket] 🔄 Attempting to subscribe to ${symbol.toUpperCase()}@kline_${interval}`);

      // Проверяем, не пытаемся ли мы подписаться на ту же подписку
      if (this.currentSubscription && 
          this.currentSubscription.symbol === symbol.toLowerCase() && 
          this.currentSubscription.interval === interval &&
          this.isConnected) {
        console.log(`[WebSocket] ℹ️ Already subscribed to ${symbol.toUpperCase()}@kline_${interval}, skipping`);
        return Result.ok();
      }

      // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Принудительно закрываем все соединения
      // Это гарантирует, что старые WebSocket соединения полностью прекратят работу
      await this.forceCloseAllConnections();
      
      // Небольшая задержка для корректного закрытия предыдущего соединения
      await new Promise(resolve => setTimeout(resolve, 150));

      // Сохраняем обработчик
      this.messageHandlers = [onData];

      // Создаем новую подписку
      this.currentSubscription = { symbol: symbol.toLowerCase(), interval };
      
      // Подключаемся к WebSocket
      await this.connect();

      console.log(`[WebSocket] ✅ Successfully subscribed to ${symbol.toUpperCase()}@kline_${interval}`);
      return Result.ok();
    } catch (error) {
      console.error(`[WebSocket] ❌ Failed to subscribe to ${symbol.toUpperCase()}@kline_${interval}:`, error);
      return Result.fail(`Failed to subscribe: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Отписывается от текущей подписки
   */
  async unsubscribe(): Promise<Result<void>> {
    try {
      console.log(`[WebSocket] 🔌 Unsubscribing from:`, {
        currentSubscription: this.currentSubscription,
        wsState: this.ws?.readyState,
        isConnected: this.isConnected
      });

      // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Принудительно отключаем обработчики сообщений
      // Это предотвращает получение сообщений от старых соединений
      this.messageHandlers = [];
      
      // Закрываем WebSocket соединение принудительно
      if (this.ws) {
        try {
          // Убираем все обработчики событий перед закрытием
          this.ws.onopen = null;
          this.ws.onmessage = null;
          this.ws.onerror = null;
          this.ws.onclose = null;
          
          // Принудительно закрываем соединение
          if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
            this.ws.close(1000, 'Unsubscribing'); // Код 1000 = нормальное закрытие
          }
          
          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Ждем полного закрытия соединения
          // или принудительно обнуляем WebSocket через таймаут
          let attempts = 0;
          const maxAttempts = 10; // Максимум 500мс
          
          while (this.ws && this.ws.readyState !== WebSocket.CLOSED && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 50));
            attempts++;
          }
          
          // Если WebSocket все еще не закрылся, принудительно обнуляем
          if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
            console.warn(`[WebSocket] ⚠️ WebSocket not closed after ${attempts * 50}ms, forcing cleanup`);
            this.ws = null;
          }
          
        } catch (closeError) {
          console.warn('[WebSocket] ⚠️ Error during WebSocket close:', closeError);
        } finally {
          this.ws = null;
        }
      }

      // Очищаем состояние
      this.isConnected = false;
      this.currentSubscription = null;
      
      console.log(`[WebSocket] ✅ Successfully unsubscribed`);
      return Result.ok();
    } catch (error) {
      console.warn('[WebSocket] ⚠️ Error during unsubscribe (continuing anyway):', error);
      
      // Принудительно очищаем состояние даже при ошибке
      this.ws = null;
      this.isConnected = false;
      this.currentSubscription = null;
      this.messageHandlers = [];
      
      return Result.ok();
    }
  }

  /**
   * Подключается к Binance WebSocket API
   */
  private async connect(): Promise<void> {
    if (!this.currentSubscription) {
      throw new Error('No subscription configured');
    }

    const { symbol, interval } = this.currentSubscription;
    const streamName = `${symbol}@kline_${interval}`;
    const wsUrl = `wss://stream.binance.com:9443/ws/${streamName}`;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[WebSocket] ❌ Message parsing error:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.warn(`[WebSocket] ⚠️ WebSocket error for ${symbol}@${interval}:`, {
            error: error,
            readyState: this.ws?.readyState,
            url: this.ws?.url
          });
          
          // Не отклоняем промис при ошибке - WebSocket может восстановиться
          // reject(error);
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.handleReconnection();
        };

      } catch (error) {
        console.error('[BinanceWebSocketService] Ошибка создания WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Обрабатывает входящие WebSocket сообщения
   */
  private handleMessage(message: any): void {
    // КРИТИЧЕСКАЯ ПРОВЕРКА: Обрабатываем сообщения только если есть активная подписка
    if (!this.currentSubscription || !this.isConnected) {
      console.log(`[WebSocket] ⚠️ Ignoring message - no active subscription or not connected:`, {
        hasSubscription: !!this.currentSubscription,
        isConnected: this.isConnected,
        messageType: message?.e || 'unknown'
      });
      return;
    }

    // ДОПОЛНИТЕЛЬНАЯ ЗАЩИТА: Проверяем, что WebSocket все еще соответствует текущей подписке
    if (this.ws && this.currentSubscription) {
      const expectedStream = `${this.currentSubscription.symbol}@kline_${this.currentSubscription.interval}`;
      const currentUrl = this.ws.url;
      
      if (currentUrl && !currentUrl.includes(expectedStream)) {
        console.warn(`[WebSocket] ⚠️ Ignoring message - WebSocket URL mismatch:`, {
          expected: expectedStream,
          current: currentUrl,
          messageType: message?.e || 'unknown'
        });
        return;
      }
    }

    // КРИТИЧЕСКАЯ ЗАЩИТА: Если WebSocket не соответствует текущей подписке, принудительно закрываем
    if (this.ws && this.currentSubscription && this.ws.url) {
      const expectedStream = `${this.currentSubscription.symbol}@kline_${this.currentSubscription.interval}`;
      const currentUrl = this.ws.url;
      
      if (!currentUrl.includes(expectedStream)) {
        console.warn(`[WebSocket] 🚨 WebSocket URL mismatch detected, forcing cleanup:`, {
          expected: expectedStream,
          current: currentUrl
        });
        
        // Принудительно закрываем несоответствующее соединение
        this.forceCloseAllConnections();
        return;
      }
    }

    // Проверяем структуру сообщения
    if (!message || typeof message !== 'object') {
      return;
    }

    // Обрабатываем сообщения с stream (для подписок)
    if (message.stream && message.data) {
      this.handleStreamMessage(message);
      return;
    }

    // Обрабатываем прямые сообщения (для одиночных подписок)
    if (message.e === 'kline') {
      this.handleKlineMessage(message);
      return;
    }
  }

  /**
   * Обрабатывает сообщения с stream
   */
  private handleStreamMessage(message: any): void {
    if (message.data.e !== 'kline') {
      return;
    }

    this.handleKlineData(message.data.k);
  }

  /**
   * Обрабатывает прямые kline сообщения
   */
  private handleKlineMessage(message: any): void {
    if (message.k) {
      this.handleKlineData(message.k);
    }
  }

  /**
   * Обрабатывает kline данные
   */
  private handleKlineData(klineData: any): void {
    // ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: Обрабатываем данные только если есть активная подписка
    if (!this.currentSubscription || !this.isConnected) {
      console.log(`[WebSocket] ⚠️ Ignoring kline data - no active subscription:`, {
        hasSubscription: !!this.currentSubscription,
        isConnected: this.isConnected,
        symbol: klineData?.s,
        interval: klineData?.i
      });
      return;
    }

    // Проверяем структуру kline данных
    if (!klineData || typeof klineData !== 'object') {
      return;
    }

    // ВРЕМЕННО ОТКЛЮЧАЕМ ПРОВЕРКУ для отладки
    console.log(`[WebSocket] 🔍 DEBUG: Received kline data:`, {
      symbol: klineData.s,
      interval: klineData.i,
      expectedSymbol: this.currentSubscription.symbol,
      expectedInterval: this.currentSubscription.interval,
      price: klineData.c,
      volume: klineData.v,
      timestamp: klineData.t
    });

    // Проверяем соответствие текущей подписке с нормализацией
    const normalizedReceivedSymbol = klineData.s?.toLowerCase();
    const normalizedExpectedSymbol = this.currentSubscription.symbol?.toLowerCase();
    const normalizedReceivedInterval = klineData.i?.toLowerCase();
    const normalizedExpectedInterval = this.currentSubscription.interval?.toLowerCase();
    
    if (normalizedReceivedSymbol !== normalizedExpectedSymbol || 
        normalizedReceivedInterval !== normalizedExpectedInterval) {
      console.log(`[WebSocket] ⚠️ Ignoring kline data - symbol/interval mismatch:`, {
        expected: `${this.currentSubscription.symbol}@${this.currentSubscription.interval}`,
        received: `${klineData.s}@${klineData.i}`,
        normalizedExpected: `${normalizedExpectedSymbol}@${normalizedExpectedInterval}`,
        normalizedReceived: `${normalizedReceivedSymbol}@${normalizedReceivedInterval}`
      });
      return; // Игнорируем данные не для текущей подписки
    }

    // ВРЕМЕННО ОТКЛЮЧАЕМ ПРОВЕРКУ закрытых свечей для демонстрации live обновлений
    if (!klineData.x) {
      console.log(`[WebSocket] ℹ️ Skipping open candle:`, {
        symbol: klineData.s,
        interval: klineData.i,
        isClosed: klineData.x
      });
      // return; // ВРЕМЕННО ОТКЛЮЧАЕМ для демонстрации
    }

    try {
      const data: BinanceKlineWebSocketData = {
        symbol: klineData.s,
        interval: klineData.i,
        timestamp: klineData.t,
        open: parseFloat(klineData.o),
        high: parseFloat(klineData.h),
        low: parseFloat(klineData.l),
        close: parseFloat(klineData.c),
        volume: parseFloat(klineData.v),
        isClosed: klineData.x
      };

      // Вызываем все обработчики
      this.messageHandlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('[WebSocket] ❌ Handler error:', error);
        }
      });
    } catch (error) {
      console.error('[BinanceWebSocketService] Ошибка обработки kline данных:', error);
    }
  }

  /**
   * Обрабатывает переподключение при разрыве соединения
   */
  private handleReconnection(): void {
    // Сбрасываем счетчик попыток при успешном переподключении
    if (this.isConnected) {
      this.reconnectAttempts = 0;
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn(`[WebSocket] ⚠️ Max reconnection attempts reached for ${this.currentSubscription?.symbol}@${this.currentSubscription?.interval}`);
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000); // Максимум 30 секунд

    console.log(`[WebSocket] 🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} for ${this.currentSubscription?.symbol}@${this.currentSubscription?.interval} in ${delay}ms`);

    setTimeout(async () => {
      if (this.currentSubscription && !this.isConnected) {
        try {
          await this.connect();
        } catch (error) {
          console.warn(`[WebSocket] ⚠️ Reconnection failed, will retry:`, error);
          this.handleReconnection();
        }
      }
    }, delay);
  }

  /**
   * Проверяет статус соединения
   */
  async isAvailable(): Promise<boolean> {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Получает текущую подписку
   */
  getCurrentSubscription(): { symbol: string; interval: string } | null {
    return this.currentSubscription;
  }

  /**
   * Принудительно закрывает все WebSocket соединения
   * Используется для экстренной очистки при смене монет
   */
  async forceCloseAllConnections(): Promise<void> {
    console.log('[WebSocket] 🚨 Force closing all connections');
    
    if (this.ws) {
      try {
        // Убираем все обработчики
        this.ws.onopen = null;
        this.ws.onmessage = null;
        this.ws.onerror = null;
        this.ws.onclose = null;
        
        // Принудительно закрываем
        if (this.ws.readyState !== WebSocket.CLOSED) {
          this.ws.close(1000, 'Force close');
        }
        
        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Ждем полного закрытия соединения
        // или принудительно обнуляем WebSocket через таймаут
        let attempts = 0;
        const maxAttempts = 20; // Максимум 1 секунда
        
        while (this.ws && this.ws.readyState !== WebSocket.CLOSED && attempts < maxAttempts) {
          // Небольшая задержка
          await new Promise(resolve => setTimeout(resolve, 50));
          attempts++;
        }
        
        // Если WebSocket все еще не закрылся, принудительно обнуляем
        if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
          console.warn(`[WebSocket] ⚠️ WebSocket not closed after ${attempts * 50}ms, forcing cleanup`);
          this.ws = null;
        }
        
      } catch (error) {
        console.warn('[WebSocket] ⚠️ Error during force close:', error);
      } finally {
        this.ws = null;
      }
    }
    
    // Очищаем состояние
    this.isConnected = false;
    this.currentSubscription = null;
    this.messageHandlers = [];
    this.reconnectAttempts = 0;
    
    console.log('[WebSocket] ✅ All connections force closed');
  }
} 