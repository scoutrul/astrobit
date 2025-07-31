import { UseCaseWithoutRequest } from '../../../Shared/application/UseCase';
import { Result } from '../../../Shared/domain/Result';
import { ICryptoDataRepository } from '../../Domain/repositories/ICryptoDataRepository';
import { Symbol } from '../../Domain/value-objects/Symbol';

export interface GetSymbolsResponse {
  symbols: Symbol[];
  totalCount: number;
  categories: {
    major: Symbol[];
    altcoins: Symbol[];
    defi: Symbol[];
  };
}

export class GetSymbolsUseCase extends UseCaseWithoutRequest<GetSymbolsResponse> {
  constructor(private readonly cryptoDataRepository: ICryptoDataRepository) {
    super();
  }

  async execute(): Promise<Result<GetSymbolsResponse>> {
    try {
      // Get symbols from repository
      const symbolsResult = await this.cryptoDataRepository.getSymbols();
      
      if (symbolsResult.isFailure) {
        return Result.fail(`Failed to get symbols: ${symbolsResult.error}`);
      }

      const symbols = symbolsResult.value;

      // Categorize symbols
      const categories = {
        major: symbols.filter(symbol => this.isMajorSymbol(symbol)),
        altcoins: symbols.filter(symbol => this.isAltcoinSymbol(symbol)),
        defi: symbols.filter(symbol => this.isDeFiSymbol(symbol))
      };

      const response: GetSymbolsResponse = {
        symbols,
        totalCount: symbols.length,
        categories
      };

      return Result.ok(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: unknown): Result<never> {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return Result.fail(`GetSymbolsUseCase error: ${errorMessage}`);
  }

  private isMajorSymbol(symbol: Symbol): boolean {
    const majorSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT'];
    return majorSymbols.includes(symbol.value);
  }

  private isAltcoinSymbol(symbol: Symbol): boolean {
    const altcoinSymbols = ['SOLUSDT', 'DOTUSDT', 'AVAXUSDT', 'LINKUSDT', 'MATICUSDT'];
    return altcoinSymbols.includes(symbol.value);
  }

  private isDeFiSymbol(symbol: Symbol): boolean {
    const defiSymbols = ['UNIUSDT', 'AAVEUSDT', 'COMPUSDT', 'MKRUSDT', 'CRVUSDT'];
    return defiSymbols.includes(symbol.value);
  }
} 