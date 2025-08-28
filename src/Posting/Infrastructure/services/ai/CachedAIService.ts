import { 
  IAIService, 
  GenerationOptions, 
  AIGenerationResult, 
  ValidationResult 
} from './IAIService';

interface CacheEntry {
  result: AIGenerationResult;
  timestamp: Date;
  accessCount: number;
  lastAccessed: Date;
  contextHash: string;
  similarityScore?: number;
}

interface CacheConfig {
  maxMemoryEntries: number;
  maxStorageEntries: number;
  defaultTTL: number; // миллисекунды
  similarityThreshold: number; // 0-1, порог семантического сходства
  enableSemanticSearch: boolean;
}

interface CacheKey {
  postType: string;
  targetAudience: string;
  contentLength: string;
  contextHash: string;
  promptHash: string;
}

interface CacheStats {
  hitRate: number;
  totalRequests: number;
  totalHits: number;
  totalMisses: number;
  cacheSize: number;
  averageGenerationTime: number;
  tokensUsed: number;
  tokensSaved: number;
}

export class CachedAIService implements IAIService {
  private readonly wrappedService: IAIService;
  private readonly config: CacheConfig;
  private readonly memoryCache = new Map<string, CacheEntry>();
  private readonly stats: CacheStats;

  constructor(
    wrappedService: IAIService,
    config?: Partial<CacheConfig>
  ) {
    this.wrappedService = wrappedService;
    this.config = {
      maxMemoryEntries: config?.maxMemoryEntries || 100,
      maxStorageEntries: config?.maxStorageEntries || 500,
      defaultTTL: config?.defaultTTL || 24 * 60 * 60 * 1000, // 24 часа
      similarityThreshold: config?.similarityThreshold || 0.8,
      enableSemanticSearch: config?.enableSemanticSearch || true,
      ...config
    };

    this.stats = {
      hitRate: 0,
      totalRequests: 0,
      totalHits: 0,
      totalMisses: 0,
      cacheSize: 0,
      averageGenerationTime: 0,
      tokensUsed: 0,
      tokensSaved: 0
    };

    console.info('[CachedAIService] Инициализирован с конфигурацией:', this.config);
  }

  async generate(prompt: string, options?: GenerationOptions): Promise<AIGenerationResult> {
    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      // Создаем ключ кэша
      const cacheKey = this.createCacheKey(prompt, options);
      const cacheKeyString = this.serializeCacheKey(cacheKey);

      // Проверяем кэш
      const cachedResult = await this.getCachedResult(cacheKeyString, cacheKey);
      
      if (cachedResult) {
        this.stats.totalHits++;
        this.stats.tokensSaved += cachedResult.metadata.tokens;
        this.updateHitRate();
        
        console.info('[CachedAIService] Cache HIT:', {
          key: cacheKeyString.substring(0, 32) + '...',
          tokensUsed: cachedResult.metadata.tokens,
          confidence: cachedResult.metadata.confidence
        });

        return cachedResult;
      }

      // Cache miss - генерируем новый контент
      console.info('[CachedAIService] Cache MISS, генерируем новый контент');
      this.stats.totalMisses++;
      
      const result = await this.wrappedService.generate(prompt, options);
      const generationTime = Date.now() - startTime;
      
      this.stats.tokensUsed += result.metadata.tokens;
      this.updateAverageGenerationTime(generationTime);
      this.updateHitRate();

      // Сохраняем в кэш
      await this.cacheResult(cacheKeyString, cacheKey, result);

      console.info('[CachedAIService] Результат сохранен в кэш:', {
        key: cacheKeyString.substring(0, 32) + '...',
        tokens: result.metadata.tokens,
        generationTime: generationTime + 'ms'
      });

      return result;

    } catch (error) {
      console.error('[CachedAIService] Ошибка генерации:', error);
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    return await this.wrappedService.isAvailable();
  }

  async getUsageStats() {
    const wrappedStats = await this.wrappedService.getUsageStats();
    return {
      ...wrappedStats,
      cache: {
        ...this.stats,
        cacheSize: this.memoryCache.size,
        hitRate: Math.round(this.stats.hitRate * 100) / 100
      }
    };
  }

  validateContent(content: string): ValidationResult {
    return this.wrappedService.validateContent(content);
  }

  // Получение статистики кэша
  getCacheStats(): CacheStats {
    return {
      ...this.stats,
      cacheSize: this.memoryCache.size,
      hitRate: Math.round(this.stats.hitRate * 100) / 100
    };
  }

  // Очистка кэша
  clearCache(): void {
    this.memoryCache.clear();
    this.clearStorageCache();
    console.info('[CachedAIService] Кэш очищен');
  }

  // Принудительное обновление кэша
  async refreshCache(): Promise<void> {
    // Удаляем устаревшие записи
    await this.cleanupExpiredEntries();
    // Применяем LRU политику
    this.applyLRUPolicy();
    console.info('[CachedAIService] Кэш обновлен');
  }

  // Приватные методы
  private createCacheKey(prompt: string, options?: GenerationOptions): CacheKey {
    const contextHash = this.hashContext(options);
    const promptHash = this.hashString(prompt);

    return {
      postType: this.extractPostType(options) || 'general',
      targetAudience: this.extractTargetAudience(options) || 'intermediate',
      contentLength: this.extractContentLength(options) || 'medium',
      contextHash,
      promptHash
    };
  }

  private serializeCacheKey(key: CacheKey): string {
    return `ai_cache_${key.postType}_${key.targetAudience}_${key.contentLength}_${key.contextHash}_${key.promptHash}`;
  }

  private async getCachedResult(keyString: string, key: CacheKey): Promise<AIGenerationResult | null> {
    // Проверяем memory cache
    const memoryEntry = this.memoryCache.get(keyString);
    if (memoryEntry && this.isEntryValid(memoryEntry)) {
      this.updateAccessInfo(memoryEntry);
      return memoryEntry.result;
    }

    // Проверяем localStorage cache
    const storageEntry = this.getFromStorage(keyString);
    if (storageEntry && this.isEntryValid(storageEntry)) {
      // Перемещаем в memory cache для быстрого доступа
      this.memoryCache.set(keyString, storageEntry);
      this.updateAccessInfo(storageEntry);
      return storageEntry.result;
    }

    // Семантический поиск похожих запросов
    if (this.config.enableSemanticSearch) {
      const similarEntry = this.findSimilarEntry(key);
      if (similarEntry) {
        console.info('[CachedAIService] Найден семантически похожий запрос');
        return similarEntry.result;
      }
    }

    return null;
  }

  private async cacheResult(keyString: string, key: CacheKey, result: AIGenerationResult): Promise<void> {
    const entry: CacheEntry = {
      result,
      timestamp: new Date(),
      accessCount: 1,
      lastAccessed: new Date(),
      contextHash: key.contextHash
    };

    // Сохраняем в memory cache
    this.memoryCache.set(keyString, entry);

    // Сохраняем в storage cache
    this.saveToStorage(keyString, entry);

    // Применяем политики очистки
    this.applyLRUPolicy();
    await this.cleanupExpiredEntries();
  }

  private isEntryValid(entry: CacheEntry): boolean {
    const age = Date.now() - entry.timestamp.getTime();
    return age < this.config.defaultTTL;
  }

  private updateAccessInfo(entry: CacheEntry): void {
    entry.accessCount++;
    entry.lastAccessed = new Date();
  }

  private findSimilarEntry(targetKey: CacheKey): CacheEntry | null {
    let bestMatch: CacheEntry | null = null;
    let bestScore = 0;

    for (const entry of this.memoryCache.values()) {
      if (!this.isEntryValid(entry)) continue;

      const score = this.calculateSimilarity(targetKey, entry);
      if (score > this.config.similarityThreshold && score > bestScore) {
        bestMatch = entry;
        bestScore = score;
      }
    }

    return bestMatch;
  }

  private calculateSimilarity(key1: CacheKey, entry: CacheEntry): number {
    let score = 0;
    let factors = 0;

    // Точное соответствие типа поста (высокий вес)
    if (key1.postType === this.extractPostTypeFromEntry()) {
      score += 0.4;
    }
    factors++;

    // Соответствие аудитории (средний вес)
    if (key1.targetAudience === 'intermediate') { // Заглушка
      score += 0.2;
    }
    factors++;

    // Соответствие длины контента (низкий вес)
    if (key1.contentLength === this.extractLengthFromEntry(entry)) {
      score += 0.1;
    }
    factors++;

    // Похожесть контекста (высокий вес)
    const contextSimilarity = this.compareContextHashes(key1.contextHash, entry.contextHash);
    score += contextSimilarity * 0.3;
    factors++;

    return factors > 0 ? score / factors : 0;
  }

  private applyLRUPolicy(): void {
    if (this.memoryCache.size <= this.config.maxMemoryEntries) return;

    // Сортируем по последнему доступу
    const entries = Array.from(this.memoryCache.entries())
      .sort(([, a], [, b]) => a.lastAccessed.getTime() - b.lastAccessed.getTime());

    // Удаляем самые старые записи
    const toRemove = entries.slice(0, entries.length - this.config.maxMemoryEntries);
    for (const [key] of toRemove) {
      this.memoryCache.delete(key);
    }

    console.info(`[CachedAIService] LRU cleanup: удалено ${toRemove.length} записей`);
  }

  private async cleanupExpiredEntries(): Promise<void> {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp.getTime() > this.config.defaultTTL) {
        this.memoryCache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.info(`[CachedAIService] Cleanup: удалено ${removed} устаревших записей`);
    }
  }

  private getFromStorage(key: string): CacheEntry | null {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const entry = JSON.parse(stored) as CacheEntry;
      // Восстанавливаем Date объекты
      entry.timestamp = new Date(entry.timestamp);
      entry.lastAccessed = new Date(entry.lastAccessed);
      
      return entry;
    } catch (error) {
      console.warn('[CachedAIService] Ошибка чтения из localStorage:', error);
      return null;
    }
  }

  private saveToStorage(key: string, entry: CacheEntry): void {
    try {
      localStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      console.warn('[CachedAIService] Ошибка сохранения в localStorage:', error);
    }
  }

  private clearStorageCache(): void {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('ai_cache_')) {
          keys.push(key);
        }
      }
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('[CachedAIService] Ошибка очистки localStorage cache:', error);
    }
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Конвертируем в 32-битное число
    }
    return hash.toString(36);
  }

  private hashContext(options?: GenerationOptions): string {
    const contextString = JSON.stringify({
      model: options?.model,
      maxTokens: options?.maxTokens,
      temperature: options?.temperature,
      systemPrompt: options?.systemPrompt
    });
    return this.hashString(contextString);
  }

  private extractPostType(options?: GenerationOptions): string | null {
    // Пытаемся извлечь тип поста из system prompt или других параметров
    if (options?.systemPrompt) {
      if (options.systemPrompt.includes('астрономического события')) return 'astronomical_announcement';
      if (options.systemPrompt.includes('ретроспективный анализ')) return 'market_retrospective';
      if (options.systemPrompt.includes('аналитический пост')) return 'analytical_post';
    }
    return null;
  }

  private extractTargetAudience(options?: GenerationOptions): string | null {
    if (options?.systemPrompt) {
      if (options.systemPrompt.includes('Аудитория: beginner')) return 'beginner';
      if (options.systemPrompt.includes('Аудитория: advanced')) return 'advanced';
      if (options.systemPrompt.includes('Аудитория: intermediate')) return 'intermediate';
    }
    return null;
  }

  private extractContentLength(options?: GenerationOptions): string | null {
    if (options?.maxTokens) {
      if (options.maxTokens <= 300) return 'short';
      if (options.maxTokens >= 1000) return 'long';
      return 'medium';
    }
    return null;
  }

  private extractPostTypeFromEntry(): string {
    return 'general'; // Заглушка, так как generationType не существует
  }



  private extractLengthFromEntry(entry: CacheEntry): string {
    const contentLength = entry.result.content.length;
    if (contentLength < 400) return 'short';
    if (contentLength > 800) return 'long';
    return 'medium';
  }

  private compareContextHashes(hash1: string, hash2: string): number {
    return hash1 === hash2 ? 1.0 : 0.0;
  }

  private updateHitRate(): void {
    this.stats.hitRate = this.stats.totalRequests > 0 
      ? this.stats.totalHits / this.stats.totalRequests 
      : 0;
  }

  private updateAverageGenerationTime(newTime: number): void {
    const totalTime = this.stats.averageGenerationTime * this.stats.totalMisses;
    this.stats.averageGenerationTime = (totalTime + newTime) / this.stats.totalMisses;
  }
}
