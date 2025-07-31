import { Result } from '../../../Shared/domain/Result';
import { UserPreference } from '../entities/UserPreference';
import { Theme } from '../value-objects/Theme';

export interface UserPreferenceSearchCriteria {
  userId?: string;
  theme?: string;
  language?: string;
  timezone?: string;
}

export interface IUserPreferenceRepository {
  // CRUD operations
  createUserPreference(userPreference: UserPreference): Promise<Result<UserPreference>>;
  getUserPreference(id: string): Promise<Result<UserPreference | null>>;
  getUserPreferenceByUserId(userId: string): Promise<Result<UserPreference | null>>;
  updateUserPreference(userPreference: UserPreference): Promise<Result<UserPreference>>;
  deleteUserPreference(id: string): Promise<Result<void>>;

  // Search operations
  findByCriteria(criteria: UserPreferenceSearchCriteria): Promise<Result<UserPreference[]>>;
  getAllUserPreferences(): Promise<Result<UserPreference[]>>;

  // Theme operations
  updateTheme(userId: string, theme: Theme): Promise<Result<UserPreference>>;
  getTheme(userId: string): Promise<Result<Theme | null>>;

  // Language operations
  updateLanguage(userId: string, language: string): Promise<Result<UserPreference>>;
  getLanguage(userId: string): Promise<Result<string | null>>;

  // Timezone operations
  updateTimezone(userId: string, timezone: string): Promise<Result<UserPreference>>;
  getTimezone(userId: string): Promise<Result<string | null>>;

  // Notification operations
  updateNotifications(
    userId: string,
    notifications: {
      email?: boolean;
      push?: boolean;
      astronomical?: boolean;
      crypto?: boolean;
    }
  ): Promise<Result<UserPreference>>;

  getNotifications(userId: string): Promise<Result<{
    email: boolean;
    push: boolean;
    astronomical: boolean;
    crypto: boolean;
  } | null>>;

  // Display operations
  updateDisplay(
    userId: string,
    display: {
      chartHeight?: number;
      showVolume?: boolean;
      showGrid?: boolean;
      showCrosshair?: boolean;
    }
  ): Promise<Result<UserPreference>>;

  getDisplay(userId: string): Promise<Result<{
    chartHeight: number;
    showVolume: boolean;
    showGrid: boolean;
    showCrosshair: boolean;
  } | null>>;

  // Utility operations
  exists(userId: string): Promise<Result<boolean>>;
  count(): Promise<Result<number>>;
  clearAll(): Promise<Result<void>>;

  // Cache operations
  saveToCache(userPreference: UserPreference): Promise<Result<void>>;
  loadFromCache(userId: string): Promise<Result<UserPreference | null>>;
  clearCache(userId?: string): Promise<Result<void>>;

  // Statistics
  getStatistics(): Promise<Result<{
    totalUsers: number;
    darkThemeUsers: number;
    lightThemeUsers: number;
    autoThemeUsers: number;
    russianLanguageUsers: number;
    englishLanguageUsers: number;
    moscowTimezoneUsers: number;
    utcTimezoneUsers: number;
  }>>;
} 