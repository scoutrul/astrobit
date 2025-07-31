import { ValueObject } from '../../../Shared/domain/ValueObject';

export type ThemeValue = 'dark' | 'light' | 'auto';

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  accentColor: string;
}

export class Theme extends ValueObject<Theme> {
  constructor(private readonly _value: ThemeValue) {
    super();
    this.validate();
  }

  get value(): ThemeValue {
    return this._value;
  }

  private validate(): void {
    if (!this._value || typeof this._value !== 'string') {
      throw new Error('Theme value is required');
    }

    if (!['dark', 'light', 'auto'].includes(this._value)) {
      throw new Error(`Invalid theme value: ${this._value}`);
    }
  }

  clone(): Theme {
    return new Theme(this._value);
  }

  equals(valueObject?: Theme): boolean {
    if (!valueObject) return false;
    return this._value === valueObject._value;
  }

  toString(): string {
    return this._value;
  }

  // Factory methods
  static createDark(): Theme {
    return new Theme('dark');
  }

  static createLight(): Theme {
    return new Theme('light');
  }

  static createAuto(): Theme {
    return new Theme('auto');
  }

  // Helper methods
  isDark(): boolean {
    return this._value === 'dark';
  }

  isLight(): boolean {
    return this._value === 'light';
  }

  isAuto(): boolean {
    return this._value === 'auto';
  }

  // Get theme configuration
  getConfig(): ThemeConfig {
    switch (this._value) {
      case 'dark':
        return {
          primaryColor: '#f7931a',
          secondaryColor: '#1a1a1a',
          backgroundColor: '#0a0b1e',
          textColor: '#e2e8f0',
          borderColor: '#334155',
          accentColor: '#10b981'
        };
      case 'light':
        return {
          primaryColor: '#f7931a',
          secondaryColor: '#ffffff',
          backgroundColor: '#f8fafc',
          textColor: '#1f2937',
          borderColor: '#e5e7eb',
          accentColor: '#059669'
        };
      case 'auto':
        // Auto theme will be determined by system preference
        return this.getSystemThemeConfig();
      default:
        return this.getConfig();
    }
  }

  private getSystemThemeConfig(): ThemeConfig {
    // Check system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return isDark ? Theme.createDark().getConfig() : Theme.createLight().getConfig();
    }
    // Default to dark theme if system preference cannot be determined
    return Theme.createDark().getConfig();
  }

  // Get display label
  getDisplayLabel(): string {
    switch (this._value) {
      case 'dark':
        return 'Темная';
      case 'light':
        return 'Светлая';
      case 'auto':
        return 'Авто';
      default:
        return this._value;
    }
  }

  // Get icon
  getIcon(): string {
    switch (this._value) {
      case 'dark':
        return '🌙';
      case 'light':
        return '☀️';
      case 'auto':
        return '🔄';
      default:
        return '🎨';
    }
  }
} 