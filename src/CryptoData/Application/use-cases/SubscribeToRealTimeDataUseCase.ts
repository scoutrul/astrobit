import { UseCase } from '../../../Shared/application/UseCase';
import { Result } from '../../../Shared/domain/Result';
import { Symbol } from '../../Domain/value-objects/Symbol';
import { Timeframe } from '../../Domain/value-objects/Timeframe';
import { BinanceWebSocketService, BinanceKlineWebSocketData } from '../../Infrastructure/external-services/BinanceWebSocketService';

export interface SubscribeToRealTimeDataRequest {
  symbol: Symbol;
  timeframe: Timeframe;
  onDataUpdate: (data: BinanceKlineWebSocketData) => void;
}

export interface SubscribeToRealTimeDataWithIdRequest extends SubscribeToRealTimeDataRequest {
  subscriberId: string;
}

export interface SubscribeToRealTimeDataResponse {
  success: boolean;
  message: string;
}

export class SubscribeToRealTimeDataUseCase extends UseCase<SubscribeToRealTimeDataRequest, SubscribeToRealTimeDataResponse> {
  private webSocketService: BinanceWebSocketService;

  constructor() {
    super();
    this.webSocketService = BinanceWebSocketService.getInstance();
  }

  protected validateRequest(request: SubscribeToRealTimeDataRequest): Result<SubscribeToRealTimeDataRequest> {
    if (!request.symbol) {
      return Result.fail('Symbol is required');
    }
    if (!request.timeframe) {
      return Result.fail('Timeframe is required');
    }
    if (!request.onDataUpdate) {
      return Result.fail('Data update callback is required');
    }
    return Result.ok(request);
  }

  protected validateRequestWithId(request: SubscribeToRealTimeDataWithIdRequest): Result<SubscribeToRealTimeDataWithIdRequest> {
    const baseValidation = this.validateRequest(request);
    if (!baseValidation.isSuccess) {
      return Result.fail(baseValidation.error);
    }
    if (!request.subscriberId) {
      return Result.fail('Subscriber ID is required');
    }
    return Result.ok(request);
  }

  async execute(request: SubscribeToRealTimeDataRequest): Promise<Result<SubscribeToRealTimeDataResponse>> {
    try {
      // Валидация входных данных
      const validationResult = this.validateRequest(request);
      if (!validationResult.isSuccess) {
        return Result.fail(validationResult.error);
      }

      // Подписываемся на WebSocket данные (legacy метод)
      const result = await this.webSocketService.subscribeToKlineData(
        request.symbol.toString(),
        request.timeframe.toString(),
        request.onDataUpdate
      );

      if (result.isSuccess) {
        return Result.ok({
          success: true,
          message: `Подписка на ${request.symbol.toString()}@${request.timeframe.toString()} установлена`
        });
      } else {
        return Result.fail(result.error);
      }
    } catch (error) {
      return Result.fail(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Подписывается на real-time данные с уникальным идентификатором
   */
  async executeWithId(request: SubscribeToRealTimeDataWithIdRequest): Promise<Result<SubscribeToRealTimeDataResponse>> {
    try {
      // Валидация входных данных
      const validationResult = this.validateRequestWithId(request);
      if (!validationResult.isSuccess) {
        return Result.fail(validationResult.error);
      }

      // Подписываемся на WebSocket данные с идентификатором
      const result = await this.webSocketService.subscribeToKlineData(
        request.symbol.toString(),
        request.timeframe.toString(),
        request.onDataUpdate,
        request.subscriberId
      );

      if (result.isSuccess) {
        return Result.ok({
          success: true,
          message: `Подписка на ${request.symbol.toString()}@${request.timeframe.toString()} установлена (ID: ${request.subscriberId})`
        });
      } else {
        return Result.fail(result.error);
      }
    } catch (error) {
      return Result.fail(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Отписывается от текущей подписки (legacy метод)
   */
  async unsubscribe(): Promise<Result<void>> {
    try {
      return await this.webSocketService.unsubscribe();
    } catch (error) {
      return Result.fail(`Failed to unsubscribe: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Отписывается от конкретного обработчика по ID
   */
  async unsubscribeHandler(subscriberId: string): Promise<Result<void>> {
    try {
      if (!subscriberId) {
        return Result.fail('Subscriber ID is required');
      }
      return await this.webSocketService.unsubscribeHandler(subscriberId);
    } catch (error) {
      return Result.fail(`Failed to unsubscribe handler: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Проверяет статус WebSocket соединения
   */
  async isConnected(): Promise<boolean> {
    return await this.webSocketService.isAvailable();
  }

  /**
   * Получает текущую подписку
   */
  getCurrentSubscription(): { symbol: string; interval: string } | null {
    return this.webSocketService.getCurrentSubscription();
  }

  /**
   * Получает экземпляр WebSocket сервиса для прямого доступа
   */
  getWebSocketService(): BinanceWebSocketService {
    return this.webSocketService;
  }

  /**
   * Получает информацию о подписках
   */
  getSubscriptionsInfo(): { activeStream: string | null; subscriptionsCount: number; handlersCount: number } {
    return this.webSocketService.getSubscriptionsInfo();
  }
} 