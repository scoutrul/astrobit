# Creative Phase: AI Posting System Architecture

## 🎨🎨🎨 ENTERING CREATIVE PHASE: AI POSTING SYSTEM

**Дата**: 2024-01-08  
**Компонент**: Система автоматического постинга и аналитики с ИИ  
**Уровень сложности**: Level 4 (Complex System)

## Архитектурные решения

### 1. AI Content Generator Architecture

#### Выбранный подход: Strategy + Factory Pattern
```typescript
// Интерфейс для генераторов контента
interface IContentGenerator {
  generate(context: GenerationContext): Promise<Result<string>>;
  validate(content: string): ValidationResult;
}

// Фабрика генераторов
class ContentGeneratorFactory {
  createGenerator(type: PostType): IContentGenerator {
    switch(type) {
      case 'astronomical_announcement': 
        return new AstronomicalAnnouncementGenerator();
      case 'market_retrospective':
        return new MarketRetrospectiveGenerator();
      case 'analytical_post':
        return new AnalyticalPostGenerator();
      default:
        throw new Error(`Unknown post type: ${type}`);
    }
  }
}

// Контекст генерации
interface GenerationContext {
  postType: PostType;
  astronomicalEvents: AstronomicalEvent[];
  historicalPosts: Post[];
  marketData: MarketData;
  userPreferences: UserPreferences;
}
```

#### Circuit Breaker Implementation
```typescript
class CircuitBreakerOpenAIService {
  private failureCount = 0;
  private lastFailureTime?: Date;
  private readonly threshold = 5;
  private readonly timeout = 60000; // 1 минута
  
  async generate(prompt: string): Promise<Result<string>> {
    if (this.isOpen()) {
      return Result.failure(new Error('Circuit breaker is open'));
    }
    
    try {
      const result = await this.openAIClient.generate(prompt);
      this.onSuccess();
      return Result.success(result);
    } catch (error) {
      this.onFailure();
      return Result.failure(error);
    }
  }
}
```

### 2. Data Architecture

#### JSON File Structure
```
src/Posting/Infrastructure/data/
├── active/
│   ├── drafts.json          # Черновики (макс. 100)
│   ├── scheduled.json       # Запланированные (макс. 100)
│   └── published.json       # Опубликованные (макс. 200)
├── archives/
│   ├── 2024-01/
│   │   ├── published_202401.json.gz
│   │   └── metadata_202401.json
│   └── 2024-02/
└── backups/
    └── daily/
        └── backup_20240108.json
```

#### Archive Service Implementation
```typescript
interface IArchiveService {
  shouldArchive(posts: Post[]): boolean;
  archive(posts: Post[]): Promise<Result<void>>;
  restore(archiveId: string): Promise<Result<Post[]>>;
}

class HybridArchiveService implements IArchiveService {
  private readonly maxRecords = 200;
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  
  async shouldArchive(posts: Post[]): Promise<boolean> {
    const recordCount = posts.length;
    const fileSize = this.calculateFileSize(posts);
    
    return recordCount > this.maxRecords || fileSize > this.maxFileSize;
  }
  
  async archive(posts: Post[]): Promise<Result<void>> {
    try {
      // Создание backup
      await this.createBackup(posts);
      
      // Атомарная операция архивирования
      const archiveName = this.generateArchiveName();
      await this.writeArchiveFile(archiveName, posts);
      
      // Обновление индекса
      await this.updateArchiveIndex(archiveName, posts);
      
      // Очистка активного файла
      await this.cleanActiveFile(posts);
      
      return Result.success();
    } catch (error) {
      return Result.failure(error);
    }
  }
}
```

### 3. UI/UX Design

#### Full-page Generator Layout
```typescript
interface ContentGeneratorUI {
  // Основные секции
  postTypeSelector: PostTypeSelector;
  contextBuilder: ContextBuilder;
  contentPreview: ContentPreview;
  generationControls: GenerationControls;
  
  // Responsive breakpoints
  mobile: MobileLayout;
  tablet: TabletLayout;
  desktop: DesktopLayout;
}

// Компонент мультивыбора исторических постов
const HistoricalPostsSelector: React.FC<HistoricalPostsSelectorProps> = ({
  selectedPosts,
  onSelectionChange,
  maxSelection = 10
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Исторический контекст
      </h3>
      
      {/* Поиск и фильтрация */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Поиск по тегам или содержанию..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      {/* Список постов с мультивыбором */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {historicalPosts.map(post => (
          <HistoricalPostItem
            key={post.id}
            post={post}
            isSelected={selectedPosts.includes(post.id)}
            onToggle={() => handlePostToggle(post.id)}
            disabled={selectedPosts.length >= maxSelection && !selectedPosts.includes(post.id)}
          />
        ))}
      </div>
      
      {/* Счетчик выбранных */}
      <div className="mt-4 text-sm text-gray-600">
        Выбрано: {selectedPosts.length} / {maxSelection}
      </div>
    </div>
  );
};
```

#### Tag System Implementation
```typescript
interface TagSystem {
  // Автоподстановка тегов
  suggestTags(content: string, context: PostContext): Tag[];
  
  // Поиск связанных постов
  findRelatedPosts(tags: Tag[], limit: number): Promise<Post[]>;
  
  // Управление тегами
  createTag(name: string, category: TagCategory): Tag;
  updateTag(tagId: string, updates: Partial<Tag>): Promise<Result<Tag>>;
}

class SmartTagSystem implements TagSystem {
  async suggestTags(content: string, context: PostContext): Promise<Tag[]> {
    const suggestions: Tag[] = [];
    
    // Астрономические теги
    const astronomicalTags = this.extractAstronomicalTags(content);
    suggestions.push(...astronomicalTags);
    
    // Рыночные теги
    const marketTags = this.extractMarketTags(content);
    suggestions.push(...marketTags);
    
    // Автоматические теги на основе контекста
    const contextualTags = this.generateContextualTags(context);
    suggestions.push(...contextualTags);
    
    return this.rankTagsByRelevance(suggestions, content);
  }
}
```

### 4. Integration Architecture

#### ContentGenerationFacade
```typescript
class ContentGenerationFacade {
  constructor(
    private astronomicalAdapter: IAstronomicalDataAdapter,
    private marketDataService: IMarketDataService,
    private contentGenerator: IContentGenerator,
    private postRepository: IPostRepository,
    private tagSystem: ITagSystem
  ) {}
  
  async generateAstronomicalAnnouncement(
    eventId: string,
    selectedHistoricalPosts: string[],
    userPreferences: UserPreferences
  ): Promise<Result<Post>> {
    try {
      // 1. Получаем данные о событии
      const event = await this.astronomicalAdapter.getEventById(eventId);
      if (!event.isSuccess) {
        return Result.failure(event.error);
      }
      
      // 2. Получаем исторический контекст
      const historicalPosts = await this.getHistoricalPosts(selectedHistoricalPosts);
      if (!historicalPosts.isSuccess) {
        return Result.failure(historicalPosts.error);
      }
      
      // 3. Получаем рыночные данные
      const marketData = await this.marketDataService.getCurrentData();
      if (!marketData.isSuccess) {
        return Result.failure(marketData.error);
      }
      
      // 4. Формируем контекст генерации
      const context = new GenerationContext({
        event: event.value,
        historicalPosts: historicalPosts.value,
        marketData: marketData.value,
        userPreferences
      });
      
      // 5. Генерируем контент
      const content = await this.contentGenerator.generate(context);
      if (!content.isSuccess) {
        return Result.failure(content.error);
      }
      
      // 6. Генерируем теги
      const tags = await this.tagSystem.suggestTags(content.value, context);
      
      // 7. Создаем и сохраняем пост
      const post = Post.create({
        title: this.generateTitle(event.value),
        content: content.value,
        type: 'astronomical_announcement',
        scheduledAt: new Date(),
        metadata: {
          astronomicalEvents: [eventId],
          tags: tags.map(t => t.name),
          template: 'astronomical_announcement',
          variables: { eventId, historicalPostCount: historicalPosts.value.length },
          priority: 'high'
        }
      });
      
      const savedPost = await this.postRepository.save(post);
      return savedPost;
      
    } catch (error) {
      return Result.failure(new Error(`Generation failed: ${error.message}`));
    }
  }
}
```

## Техническая реализация

### OpenAI API Integration через OpenRouter
```typescript
class OpenRouterAIService implements IAIService {
  private readonly baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly apiKey: string;
  
  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }
  }
  
  async generate(prompt: string, options: GenerationOptions = {}): Promise<AIGenerationResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    
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
      
      return {
        content: data.choices[0].message.content,
        metadata: {
          model: data.model,
          tokens: data.usage.total_tokens,
          confidence: this.calculateConfidence(data)
        },
        validation: {
          isValid: true,
          warnings: [],
          errors: []
        }
      };
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }
  
  private getDefaultSystemPrompt(): string {
    return `Ты - эксперт по астрономии и криптовалютам. 
    Создавай качественный, информативный контент на русском языке.
    Используй научно точную информацию и избегай спекуляций.
    Формат: краткий, но содержательный текст с практическими выводами.`;
  }
}
```

### Performance Optimization
```typescript
class ContentGenerationOptimizer {
  private cache = new Map<string, CachedContent>();
  private readonly cacheTTL = 24 * 60 * 60 * 1000; // 24 часа
  
  async generateWithCache(
    context: GenerationContext,
    generator: IContentGenerator
  ): Promise<Result<string>> {
    const cacheKey = this.createCacheKey(context);
    
    // Проверяем кэш
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (this.isCacheValid(cached)) {
        return Result.success(cached.content);
      }
    }
    
    // Генерируем новый контент
    const result = await generator.generate(context);
    if (result.isSuccess) {
      // Кэшируем результат
      this.cache.set(cacheKey, {
        content: result.value,
        timestamp: Date.now(),
        ttl: this.cacheTTL
      });
    }
    
    return result;
  }
  
  private createCacheKey(context: GenerationContext): string {
    return JSON.stringify({
      type: context.postType,
      eventId: context.astronomicalEvents.map(e => e.id).sort(),
      historicalPostIds: context.historicalPosts.map(p => p.id).sort(),
      marketDataHash: this.hashMarketData(context.marketData)
    });
  }
}
```

## Валидация архитектуры

### Requirements Coverage
- [x] AI интеграция через OpenAI API
- [x] Контекстная генерация с историческими данными
- [x] Система тегов и связей
- [x] Автоматическое архивирование
- [x] Расширенная админ-панель
- [x] Интеграция с существующими модулями

### Technical Feasibility
- [x] OpenAI API доступен через OpenRouter
- [x] JSON операции поддерживаются в браузере
- [x] React + TypeScript архитектура готова
- [x] Tailwind CSS для стилизации

### Risk Assessment
- **OpenAI API лимиты**: Митигировано через Circuit Breaker и кэширование
- **Производительность JSON**: Митигировано через Lazy Loading и архивирование
- **Сложность UI**: Митигировано через пошаговую реализацию

## Следующие шаги

1. **Переход в IMPLEMENT MODE** для реализации компонентов
2. **Создание proof of concept** OpenAI интеграции
3. **Тестирование JSON операций** с большими объемами данных
4. **Реализация базовых UI компонентов** для генерации контента

---

## 🎨🎨🎨 EXITING CREATIVE PHASE

Архитектурный дизайн AI-системы постинга завершен. Все ключевые решения приняты, техническая реализация спроектирована. Система готова к переходу в IMPLEMENT MODE.
