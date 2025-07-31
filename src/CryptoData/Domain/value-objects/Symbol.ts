import { ValueObject } from '../../../Shared/domain/ValueObject';

export class Symbol extends ValueObject<Symbol> {
  constructor(private readonly _value: string) {
    super();
    this.validate();
  }

  get value(): string {
    return this._value;
  }

  private validate(): void {
    if (!this._value || this._value.trim().length === 0) {
      throw new Error('Symbol cannot be empty');
    }

    if (!/^[A-Z0-9]+$/.test(this._value)) {
      throw new Error('Symbol must contain only uppercase letters and numbers');
    }

    if (this._value.length < 2 || this._value.length > 20) {
      throw new Error('Symbol length must be between 2 and 20 characters');
    }
  }

  clone(): Symbol {
    return new Symbol(this._value);
  }

  equals(valueObject?: Symbol): boolean {
    if (!valueObject) return false;
    return this._value === valueObject._value;
  }

  toString(): string {
    return this._value;
  }

  // Helper methods for common symbols
  static BTCUSDT(): Symbol {
    return new Symbol('BTCUSDT');
  }

  static ETHUSDT(): Symbol {
    return new Symbol('ETHUSDT');
  }

  static BNBUSDT(): Symbol {
    return new Symbol('BNBUSDT');
  }

  static XRPUSDT(): Symbol {
    return new Symbol('XRPUSDT');
  }

  static ADAUSDT(): Symbol {
    return new Symbol('ADAUSDT');
  }

  static SOLUSDT(): Symbol {
    return new Symbol('SOLUSDT');
  }

  static DOTUSDT(): Symbol {
    return new Symbol('DOTUSDT');
  }

  static AVAXUSDT(): Symbol {
    return new Symbol('AVAXUSDT');
  }

  static LINKUSDT(): Symbol {
    return new Symbol('LINKUSDT');
  }

  static MATICUSDT(): Symbol {
    return new Symbol('MATICUSDT');
  }

  static UNIUSDT(): Symbol {
    return new Symbol('UNIUSDT');
  }

  static AAVEUSDT(): Symbol {
    return new Symbol('AAVEUSDT');
  }

  static COMPUSDT(): Symbol {
    return new Symbol('COMPUSDT');
  }

  static MKRUSDT(): Symbol {
    return new Symbol('MKRUSDT');
  }

  static CRVUSDT(): Symbol {
    return new Symbol('CRVUSDT');
  }

  // Get all available symbols
  static getAllSymbols(): Symbol[] {
    return [
      Symbol.BTCUSDT(),
      Symbol.ETHUSDT(),
      Symbol.BNBUSDT(),
      Symbol.XRPUSDT(),
      Symbol.ADAUSDT(),
      Symbol.SOLUSDT(),
      Symbol.DOTUSDT(),
      Symbol.AVAXUSDT(),
      Symbol.LINKUSDT(),
      Symbol.MATICUSDT(),
      Symbol.UNIUSDT(),
      Symbol.AAVEUSDT(),
      Symbol.COMPUSDT(),
      Symbol.MKRUSDT(),
      Symbol.CRVUSDT()
    ];
  }

  // Get symbols by category
  static getMajorSymbols(): Symbol[] {
    return [
      Symbol.BTCUSDT(),
      Symbol.ETHUSDT(),
      Symbol.BNBUSDT(),
      Symbol.XRPUSDT(),
      Symbol.ADAUSDT()
    ];
  }

  static getAltcoinSymbols(): Symbol[] {
    return [
      Symbol.SOLUSDT(),
      Symbol.DOTUSDT(),
      Symbol.AVAXUSDT(),
      Symbol.LINKUSDT(),
      Symbol.MATICUSDT()
    ];
  }

  static getDeFiSymbols(): Symbol[] {
    return [
      Symbol.UNIUSDT(),
      Symbol.AAVEUSDT(),
      Symbol.COMPUSDT(),
      Symbol.MKRUSDT(),
      Symbol.CRVUSDT()
    ];
  }
} 