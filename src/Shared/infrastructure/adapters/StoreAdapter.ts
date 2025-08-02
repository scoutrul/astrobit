import { useStore } from '../../../store';
import { DependencyContainer } from '../DependencyContainer';

/**
 * StoreAdapter - адаптер для обеспечения обратной совместимости
 * между новой архитектурой и существующим Zustand store
 */
export class StoreAdapter {
  private static instance: StoreAdapter;
  private container: DependencyContainer;

  private constructor() {
    this.container = DependencyContainer.getInstance();
  }

  static getInstance(): StoreAdapter {
    if (!StoreAdapter.instance) {
      StoreAdapter.instance = new StoreAdapter();
    }
    return StoreAdapter.instance;
  }

  // CryptoData use cases
  getCryptoDataUseCase(): any {
    return this.container.resolve<any>('GetCryptoDataUseCase');
  }

  getSymbolsUseCase(): any {
    return this.container.resolve<any>('GetSymbolsUseCase');
  }

  // Store state helpers
  getStoreState() {
    return useStore.getState();
  }

  setStoreState(newState: Partial<ReturnType<typeof useStore.getState>>) {
    useStore.setState(newState);
  }

  // Symbol helpers
  getSymbol(): string {
    return useStore.getState().symbol;
  }

  setSymbol(symbol: string): void {
    useStore.setState({ symbol });
  }

  // Timeframe helpers
  getTimeframe(): string {
    return useStore.getState().timeframe;
  }

  setTimeframe(timeframe: string): void {
    useStore.setState({ timeframe });
  }

  // Utility methods
  resetStore(): void {
    useStore.setState({
      symbol: 'BTCUSDT',
      timeframe: '1d'
    });
  }

  // Debug helpers
  logStoreState(): void {
    console.log('Current store state:', useStore.getState());
  }

  logContainerState(): void {
    console.log('DI Container instance:', this.container);
  }
} 