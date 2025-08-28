import { UseCase } from '../../../../Shared/application/UseCase';
import { Result } from '../../../../Shared/domain/Result';
import { IAIService } from '../../../Infrastructure/services/ai/IAIService';
import { PostType } from '../../../Domain/value-objects/PostType';
import { Tag } from '../../../Domain/value-objects/Tag';
import { RealDataContextService, GetRealDataContextRequest } from '../../../Infrastructure/services/RealDataContextService';

export interface GenerateContentRequest {
  postType: PostType;
  customPrompt?: string;
  astronomicalEventIds?: string[];
  historicalPostIds?: string[];
  marketContext?: any;
  targetAudience?: 'beginner' | 'intermediate' | 'advanced';
  contentLength?: 'short' | 'medium' | 'long';
  includeAnalysis?: boolean;
  includeForecast?: boolean;
}

export interface GenerateContentResponse {
  title: string;
  content: string;
  suggestedTags: Tag[];
  metadata: {
    model: string;
    tokens: number;
    confidence: number;
    generationType: string;
    contextUsed: {
      astronomicalEvents: number;
      historicalPosts: number;
      marketDataIncluded: boolean;
    };
  };
}

export class GenerateContentUseCase extends UseCase<GenerateContentRequest, GenerateContentResponse> {
  constructor(
    private readonly aiService: IAIService,
    private readonly realDataContextService?: RealDataContextService,
    private readonly postRepository?: any // Будет типизировано позже
  ) {
    super();
  }

  async execute(request: GenerateContentRequest): Promise<Result<GenerateContentResponse>> {
    try {
      console.info('[GenerateContentUseCase] Начинаю генерацию контента:', {
        postType: request.postType.value,
        customPrompt: !!request.customPrompt,
        historicalPosts: request.historicalPostIds?.length || 0,
        astronomicalEvents: request.astronomicalEventIds?.length || 0
      });

      // 1. Подготавливаем контекст
      const context = await this.prepareGenerationContext(request);

      // 2. Создаем промпт
      const prompt = this.buildPrompt(request, context);

      // 3. Генерируем контент
      const generationResult = await this.aiService.generate(prompt, {
        model: this.selectModel(request.postType),
        maxTokens: this.getMaxTokens(request.contentLength),
        temperature: this.getTemperature(request.postType)
      });

      if (!generationResult.validation.isValid) {
        return Result.fail(`Сгенерированный контент не прошел валидацию: ${generationResult.validation.errors.join(', ')}`);
      }

      // 4. Парсим результат и создаем ответ
      const parsedContent = this.parseGeneratedContent(generationResult.content);
              const suggestedTags = this.generateTags(request, parsedContent);

      const response: GenerateContentResponse = {
        title: parsedContent.title || this.generateDefaultTitle(request.postType),
        content: parsedContent.content,
        suggestedTags,
        metadata: {
          model: generationResult.metadata.model,
          tokens: generationResult.metadata.tokens,
          confidence: generationResult.metadata.confidence,
          generationType: request.postType.value,
          contextUsed: {
            astronomicalEvents: context.astronomicalEvents.length,
            historicalPosts: context.historicalPosts.length,
            marketDataIncluded: !!context.marketData
          }
        }
      };

      console.info('[GenerateContentUseCase] Контент успешно сгенерирован:', {
        titleLength: response.title.length,
        contentLength: response.content.length,
        tagsCount: response.suggestedTags.length,
        confidence: response.metadata.confidence
      });

      return Result.ok(response);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка генерации';
      console.error('[GenerateContentUseCase] Ошибка генерации контента:', error);
      return Result.fail(`Ошибка генерации контента: ${errorMessage}`);
    }
  }

  // Подготовка контекста для генерации
  private async prepareGenerationContext(request: GenerateContentRequest): Promise<any> {
    const context: any = {
      astronomicalEvents: [],
      historicalPosts: [],
      marketData: null,
      realDataContext: null
    };

    try {
      // Получаем реальный контекст данных через RealDataContextService
      if (this.realDataContextService) {
        console.info('[GenerateContentUseCase] Получение реального контекста данных...');
        
        const realDataRequest: GetRealDataContextRequest = {
          postType: request.postType,
          dateRange: {
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 дней назад
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 дней вперед
          },
          includeCrypto: request.postType.value === 'market_retrospective' || request.postType.value === 'analytical_post',
          includeAstronomical: request.postType.value === 'astronomical_announcement' || request.postType.value === 'analytical_post',
          maxEvents: 10
        };

        const realDataResult = await this.realDataContextService.getRealDataContext(realDataRequest);
        
        if (realDataResult.isSuccess) {
          context.realDataContext = realDataResult.value;
          context.astronomicalEvents = realDataResult.value.astronomicalEvents;
          context.marketData = {
            cryptoData: realDataResult.value.cryptoData,
            marketSummary: realDataResult.value.marketSummary,
            insights: realDataResult.value.contextualInsights
          };
          
          console.info('[GenerateContentUseCase] Реальный контекст получен:', {
            astronomicalEvents: context.astronomicalEvents.length,
            cryptoData: context.marketData.cryptoData.length,
            insights: context.marketData.insights.length
          });
        } else {
          console.warn('[GenerateContentUseCase] Не удалось получить реальный контекст:', realDataResult.error);
        }
      }

      // Загружаем исторические посты (если указаны)
      if (request.historicalPostIds && request.historicalPostIds.length > 0 && this.postRepository) {
        console.info(`[GenerateContentUseCase] Загрузка ${request.historicalPostIds.length} исторических постов`);
        try {
          // TODO: Реализовать получение исторических постов через PostRepository
          // const historicalPosts = await this.postRepository.findByIds(request.historicalPostIds);
          // context.historicalPosts = historicalPosts;
        } catch (error) {
          console.warn('[GenerateContentUseCase] Ошибка загрузки исторических постов:', error);
        }
      }

    } catch (error) {
      console.warn('[GenerateContentUseCase] Ошибка загрузки контекста:', error);
      // Продолжаем с частичным контекстом
    }

    return context;
  }

  // Построение промпта для AI
  private buildPrompt(request: GenerateContentRequest, context: any): string {
    const postType = request.postType;
    let systemContext = '';

    // Добавляем реальный контекст данных в промпт
    if (context.realDataContext && this.realDataContextService) {
      const realDataPrompt = this.realDataContextService.formatContextForAI(context.realDataContext);
      systemContext += `\n\nКОНТЕКСТ РЕАЛЬНЫХ ДАННЫХ:\n${realDataPrompt}\n`;
    }

    // Добавляем контекст типа поста
    switch (postType.value) {
      case 'astronomical_announcement':
        systemContext += this.buildAstronomicalPrompt(request, context);
        break;
      case 'market_retrospective':
        systemContext += this.buildMarketRetrospectivePrompt(request);
        break;
      case 'analytical_post':
        systemContext += this.buildAnalyticalPrompt(request);
        break;
      default:
        systemContext += this.buildGeneralPrompt(request);
    }

    // Добавляем пользовательские указания
    if (request.customPrompt) {
      systemContext += `\n\nДополнительные указания от пользователя: ${request.customPrompt}`;
    }

    // Добавляем технические требования
    systemContext += this.buildTechnicalRequirements(request);

    return systemContext;
  }

  private buildAstronomicalPrompt(request: GenerateContentRequest, context: any): string {
    let prompt = `Создай анонс астрономического события на русском языке.

Аудитория: ${request.targetAudience || 'intermediate'}
Длина контента: ${request.contentLength || 'medium'}

Структура поста:
1. Привлекающий заголовок с эмодзи
2. Краткое описание события
3. Время и условия наблюдения
4. Практические советы для наблюдения
5. Интересные факты или историческая справка`;

    if (context.astronomicalEvents.length > 0) {
      prompt += `\n\nИспользуй данные о событиях: ${JSON.stringify(context.astronomicalEvents, null, 2)}`;
    }

    if (context.historicalPosts.length > 0) {
      prompt += `\n\nОриентируйся на стиль предыдущих постов: ${context.historicalPosts.map((p: any) => p.title).join(', ')}`;
    }

    return prompt;
  }

  private buildMarketRetrospectivePrompt(request: GenerateContentRequest): string {
    return `Создай ретроспективный анализ рынка на русском языке.

Аудитория: ${request.targetAudience || 'intermediate'}
Длина контента: ${request.contentLength || 'medium'}

Структура поста:
1. Заголовок с периодом анализа
2. Ключевые движения рынка
3. Влияние астрономических событий (если есть)
4. Статистика и цифры
5. Выводы и наблюдения
6. Образовательная ценность

Важно: НЕ давай финансовых советов, только аналитическую информацию.`;
  }

  private buildAnalyticalPrompt(request: GenerateContentRequest): string {
    return `Создай аналитический пост, связывающий астрономию и рынки на русском языке.

Аудитория: ${request.targetAudience || 'intermediate'}
Длина контента: ${request.contentLength || 'medium'}

Структура поста:
1. Интригующий заголовок
2. Описание астрономического феномена
3. Исторические параллели с рынком
4. Корреляции и наблюдения
5. Образовательные выводы
6. Disclaimer о корреляции vs причинности

Тон: научно-популярный, без финансовых советов.`;
  }

  private buildGeneralPrompt(request: GenerateContentRequest): string {
    return `Создай информационный пост на русском языке.

Аудитория: ${request.targetAudience || 'intermediate'}
Длина контента: ${request.contentLength || 'medium'}

Создай качественный, информативный контент с образовательной ценностью.`;
  }

  private buildTechnicalRequirements(request: GenerateContentRequest): string {
    let requirements = `\n\nТехнические требования:
- Язык: русский
- Формат: готовый для публикации в Telegram
- Длина: ${this.getContentLengthGuidelines(request.contentLength)}
- Используй эмодзи для визуального оформления
- Добавь 3-5 релевантных хэштегов в конце
- Избегай финансовых советов
- Фокус на образовательном контенте`;

    return requirements;
  }

  private getContentLengthGuidelines(length?: 'short' | 'medium' | 'long'): string {
    switch (length) {
      case 'short': return '200-400 символов';
      case 'long': return '800-1200 символов';
      default: return '400-800 символов';
    }
  }

  // Парсинг сгенерированного контента
  private parseGeneratedContent(content: string): { title?: string; content: string } {
    const lines = content.split('\n').filter(line => line.trim());
    
    // Простой парсер - первая строка как заголовок
    if (lines.length > 1) {
      const potentialTitle = lines[0].trim();
      if (potentialTitle.length < 100) { // Разумная длина заголовка
        return {
          title: potentialTitle,
          content: lines.slice(1).join('\n').trim()
        };
      }
    }

    return { content };
  }

  // Генерация тегов
  private generateTags(request: GenerateContentRequest, content: any): Tag[] {
    const tags: Tag[] = [];

    // Теги по типу поста
    switch (request.postType.value) {
      case 'astronomical_announcement':
        tags.push(Tag.astronomical('астрономия'));
        tags.push(Tag.astronomical('наблюдение'));
        break;
      case 'market_retrospective':
        tags.push(Tag.market('ретроспектива'));
        tags.push(Tag.market('анализ'));
        break;
      case 'analytical_post':
        tags.push(Tag.technical('аналитика'));
        tags.push(Tag.general('корреляция'));
        break;
    }

    // Дополнительные теги на основе контента
    const contentText = content.content.toLowerCase();
    if (contentText.includes('биткоин') || contentText.includes('bitcoin')) {
      tags.push(Tag.market('биткоин'));
    }
    if (contentText.includes('луна') || contentText.includes('лунный')) {
      tags.push(Tag.astronomical('луна'));
    }
    if (contentText.includes('затмение')) {
      tags.push(Tag.astronomical('затмение'));
    }

    return tags.slice(0, 5); // Ограничиваем количество тегов
  }

  // Выбор модели AI
  private selectModel(postType: PostType): string {
    switch (postType.getGenerationComplexity()) {
      case 'complex':
        return 'openai/gpt-4-turbo-preview';
      case 'medium':
        return 'openai/gpt-3.5-turbo';
      default:
        return 'openai/gpt-3.5-turbo';
    }
  }

  // Определение максимального количества токенов
  private getMaxTokens(contentLength?: 'short' | 'medium' | 'long'): number {
    switch (contentLength) {
      case 'short': return 300;
      case 'long': return 1200;
      default: return 800;
    }
  }

  // Определение температуры
  private getTemperature(postType: PostType): number {
    switch (postType.value) {
      case 'analytical_post':
        return 0.3; // Более строгий анализ
      case 'astronomical_announcement':
        return 0.5; // Баланс точности и креативности
      default:
        return 0.7; // Более креативный подход
    }
  }

  // Генерация заголовка по умолчанию
  private generateDefaultTitle(postType: PostType): string {
    const icons: Record<string, string> = {
      'astronomical_announcement': '🌙',
      'market_retrospective': '📈',
      'analytical_post': '📊',
      'general_post': '📝'
    };

    const icon = icons[postType.value] || '📝';
    return `${icon} ${postType.displayName}`;
  }
}
