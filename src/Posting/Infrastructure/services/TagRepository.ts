import { Result } from '../../../Shared/domain/Result';
import { Tag, TagCategory } from '../../Domain/value-objects/Tag';
import { JsonDataManager } from './JsonDataManager';

interface TagUsageStats {
  tagName: string;
  category: TagCategory;
  usageCount: number;
  lastUsed: Date;
  relatedTags: string[];
  cooccurrenceCount: Record<string, number>;
}

interface TagSuggestion {
  tag: Tag;
  confidence: number;
  reason: 'content_match' | 'history_based' | 'semantic_similarity' | 'category_match';
  relatedTags?: string[];
}

interface TagAnalytics {
  totalTags: number;
  totalUsage: number;
  topTags: TagUsageStats[];
  categoryDistribution: Record<TagCategory, number>;
  trendingTags: TagUsageStats[];
  unusedTags: string[];
}

export interface ITagRepository {
  // Основные операции с тегами
  getAllTags(): Promise<Result<Tag[]>>;
  getTagsByCategory(category: TagCategory): Promise<Result<Tag[]>>;
  searchTags(query: string): Promise<Result<Tag[]>>;
  createTag(tag: Tag): Promise<Result<Tag>>;
  updateTag(tagName: string, updates: Partial<Tag>): Promise<Result<Tag>>;
  deleteTag(tagName: string): Promise<Result<boolean>>;

  // Умные предложения тегов
  suggestTags(content: string, maxSuggestions?: number): Promise<Result<TagSuggestion[]>>;
  suggestTagsBasedOnHistory(historicalTags: string[]): Promise<Result<TagSuggestion[]>>;
  findSimilarTags(tagName: string): Promise<Result<Tag[]>>;

  // Статистика и аналитика
  recordTagUsage(tags: string[], postContent?: string): Promise<Result<void>>;
  getTagAnalytics(): Promise<Result<TagAnalytics>>;
  getTagUsageStats(tagName: string): Promise<Result<TagUsageStats | null>>;
}

export class TagRepository implements ITagRepository {
  private readonly dataManager: JsonDataManager<Tag>;
  private readonly statsManager: JsonDataManager<TagUsageStats>;
  private readonly tagsCache = new Map<string, Tag>();
  private readonly statsCache = new Map<string, TagUsageStats>();

  // Предопределенные теги по категориям
  private readonly predefinedTags: Record<TagCategory, string[]> = {
    astronomical: [
      'астрономия', 'луна', 'солнце', 'планеты', 'звезды', 'затмение', 
      'лунное_затмение', 'солнечное_затмение', 'комета', 'метеорный_поток',
      'созвездие', 'галактика', 'наблюдение', 'телескоп', 'космос'
    ],
    market: [
      'криптовалюты', 'биткоин', 'эфириум', 'анализ', 'рынок', 'трейдинг',
      'ретроспектива', 'волатильность', 'тренд', 'корреляция', 'цена',
      'капитализация', 'объем', 'ликвидность', 'альткоины'
    ],
    technical: [
      'аналитика', 'данные', 'графики', 'индикаторы', 'паттерны',
      'статистика', 'прогноз', 'моделирование', 'алгоритм', 'метрики',
      'бэктест', 'сигналы', 'стратегия', 'риск_менеджмент'
    ],
    general: [
      'образование', 'новости', 'события', 'исследование', 'наука',
      'технологии', 'инновации', 'будущее', 'тренды', 'культура',
      'история', 'философия', 'психология', 'социология'
    ]
  };

  constructor() {
    this.dataManager = new JsonDataManager<Tag>();
    this.statsManager = new JsonDataManager<TagUsageStats>();
    
    console.info('[TagRepository] Инициализирован');
    this.initializePredefinedTags();
  }

  async getAllTags(): Promise<Result<Tag[]>> {
    try {
      const result = await this.dataManager.load('src/Posting/Infrastructure/data/tags.json');
      if (result.isSuccess) {
        // Обновляем кэш
        result.value.forEach(tag => {
          this.tagsCache.set(tag.name, tag);
        });
      }
      return result;
    } catch (error) {
      return Result.fail(`Ошибка загрузки тегов: ${error}`);
    }
  }

  async getTagsByCategory(category: TagCategory): Promise<Result<Tag[]>> {
    try {
      const allTagsResult = await this.getAllTags();
      if (!allTagsResult.isSuccess) {
        return allTagsResult;
      }

      const categoryTags = allTagsResult.value.filter(tag => tag.category === category);
      return Result.ok(categoryTags);
    } catch (error) {
      return Result.fail(new Error(`Ошибка получения тегов категории ${category}: ${error}`));
    }
  }

  async searchTags(query: string): Promise<Result<Tag[]>> {
    try {
      const allTagsResult = await this.getAllTags();
      if (!allTagsResult.isSuccess) {
        return allTagsResult;
      }

      const normalizedQuery = query.toLowerCase().trim();
      const matchingTags = allTagsResult.value.filter(tag => 
        tag.name.toLowerCase().includes(normalizedQuery) ||
        this.calculateTextSimilarity(tag.name, normalizedQuery) > 0.6
      );

      // Сортируем по релевантности
      matchingTags.sort((a, b) => {
        const scoreA = this.calculateSearchScore(a.name, normalizedQuery);
        const scoreB = this.calculateSearchScore(b.name, normalizedQuery);
        return scoreB - scoreA;
      });

      return Result.ok(matchingTags);
    } catch (error) {
      return Result.fail(new Error(`Ошибка поиска тегов: ${error}`));
    }
  }

  async createTag(tag: Tag): Promise<Result<Tag>> {
    try {
      const allTagsResult = await this.getAllTags();
      if (!allTagsResult.isSuccess) {
        return Result.fail(allTagsResult.error!);
      }

      // Проверяем, не существует ли уже такой тег
      const existingTag = allTagsResult.value.find(t => t.name === tag.name);
      if (existingTag) {
        return Result.fail(new Error(`Тег "${tag.name}" уже существует`));
      }

      const updatedTags = [...allTagsResult.value, tag];
      const saveResult = await this.dataManager.save('src/Posting/Infrastructure/data/tags.json', updatedTags);

      if (saveResult.ok) {
        this.tagsCache.set(tag.name, tag);
        console.info(`[TagRepository] Создан новый тег: ${tag.name} (${tag.category})`);
        return Result.ok(tag);
      } else {
        return Result.fail(new Error(saveResult.error || 'Ошибка сохранения тега'));
      }
    } catch (error) {
      return Result.fail(new Error(`Ошибка создания тега: ${error}`));
    }
  }

  async updateTag(tagName: string, updates: Partial<Tag>): Promise<Result<Tag>> {
    try {
      const allTagsResult = await this.getAllTags();
      if (!allTagsResult.isSuccess) {
        return Result.fail(allTagsResult.error!);
      }

      const tagIndex = allTagsResult.value.findIndex(t => t.name === tagName);
      if (tagIndex === -1) {
        return Result.fail(new Error(`Тег "${tagName}" не найден`));
      }

      const existingTag = allTagsResult.value[tagIndex];
      const updatedTag = Tag.create(
        updates.name || existingTag.name,
        updates.category || existingTag.category,
        updates.weight !== undefined ? updates.weight : existingTag.weight
      );

      allTagsResult.value[tagIndex] = updatedTag;
      const saveResult = await this.dataManager.save('src/Posting/Infrastructure/data/tags.json', allTagsResult.value);

      if (saveResult.ok) {
        this.tagsCache.set(updatedTag.name, updatedTag);
        return Result.ok(updatedTag);
      } else {
        return Result.fail(new Error(saveResult.error || 'Ошибка обновления тега'));
      }
    } catch (error) {
      return Result.fail(new Error(`Ошибка обновления тега: ${error}`));
    }
  }

  async deleteTag(tagName: string): Promise<Result<boolean>> {
    try {
      const allTagsResult = await this.getAllTags();
      if (!allTagsResult.isSuccess) {
        return Result.fail(allTagsResult.error!);
      }

      const filteredTags = allTagsResult.value.filter(t => t.name !== tagName);
      if (filteredTags.length === allTagsResult.value.length) {
        return Result.fail(new Error(`Тег "${tagName}" не найден`));
      }

      const saveResult = await this.dataManager.save('src/Posting/Infrastructure/data/tags.json', filteredTags);

      if (saveResult.ok) {
        this.tagsCache.delete(tagName);
        return Result.ok(true);
      } else {
        return Result.fail(new Error(saveResult.error || 'Ошибка удаления тега'));
      }
    } catch (error) {
      return Result.fail(new Error(`Ошибка удаления тега: ${error}`));
    }
  }

  async suggestTags(content: string, maxSuggestions: number = 8): Promise<Result<TagSuggestion[]>> {
    try {
      const suggestions: TagSuggestion[] = [];
      const allTagsResult = await this.getAllTags();
      
      if (!allTagsResult.isSuccess) {
        return Result.fail(allTagsResult.error!);
      }

      const normalizedContent = content.toLowerCase();

      // 1. Поиск по содержанию контента
      for (const tag of allTagsResult.value) {
        const contentScore = this.calculateContentMatchScore(tag.name, normalizedContent);
        if (contentScore > 0.3) {
          suggestions.push({
            tag,
            confidence: contentScore,
            reason: 'content_match'
          });
        }
      }

      // 2. Предложения на основе категорий
      const categoryScores = this.analyzeContentCategories(normalizedContent);
      for (const [category, score] of Object.entries(categoryScores)) {
        if (score > 0.4) {
          const categoryTagsResult = await this.getTagsByCategory(category as TagCategory);
          if (categoryTagsResult.isSuccess) {
            const topCategoryTags = categoryTagsResult.value
              .slice(0, 3)
              .filter(tag => !suggestions.find(s => s.tag.name === tag.name));
            
            for (const tag of topCategoryTags) {
              suggestions.push({
                tag,
                confidence: score * 0.8,
                reason: 'category_match'
              });
            }
          }
        }
      }

      // 3. Семантические предложения
      const semanticSuggestions = await this.getSemanticSuggestions(normalizedContent);
      suggestions.push(...semanticSuggestions);

      // Сортируем по уверенности и возвращаем топ
      suggestions.sort((a, b) => b.confidence - a.confidence);
      const uniqueSuggestions = this.removeDuplicateSuggestions(suggestions);

      return Result.ok(uniqueSuggestions.slice(0, maxSuggestions));
    } catch (error) {
      return Result.fail(new Error(`Ошибка предложения тегов: ${error}`));
    }
  }

  async suggestTagsBasedOnHistory(historicalTags: string[]): Promise<Result<TagSuggestion[]>> {
    try {
      const suggestions: TagSuggestion[] = [];
      const statsResult = await this.loadTagStats();
      
      if (!statsResult.isSuccess) {
        return Result.ok([]); // Возвращаем пустой массив, если статистики нет
      }

      // Анализируем совместную встречаемость тегов
      for (const stats of statsResult.value) {
        if (historicalTags.includes(stats.tagName)) continue;

        let cooccurrenceScore = 0;
        let matchCount = 0;

        for (const histTag of historicalTags) {
          const cooccurrence = stats.cooccurrenceCount[histTag] || 0;
          if (cooccurrence > 0) {
            cooccurrenceScore += cooccurrence;
            matchCount++;
          }
        }

        if (matchCount > 0) {
          const confidence = Math.min(cooccurrenceScore / (stats.usageCount * historicalTags.length), 1.0);
          if (confidence > 0.1) {
            const tagResult = await this.getTagByName(stats.tagName);
            if (tagResult.isSuccess) {
              suggestions.push({
                tag: tagResult.value,
                confidence,
                reason: 'history_based',
                relatedTags: historicalTags.filter(ht => (stats.cooccurrenceCount[ht] || 0) > 0)
              });
            }
          }
        }
      }

      suggestions.sort((a, b) => b.confidence - a.confidence);
      return Result.ok(suggestions.slice(0, 5));
    } catch (error) {
      return Result.fail(new Error(`Ошибка предложений на основе истории: ${error}`));
    }
  }

  async findSimilarTags(tagName: string): Promise<Result<Tag[]>> {
    try {
      const allTagsResult = await this.getAllTags();
      if (!allTagsResult.isSuccess) {
        return allTagsResult;
      }

      const targetTag = allTagsResult.value.find(t => t.name === tagName);
      if (!targetTag) {
        return Result.fail(new Error(`Тег "${tagName}" не найден`));
      }

      const similarTags = allTagsResult.value
        .filter(tag => tag.name !== tagName)
        .map(tag => ({
          tag,
          similarity: this.calculateTagSimilarity(targetTag, tag)
        }))
        .filter(item => item.similarity > 0.5)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 8)
        .map(item => item.tag);

      return Result.ok(similarTags);
    } catch (error) {
      return Result.fail(new Error(`Ошибка поиска похожих тегов: ${error}`));
    }
  }

  async recordTagUsage(tags: string[], postContent?: string): Promise<Result<void>> {
    try {
      const statsResult = await this.loadTagStats();
      const currentStats = statsResult.isSuccess ? statsResult.value : [];
      const statsMap = new Map(currentStats.map(s => [s.tagName, s]));

      // Обновляем статистику для каждого тега
      for (const tagName of tags) {
        let stats = statsMap.get(tagName);
        
        if (!stats) {
          const tag = this.tagsCache.get(tagName);
          stats = {
            tagName,
            category: tag?.category || 'general',
            usageCount: 0,
            lastUsed: new Date(),
            relatedTags: [],
            cooccurrenceCount: {}
          };
        }

        stats.usageCount++;
        stats.lastUsed = new Date();

        // Обновляем совместную встречаемость
        for (const otherTag of tags) {
          if (otherTag !== tagName) {
            stats.cooccurrenceCount[otherTag] = (stats.cooccurrenceCount[otherTag] || 0) + 1;
          }
        }

        statsMap.set(tagName, stats);
      }

      // Сохраняем обновленную статистику
      const updatedStats = Array.from(statsMap.values());
      const saveResult = await this.statsManager.save('src/Posting/Infrastructure/data/tag-stats.json', updatedStats);

      if (saveResult.ok) {
        console.info(`[TagRepository] Записана статистика использования для ${tags.length} тегов`);
        return Result.ok();
      } else {
        return Result.fail(new Error(saveResult.error || 'Ошибка сохранения статистики'));
      }
    } catch (error) {
      return Result.fail(new Error(`Ошибка записи статистики тегов: ${error}`));
    }
  }

  async getTagAnalytics(): Promise<Result<TagAnalytics>> {
    try {
      const [tagsResult, statsResult] = await Promise.all([
        this.getAllTags(),
        this.loadTagStats()
      ]);

      if (!tagsResult.isSuccess) {
        return Result.fail(tagsResult.error!);
      }

      const allTags = tagsResult.value;
      const allStats = statsResult.isSuccess ? statsResult.value : [];
      
      const totalUsage = allStats.reduce((sum, stats) => sum + stats.usageCount, 0);
      const categoryDistribution = this.calculateCategoryDistribution(allStats);
      const topTags = allStats
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 10);
      
      const recentThreshold = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 дней
      const trendingTags = allStats
        .filter(stats => stats.lastUsed.getTime() > recentThreshold)
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 5);

      const usedTagNames = new Set(allStats.map(s => s.tagName));
      const unusedTags = allTags
        .filter(tag => !usedTagNames.has(tag.name))
        .map(tag => tag.name);

      const analytics: TagAnalytics = {
        totalTags: allTags.length,
        totalUsage,
        topTags,
        categoryDistribution,
        trendingTags,
        unusedTags
      };

      return Result.ok(analytics);
    } catch (error) {
      return Result.fail(new Error(`Ошибка получения аналитики тегов: ${error}`));
    }
  }

  async getTagUsageStats(tagName: string): Promise<Result<TagUsageStats | null>> {
    try {
      const statsResult = await this.loadTagStats();
      if (!statsResult.isSuccess) {
        return Result.ok(null);
      }

      const stats = statsResult.value.find(s => s.tagName === tagName);
      return Result.ok(stats || null);
    } catch (error) {
      return Result.fail(new Error(`Ошибка получения статистики тега: ${error}`));
    }
  }

  // Приватные методы
  private async initializePredefinedTags(): Promise<void> {
    try {
      const allTagsResult = await this.getAllTags();
      const existingTags = allTagsResult.isSuccess ? allTagsResult.value : [];
      const existingTagNames = new Set(existingTags.map(t => t.name));

      let newTags: Tag[] = [];

      // Создаем предопределенные теги, которых еще нет
      for (const [category, tagNames] of Object.entries(this.predefinedTags)) {
        for (const tagName of tagNames) {
          if (!existingTagNames.has(tagName)) {
            newTags.push(Tag.create(tagName, category as TagCategory));
          }
        }
      }

      if (newTags.length > 0) {
        const allTags = [...existingTags, ...newTags];
        await this.dataManager.save('src/Posting/Infrastructure/data/tags.json', allTags);
        console.info(`[TagRepository] Инициализировано ${newTags.length} предопределенных тегов`);
      }
    } catch (error) {
      console.warn('[TagRepository] Ошибка инициализации предопределенных тегов:', error);
    }
  }

  private async loadTagStats(): Promise<Result<TagUsageStats[]>> {
    return await this.statsManager.load('src/Posting/Infrastructure/data/tag-stats.json');
  }

  private async getTagByName(name: string): Promise<Result<Tag>> {
    if (this.tagsCache.has(name)) {
      return Result.ok(this.tagsCache.get(name)!);
    }

    const allTagsResult = await this.getAllTags();
    if (!allTagsResult.isSuccess) {
      return Result.fail(allTagsResult.error!);
    }

    const tag = allTagsResult.value.find(t => t.name === name);
    if (!tag) {
      return Result.fail(new Error(`Тег "${name}" не найден`));
    }

    return Result.ok(tag);
  }

  private calculateContentMatchScore(tagName: string, content: string): number {
    const normalizedTag = tagName.toLowerCase();
    
    // Прямое вхождение
    if (content.includes(normalizedTag)) {
      return 0.9;
    }

    // Частичное совпадение
    const similarity = this.calculateTextSimilarity(normalizedTag, content);
    if (similarity > 0.7) {
      return similarity * 0.8;
    }

    // Поиск связанных слов
    const relatedScore = this.findRelatedWords(normalizedTag, content);
    return relatedScore;
  }

  private calculateTextSimilarity(str1: string, str2: string): number {
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);
    
    let matches = 0;
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1 === word2 || this.levenshteinDistance(word1, word2) <= 1) {
          matches++;
          break;
        }
      }
    }

    return matches / Math.max(words1.length, words2.length);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private findRelatedWords(tag: string, content: string): number {
    // Простая эвристика для поиска связанных слов
    const relatedWords: Record<string, string[]> = {
      'луна': ['лунный', 'месяц', 'спутник'],
      'солнце': ['солнечный', 'звезда', 'светило'],
      'биткоин': ['btc', 'криптовалюта', 'блокчейн'],
      'анализ': ['исследование', 'изучение', 'разбор']
    };

    const related = relatedWords[tag] || [];
    let score = 0;

    for (const word of related) {
      if (content.includes(word)) {
        score += 0.2;
      }
    }

    return Math.min(score, 0.6);
  }

  private analyzeContentCategories(content: string): Record<string, number> {
    const categoryKeywords: Record<TagCategory, string[]> = {
      astronomical: ['астрономия', 'космос', 'планета', 'звезда', 'луна', 'солнце', 'галактика'],
      market: ['рынок', 'торговля', 'цена', 'криптовалюта', 'биткоин', 'трейдинг'],
      technical: ['анализ', 'данные', 'график', 'статистика', 'метрика'],
      general: ['новости', 'событие', 'исследование', 'образование']
    };

    const scores: Record<string, number> = {};

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      let score = 0;
      for (const keyword of keywords) {
        if (content.includes(keyword)) {
          score += 0.1;
        }
      }
      scores[category] = Math.min(score, 1.0);
    }

    return scores;
  }

  private async getSemanticSuggestions(content: string): Promise<TagSuggestion[]> {
    // Простая семантическая логика (можно расширить с помощью ML)
    const suggestions: TagSuggestion[] = [];
    
    if (content.includes('затмение')) {
      const eclipseTags = ['астрономия', 'наблюдение', 'редкое_событие'];
      for (const tagName of eclipseTags) {
        const tagResult = await this.getTagByName(tagName);
        if (tagResult.isSuccess) {
          suggestions.push({
            tag: tagResult.value,
            confidence: 0.7,
            reason: 'semantic_similarity'
          });
        }
      }
    }

    return suggestions;
  }

  private removeDuplicateSuggestions(suggestions: TagSuggestion[]): TagSuggestion[] {
    const seen = new Set<string>();
    return suggestions.filter(suggestion => {
      if (seen.has(suggestion.tag.name)) {
        return false;
      }
      seen.add(suggestion.tag.name);
      return true;
    });
  }

  private calculateSearchScore(tagName: string, query: string): number {
    const lowerTag = tagName.toLowerCase();
    const lowerQuery = query.toLowerCase();

    // Точное совпадение
    if (lowerTag === lowerQuery) return 1.0;
    
    // Начинается с запроса
    if (lowerTag.startsWith(lowerQuery)) return 0.9;
    
    // Содержит запрос
    if (lowerTag.includes(lowerQuery)) return 0.7;
    
    // Похожесть по Левенштейну
    const distance = this.levenshteinDistance(lowerTag, lowerQuery);
    const maxLength = Math.max(lowerTag.length, lowerQuery.length);
    const similarity = 1 - (distance / maxLength);
    
    return similarity;
  }

  private calculateTagSimilarity(tag1: Tag, tag2: Tag): number {
    let score = 0;

    // Одинаковая категория
    if (tag1.category === tag2.category) {
      score += 0.3;
    }

    // Похожесть имен
    const nameSimilarity = this.calculateTextSimilarity(tag1.name, tag2.name);
    score += nameSimilarity * 0.7;

    return score;
  }

  private calculateCategoryDistribution(stats: TagUsageStats[]): Record<TagCategory, number> {
    const distribution: Record<TagCategory, number> = {
      astronomical: 0,
      market: 0,
      technical: 0,
      general: 0
    };

    for (const stat of stats) {
      distribution[stat.category] += stat.usageCount;
    }

    return distribution;
  }
}
