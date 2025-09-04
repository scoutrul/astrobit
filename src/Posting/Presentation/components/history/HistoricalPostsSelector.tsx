import React, { useState, useEffect, useCallback } from 'react';
import { JsonDataManager } from '../../../Infrastructure/services/JsonDataManager';
import { Post } from '../../../Domain/entities/Post';



interface HistoricalPost {
  id: string;
  title: string;
  type: string;
  createdAt: string;
  tags: string[];
  content: string;
  metadata: {
    wordCount: number;
    significance: number;
    popularity?: number;
  };
}

interface HistoricalPostsSelectorProps {
  onPostsSelected: (posts: HistoricalPost[]) => void;
  maxSelections?: number;
  autoSelectRelevant?: boolean;
  contentContext?: string; // Контекст для автоматического выбора релевантных постов
  postType?: string;
}

interface FilterState {
  dateRange: {
    start: string;
    end: string;
  };
  postTypes: string[];
  tags: string[];
  minSignificance: number;
  searchQuery: string;
  sortBy: 'date' | 'relevance' | 'popularity' | 'significance';
  sortOrder: 'asc' | 'desc';
}

interface HistoricalPostsSelectorState {
  allPosts: HistoricalPost[];
  filteredPosts: HistoricalPost[];
  selectedPosts: HistoricalPost[];
  availableTags: string[];
  isLoading: boolean;
  filters: FilterState;
  relevanceScores: Map<string, number>;
  isDataLoaded: boolean; // Флаг для предотвращения повторных загрузок
}

export const HistoricalPostsSelector: React.FC<HistoricalPostsSelectorProps> = ({
  onPostsSelected,
  maxSelections = 10,
  autoSelectRelevant = true,
  contentContext = '',
  postType = ''
}) => {
  const [state, setState] = useState<HistoricalPostsSelectorState>({
    allPosts: [],
    filteredPosts: [],
    selectedPosts: [],
    availableTags: [],
    isLoading: false,
    filters: {
      dateRange: { start: '', end: '' },
      postTypes: [],
      tags: [],
      minSignificance: 0,
      searchQuery: '',
      sortBy: 'date',
      sortOrder: 'desc'
    },
    relevanceScores: new Map(),
    isDataLoaded: false
  });

  // Создаем адаптер для HistoricalPost, чтобы соответствовать требованиям JsonDataManager
  const dataManager = new JsonDataManager<{ id: string; createdAt: Date; data: HistoricalPost }>();
  
  // Кэш для архивных данных
  const [archivedPostsCache, setArchivedPostsCache] = useState<HistoricalPost[] | null>(null);

  // Загрузка архивных постов с кэшированием
  const loadArchivedPosts = useCallback(async (): Promise<HistoricalPost[]> => {
    // Возвращаем кэшированные данные если они есть
    if (archivedPostsCache) {
      console.info('[HistoricalPostsSelector] Используем кэшированные архивные данные');
      return archivedPostsCache;
    }

    try {
      console.info('[HistoricalPostsSelector] Загружаем архивные данные...');
      const indexResult = await dataManager.load('src/Posting/Infrastructure/data/archives/archive-index.json');
      if (!indexResult.isSuccess) return [];

      const indexData = indexResult.value as any;
      const archivePromises = (indexData.archives || []).map(async (archive: any) => {
        try {
          const archiveResult = await dataManager.load(`src/Posting/Infrastructure/data/archives/${archive.filename}`);
          if (archiveResult.isSuccess) {
            return (archiveResult.value as any[]).map(convertPostToHistorical);
          }
          return [];
        } catch {
          return [];
        }
      });

      const archiveResults = await Promise.all(archivePromises);
      const allArchivedPosts = archiveResults.flat();
      
      // Кэшируем результат
      setArchivedPostsCache(allArchivedPosts);
      console.info('[HistoricalPostsSelector] Архивные данные закэшированы');
      
      return allArchivedPosts;
    } catch {
      return [];
    }
  }, [archivedPostsCache, dataManager]);

  // Загрузка исторических постов
  const loadHistoricalPosts = useCallback(async () => {
    // Предотвращаем повторную загрузку если данные уже загружены
    if (state.isDataLoaded) {
      console.info('[HistoricalPostsSelector] Данные уже загружены, пропускаем загрузку');
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Загружаем из активных и архивных данных
      const [publishedResult, archivedResult] = await Promise.all([
        dataManager.load('src/Posting/Infrastructure/data/active/published.json'),
        loadArchivedPosts()
      ]);

      let allPosts: HistoricalPost[] = [];

      // Добавляем опубликованные посты
      if (publishedResult.isSuccess) {
        const publishedPosts = (publishedResult.value as any[]).map(convertPostToHistorical);
        allPosts.push(...publishedPosts);
      }

      // Добавляем архивные посты
      if (archivedResult.length > 0) {
        allPosts.push(...archivedResult);
      }

      // Если нет реальных данных, используем mock данные
      if (allPosts.length === 0) {
        allPosts = generateMockHistoricalPosts();
      }

      // Вычисляем релевантность если есть контекст
      const relevanceScores = new Map<string, number>();
      if (contentContext) {
        for (const post of allPosts) {
          const score = calculateRelevanceScore(post, contentContext, postType);
          relevanceScores.set(post.id, score);
        }
      }

      // Извлекаем уникальные теги
      const allTags = [...new Set(allPosts.flatMap(post => post.tags))].sort();

      setState(prev => ({
        ...prev,
        allPosts,
        filteredPosts: allPosts,
        availableTags: allTags,
        relevanceScores,
        isLoading: false,
        isDataLoaded: true // Отмечаем что данные загружены
      }));

      // Автоматический выбор релевантных постов
      if (autoSelectRelevant && contentContext) {
        autoSelectRelevantPosts(allPosts, relevanceScores);
      }

      console.info('[HistoricalPostsSelector] Загружено', allPosts.length, 'исторических постов');
    } catch (error) {
      console.error('[HistoricalPostsSelector] Ошибка загрузки:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [contentContext, postType, autoSelectRelevant, dataManager, state.isDataLoaded, loadArchivedPosts]);


  // Конвертация Post в HistoricalPost
  const convertPostToHistorical = (post: Post): HistoricalPost => ({
    id: post.id,
    title: post.title,
    type: post.type,
    createdAt: post.createdAt.toISOString(),
    tags: post.metadata?.tags || [],
    content: post.content,
    metadata: {
      wordCount: post.content.split(/\s+/).length,
      significance: post.metadata?.priority === 'high' ? 100 : post.metadata?.priority === 'low' ? 25 : 50,
      popularity: Math.random() * 100 // Mock popularity - можно заменить реальными данными
    }
  });

  // Генерация mock данных для демонстрации
  const generateMockHistoricalPosts = (): HistoricalPost[] => {
    const mockPosts: HistoricalPost[] = [
      {
        id: 'hist-1',
        title: 'Лунное затмение 16 мая: полное руководство наблюдения',
        type: 'astronomical_announcement',
        createdAt: '2024-05-15T18:00:00Z',
        tags: ['астрономия', 'лунное_затмение', 'наблюдение'],
        content: 'Завтра состоится полное лунное затмение, видимое во всем восточном полушарии. Максимальная фаза в 21:15 по московскому времени...',
        metadata: { wordCount: 245, significance: 8, popularity: 92 }
      },
      {
        id: 'hist-2',
        title: 'Ретроспектива криптовалютного рынка за апрель 2024',
        type: 'market_retrospective',
        createdAt: '2024-05-01T12:00:00Z',
        tags: ['криптовалюты', 'ретроспектива', 'биткоин', 'анализ'],
        content: 'Апрель стал месяцем консолидации для криптовалютного рынка. Bitcoin торговался в диапазоне $60,000-$67,000...',
        metadata: { wordCount: 312, significance: 7, popularity: 78 }
      },
      {
        id: 'hist-3',
        title: 'Комета 12P/Pons-Brooks достигает максимальной яркости',
        type: 'astronomical_announcement',
        createdAt: '2024-04-28T20:00:00Z',
        tags: ['астрономия', 'комета', 'наблюдение', 'телескоп'],
        content: 'Комета 12P/Pons-Brooks, известная как "Комета дьявола", достигла своей максимальной яркости и видна невооруженным глазом...',
        metadata: { wordCount: 198, significance: 9, popularity: 85 }
      },
      {
        id: 'hist-4',
        title: 'Аналитический обзор: корреляция между астрономическими событиями и криптовалютами',
        type: 'analytical_post',
        createdAt: '2024-04-20T14:00:00Z',
        tags: ['анализ', 'корреляция', 'астрономия', 'криптовалюты', 'статистика'],
        content: 'Исследование показывает интересную корреляцию между значимыми астрономическими событиями и волатильностью криптовалютного рынка...',
        metadata: { wordCount: 567, significance: 8, popularity: 76 }
      },
      {
        id: 'hist-5',
        title: 'Метеорный поток Лириды: пик активности в ночь с 21 на 22 апреля',
        type: 'astronomical_announcement',
        createdAt: '2024-04-21T16:00:00Z',
        tags: ['астрономия', 'метеорный_поток', 'лириды', 'наблюдение'],
        content: 'Ежегодный метеорный поток Лириды достигнет пика активности в ночь с 21 на 22 апреля. Ожидается до 20 метеоров в час...',
        metadata: { wordCount: 203, significance: 6, popularity: 64 }
      }
    ];

    return mockPosts;
  };

  // Вычисление релевантности поста
  const calculateRelevanceScore = (post: HistoricalPost, context: string, targetPostType: string): number => {
    let score = 0;

    // Соответствие типа поста (высокий вес)
    if (post.type === targetPostType) {
      score += 40;
    } else if (getPostTypeCategory(post.type) === getPostTypeCategory(targetPostType)) {
      score += 20;
    }

    // Семантическое сходство контента (средний вес)
    const contentSimilarity = calculateTextSimilarity(post.content.toLowerCase(), context.toLowerCase());
    score += contentSimilarity * 30;

    // Пересечение тегов (средний вес)
    const contextWords = context.toLowerCase().split(/\s+/);
    const tagMatches = post.tags.filter(tag => 
      contextWords.some(word => tag.toLowerCase().includes(word) || word.includes(tag.toLowerCase()))
    );
    score += (tagMatches.length / Math.max(post.tags.length, 1)) * 20;

    // Историческая значимость (низкий вес)
    score += (post.metadata.significance / 10) * 10;

    return Math.min(score, 100);
  };

  // Простое вычисление сходства текста
  const calculateTextSimilarity = (text1: string, text2: string): number => {
    const words1 = new Set(text1.split(/\s+/).filter(w => w.length > 3));
    const words2 = new Set(text2.split(/\s+/).filter(w => w.length > 3));
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  };

  // Получение категории типа поста
  const getPostTypeCategory = (postType: string): string => {
    if (['astronomical_announcement', 'comet_event', 'eclipse_announcement'].includes(postType)) {
      return 'astronomical';
    }
    if (['market_retrospective', 'price_analysis', 'trading_update'].includes(postType)) {
      return 'market';
    }
    if (['analytical_post', 'research_summary', 'data_analysis'].includes(postType)) {
      return 'analytical';
    }
    return 'general';
  };

  // Автоматический выбор релевантных постов
  const autoSelectRelevantPosts = (posts: HistoricalPost[], relevanceScores: Map<string, number>) => {
    const sortedPosts = posts
      .map(post => ({ post, score: relevanceScores.get(post.id) || 0 }))
      .filter(item => item.score > 30) // Минимальный порог релевантности
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.min(maxSelections, 5)) // Автоматически выбираем до 5 самых релевантных
      .map(item => item.post);

    setState(prev => ({ ...prev, selectedPosts: sortedPosts }));
    onPostsSelected(sortedPosts);

    if (sortedPosts.length > 0) {
      console.info('[HistoricalPostsSelector] Автоматически выбрано', sortedPosts.length, 'релевантных постов');
    }
  };

  // Применение фильтров
  const applyFilters = useCallback(() => {
    let filtered = [...state.allPosts];

    // Фильтр по дате
    if (state.filters.dateRange.start) {
      filtered = filtered.filter(post => post.createdAt >= state.filters.dateRange.start);
    }
    if (state.filters.dateRange.end) {
      filtered = filtered.filter(post => post.createdAt <= state.filters.dateRange.end);
    }

    // Фильтр по типам постов
    if (state.filters.postTypes.length > 0) {
      filtered = filtered.filter(post => state.filters.postTypes.includes(post.type));
    }

    // Фильтр по тегам
    if (state.filters.tags.length > 0) {
      filtered = filtered.filter(post => 
        state.filters.tags.some(tag => post.tags.includes(tag))
      );
    }

    // Фильтр по значимости
    if (state.filters.minSignificance > 0) {
      filtered = filtered.filter(post => post.metadata.significance >= state.filters.minSignificance);
    }

    // Поиск по тексту
    if (state.filters.searchQuery) {
      const query = state.filters.searchQuery.toLowerCase();
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Сортировка
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (state.filters.sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'relevance':
          const scoreA = state.relevanceScores.get(a.id) || 0;
          const scoreB = state.relevanceScores.get(b.id) || 0;
          comparison = scoreA - scoreB;
          break;
        case 'popularity':
          comparison = (a.metadata.popularity || 0) - (b.metadata.popularity || 0);
          break;
        case 'significance':
          comparison = a.metadata.significance - b.metadata.significance;
          break;
      }
      
      return state.filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    setState(prev => ({ ...prev, filteredPosts: filtered }));
  }, [state.allPosts, state.filters, state.relevanceScores]);

  // Обработчики событий
  const handlePostToggle = (post: HistoricalPost) => {
    setState(prev => {
      const isSelected = prev.selectedPosts.some(p => p.id === post.id);
      let newSelected: HistoricalPost[];

      if (isSelected) {
        newSelected = prev.selectedPosts.filter(p => p.id !== post.id);
      } else if (prev.selectedPosts.length < maxSelections) {
        newSelected = [...prev.selectedPosts, post];
      } else {
        // Заменяем самый старый выбранный пост
        newSelected = [...prev.selectedPosts.slice(1), post];
      }

      onPostsSelected(newSelected);
      return { ...prev, selectedPosts: newSelected };
    });
  };

  const updateFilter = (key: keyof FilterState, value: any) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, [key]: value }
    }));
  };

  const clearSelection = () => {
    setState(prev => ({ ...prev, selectedPosts: [] }));
    onPostsSelected([]);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPostTypeDisplayName = (type: string): string => {
    const names: Record<string, string> = {
      'astronomical_announcement': '🌌 Астрономическое событие',
      'market_retrospective': '📈 Ретроспектива рынка',
      'analytical_post': '📊 Аналитический пост',
      'general_post': '📝 Обычный пост'
    };
    return names[type] || type;
  };

  // Получение уникальных типов постов
  const availablePostTypes = [...new Set(state.allPosts.map(post => post.type))];

  useEffect(() => {
    loadHistoricalPosts();
  }, [loadHistoricalPosts]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  return (
    <div className="historical-posts-selector bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Заголовок */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            📚 Исторические посты ({state.selectedPosts.length}/{maxSelections})
          </h3>
          <div className="flex items-center space-x-2">
            {state.selectedPosts.length > 0 && (
              <button
                onClick={clearSelection}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
              >
                🗑️ Очистить
              </button>
            )}
            <button
              onClick={loadHistoricalPosts}
              disabled={state.isLoading}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded hover:bg-blue-200 disabled:opacity-50 transition-colors"
            >
              {state.isLoading ? '🔄' : '🔄'} Обновить
            </button>
          </div>
        </div>

        {/* Индикатор релевантности */}
        {contentContext && (
          <div className="mt-2 text-sm text-gray-600">
            🎯 Автоматический подбор на основе контекста: "{contentContext.substring(0, 50)}..."
          </div>
        )}
      </div>

      {/* Фильтры */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">🔍 Поиск</label>
            <input
              type="text"
              value={state.filters.searchQuery}
              onChange={(e) => updateFilter('searchQuery', e.target.value)}
              placeholder="Заголовок, содержимое..."
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">📋 Тип</label>
            <select
              value={state.filters.postTypes[0] || ''}
              onChange={(e) => updateFilter('postTypes', e.target.value ? [e.target.value] : [])}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Все типы</option>
              {availablePostTypes.map(type => (
                <option key={type} value={type}>{getPostTypeDisplayName(type)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">⭐ Мин. значимость</label>
            <input
              type="range"
              min="0"
              max="10"
              value={state.filters.minSignificance}
              onChange={(e) => updateFilter('minSignificance', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-500 text-center">{state.filters.minSignificance}/10</div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">📊 Сортировка</label>
            <select
              value={state.filters.sortBy}
              onChange={(e) => updateFilter('sortBy', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="date">📅 По дате</option>
              <option value="relevance">🎯 По релевантности</option>
              <option value="significance">⭐ По значимости</option>
              <option value="popularity">📈 По популярности</option>
            </select>
          </div>
        </div>
      </div>

      {/* Список постов */}
      <div className="max-h-64 overflow-y-auto">
        {state.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : state.filteredPosts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            📭 Посты не найдены
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {state.filteredPosts.map(post => {
              const isSelected = state.selectedPosts.some(p => p.id === post.id);
              const relevanceScore = state.relevanceScores.get(post.id) || 0;

              return (
                <div
                  key={post.id}
                  onClick={() => handlePostToggle(post)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm leading-tight flex-1">
                      {post.title}
                    </h4>
                    <div className="flex items-center space-x-2 ml-2">
                      {relevanceScore > 0 && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          🎯 {Math.round(relevanceScore)}%
                        </span>
                      )}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-600 mb-2">
                    <span>📅 {formatDate(post.createdAt)}</span>
                    <span>{getPostTypeDisplayName(post.type)}</span>
                    <span>⭐ {post.metadata.significance}/10</span>
                    {post.metadata.popularity && (
                      <span>📈 {Math.round(post.metadata.popularity)}</span>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-700 line-clamp-2 mb-2">
                    {post.content.substring(0, 120)}...
                  </div>
                  
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.tags.slice(0, 4).map(tag => (
                        <span
                          key={tag}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {post.tags.length > 4 && (
                        <span className="text-xs text-gray-500">+{post.tags.length - 4}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Выбранные посты */}
      {state.selectedPosts.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-blue-50">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            ✅ Выбрано постов: {state.selectedPosts.length}
          </h4>
          <div className="space-y-1">
            {state.selectedPosts.map(post => (
              <div key={post.id} className="flex items-center justify-between text-sm">
                <span className="text-blue-800 truncate">{post.title}</span>
                <button
                  onClick={() => handlePostToggle(post)}
                  className="text-blue-600 hover:text-blue-800 ml-2"
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricalPostsSelector;
