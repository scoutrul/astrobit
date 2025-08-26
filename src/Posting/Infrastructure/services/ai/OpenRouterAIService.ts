import { 
  IAIService, 
  GenerationOptions, 
  AIGenerationResult, 
  ValidationResult 
} from './IAIService';

export class OpenRouterAIService implements IAIService {
  private readonly baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly apiKey: string;
  private usageStats = {
    requestsToday: 0,
    tokensUsed: 0,
    remainingQuota: 10000 // По умолчанию
  };

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY environment variable.');
    }
  }

  async generate(prompt: string, options: GenerationOptions = {}): Promise<AIGenerationResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'AstroBit - AI Content Generator'
        },
        body: JSON.stringify({
          model: options.model || 'openai/gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: options.systemPrompt || this.getDefaultSystemPrompt()
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: options.maxTokens || 1000,
          temperature: options.temperature || 0.7
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from OpenAI API');
      }

      const content = data.choices[0].message.content;
      const tokens = data.usage?.total_tokens || 0;

      // Обновляем статистику использования
      this.usageStats.requestsToday++;
      this.usageStats.tokensUsed += tokens;

      const result: AIGenerationResult = {
        content,
        metadata: {
          model: data.model || options.model || 'openai/gpt-3.5-turbo',
          tokens,
          confidence: this.calculateConfidence(data),
          timestamp: new Date()
        },
        validation: this.validateContent(content)
      };

      return result;

    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }

      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Простая проверка доступности API
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async getUsageStats() {
    return { ...this.usageStats };
  }

  validateContent(content: string): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Базовая валидация
    if (!content || content.trim().length === 0) {
      errors.push('Контент не может быть пустым');
    }

    if (content.length < 50) {
      warnings.push('Контент слишком короткий (менее 50 символов)');
    }

    if (content.length > 4000) {
      warnings.push('Контент слишком длинный (более 4000 символов)');
    }

    // Проверка на наличие неподходящего контента
    const inappropriatePatterns = [
      /\b(спам|реклама)\b/gi,
      /\b(финансовый совет|инвестиционный совет)\b/gi
    ];

    for (const pattern of inappropriatePatterns) {
      if (pattern.test(content)) {
        warnings.push('Контент может содержать неподходящую информацию');
        break;
      }
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }

  private getDefaultSystemPrompt(): string {
    return `Ты - эксперт по астрономии и криптовалютам. 
Создавай качественный, информативный контент на русском языке.
Используй научно точную информацию и избегай спекуляций.
Формат: краткий, но содержательный текст с практическими выводами.
Никогда не давай финансовых советов, только образовательную информацию.`;
  }

  private calculateConfidence(data: any): number {
    // Простая оценка уверенности на основе ответа
    if (data.choices && data.choices[0] && data.choices[0].finish_reason === 'stop') {
      return 0.9;
    }
    return 0.7;
  }
}
