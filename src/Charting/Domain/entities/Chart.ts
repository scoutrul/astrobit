import { BaseEntity } from '../../../Shared/domain/BaseEntity';
import { ChartConfig } from '../value-objects/ChartConfig';
import { ChartData } from '../value-objects/ChartData';

export interface ChartState {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface ChartInteraction {
  isMouseOver: boolean;
  mousePosition: { x: number; y: number } | null;
  selectedPoint: any | null;
  visibleRange: { from: number; to: number } | null;
}

export class Chart extends BaseEntity<Chart> {
  constructor(
    id: string,
    private readonly _symbol: string,
    private readonly _timeframe: string,
    private readonly _config: ChartConfig,
    private readonly _data: ChartData,
    private readonly _state: ChartState,
    private readonly _interaction: ChartInteraction,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);
    this.validate();
  }

  get symbol(): string {
    return this._symbol;
  }

  get timeframe(): string {
    return this._timeframe;
  }

  get config(): ChartConfig {
    return this._config;
  }

  get data(): ChartData {
    return this._data;
  }

  get state(): ChartState {
    return this._state;
  }

  get interaction(): ChartInteraction {
    return this._interaction;
  }

  private validate(): void {
    if (!this._symbol || this._symbol.trim().length === 0) {
      throw new Error('Chart must have a symbol');
    }

    if (!this._timeframe || this._timeframe.trim().length === 0) {
      throw new Error('Chart must have a timeframe');
    }

    if (!this._config) {
      throw new Error('Chart must have a configuration');
    }

    if (!this._data) {
      throw new Error('Chart must have data');
    }

    if (!this._state) {
      throw new Error('Chart must have a state');
    }

    if (!this._interaction) {
      throw new Error('Chart must have interaction state');
    }
  }

  clone(): Chart {
    return new Chart(
      this._id,
      this._symbol,
      this._timeframe,
      this._config,
      this._data,
      this._state,
      this._interaction,
      this._createdAt,
      this._updatedAt
    );
  }

  // Business logic methods
  isReady(): boolean {
    return this._state.isReady;
  }

  isLoading(): boolean {
    return this._state.isLoading;
  }

  hasError(): boolean {
    return this._state.error !== null;
  }

  getError(): string | null {
    return this._state.error;
  }

  hasData(): boolean {
    return !this._data.isEmpty();
  }

  hasMarkers(): boolean {
    return this._data.hasMarkers();
  }

  getDataCount(): number {
    return this._data.getDataCount();
  }

  getMarkerCount(): number {
    return this._data.getMarkerCount();
  }

  getTimeRange(): { start: number; end: number } | null {
    return this._data.getTimeRange();
  }

  getPriceRange(): { min: number; max: number } | null {
    return this._data.getPriceRange();
  }

  isMouseOver(): boolean {
    return this._interaction.isMouseOver;
  }

  getMousePosition(): { x: number; y: number } | null {
    return this._interaction.mousePosition;
  }

  getSelectedPoint(): any | null {
    return this._interaction.selectedPoint;
  }

  getVisibleRange(): { from: number; to: number } | null {
    return this._interaction.visibleRange;
  }

  // State update methods (return new instances)
  withLoading(loading: boolean): Chart {
    const newState: ChartState = {
      ...this._state,
      isLoading: loading,
      error: loading ? null : this._state.error
    };

    return new Chart(
      this._id,
      this._symbol,
      this._timeframe,
      this._config,
      this._data,
      newState,
      this._interaction,
      this._createdAt,
      new Date()
    );
  }

  withReady(ready: boolean): Chart {
    const newState: ChartState = {
      ...this._state,
      isReady: ready,
      lastUpdated: ready ? new Date() : this._state.lastUpdated
    };

    return new Chart(
      this._id,
      this._symbol,
      this._timeframe,
      this._config,
      this._data,
      newState,
      this._interaction,
      this._createdAt,
      new Date()
    );
  }

  withError(error: string | null): Chart {
    const newState: ChartState = {
      ...this._state,
      error,
      isLoading: false
    };

    return new Chart(
      this._id,
      this._symbol,
      this._timeframe,
      this._config,
      this._data,
      newState,
      this._interaction,
      this._createdAt,
      new Date()
    );
  }

  withData(data: ChartData): Chart {
    return new Chart(
      this._id,
      this._symbol,
      this._timeframe,
      this._config,
      data,
      {
        ...this._state,
        lastUpdated: new Date()
      },
      this._interaction,
      this._createdAt,
      new Date()
    );
  }

  withConfig(config: ChartConfig): Chart {
    return new Chart(
      this._id,
      this._symbol,
      this._timeframe,
      config,
      this._data,
      this._state,
      this._interaction,
      this._createdAt,
      new Date()
    );
  }

  withMouseOver(isMouseOver: boolean): Chart {
    const newInteraction: ChartInteraction = {
      ...this._interaction,
      isMouseOver
    };

    return new Chart(
      this._id,
      this._symbol,
      this._timeframe,
      this._config,
      this._data,
      this._state,
      newInteraction,
      this._createdAt,
      this._updatedAt
    );
  }

  withMousePosition(position: { x: number; y: number } | null): Chart {
    const newInteraction: ChartInteraction = {
      ...this._interaction,
      mousePosition: position
    };

    return new Chart(
      this._id,
      this._symbol,
      this._timeframe,
      this._config,
      this._data,
      this._state,
      newInteraction,
      this._createdAt,
      this._updatedAt
    );
  }

  withSelectedPoint(point: any | null): Chart {
    const newInteraction: ChartInteraction = {
      ...this._interaction,
      selectedPoint: point
    };

    return new Chart(
      this._id,
      this._symbol,
      this._timeframe,
      this._config,
      this._data,
      this._state,
      newInteraction,
      this._createdAt,
      this._updatedAt
    );
  }

  withVisibleRange(range: { from: number; to: number } | null): Chart {
    const newInteraction: ChartInteraction = {
      ...this._interaction,
      visibleRange: range
    };

    return new Chart(
      this._id,
      this._symbol,
      this._timeframe,
      this._config,
      this._data,
      this._state,
      newInteraction,
      this._createdAt,
      this._updatedAt
    );
  }

  // Filtering methods
  filterByTimeRange(startTime: number, endTime: number): Chart {
    const filteredData = this._data.filterByTimeRange(startTime, endTime);
    return this.withData(filteredData);
  }

  filterByPriceRange(minPrice: number, maxPrice: number): Chart {
    const filteredData = this._data.filterByPriceRange(minPrice, maxPrice);
    return this.withData(filteredData);
  }

  // Factory methods
  static create(
    symbol: string,
    timeframe: string,
    config: ChartConfig,
    data: ChartData = ChartData.createEmpty()
  ): Chart {
    const id = `${symbol}_${timeframe}_${Date.now()}`;
    
    const initialState: ChartState = {
      isReady: false,
      isLoading: false,
      error: null,
      lastUpdated: null
    };

    const initialInteraction: ChartInteraction = {
      isMouseOver: false,
      mousePosition: null,
      selectedPoint: null,
      visibleRange: null
    };

    return new Chart(
      id,
      symbol,
      timeframe,
      config,
      data,
      initialState,
      initialInteraction
    );
  }

  static createEmpty(symbol: string, timeframe: string): Chart {
    const config = ChartConfig.createDarkCandlestickConfig(800, 600);
    return Chart.create(symbol, timeframe, config);
  }

  // Conversion methods for external APIs
  toApiFormat(): {
    id: string;
    symbol: string;
    timeframe: string;
    config: any;
    data: any;
    state: ChartState;
    interaction: ChartInteraction;
  } {
    return {
      id: this._id,
      symbol: this._symbol,
      timeframe: this._timeframe,
      config: this._config,
      data: this._data,
      state: this._state,
      interaction: this._interaction
    };
  }
} 