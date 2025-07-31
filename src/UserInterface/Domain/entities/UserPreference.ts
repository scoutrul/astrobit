import { BaseEntity } from '../../../Shared/domain/BaseEntity';
import { Theme } from '../value-objects/Theme';

export interface UserPreferenceState {
  isLoaded: boolean;
  isSaving: boolean;
  error: string | null;
}

export class UserPreference extends BaseEntity<UserPreference> {
  constructor(
    id: string,
    private readonly _userId: string,
    private readonly _theme: Theme,
    private readonly _language: string,
    private readonly _timezone: string,
    private readonly _notifications: {
      email: boolean;
      push: boolean;
      astronomical: boolean;
      crypto: boolean;
    },
    private readonly _display: {
      chartHeight: number;
      showVolume: boolean;
      showGrid: boolean;
      showCrosshair: boolean;
    },
    private readonly _state: UserPreferenceState,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);
    this.validate();
  }

  get userId(): string {
    return this._userId;
  }

  get theme(): Theme {
    return this._theme;
  }

  get language(): string {
    return this._language;
  }

  get timezone(): string {
    return this._timezone;
  }

  get notifications(): {
    email: boolean;
    push: boolean;
    astronomical: boolean;
    crypto: boolean;
  } {
    return { ...this._notifications };
  }

  get display(): {
    chartHeight: number;
    showVolume: boolean;
    showGrid: boolean;
    showCrosshair: boolean;
  } {
    return { ...this._display };
  }

  get state(): UserPreferenceState {
    return { ...this._state };
  }

  private validate(): void {
    if (!this._userId || typeof this._userId !== 'string') {
      throw new Error('User ID is required');
    }

    if (!this._theme || !(this._theme instanceof Theme)) {
      throw new Error('Theme is required and must be a Theme value object');
    }

    if (!this._language || typeof this._language !== 'string') {
      throw new Error('Language is required');
    }

    if (!this._timezone || typeof this._timezone !== 'string') {
      throw new Error('Timezone is required');
    }

    if (!this._notifications || typeof this._notifications !== 'object') {
      throw new Error('Notifications configuration is required');
    }

    if (!this._display || typeof this._display !== 'object') {
      throw new Error('Display configuration is required');
    }

    if (this._display.chartHeight <= 0) {
      throw new Error('Chart height must be positive');
    }
  }

  clone(): UserPreference {
    return new UserPreference(
      this.id,
      this._userId,
      this._theme.clone(),
      this._language,
      this._timezone,
      { ...this._notifications },
      { ...this._display },
      { ...this._state },
      this.createdAt,
      this.updatedAt
    );
  }

  // Business logic methods
  isDarkTheme(): boolean {
    return this._theme.isDark();
  }

  isLightTheme(): boolean {
    return this._theme.isLight();
  }

  isAutoTheme(): boolean {
    return this._theme.isAuto();
  }

  hasEmailNotifications(): boolean {
    return this._notifications.email;
  }

  hasPushNotifications(): boolean {
    return this._notifications.push;
  }

  hasAstronomicalNotifications(): boolean {
    return this._notifications.astronomical;
  }

  hasCryptoNotifications(): boolean {
    return this._notifications.crypto;
  }

  getChartHeight(): number {
    return this._display.chartHeight;
  }

  shouldShowVolume(): boolean {
    return this._display.showVolume;
  }

  shouldShowGrid(): boolean {
    return this._display.showGrid;
  }

  shouldShowCrosshair(): boolean {
    return this._display.showCrosshair;
  }

  isLoaded(): boolean {
    return this._state.isLoaded;
  }

  isSaving(): boolean {
    return this._state.isSaving;
  }

  hasError(): boolean {
    return this._state.error !== null;
  }

  getError(): string | null {
    return this._state.error;
  }

  // State update methods
  withTheme(theme: Theme): UserPreference {
    return new UserPreference(
      this.id,
      this._userId,
      theme,
      this._language,
      this._timezone,
      { ...this._notifications },
      { ...this._display },
      { ...this._state },
      this.createdAt,
      new Date()
    );
  }

  withLanguage(language: string): UserPreference {
    return new UserPreference(
      this.id,
      this._userId,
      this._theme,
      language,
      this._timezone,
      { ...this._notifications },
      { ...this._display },
      { ...this._state },
      this.createdAt,
      new Date()
    );
  }

  withTimezone(timezone: string): UserPreference {
    return new UserPreference(
      this.id,
      this._userId,
      this._theme,
      this._language,
      timezone,
      { ...this._notifications },
      { ...this._display },
      { ...this._state },
      this.createdAt,
      new Date()
    );
  }

  withNotifications(notifications: {
    email?: boolean;
    push?: boolean;
    astronomical?: boolean;
    crypto?: boolean;
  }): UserPreference {
    const updatedNotifications = {
      ...this._notifications,
      ...notifications
    };

    return new UserPreference(
      this.id,
      this._userId,
      this._theme,
      this._language,
      this._timezone,
      updatedNotifications,
      { ...this._display },
      { ...this._state },
      this.createdAt,
      new Date()
    );
  }

  withDisplay(display: {
    chartHeight?: number;
    showVolume?: boolean;
    showGrid?: boolean;
    showCrosshair?: boolean;
  }): UserPreference {
    const updatedDisplay = {
      ...this._display,
      ...display
    };

    return new UserPreference(
      this.id,
      this._userId,
      this._theme,
      this._language,
      this._timezone,
      { ...this._notifications },
      updatedDisplay,
      { ...this._state },
      this.createdAt,
      new Date()
    );
  }

  withLoaded(isLoaded: boolean): UserPreference {
    return new UserPreference(
      this.id,
      this._userId,
      this._theme,
      this._language,
      this._timezone,
      { ...this._notifications },
      { ...this._display },
      { ...this._state, isLoaded },
      this.createdAt,
      new Date()
    );
  }

  withSaving(isSaving: boolean): UserPreference {
    return new UserPreference(
      this.id,
      this._userId,
      this._theme,
      this._language,
      this._timezone,
      { ...this._notifications },
      { ...this._display },
      { ...this._state, isSaving },
      this.createdAt,
      new Date()
    );
  }

  withError(error: string | null): UserPreference {
    return new UserPreference(
      this.id,
      this._userId,
      this._theme,
      this._language,
      this._timezone,
      { ...this._notifications },
      { ...this._display },
      { ...this._state, error },
      this.createdAt,
      new Date()
    );
  }

  // Factory methods
  static create(
    userId: string,
    theme: Theme = Theme.createDark(),
    language: string = 'ru',
    timezone: string = 'Europe/Moscow'
  ): UserPreference {
    const id = `pref_${userId}_${Date.now()}`;
    
    return new UserPreference(
      id,
      userId,
      theme,
      language,
      timezone,
      {
        email: true,
        push: true,
        astronomical: true,
        crypto: true
      },
      {
        chartHeight: 400,
        showVolume: true,
        showGrid: true,
        showCrosshair: true
      },
      {
        isLoaded: false,
        isSaving: false,
        error: null
      }
    );
  }

  static createDefault(userId: string): UserPreference {
    return UserPreference.create(userId, Theme.createDark());
  }

  // Conversion methods
  toApiFormat(): {
    id: string;
    userId: string;
    theme: string;
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      push: boolean;
      astronomical: boolean;
      crypto: boolean;
    };
    display: {
      chartHeight: number;
      showVolume: boolean;
      showGrid: boolean;
      showCrosshair: boolean;
    };
    state: UserPreferenceState;
  } {
    return {
      id: this.id,
      userId: this._userId,
      theme: this._theme.toString(),
      language: this._language,
      timezone: this._timezone,
      notifications: { ...this._notifications },
      display: { ...this._display },
      state: { ...this._state }
    };
  }

  static fromApiFormat(data: {
    id: string;
    userId: string;
    theme: string;
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      push: boolean;
      astronomical: boolean;
      crypto: boolean;
    };
    display: {
      chartHeight: number;
      showVolume: boolean;
      showGrid: boolean;
      showCrosshair: boolean;
    };
    state: UserPreferenceState;
  }): UserPreference {
    const theme = new Theme(data.theme as any);
    
    return new UserPreference(
      data.id,
      data.userId,
      theme,
      data.language,
      data.timezone,
      data.notifications,
      data.display,
      data.state
    );
  }
} 