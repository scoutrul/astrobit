import { Result } from '../../../Shared/domain/Result';
import { IUserPreferenceRepository, UserPreferenceSearchCriteria } from '../../Domain/repositories/IUserPreferenceRepository';
import { UserPreference } from '../../Domain/entities/UserPreference';
import { Theme } from '../../Domain/value-objects/Theme';

export class LocalStorageUserPreferenceRepository implements IUserPreferenceRepository {
  private readonly STORAGE_KEY = 'astrobit_user_preferences';
  private readonly CACHE_KEY = 'astrobit_user_preferences_cache';

  // CRUD operations
  async createUserPreference(userPreference: UserPreference): Promise<Result<UserPreference>> {
    try {
      const preferences = this.getAllPreferencesFromStorage();
      preferences[userPreference.id] = userPreference.toApiFormat();
      this.savePreferencesToStorage(preferences);
      
      // Сохраняем в кэш
      await this.saveToCache(userPreference);
      
      return Result.ok(userPreference);
    } catch (error) {
      return Result.fail(`Failed to create user preference: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUserPreference(id: string): Promise<Result<UserPreference | null>> {
    try {
      const preferences = this.getAllPreferencesFromStorage();
      const preferenceData = preferences[id];
      
      if (!preferenceData) {
        return Result.ok(null);
      }

      const userPreference = UserPreference.fromApiFormat(preferenceData);
      return Result.ok(userPreference);
    } catch (error) {
      return Result.fail(`Failed to get user preference: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUserPreferenceByUserId(userId: string): Promise<Result<UserPreference | null>> {
    try {
      const preferences = this.getAllPreferencesFromStorage();
      
      for (const preferenceData of Object.values(preferences)) {
        if (preferenceData.userId === userId) {
          const userPreference = UserPreference.fromApiFormat(preferenceData as any);
          return Result.ok(userPreference);
        }
      }

      return Result.ok(null);
    } catch (error) {
      return Result.fail(`Failed to get user preference by user ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateUserPreference(userPreference: UserPreference): Promise<Result<UserPreference>> {
    try {
      const preferences = this.getAllPreferencesFromStorage();
      preferences[userPreference.id] = userPreference.toApiFormat();
      this.savePreferencesToStorage(preferences);
      
      // Обновляем кэш
      await this.saveToCache(userPreference);
      
      return Result.ok(userPreference);
    } catch (error) {
      return Result.fail(`Failed to update user preference: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteUserPreference(id: string): Promise<Result<void>> {
    try {
      const preferences = this.getAllPreferencesFromStorage();
      delete preferences[id];
      this.savePreferencesToStorage(preferences);
      
      // Очищаем кэш
      await this.clearCache(id);
      
      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to delete user preference: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Search operations
  async findByCriteria(criteria: UserPreferenceSearchCriteria): Promise<Result<UserPreference[]>> {
    try {
      const preferences = this.getAllPreferencesFromStorage();
      const results: UserPreference[] = [];

      for (const preferenceData of Object.values(preferences)) {
        let matches = true;

        if (criteria.userId && preferenceData.userId !== criteria.userId) {
          matches = false;
        }

        if (criteria.theme && preferenceData.theme !== criteria.theme) {
          matches = false;
        }

        if (criteria.language && preferenceData.language !== criteria.language) {
          matches = false;
        }

        if (criteria.timezone && preferenceData.timezone !== criteria.timezone) {
          matches = false;
        }

        if (matches) {
          const userPreference = UserPreference.fromApiFormat(preferenceData as any);
          results.push(userPreference);
        }
      }

      return Result.ok(results);
    } catch (error) {
      return Result.fail(`Failed to find user preferences by criteria: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllUserPreferences(): Promise<Result<UserPreference[]>> {
    try {
      const preferences = this.getAllPreferencesFromStorage();
      const results: UserPreference[] = [];

      for (const preferenceData of Object.values(preferences)) {
        const userPreference = UserPreference.fromApiFormat(preferenceData as any);
        results.push(userPreference);
      }

      return Result.ok(results);
    } catch (error) {
      return Result.fail(`Failed to get all user preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Theme operations
  async updateTheme(userId: string, theme: Theme): Promise<Result<UserPreference>> {
    try {
      const preferenceResult = await this.getUserPreferenceByUserId(userId);
      if (preferenceResult.isFailure) {
        return Result.fail(`Failed to get user preference: ${preferenceResult.error}`);
      }

      let userPreference: UserPreference;
      if (preferenceResult.value) {
        userPreference = preferenceResult.value.withTheme(theme);
      } else {
        userPreference = UserPreference.create(userId, theme);
      }

      return await this.updateUserPreference(userPreference);
    } catch (error) {
      return Result.fail(`Failed to update theme: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTheme(userId: string): Promise<Result<Theme | null>> {
    try {
      const preferenceResult = await this.getUserPreferenceByUserId(userId);
      if (preferenceResult.isFailure) {
        return Result.fail(`Failed to get user preference: ${preferenceResult.error}`);
      }

      return Result.ok(preferenceResult.value?.theme || null);
    } catch (error) {
      return Result.fail(`Failed to get theme: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Language operations
  async updateLanguage(userId: string, language: string): Promise<Result<UserPreference>> {
    try {
      const preferenceResult = await this.getUserPreferenceByUserId(userId);
      if (preferenceResult.isFailure) {
        return Result.fail(`Failed to get user preference: ${preferenceResult.error}`);
      }

      let userPreference: UserPreference;
      if (preferenceResult.value) {
        userPreference = preferenceResult.value.withLanguage(language);
      } else {
        userPreference = UserPreference.create(userId, Theme.createDark(), language);
      }

      return await this.updateUserPreference(userPreference);
    } catch (error) {
      return Result.fail(`Failed to update language: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getLanguage(userId: string): Promise<Result<string | null>> {
    try {
      const preferenceResult = await this.getUserPreferenceByUserId(userId);
      if (preferenceResult.isFailure) {
        return Result.fail(`Failed to get user preference: ${preferenceResult.error}`);
      }

      return Result.ok(preferenceResult.value?.language || null);
    } catch (error) {
      return Result.fail(`Failed to get language: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Timezone operations
  async updateTimezone(userId: string, timezone: string): Promise<Result<UserPreference>> {
    try {
      const preferenceResult = await this.getUserPreferenceByUserId(userId);
      if (preferenceResult.isFailure) {
        return Result.fail(`Failed to get user preference: ${preferenceResult.error}`);
      }

      let userPreference: UserPreference;
      if (preferenceResult.value) {
        userPreference = preferenceResult.value.withTimezone(timezone);
      } else {
        userPreference = UserPreference.create(userId, Theme.createDark(), 'ru', timezone);
      }

      return await this.updateUserPreference(userPreference);
    } catch (error) {
      return Result.fail(`Failed to update timezone: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTimezone(userId: string): Promise<Result<string | null>> {
    try {
      const preferenceResult = await this.getUserPreferenceByUserId(userId);
      if (preferenceResult.isFailure) {
        return Result.fail(`Failed to get user preference: ${preferenceResult.error}`);
      }

      return Result.ok(preferenceResult.value?.timezone || null);
    } catch (error) {
      return Result.fail(`Failed to get timezone: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Notification operations
  async updateNotifications(
    userId: string,
    notifications: {
      email?: boolean;
      push?: boolean;
      astronomical?: boolean;
      crypto?: boolean;
    }
  ): Promise<Result<UserPreference>> {
    try {
      const preferenceResult = await this.getUserPreferenceByUserId(userId);
      if (preferenceResult.isFailure) {
        return Result.fail(`Failed to get user preference: ${preferenceResult.error}`);
      }

      let userPreference: UserPreference;
      if (preferenceResult.value) {
        userPreference = preferenceResult.value.withNotifications(notifications);
      } else {
        userPreference = UserPreference.createDefault(userId).withNotifications(notifications);
      }

      return await this.updateUserPreference(userPreference);
    } catch (error) {
      return Result.fail(`Failed to update notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getNotifications(userId: string): Promise<Result<{
    email: boolean;
    push: boolean;
    astronomical: boolean;
    crypto: boolean;
  } | null>> {
    try {
      const preferenceResult = await this.getUserPreferenceByUserId(userId);
      if (preferenceResult.isFailure) {
        return Result.fail(`Failed to get user preference: ${preferenceResult.error}`);
      }

      return Result.ok(preferenceResult.value?.notifications || null);
    } catch (error) {
      return Result.fail(`Failed to get notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Display operations
  async updateDisplay(
    userId: string,
    display: {
      chartHeight?: number;
      showVolume?: boolean;
      showGrid?: boolean;
      showCrosshair?: boolean;
    }
  ): Promise<Result<UserPreference>> {
    try {
      const preferenceResult = await this.getUserPreferenceByUserId(userId);
      if (preferenceResult.isFailure) {
        return Result.fail(`Failed to get user preference: ${preferenceResult.error}`);
      }

      let userPreference: UserPreference;
      if (preferenceResult.value) {
        userPreference = preferenceResult.value.withDisplay(display);
      } else {
        userPreference = UserPreference.createDefault(userId).withDisplay(display);
      }

      return await this.updateUserPreference(userPreference);
    } catch (error) {
      return Result.fail(`Failed to update display: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getDisplay(userId: string): Promise<Result<{
    chartHeight: number;
    showVolume: boolean;
    showGrid: boolean;
    showCrosshair: boolean;
  } | null>> {
    try {
      const preferenceResult = await this.getUserPreferenceByUserId(userId);
      if (preferenceResult.isFailure) {
        return Result.fail(`Failed to get user preference: ${preferenceResult.error}`);
      }

      return Result.ok(preferenceResult.value?.display || null);
    } catch (error) {
      return Result.fail(`Failed to get display: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Utility operations
  async exists(userId: string): Promise<Result<boolean>> {
    try {
      const preferenceResult = await this.getUserPreferenceByUserId(userId);
      return Result.ok(preferenceResult.value !== null);
    } catch (error) {
      return Result.fail(`Failed to check if user preference exists: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async count(): Promise<Result<number>> {
    try {
      const preferences = this.getAllPreferencesFromStorage();
      return Result.ok(Object.keys(preferences).length);
    } catch (error) {
      return Result.fail(`Failed to count user preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async clearAll(): Promise<Result<void>> {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.CACHE_KEY);
      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to clear all user preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Cache operations
  async saveToCache(userPreference: UserPreference): Promise<Result<void>> {
    try {
      const cache = this.getCacheFromStorage();
      cache[userPreference.userId] = userPreference.toApiFormat();
      this.saveCacheToStorage(cache);
      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to save to cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async loadFromCache(userId: string): Promise<Result<UserPreference | null>> {
    try {
      const cache = this.getCacheFromStorage();
      const preferenceData = cache[userId];
      
      if (!preferenceData) {
        return Result.ok(null);
      }

      const userPreference = UserPreference.fromApiFormat(preferenceData);
      return Result.ok(userPreference);
    } catch (error) {
      return Result.fail(`Failed to load from cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async clearCache(userId?: string): Promise<Result<void>> {
    try {
      if (userId) {
        const cache = this.getCacheFromStorage();
        delete cache[userId];
        this.saveCacheToStorage(cache);
      } else {
        localStorage.removeItem(this.CACHE_KEY);
      }
      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to clear cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Statistics
  async getStatistics(): Promise<Result<{
    totalUsers: number;
    darkThemeUsers: number;
    lightThemeUsers: number;
    autoThemeUsers: number;
    russianLanguageUsers: number;
    englishLanguageUsers: number;
    moscowTimezoneUsers: number;
    utcTimezoneUsers: number;
  }>> {
    try {
      const preferences = this.getAllPreferencesFromStorage();
      const statistics = {
        totalUsers: Object.keys(preferences).length,
        darkThemeUsers: 0,
        lightThemeUsers: 0,
        autoThemeUsers: 0,
        russianLanguageUsers: 0,
        englishLanguageUsers: 0,
        moscowTimezoneUsers: 0,
        utcTimezoneUsers: 0
      };

      for (const preferenceData of Object.values(preferences)) {
        // Theme statistics
        switch (preferenceData.theme) {
          case 'dark':
            statistics.darkThemeUsers++;
            break;
          case 'light':
            statistics.lightThemeUsers++;
            break;
          case 'auto':
            statistics.autoThemeUsers++;
            break;
        }

        // Language statistics
        switch (preferenceData.language) {
          case 'ru':
            statistics.russianLanguageUsers++;
            break;
          case 'en':
            statistics.englishLanguageUsers++;
            break;
        }

        // Timezone statistics
        switch (preferenceData.timezone) {
          case 'Europe/Moscow':
            statistics.moscowTimezoneUsers++;
            break;
          case 'UTC':
            statistics.utcTimezoneUsers++;
            break;
        }
      }

      return Result.ok(statistics);
    } catch (error) {
      return Result.fail(`Failed to get statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private helper methods
  private getAllPreferencesFromStorage(): Record<string, any> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private savePreferencesToStorage(preferences: Record<string, any>): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save preferences to localStorage:', error);
    }
  }

  private getCacheFromStorage(): Record<string, any> {
    try {
      const data = localStorage.getItem(this.CACHE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private saveCacheToStorage(cache: Record<string, any>): void {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Failed to save cache to localStorage:', error);
    }
  }
} 