import { ValueObject } from '../../../Shared/domain/ValueObject';

export type ChartType = 'candlestick' | 'line' | 'area' | 'bar';
export type ChartTheme = 'dark' | 'light';
export type ChartPosition = 'aboveBar' | 'belowBar' | 'inBar';

export interface ChartOptions {
  width: number;
  height: number;
  layout: {
    backgroundColor: string;
    textColor: string;
  };
  grid: {
    vertLines: {
      color: string;
      style: number;
    };
    horzLines: {
      color: string;
      style: number;
    };
  };
  crosshair: {
    mode: number;
  };
  rightPriceScale: {
    borderColor: string;
  };
  timeScale: {
    borderColor: string;
    timeVisible: boolean;
    secondsVisible: boolean;
  };
}

export interface MarkerConfig {
  position: ChartPosition;
  color: string;
  text: string;
  size: number;
}

export class ChartConfig extends ValueObject<ChartConfig> {
  constructor(
    private readonly _type: ChartType,
    private readonly _theme: ChartTheme,
    private readonly _options: ChartOptions,
    private readonly _markerConfig: MarkerConfig
  ) {
    super();
    this.validate();
  }

  get type(): ChartType {
    return this._type;
  }

  get theme(): ChartTheme {
    return this._theme;
  }

  get options(): ChartOptions {
    return this._options;
  }

  get markerConfig(): MarkerConfig {
    return this._markerConfig;
  }

  private validate(): void {
    if (!this._type || !['candlestick', 'line', 'area', 'bar'].includes(this._type)) {
      throw new Error('Invalid chart type');
    }

    if (!this._theme || !['dark', 'light'].includes(this._theme)) {
      throw new Error('Invalid chart theme');
    }

    if (!this._options || typeof this._options !== 'object') {
      throw new Error('Chart options are required');
    }

    if (this._options.width <= 0 || this._options.height <= 0) {
      throw new Error('Chart dimensions must be positive');
    }

    if (!this._markerConfig || typeof this._markerConfig !== 'object') {
      throw new Error('Marker config is required');
    }
  }

  clone(): ChartConfig {
    return new ChartConfig(
      this._type,
      this._theme,
      { ...this._options },
      { ...this._markerConfig }
    );
  }

  equals(valueObject?: ChartConfig): boolean {
    if (!valueObject) return false;
    return (
      this._type === valueObject._type &&
      this._theme === valueObject._theme &&
      JSON.stringify(this._options) === JSON.stringify(valueObject._options) &&
      JSON.stringify(this._markerConfig) === JSON.stringify(valueObject._markerConfig)
    );
  }

  // Factory methods for common configurations
  static createDarkCandlestickConfig(width: number, height: number): ChartConfig {
    return new ChartConfig(
      'candlestick',
      'dark',
      {
        width,
        height,
        layout: {
          backgroundColor: '#0a0b1e',
          textColor: '#e2e8f0'
        },
        grid: {
          vertLines: {
            color: '#334155',
            style: 1
          },
          horzLines: {
            color: '#334155',
            style: 1
          }
        },
        crosshair: {
          mode: 1
        },
        rightPriceScale: {
          borderColor: '#334155'
        },
        timeScale: {
          borderColor: '#334155',
          timeVisible: true,
          secondsVisible: false
        }
      },
      {
        position: 'aboveBar',
        color: '#f7931a',
        text: '⭐',
        size: 2
      }
    );
  }

  static createLightCandlestickConfig(width: number, height: number): ChartConfig {
    return new ChartConfig(
      'candlestick',
      'light',
      {
        width,
        height,
        layout: {
          backgroundColor: '#ffffff',
          textColor: '#1f2937'
        },
        grid: {
          vertLines: {
            color: '#e5e7eb',
            style: 1
          },
          horzLines: {
            color: '#e5e7eb',
            style: 1
          }
        },
        crosshair: {
          mode: 1
        },
        rightPriceScale: {
          borderColor: '#d1d5db'
        },
        timeScale: {
          borderColor: '#d1d5db',
          timeVisible: true,
          secondsVisible: false
        }
      },
      {
        position: 'aboveBar',
        color: '#f7931a',
        text: '⭐',
        size: 2
      }
    );
  }

  // Helper methods
  isDarkTheme(): boolean {
    return this._theme === 'dark';
  }

  isLightTheme(): boolean {
    return this._theme === 'light';
  }

  isCandlestick(): boolean {
    return this._type === 'candlestick';
  }

  isLine(): boolean {
    return this._type === 'line';
  }

  isArea(): boolean {
    return this._type === 'area';
  }

  isBar(): boolean {
    return this._type === 'bar';
  }

  // Update methods (return new instances)
  withTheme(theme: ChartTheme): ChartConfig {
    return new ChartConfig(
      this._type,
      theme,
      this._options,
      this._markerConfig
    );
  }

  withType(type: ChartType): ChartConfig {
    return new ChartConfig(
      type,
      this._theme,
      this._options,
      this._markerConfig
    );
  }

  withDimensions(width: number, height: number): ChartConfig {
    const newOptions = { ...this._options, width, height };
    return new ChartConfig(
      this._type,
      this._theme,
      newOptions,
      this._markerConfig
    );
  }

  withMarkerConfig(markerConfig: MarkerConfig): ChartConfig {
    return new ChartConfig(
      this._type,
      this._theme,
      this._options,
      markerConfig
    );
  }
} 