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
      // Валидация входных данных
      const validationResult = this.validateRequest(request);
      if (!validationResult.isSuccess) {
        return Result.fail(validationResult.error);
      }

      // Для недельных и месячных таймфреймов WebSocket обновления не имеют смысла
      // так как свечи обновляются крайне редко
      const timeframeValue = request.timeframe.value;
      if (timeframeValue === '1w' || timeframeValue === '1M') {
        console.log(`[RealTime] ℹ️ Skipping WebSocket subscription for ${timeframeValue} timeframe (updates too infrequent)`);
        return Result.ok({
          success: true,
          message: `WebSocket подписка пропущена для ${timeframeValue} (обновления слишком редкие)`
        });
      }

      // Подписываемся на WebSocket данные
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
   * Отписывается от текущей подписки
   */
  async unsubscribe(): Promise<Result<void>> {
    try {
      return await this.webSocketService.unsubscribe();
    } catch (error) {
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