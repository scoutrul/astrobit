# Технический контекст AstroBit

## Системные технологии для AI-постинга

### Базовый технологический стек
**Унаследован от существующего проекта:**
- **Frontend Framework**: React 18+ с TypeScript
- **Build Tool**: Vite для быстрой сборки и HMR
- **State Management**: Zustand для глобального состояния
- **Styling**: Tailwind CSS для утилитарных стилей
- **Архитектура**: Clean Architecture / Hexagonal Architecture

### Новые технологические компоненты

#### AI и Content Generation
```json
{
  "openai": "^4.0.0",
  "ai": "^3.0.0", 
  "zod": "^3.22.0"
}
```

**OpenAI API Integration:**
- **Model**: GPT-4 для высокого качества генерации
- **Backup Model**: GPT-3.5-turbo для fallback ситуаций
- **Rate Limiting**: Встроенная система управления лимитами
- **Token Management**: Подсчет и оптимизация токенов

**Prompt Engineering Framework:**
```typescript
interface PromptTemplate {
  system: string;
  user: string;
  context: Record<string, any>;
  maxTokens: number;
  temperature: number;
}

class PromptBuilder {
  withSystemMessage(message: string): PromptBuilder;
  withUserMessage(message: string): PromptBuilder;
  withContext(context: Record<string, any>): PromptBuilder;
  build(): PromptTemplate;
}
```

#### Data Management и архивирование
**JSON Operation Libraries:**
```json
{
  "lodash": "^4.17.21",
  "date-fns": "^2.30.0",
  "uuid": "^9.0.0"
}
```

**File System Management:**
- **Atomic Operations**: Ensure data consistency при архивировании
- **Backup Strategy**: Automatic backup before critical operations
- **Compression**: Gzip для архивных файлов для экономии места

**Archive Structure:**
```
src/Posting/Infrastructure/data/
├── active/
│   ├── drafts.json
│   ├── scheduled.json
│   └── published.json
├── archives/
│   ├── 2024-01/
│   │   ├── published_202401.json.gz
│   │   └── metadata_202401.json
│   └── 2024-02/
└── backups/
    └── daily/
```

#### External API Integrations
**Existing Integrations (расширение):**
- **Telegram Bot API**: Уже реализован, расширение для новых типов контента
- **Astronomical Data**: Локальные JSON файлы + потенциальная внешняя интеграция
- **Crypto Market Data**: Binance API для real-time данных

**New Integrations:**
- **OpenAI API**: Primary AI content generation service
- **Backup AI Services**: Anthropic Claude API как резервный вариант
- **Content Moderation**: OpenAI Moderation API для проверки контента

### Архитектурные ограничения и решения

#### Performance Constraints
**JSON File Size Management:**
```typescript
interface ArchiveStrategy {
  maxRecords: number; // 200 записей
  maxFileSize: number; // 5MB 
  compressionEnabled: boolean;
  rotationPolicy: 'time' | 'size' | 'hybrid';
}

class PerformanceOptimizer {
  // Lazy loading для больших файлов
  async loadArchive(month: string): Promise<Post[]> {
    return this.lazyLoader.load(`archives/${month}`);
  }
  
  // Виртуализация для UI списков
  renderVirtualizedPostList(posts: Post[]): JSX.Element {
    return <VirtualizedList items={posts} />;
  }
}
```

**Memory Management:**
- **Lazy Loading**: Архивы загружаются только при необходимости
- **Cache Invalidation**: LRU cache для часто используемых данных
- **Virtual Scrolling**: Для UI с большими списками постов

#### API Rate Limiting
**OpenAI API Management:**
```typescript
interface RateLimiter {
  requests: {
    perMinute: number; // 60 запросов
    perDay: number;    // 1000 запросов
  };
  tokens: {
    perMinute: number; // 40,000 токенов
    perDay: number;    // 200,000 токенов
  };
}

class APIThrottler {
  private queue: RequestQueue = new RequestQueue();
  
  async throttledRequest<T>(
    apiCall: () => Promise<T>,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<T> {
    return this.queue.add(apiCall, priority);
  }
}
```

**Fallback Strategies:**
1. **Queue Management**: Priority queue для критических запросов
2. **Caching**: Кэширование похожих запросов для экономии лимитов
3. **Batch Processing**: Группировка запросов для эффективности
4. **Graceful Degradation**: Template-based content при недоступности AI

### Development Environment

#### TypeScript Configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true
  },
  "include": [
    "src/**/*",
    "src/Posting/**/*"
  ]
}
```

**Type Safety для AI Content:**
```typescript
// Строгая типизация для AI responses
interface AIGenerationResult {
  content: string;
  metadata: {
    model: string;
    tokens: number;
    confidence: number;
  };
  validation: {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  };
}

// Валидация с Zod
const PostContentSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.string().min(50).max(4000),
  tags: z.array(z.string()).min(1).max(10),
  type: z.enum(['announcement', 'retrospective', 'analysis'])
});
```

#### Testing Strategy
**Unit Testing Framework:**
```json
{
  "vitest": "^1.0.0",
  "@testing-library/react": "^14.0.0",
  "@testing-library/jest-dom": "^6.0.0"
}
```

**Mock Strategies для AI:**
```typescript
class MockOpenAIService implements IOpenAIService {
  async generate(prompt: string): Promise<AIGenerationResult> {
    return {
      content: this.generateMockContent(prompt),
      metadata: { model: 'mock', tokens: 100, confidence: 0.95 },
      validation: { isValid: true, warnings: [], errors: [] }
    };
  }
}

// Стратегия тестирования:
// 1. Unit tests с mock AI сервисами
// 2. Integration tests с реальным OpenAI (ограниченно)
// 3. E2E tests с mock данными
// 4. Performance tests с большими JSON файлами
```

### Security Considerations

#### API Key Management
```typescript
interface SecurityConfig {
  apiKeys: {
    openai: string; // Через переменные окружения
    telegram: string;
    backup?: string; // Для fallback сервисов
  };
  encryption: {
    sensitiveData: boolean; // Шифрование чувствительных данных
    algorithm: 'AES-256-GCM';
  };
}

class SecureKeyManager {
  private keys: Map<string, string> = new Map();
  
  getAPIKey(service: 'openai' | 'telegram'): string {
    const key = this.keys.get(service);
    if (!key) throw new SecurityError(`Missing API key for ${service}`);
    return key;
  }
}
```

**Content Security:**
- **Input Sanitization**: Все пользовательские вводы очищаются
- **Output Validation**: AI-сгенерированный контент проверяется
- **Moderation**: Автоматическая проверка контента через OpenAI Moderation
- **Audit Logging**: Все AI запросы логируются для аудита

#### Data Privacy
```typescript
interface PrivacyPolicy {
  dataRetention: {
    drafts: '30 days';
    published: '1 year';
    archived: 'indefinite';
    logs: '90 days';
  };
  anonymization: {
    userInputs: boolean;
    generatedContent: boolean;
  };
}
```

### Deployment и Infrastructure

#### Build Process
```json
{
  "scripts": {
    "build": "vite build",
    "build:prod": "vite build --mode production",
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext ts,tsx",
    "test": "vitest",
    "test:e2e": "playwright test"
  }
}
```

**Production Optimizations:**
- **Code Splitting**: Async loading AI компонентов
- **Tree Shaking**: Удаление неиспользуемого кода
- **Minification**: Оптимизация размера bundle
- **Compression**: Gzip/Brotli для статических ресурсов

#### Environment Configuration
```typescript
interface EnvironmentConfig {
  development: {
    aiService: 'mock' | 'openai';
    dataSource: 'local' | 'remote';
    logging: 'verbose';
  };
  staging: {
    aiService: 'openai';
    dataSource: 'staging';
    logging: 'standard';
  };
  production: {
    aiService: 'openai';
    dataSource: 'production';
    logging: 'minimal';
  };
}
```

### Monitoring и Observability

#### Logging Strategy
```typescript
interface LoggingConfig {
  levels: ['error', 'warn', 'info', 'debug'];
  ai: {
    requests: boolean;
    responses: boolean; // Без чувствительных данных
    errors: boolean;
    performance: boolean;
  };
  archiving: {
    operations: boolean;
    performance: boolean;
    errors: boolean;
  };
}

class SystemLogger {
  logAIRequest(request: AIRequest): void {
    console.info('AI request', {
      type: request.type,
      tokensEstimate: request.estimatedTokens,
      timestamp: new Date().toISOString()
    });
  }
  
  logArchiveOperation(operation: ArchiveOperation): void {
    console.info('Archive operation', {
      type: operation.type,
      recordCount: operation.recordCount,
      performance: operation.duration
    });
  }
}
```

**Performance Monitoring:**
- **AI Response Times**: Мониторинг времени ответа API
- **JSON Operation Performance**: Время чтения/записи больших файлов
- **Memory Usage**: Отслеживание использования памяти
- **Error Rates**: Процент неудачных AI запросов

### Migration Strategy

#### Data Migration
```typescript
interface MigrationPlan {
  phase1: {
    description: 'Расширение существующей Post entity';
    changes: ['добавление AI metadata', 'система тегов'];
    rollback: 'автоматический';
  };
  phase2: {
    description: 'Внедрение архивной системы';
    changes: ['создание archive структуры', 'миграция старых данных'];
    rollback: 'manual';
  };
  phase3: {
    description: 'AI интеграция';
    changes: ['OpenAI сервисы', 'content generation pipeline'];
    rollback: 'feature toggle';
  };
}
```

**Backward Compatibility:**
- Существующие посты остаются совместимыми
- Новые поля опциональны
- Graceful degradation для старых данных
- API версионирование для будущих изменений

### Quality Assurance

#### Code Quality
```json
{
  "eslint": "^8.0.0",
  "@typescript-eslint/eslint-plugin": "^6.0.0",
  "prettier": "^3.0.0",
  "husky": "^8.0.0",
  "lint-staged": "^14.0.0"
}
```

**Quality Gates:**
- **Type Coverage**: Минимум 95% type coverage
- **Test Coverage**: Минимум 80% unit test coverage
- **AI Content Quality**: Automated validation rules
- **Performance**: Benchmark tests для JSON операций

Эта техническая архитектура обеспечивает масштабируемое, надежное и поддерживаемое решение для AI-powered системы постинга, интегрируясь с существующей технологической базой проекта AstroBit.
