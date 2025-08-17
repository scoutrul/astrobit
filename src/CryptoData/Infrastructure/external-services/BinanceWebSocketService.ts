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

interface SubscriptionHandler {
  id: string;
  callback: (data: BinanceKlineWebSocketData) => void;
}

/**
 * Оптимизированный WebSocket сервис для Binance API
 * Поддерживает единое соединение с множественными подписками
 */
export class BinanceWebSocketService extends ExternalService {
  private static instance: BinanceWebSocketService | null = null;
  private ws: WebSocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  
  // Активные подписки: ключ = "symbol@interval", значение = массив обработчиков
  private subscriptions = new Map<string, SubscriptionHandler[]>();
  
  // Текущее активное соединение
  private activeStream: string | null = null;
  
  // Последние полученные данные для каждого потока
  private lastDataCache = new Map<string, BinanceKlineWebSocketData>();

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
   * Оптимизировано для предотвращения дублирования соединений
   */
  async subscribeToKlineData(
    symbol: string, 
    interval: string, 
    onData: (data: BinanceKlineWebSocketData) => void,
    subscriberId?: string
  ): Promise<Result<void>> {
    try {
      const normalizedSymbol = symbol.toLowerCase();
      const streamKey = `${normalizedSymbol}@kline_${interval}`;
      const handlerId = subscriberId || `handler_${Date.now()}_${Math.random()}`;

      // Проверяем, есть ли уже активная подписка на этот поток
      if (this.subscriptions.has(streamKey)) {
        // Добавляем новый обработчик к существующей подписке
        const handlers = this.subscriptions.get(streamKey)!;
        
        // Проверяем, не существует ли уже обработчик с таким ID
        const existingHandlerIndex = handlers.findIndex(h => h.id === handlerId);
        if (existingHandlerIndex >= 0) {
          // Заменяем существующий обработчик
          handlers[existingHandlerIndex].callback = onData;
        } else {
          // Добавляем новый обработчик
          handlers.push({ id: handlerId, callback: onData });
        }
        
        // Если есть кэшированные данные, отправляем их новому подписчику
        const cachedData = this.lastDataCache.get(streamKey);
        if (cachedData) {
          try {
            onData(cachedData);
          } catch (error) {
            // Ошибка отправки кэшированных данных
          }
        }
        
        return Result.ok();
      }

      // Проверяем, не пытаемся ли мы создать дублирующую подписку
      if (this.activeStream === streamKey && this.subscriptions.size > 0) {
        return Result.fail('Subscription already exists for this stream');
      }

      // Создаем новую подписку
      this.subscriptions.set(streamKey, [{ id: handlerId, callback: onData }]);

      // Если это первая подписка или нужно сменить поток
      if (!this.activeStream || this.activeStream !== streamKey) {
        await this.switchToStream(streamKey);
      }

      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to subscribe: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Отписывается от конкретного обработчика
   */
  async unsubscribeHandler(subscriberId: string): Promise<Result<void>> {
    try {
      let found = false;
      
      // Ищем и удаляем обработчик по ID
      for (const [streamKey, handlers] of this.subscriptions.entries()) {
        const handlerIndex = handlers.findIndex(h => h.id === subscriberId);
        if (handlerIndex >= 0) {
          handlers.splice(handlerIndex, 1);
          found = true;
          
          // Если больше нет обработчиков для этого потока, удаляем подписку
          if (handlers.length === 0) {
            this.subscriptions.delete(streamKey);
            this.lastDataCache.delete(streamKey);
            
            // Если это был активный поток и больше нет подписок, закрываем соединение
            if (this.activeStream === streamKey && this.subscriptions.size === 0) {
              await this.disconnect();
            }
          }
          break;
        }
      }
      
      return found ? Result.ok() : Result.fail(`Subscription not found: ${subscriberId}`);
    } catch (error) {
      return Result.fail(`Failed to unsubscribe: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Отписывается от всех подписок (legacy метод)
   */
  async unsubscribe(): Promise<Result<void>> {
    try {
      await this.disconnect();
      this.subscriptions.clear();
      this.lastDataCache.clear();
      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to unsubscribe: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Переключается на новый поток данных
   */
  private async switchToStream(streamKey: string): Promise<void> {
    // Если уже подключены к нужному потоку, не переключаемся
    if (this.activeStream === streamKey && this.isConnected) {
      return;
    }

    // Закрываем существующее соединение только если оно отличается
    if (this.ws && this.activeStream !== streamKey) {
      // Очищаем подписки старого потока
      this.subscriptions.clear();
      
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }

    // Очищаем таймаут переподключения
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.activeStream = streamKey;
    await this.connect();
  }

  /**
   * Подключается к Binance WebSocket API
   */
  private async connect(): Promise<void> {
    if (!this.activeStream) {
      throw new Error('No active stream configured');
    }

    // Условный WebSocket URL в зависимости от режима
    const wsUrl = import.meta.env.DEV
      ? `ws://localhost:5173/binance-ws/ws/${this.activeStream}`  // Прокси в dev режиме
      : `wss://stream.binance.com:9443/ws/${this.activeStream}`; // Внешний WebSocket в production

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
            // Ошибка парсинга сообщения
          }
        };

        this.ws.onerror = (error) => {
          reject(error);
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          
          // Переподключаемся только если есть активные подписки
          if (this.subscriptions.size > 0) {
            this.handleReconnection();
          }
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Закрывает соединение
   */
  private async disconnect(): Promise<void> {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    this.activeStream = null;
    this.reconnectAttempts = 0;
  }

  /**
   * Обрабатывает входящие WebSocket сообщения
   */
  private handleMessage(message: any): void {
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

    this.handleKlineData(message.data.k, message.stream);
  }

  /**
   * Обрабатывает прямые kline сообщения
   */
  private handleKlineMessage(message: any): void {
    if (message.k) {
      const streamKey = `${message.k.s.toLowerCase()}@kline_${message.k.i}`;
      this.handleKlineData(message.k, streamKey);
    }
  }

  /**
   * Обрабатывает kline данные и обновляет кэш
   */
  private handleKlineData(klineData: any, streamKey?: string): void {
    if (!klineData || typeof klineData !== 'object') {
      return;
    }

    const inferredStreamKey = streamKey || `${klineData.s.toLowerCase()}@kline_${klineData.i}`;
    
    // Проверяем, есть ли подписчики на этот поток
    const handlers = this.subscriptions.get(inferredStreamKey);
    if (!handlers || handlers.length === 0) {
      return;
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

      // Отладочная информация для проверки данных (только для закрытых свечей)
      if (klineData.x) {
      }

      // Обновляем кэш последних данных (для всех свечей, не только закрытых)
      this.lastDataCache.set(inferredStreamKey, data);

      // Отправляем данные всем подписчикам (как закрытые, так и живые свечи)
      handlers.forEach(handler => {
        try {
          handler.callback(data);
        } catch (error) {
          // Ошибка обработчика
        }
      });

    } catch (error) {
      // Ошибка обработки kline данных
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
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000); // Максимум 30 секунд

    this.reconnectTimeout = setTimeout(async () => {
      if (this.activeStream && this.subscriptions.size > 0) {
        try {
          await this.connect();
        } catch (error) {
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
   * Получает информацию о текущих подписках
   */
  getSubscriptionsInfo(): { activeStream: string | null; subscriptionsCount: number; handlersCount: number } {
    const handlersCount = Array.from(this.subscriptions.values()).reduce((total, handlers) => total + handlers.length, 0);
    
    return {
      activeStream: this.activeStream,
      subscriptionsCount: this.subscriptions.size,
      handlersCount
    };
  }

  /**
   * Получает текущую подписку (legacy метод для совместимости)
   */
  getCurrentSubscription(): { symbol: string; interval: string } | null {
    if (!this.activeStream) {
      return null;
    }

    const match = this.activeStream.match(/^(.+)@kline_(.+)$/);
    if (match) {
      return {
        symbol: match[1].toUpperCase(),
        interval: match[2]
      };
    }

    return null;
  }

  /**
   * Получает последние данные для потока
   */
  getLastData(symbol: string, interval: string): BinanceKlineWebSocketData | null {
    const streamKey = `${symbol.toLowerCase()}@kline_${interval}`;
    return this.lastDataCache.get(streamKey) || null;
  }

  /**
   * Принудительно закрывает все WebSocket соединения
   * Используется для экстренной очистки при смене монет
   */
  async forceCloseAllConnections(): Promise<void> {
    
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
          this.ws = null;
        }
        
      } catch (error) {
      } finally {
        this.ws = null;
      }
    }
    
    // Очищаем состояние
    this.isConnected = false;
    this.reconnectAttempts = 0;
    
  }
} 