import { BaseEntity } from '../../../Shared/domain/BaseEntity';
import { Symbol } from '../value-objects/Symbol';
import { Timeframe } from '../value-objects/Timeframe';

export class CryptoData extends BaseEntity<CryptoData> {
  constructor(
    id: string,
    private readonly _symbol: Symbol,
    private readonly _timeframe: Timeframe,
    private readonly _timestamp: Date,
    private readonly _open: number,
    private readonly _high: number,
    private readonly _low: number,
    private readonly _close: number,
    private readonly _volume: number,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);
    this.validate();
  }

  get symbol(): Symbol {
    return this._symbol;
  }

  get timeframe(): Timeframe {
    return this._timeframe;
  }

  get timestamp(): Date {
    return this._timestamp;
  }

  get open(): number {
    return this._open;
  }

  get high(): number {
    return this._high;
  }

  get low(): number {
    return this._low;
  }

  get close(): number {
    return this._close;
  }

  get volume(): number {
    return this._volume;
  }

  private validate(): void {
    if (this._open <= 0) {
      throw new Error('Open price must be positive');
    }

    if (this._high <= 0) {
      throw new Error('High price must be positive');
    }

    if (this._low <= 0) {
      throw new Error('Low price must be positive');
    }

    if (this._close <= 0) {
      throw new Error('Close price must be positive');
    }

    if (this._volume < 0) {
      throw new Error('Volume cannot be negative');
    }

    if (this._high < this._low) {
      throw new Error('High price cannot be less than low price');
    }

    if (this._open > this._high || this._open < this._low) {
      throw new Error('Open price must be between high and low prices');
    }

    if (this._close > this._high || this._close < this._low) {
      throw new Error('Close price must be between high and low prices');
    }
  }

  clone(): CryptoData {
    return new CryptoData(
      this._id,
      this._symbol,
      this._timeframe,
      this._timestamp,
      this._open,
      this._high,
      this._low,
      this._close,
      this._volume,
      this._createdAt,
      this._updatedAt
    );
  }

  // Business logic methods
  isGreenCandle(): boolean {
    return this._close >= this._open;
  }

  isRedCandle(): boolean {
    return this._close < this._open;
  }

  getPriceChange(): number {
    return this._close - this._open;
  }

  getPriceChangePercent(): number {
    return ((this._close - this._open) / this._open) * 100;
  }

  getBodySize(): number {
    return Math.abs(this._close - this._open);
  }

  getUpperShadow(): number {
    return this._high - Math.max(this._open, this._close);
  }

  getLowerShadow(): number {
    return Math.min(this._open, this._close) - this._low;
  }

  getTotalRange(): number {
    return this._high - this._low;
  }

  getBodyToRangeRatio(): number {
    const bodySize = this.getBodySize();
    const totalRange = this.getTotalRange();
    return totalRange > 0 ? bodySize / totalRange : 0;
  }

  // Time-based methods
  isFromToday(): boolean {
    const today = new Date();
    return this._timestamp.toDateString() === today.toDateString();
  }

  isFromYesterday(): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return this._timestamp.toDateString() === yesterday.toDateString();
  }

  isFromThisWeek(): boolean {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return this._timestamp >= startOfWeek && this._timestamp <= endOfWeek;
  }

  isFromThisMonth(): boolean {
    const now = new Date();
    return this._timestamp.getMonth() === now.getMonth() && 
           this._timestamp.getFullYear() === now.getFullYear();
  }

  // Conversion methods for external APIs
  toApiFormat(): {
    symbol: string;
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  } {
    return {
      symbol: this._symbol.value,
      time: this._timestamp.toISOString(),
      open: this._open,
      high: this._high,
      low: this._low,
      close: this._close,
      volume: this._volume
    };
  }

  static fromApiFormat(data: {
    symbol: string;
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }): CryptoData {
    return new CryptoData(
      `${data.symbol}_${data.time}`,
      new Symbol(data.symbol),
      Timeframe.OneDay(), // Default timeframe, should be provided by context
      new Date(data.time),
      data.open,
      data.high,
      data.low,
      data.close,
      data.volume
    );
  }

  // Factory methods for testing
  static createTestData(
    symbol: Symbol,
    timeframe: Timeframe,
    timestamp: Date,
    open: number,
    high: number,
    low: number,
    close: number,
    volume: number
  ): CryptoData {
    return new CryptoData(
      `${symbol.value}_${timestamp.getTime()}`,
      symbol,
      timeframe,
      timestamp,
      open,
      high,
      low,
      close,
      volume
    );
  }
} 