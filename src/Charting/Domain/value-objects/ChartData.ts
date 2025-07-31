import { ValueObject } from '../../../Shared/domain/ValueObject';

export interface CandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface LineData {
  time: number;
  value: number;
}

export interface AreaData {
  time: number;
  value: number;
}

export interface BarData {
  time: number;
  value: number;
}

export type ChartDataPoint = CandlestickData | LineData | AreaData | BarData;

export interface ChartMarker {
  time: number;
  position: 'aboveBar' | 'belowBar' | 'inBar';
  color: string;
  text: string;
  size: number;
}

export class ChartData extends ValueObject<ChartData> {
  constructor(
    private readonly _data: ChartDataPoint[],
    private readonly _markers: ChartMarker[] = []
  ) {
    super();
    this.validate();
  }

  get data(): ChartDataPoint[] {
    return this._data;
  }

  get markers(): ChartMarker[] {
    return this._markers;
  }

  private validate(): void {
    if (!Array.isArray(this._data)) {
      throw new Error('Chart data must be an array');
    }

    if (!Array.isArray(this._markers)) {
      throw new Error('Chart markers must be an array');
    }

    // Validate data points
    for (const point of this._data) {
      if (!point || typeof point !== 'object') {
        throw new Error('Invalid chart data point');
      }

      if (!point.time || typeof point.time !== 'number') {
        throw new Error('Chart data point must have a valid time');
      }

      // Validate candlestick data
      if ('open' in point && 'high' in point && 'low' in point && 'close' in point) {
        if (point.open <= 0 || point.high <= 0 || point.low <= 0 || point.close <= 0) {
          throw new Error('Candlestick data must have positive values');
        }

        if (point.high < Math.max(point.open, point.close)) {
          throw new Error('High must be greater than or equal to open and close');
        }

        if (point.low > Math.min(point.open, point.close)) {
          throw new Error('Low must be less than or equal to open and close');
        }
      }

      // Validate line/area/bar data
      if ('value' in point) {
        if (typeof point.value !== 'number') {
          throw new Error('Chart data point must have a valid value');
        }
      }
    }

    // Validate markers
    for (const marker of this._markers) {
      if (!marker || typeof marker !== 'object') {
        throw new Error('Invalid chart marker');
      }

      if (!marker.time || typeof marker.time !== 'number') {
        throw new Error('Chart marker must have a valid time');
      }

      if (!marker.position || !['aboveBar', 'belowBar', 'inBar'].includes(marker.position)) {
        throw new Error('Chart marker must have a valid position');
      }

      if (!marker.color || typeof marker.color !== 'string') {
        throw new Error('Chart marker must have a valid color');
      }

      if (!marker.text || typeof marker.text !== 'string') {
        throw new Error('Chart marker must have a valid text');
      }

      if (!marker.size || typeof marker.size !== 'number' || marker.size <= 0) {
        throw new Error('Chart marker must have a valid size');
      }
    }
  }

  clone(): ChartData {
    return new ChartData(
      [...this._data],
      [...this._markers]
    );
  }

  equals(valueObject?: ChartData): boolean {
    if (!valueObject) return false;
    return (
      JSON.stringify(this._data) === JSON.stringify(valueObject._data) &&
      JSON.stringify(this._markers) === JSON.stringify(valueObject._markers)
    );
  }

  // Business logic methods
  getDataCount(): number {
    return this._data.length;
  }

  getMarkerCount(): number {
    return this._markers.length;
  }

  isEmpty(): boolean {
    return this._data.length === 0;
  }

  hasMarkers(): boolean {
    return this._markers.length > 0;
  }

  getTimeRange(): { start: number; end: number } | null {
    if (this._data.length === 0) {
      return null;
    }

    const times = this._data.map(point => point.time);
    return {
      start: Math.min(...times),
      end: Math.max(...times)
    };
  }

  getPriceRange(): { min: number; max: number } | null {
    if (this._data.length === 0) {
      return null;
    }

    const prices: number[] = [];

    for (const point of this._data) {
      if ('open' in point && 'high' in point && 'low' in point && 'close' in point) {
        prices.push(point.open, point.high, point.low, point.close);
      } else if ('value' in point) {
        prices.push(point.value);
      }
    }

    if (prices.length === 0) {
      return null;
    }

    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  }

  // Filtering methods
  filterByTimeRange(startTime: number, endTime: number): ChartData {
    const filteredData = this._data.filter(point => 
      point.time >= startTime && point.time <= endTime
    );

    const filteredMarkers = this._markers.filter(marker => 
      marker.time >= startTime && marker.time <= endTime
    );

    return new ChartData(filteredData, filteredMarkers);
  }

  filterByPriceRange(minPrice: number, maxPrice: number): ChartData {
    const filteredData = this._data.filter(point => {
      if ('open' in point && 'high' in point && 'low' in point && 'close' in point) {
        return point.low <= maxPrice && point.high >= minPrice;
      } else if ('value' in point) {
        return point.value >= minPrice && point.value <= maxPrice;
      }
      return true;
    });

    return new ChartData(filteredData, this._markers);
  }

  // Sorting methods
  sortByTime(ascending: boolean = true): ChartData {
    const sortedData = [...this._data].sort((a, b) => {
      return ascending ? a.time - b.time : b.time - a.time;
    });

    const sortedMarkers = [...this._markers].sort((a, b) => {
      return ascending ? a.time - b.time : b.time - a.time;
    });

    return new ChartData(sortedData, sortedMarkers);
  }

  // Factory methods
  static createEmpty(): ChartData {
    return new ChartData([], []);
  }

  static createFromCandlestickData(data: CandlestickData[], markers: ChartMarker[] = []): ChartData {
    return new ChartData(data, markers);
  }

  static createFromLineData(data: LineData[], markers: ChartMarker[] = []): ChartData {
    return new ChartData(data, markers);
  }

  static createFromAreaData(data: AreaData[], markers: ChartMarker[] = []): ChartData {
    return new ChartData(data, markers);
  }

  static createFromBarData(data: BarData[], markers: ChartMarker[] = []): ChartData {
    return new ChartData(data, markers);
  }

  // Conversion methods
  toCandlestickData(): CandlestickData[] {
    return this._data.filter((point): point is CandlestickData => 
      'open' in point && 'high' in point && 'low' in point && 'close' in point
    );
  }

  toLineData(): LineData[] {
    return this._data.filter((point): point is LineData => 'value' in point);
  }

  toAreaData(): AreaData[] {
    return this._data.filter((point): point is AreaData => 'value' in point);
  }

  toBarData(): BarData[] {
    return this._data.filter((point): point is BarData => 'value' in point);
  }
} 