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

  async execute(request: SubscribeToRealTimeDataRequest): Promise<Result<SubscribeToRealTimeDataResponse>> {
    try {
      console.log('[SubscribeToRealTimeDataUseCase] Подписка на real-time данные:', {
        symbol: request.symbol.toString(),
        timeframe: request.timeframe.toString()
      });

      // Валидация входных данных
      const validationResult = this.validateRequest(request);
      if (!validationResult.isSuccess) {
        return Result.fail(validationResult.error);
      }

      // Подписываемся на WebSocket данные
      const result = await this.webSocketService.subscribeToKlineData(
        request.symbol.toString(),
        request.timeframe.toString(),
        request.onDataUpdate
      );

      if (result.isSuccess) {
        console.log('[SubscribeToRealTimeDataUseCase] ✅ Подписка успешно установлена');
        return Result.ok({
          success: true,
          message: `Подписка на ${request.symbol.toString()}@${request.timeframe.toString()} установлена`
        });
      } else {
        console.error('[SubscribeToRealTimeDataUseCase] ❌ Ошибка подписки:', result.error);
        return Result.fail(result.error);
      }
    } catch (error) {
      console.error('[SubscribeToRealTimeDataUseCase] ❌ Неожиданная ошибка:', error);
      return Result.fail(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Отписывается от текущей подписки
   */
  async unsubscribe(): Promise<Result<void>> {
    try {
      console.log('[SubscribeToRealTimeDataUseCase] Отписка от real-time данных');
      return await this.webSocketService.unsubscribe();
    } catch (error) {
      console.error('[SubscribeToRealTimeDataUseCase] ❌ Ошибка отписки:', error);
      return Result.fail(`Failed to unsubscribe: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
} 