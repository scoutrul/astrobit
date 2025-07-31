import { UseCase } from '../../../Shared/application';
import { Result } from '../../../Shared/domain/Result';
import { ICryptoDataRepository } from '../../Domain/repositories/ICryptoDataRepository';
import { CryptoData } from '../../Domain/entities/CryptoData';
import { Symbol } from '../../Domain/value-objects/Symbol';
import { Timeframe } from '../../Domain/value-objects/Timeframe';

export interface GetCryptoDataRequest {
  symbol: string;
  timeframe: string;
  limit?: number;
}

export interface GetCryptoDataResponse {
  data: CryptoData[];
  symbol: string;
  timeframe: string;
  totalCount: number;
  lastUpdated: Date;
}

export class GetCryptoDataUseCase extends UseCase<GetCryptoDataRequest, GetCryptoDataResponse> {
  constructor(private readonly cryptoDataRepository: ICryptoDataRepository) {
    super();
  }

  private handleError(error: unknown): Result<never> {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return Result.fail(`GetCryptoDataUseCase error: ${errorMessage}`);
  }

  async execute(request: GetCryptoDataRequest): Promise<Result<GetCryptoDataResponse>> {
    try {
      // Validate request
      const validationResult = this.validateRequest(request);
      if (validationResult.isFailure) {
        return Result.fail(validationResult.error);
      }

      // Create domain objects
      const symbol = new Symbol(request.symbol);
      const timeframe = new Timeframe(request.timeframe as any);
      const limit = request.limit || timeframe.getRecommendedDataLimit();

      // Get data from repository
      const dataResult = await this.cryptoDataRepository.getKlineData(symbol, timeframe, limit);
      
      if (dataResult.isFailure) {
        return Result.fail(`Failed to get crypto data: ${dataResult.error}`);
      }

      const response: GetCryptoDataResponse = {
        data: dataResult.value,
        symbol: symbol.value,
        timeframe: timeframe.value,
        totalCount: dataResult.value.length,
        lastUpdated: new Date()
      };

      return Result.ok(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  protected validateRequest(request: GetCryptoDataRequest): Result<GetCryptoDataRequest> {
    if (!request.symbol || request.symbol.trim().length === 0) {
      return Result.fail('Symbol is required');
    }

    if (!request.timeframe || request.timeframe.trim().length === 0) {
      return Result.fail('Timeframe is required');
    }

    const validTimeframes = ['1h', '8h', '1d', '1w', '1M'];
    if (!validTimeframes.includes(request.timeframe)) {
      return Result.fail(`Invalid timeframe: ${request.timeframe}. Valid timeframes are: ${validTimeframes.join(', ')}`);
    }

    if (request.limit !== undefined && (request.limit <= 0 || request.limit > 10000)) {
      return Result.fail('Limit must be between 1 and 10000');
    }

    return Result.ok(request);
  }
} 