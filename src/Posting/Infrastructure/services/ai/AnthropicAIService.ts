import { 
  IAIService, 
  GenerationOptions, 
  AIGenerationResult, 
  ValidationResult 
} from './IAIService';

export class AnthropicAIService implements IAIService {
  private readonly baseUrl = 'https://api.anthropic.com/v1/messages';
  private readonly apiKey: string;
  private readonly defaultModel: string;
  private usageStats = {
    requestsToday: 0,
    tokensUsed: 0,
    remainingQuota: 10000 // По умолчанию
  };

  constructor() {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    const model = import.meta.env.VITE_CHAT_MODEL || 'claude-3-5-haiku-latest';
    
    if (!apiKey) {
      throw new Error('Anthropic API key not configured. Please set VITE_ANTHROPIC_API_KEY environment variable.');
    }
    
    this.apiKey = apiKey;
    this.defaultModel = model;
    
    console.info('[AnthropicAIService] Инициализирован с моделью:', this.defaultModel);
  }

  async generate(prompt: string, options: GenerationOptions = {}): Promise<AIGenerationResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: options.model || this.defaultModel,
          max_tokens: options.maxTokens || 1000,
          temperature: options.temperature || 0.7,
          messages: [
            {
              role: 'user',
              content: `${options.systemPrompt || this.getDefaultSystemPrompt()}\n\n${prompt}`
            }
          ]
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API request failed: ${response.status} ${response.statusText}. ${errorText}`);
      }

      const data = await response.json();

      if (!data.content || !data.content[0] || !data.content[0].text) {
        throw new Error('Invalid response format from Anthropic API');
      }

      const content = data.content[0].text;
      const tokens = data.usage?.input_tokens + data.usage?.output_tokens || 0;

      // Обновляем статистику использования
      this.usageStats.requestsToday++;
      this.usageStats.tokensUsed += tokens;

      const result: AIGenerationResult = {
        content,
        metadata: {
          model: options.model || this.defaultModel,
          tokens,
          confidence: this.calculateConfidence(content),
          timestamp: new Date()
        },
        validation: this.validateContent(content)
      };

      console.info('[AnthropicAIService] Контент сгенерирован:', {
        model: result.metadata.model,
        tokens: result.metadata.tokens,
        confidence: result.metadata.confidence
      });

      return result;

    } catch (error) {
      clearTimeout(timeoutId);
      console.error('[AnthropicAIService] Ошибка генерации:', error);
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Простая проверка доступности через тестовый запрос
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: this.defaultModel,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }]
        })
      });
      
      return response.ok;
    } catch (error) {
      console.warn('[AnthropicAIService] Сервис недоступен:', error);
      return false;
    }
  }

  async getUsageStats(): Promise<{
    requestsToday: number;
    tokensUsed: number;
    remainingQuota: number;
  }> {
    return { ...this.usageStats };
  }

  validateContent(content: string): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Проверка длины контента
    if (content.length < 50) {
      warnings.push('Контент слишком короткий');
    }
    
    if (content.length > 4000) {
      warnings.push('Контент слишком длинный для телеграм-поста');
    }

    // Проверка на наличие эмодзи (желательно для телеграм)
    if (!/[🌙📈📊📝🚀⚡🏷️📚🎯📏🎨#]/.test(content)) {
      warnings.push('Рекомендуется добавить эмодзи для лучшего восприятия');
    }

    // Проверка на наличие хештегов
    if (!/#\w+/.test(content)) {
      warnings.push('Рекомендуется добавить хештеги');
    }

    // Проверка на пустой контент
    if (!content.trim()) {
      errors.push('Контент не может быть пустым');
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }

  private getDefaultSystemPrompt(): string {
    return `Ты эксперт по созданию контента для телеграм-канала AstroBit, который объединяет астрономию и криптовалюты. 

Твоя задача:
- Создавать качественный, информативный контент
- Использовать эмодзи для лучшего восприятия
- Добавлять релевантные хештеги
- Адаптировать стиль под целевую аудиторию
- Связывать астрономические события с рыночными трендами

Стиль:
- Профессиональный, но доступный
- С элементами научной точности
- С акцентом на практическую пользу
- С использованием астрономических и финансовых терминов

Формат ответа:
- Заголовок с эмодзи
- Основной текст с разбивкой на абзацы
- Пустая строка
- Хештеги на отдельной строке (каждый хештег через пробел)
- Длина: 200-1200 символов в зависимости от запроса

КРИТИЧЕСКИ ВАЖНО: 
1. После основного текста ОБЯЗАТЕЛЬНО должна быть пустая строка
2. Затем на следующей строке должны быть хештеги
3. Формат: пустая строка + хештеги на новой строке

Пример правильного формата:
🌠 Заголовок поста

Основной текст поста здесь...

#Астрономия #Космос #Наука`;
  }

  private calculateConfidence(content: string): number {
    // Простая эвристика для расчета уверенности
    let confidence = 0.5; // Базовая уверенность

    // Увеличиваем уверенность за качественные индикаторы
    if (content.length > 100 && content.length < 2000) confidence += 0.2;
    if (/[🌙📈📊📝🚀⚡🏷️📚🎯📏🎨]/.test(content)) confidence += 0.1;
    if (/#\w+/.test(content)) confidence += 0.1;
    if (content.includes('астрономи') || content.includes('крипто')) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }
}
