import { UseCase } from '../../../Shared/application/UseCase';
import { Result } from '../../../Shared/domain/Result';
import { IUserPreferenceRepository } from '../../Domain/repositories/IUserPreferenceRepository';
import { UserPreference } from '../../Domain/entities/UserPreference';
import { Theme } from '../../Domain/value-objects/Theme';

export interface UpdateUserPreferenceRequest {
  userId: string;
  theme?: string;
  language?: string;
  timezone?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
    astronomical?: boolean;
    crypto?: boolean;
  };
  display?: {
    chartHeight?: number;
    showVolume?: boolean;
    showGrid?: boolean;
    showCrosshair?: boolean;
  };
}

export interface UpdateUserPreferenceResponse {
  userPreference: UserPreference;
  message: string;
  updatedFields: string[];
}

export class UpdateUserPreferenceUseCase extends UseCase<UpdateUserPreferenceRequest, UpdateUserPreferenceResponse> {
  constructor(private readonly userPreferenceRepository: IUserPreferenceRepository) {
    super();
  }

  async execute(request: UpdateUserPreferenceRequest): Promise<Result<UpdateUserPreferenceResponse>> {
    try {
      const validationResult = this.validateRequest(request);
      if (validationResult.isFailure) {
        return Result.fail(validationResult.error);
      }

      // Получаем существующие настройки пользователя
      const existingPreferenceResult = await this.userPreferenceRepository.getUserPreferenceByUserId(request.userId);
      if (existingPreferenceResult.isFailure) {
        return Result.fail(`Failed to get user preference: ${existingPreferenceResult.error}`);
      }

      let userPreference: UserPreference;
      const updatedFields: string[] = [];

      if (existingPreferenceResult.value) {
        // Обновляем существующие настройки
        userPreference = existingPreferenceResult.value;
      } else {
        // Создаем новые настройки по умолчанию
        userPreference = UserPreference.createDefault(request.userId);
      }

      // Обновляем тему
      if (request.theme) {
        const theme = new Theme(request.theme as any);
        userPreference = userPreference.withTheme(theme);
        updatedFields.push('theme');
      }

      // Обновляем язык
      if (request.language) {
        userPreference = userPreference.withLanguage(request.language);
        updatedFields.push('language');
      }

      // Обновляем часовой пояс
      if (request.timezone) {
        userPreference = userPreference.withTimezone(request.timezone);
        updatedFields.push('timezone');
      }

      // Обновляем уведомления
      if (request.notifications) {
        userPreference = userPreference.withNotifications(request.notifications);
        updatedFields.push('notifications');
      }

      // Обновляем отображение
      if (request.display) {
        userPreference = userPreference.withDisplay(request.display);
        updatedFields.push('display');
      }

      // Сохраняем обновленные настройки
      const saveResult = await this.userPreferenceRepository.updateUserPreference(userPreference);
      if (saveResult.isFailure) {
        return Result.fail(`Failed to save user preference: ${saveResult.error}`);
      }

      const response: UpdateUserPreferenceResponse = {
        userPreference: saveResult.value,
        message: `User preferences updated successfully: ${updatedFields.join(', ')}`,
        updatedFields
      };

      return Result.ok(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  protected validateRequest(request: UpdateUserPreferenceRequest): Result<UpdateUserPreferenceRequest> {
    if (!request.userId || typeof request.userId !== 'string') {
      return Result.fail('User ID is required and must be a string');
    }

    if (request.userId.trim().length === 0) {
      return Result.fail('User ID cannot be empty');
    }

    if (request.theme && !['dark', 'light', 'auto'].includes(request.theme)) {
      return Result.fail(`Invalid theme value: ${request.theme}`);
    }

    if (request.language && typeof request.language !== 'string') {
      return Result.fail('Language must be a string');
    }

    if (request.timezone && typeof request.timezone !== 'string') {
      return Result.fail('Timezone must be a string');
    }

    if (request.notifications) {
      const notifications = request.notifications;
      if (notifications.email !== undefined && typeof notifications.email !== 'boolean') {
        return Result.fail('Email notification must be a boolean');
      }
      if (notifications.push !== undefined && typeof notifications.push !== 'boolean') {
        return Result.fail('Push notification must be a boolean');
      }
      if (notifications.astronomical !== undefined && typeof notifications.astronomical !== 'boolean') {
        return Result.fail('Astronomical notification must be a boolean');
      }
      if (notifications.crypto !== undefined && typeof notifications.crypto !== 'boolean') {
        return Result.fail('Crypto notification must be a boolean');
      }
    }

    if (request.display) {
      const display = request.display;
      if (display.chartHeight !== undefined && (typeof display.chartHeight !== 'number' || display.chartHeight <= 0)) {
        return Result.fail('Chart height must be a positive number');
      }
      if (display.showVolume !== undefined && typeof display.showVolume !== 'boolean') {
        return Result.fail('Show volume must be a boolean');
      }
      if (display.showGrid !== undefined && typeof display.showGrid !== 'boolean') {
        return Result.fail('Show grid must be a boolean');
      }
      if (display.showCrosshair !== undefined && typeof display.showCrosshair !== 'boolean') {
        return Result.fail('Show crosshair must be a boolean');
      }
    }

    return Result.ok(request);
  }

  private handleError(error: unknown): Result<never> {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return Result.fail(`UpdateUserPreferenceUseCase error: ${errorMessage}`);
  }
} 