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
      console.log(`[BinanceWebSocketService] Подписка на kline данные: ${symbol}@${interval}`);

      // Отписываемся от предыдущей подписки
      await this.unsubscribe();

      // Сохраняем обработчик
      this.messageHandlers = [onData];

      // Создаем новую подписку
      this.currentSubscription = { symbol: symbol.toLowerCase(), interval };
      
      // Подключаемся к WebSocket
      await this.connect();

      return Result.ok();
    } catch (error) {
      console.error('[BinanceWebSocketService] Ошибка подписки:', error);
      return Result.fail(`Failed to subscribe: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Отписывается от текущей подписки
   */
  async unsubscribe(): Promise<Result<void>> {
    try {
      console.log('[BinanceWebSocketService] Отписка от текущей подписки');

      // Закрываем WebSocket соединение
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }

      this.isConnected = false;
      this.currentSubscription = null;
      this.messageHandlers = [];

      return Result.ok();
    } catch (error) {
      console.error('[BinanceWebSocketService] Ошибка отписки:', error);
      return Result.fail(`Failed to unsubscribe: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

    console.log(`[BinanceWebSocketService] Подключение к: ${wsUrl}`);

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('[BinanceWebSocketService] WebSocket соединение установлено');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            // Убираем избыточное логирование каждого сообщения
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[BinanceWebSocketService] Ошибка парсинга сообщения:', error);
            console.error('[BinanceWebSocketService] Сырые данные:', event.data);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[BinanceWebSocketService] WebSocket ошибка:', error);
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('[BinanceWebSocketService] WebSocket соединение закрыто:', event.code, event.reason);
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
    // Проверяем структуру kline данных
    if (!klineData || typeof klineData !== 'object') {
      return;
    }

    // Проверяем соответствие текущей подписке
    if (this.currentSubscription) {
      if (klineData.s !== this.currentSubscription.symbol || 
          klineData.i !== this.currentSubscription.interval) {
        return; // Игнорируем данные не для текущей подписки
      }
    }

    // Обрабатываем только закрытые свечи
    if (!klineData.x) {
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

      // Логируем только важные события (закрытые свечи)
      console.log(`[BinanceWebSocketService] 📊 Закрытая свеча: ${data.symbol} ${data.interval}`, {
        timestamp: new Date(data.timestamp).toISOString(),
        close: data.close,
        volume: data.volume
      });

      // Вызываем все обработчики
      this.messageHandlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('[BinanceWebSocketService] Ошибка в обработчике:', error);
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
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[BinanceWebSocketService] Превышено максимальное количество попыток переподключения');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`[BinanceWebSocketService] Переподключение через ${delay}ms (попытка ${this.reconnectAttempts})`);

    setTimeout(async () => {
      if (this.currentSubscription) {
        try {
          await this.connect();
        } catch (error) {
          console.error('[BinanceWebSocketService] Ошибка переподключения:', error);
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
} 