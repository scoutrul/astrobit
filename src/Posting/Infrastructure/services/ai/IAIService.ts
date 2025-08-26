import { Result } from '../../../../Shared/domain/Result';

export interface GenerationOptions {
  model?: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

export interface AIGenerationMetadata {
  model: string;
  tokens: number;
  confidence: number;
  timestamp: Date;
}

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

export interface AIGenerationResult {
  content: string;
  metadata: AIGenerationMetadata;
  validation: ValidationResult;
}

export interface GenerationContext {
  postType: string;
  astronomicalEvents?: any[];
  historicalPosts?: any[];
  marketData?: any;
  userPreferences?: any;
  selectedContext?: string[];
}

export interface IAIService {
  /**
   * Генерирует контент на основе промпта и опций
   */
  generate(prompt: string, options?: GenerationOptions): Promise<AIGenerationResult>;

  /**
   * Проверяет доступность сервиса
   */
  isAvailable(): Promise<boolean>;

  /**
   * Получает статистику использования
   */
  getUsageStats(): Promise<{
    requestsToday: number;
    tokensUsed: number;
    remainingQuota: number;
  }>;

  /**
   * Валидирует сгенерированный контент
   */
  validateContent(content: string): ValidationResult;
}
