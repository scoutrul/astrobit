import React, { useState, useCallback, useEffect } from 'react';
import { PostType } from '../../../Domain/value-objects/PostType';
import { GenerateContentRequest, GenerateContentResponse } from '../../../Application/use-cases/ai/GenerateContentUseCase';
import { HistoricalPostsSelector } from '../history/HistoricalPostsSelector';
// import { TagRepository } from '../../../Infrastructure/services/TagRepository'; // Временно отключено
import { CachedAIService } from '../../../Infrastructure/services/ai/CachedAIService';
import { CircuitBreakerAIService } from '../../../Infrastructure/services/ai/CircuitBreakerAIService';
import { OpenRouterAIService } from '../../../Infrastructure/services/ai/OpenRouterAIService';

interface ContentGeneratorProps {
  onContentGenerated: (content: string, metadata: any) => void;
  onError: (error: string) => void;
  disabled?: boolean;
  generateContentUseCase?: any; // Будет типизировано позже
}

interface GenerationState {
  isGenerating: boolean;
  selectedType: string;
  selectedHistoricalPosts: Array<{
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
  }>;
  customPrompt: string;
  targetAudience: 'beginner' | 'intermediate' | 'advanced';
  contentLength: 'short' | 'medium' | 'long';
  generatedContent: string;
  suggestedTags: string[];
  showHistoricalSelector: boolean;
  showAdvancedOptions: boolean;
  lastGeneration?: {
    content: string;
    metadata: any;
    timestamp: Date;
  };
  cacheStats?: {
    hitRate: number;
    totalRequests: number;
    tokensSaved: number;
  };
}

export const ContentGenerator: React.FC<ContentGeneratorProps> = ({
  onContentGenerated,
  onError,
  disabled = false,
  generateContentUseCase
}) => {
  const [state, setState] = useState<GenerationState>({
    isGenerating: false,
    selectedType: 'astronomical_announcement',
    selectedHistoricalPosts: [],
    customPrompt: '',
    targetAudience: 'intermediate',
    contentLength: 'medium',
    generatedContent: '',
    suggestedTags: [],
    showHistoricalSelector: false,
    showAdvancedOptions: false
  });

  // Инициализация сервисов с кэшированием и устойчивостью
  const [aiService] = useState(() => {
    const baseService = new OpenRouterAIService();
    const circuitBreakerService = new CircuitBreakerAIService(baseService, {
      failureThreshold: 3,
      recoveryTimeout: 30000,
      successThreshold: 2,
      monitoringWindow: 60000
    });
    return new CachedAIService(circuitBreakerService, {
      maxMemoryEntries: 50,
      defaultTTL: 30 * 60 * 1000, // 30 минут
      enableSemanticSearch: true
    });
  });

  // const [tagRepository] = useState(() => new TagRepository()); // Временно отключено

  const postTypes = [
    { value: 'astronomical_announcement', label: 'Анонс астрономического события', icon: '🌙', description: 'Информация о предстоящих астрономических событиях' },
    { value: 'market_retrospective', label: 'Ретроспектива рынка', icon: '📈', description: 'Анализ рыночных движений за период' },
    { value: 'analytical_post', label: 'Аналитический пост', icon: '📊', description: 'Корреляционный анализ астрономии и рынков' },
    { value: 'general_post', label: 'Обычный пост', icon: '📝', description: 'Общий информационный контент' }
  ];

  // Загрузка статистики кэша
  useEffect(() => {
    const updateCacheStats = () => {
      const stats = aiService.getCacheStats();
      setState(prev => ({ ...prev, cacheStats: stats }));
    };

    updateCacheStats();
    const interval = setInterval(updateCacheStats, 10000); // Обновляем каждые 10 секунд

    return () => clearInterval(interval);
  }, [aiService]);

  const handleGenerate = useCallback(async () => {
    if (state.isGenerating || disabled) return;

    setState(prev => ({ ...prev, isGenerating: true, generatedContent: '', suggestedTags: [] }));

    try {
      let result: GenerateContentResponse;

      if (generateContentUseCase) {
        // Используем реальный use case с новыми сервисами
        const request: GenerateContentRequest = {
          postType: PostType.create(state.selectedType as any),
          customPrompt: state.customPrompt || undefined,
          historicalPostIds: state.selectedHistoricalPosts.map(p => p.id),
          targetAudience: state.targetAudience,
          contentLength: state.contentLength,
          includeAnalysis: state.selectedType !== 'general_post',
          includeForecast: state.selectedType === 'analytical_post'
        };

        const useCase = generateContentUseCase;
        const response = await useCase.execute(request);
        
        if (!response.isSuccess) {
          throw new Error(response.error?.message || 'Ошибка генерации');
        }

        result = response.value;

      } else {
        // Улучшенная имитация с использованием новых сервисов
        console.info('🤖 AI Генерация контента:', {
          type: state.selectedType,
          historicalPosts: state.selectedHistoricalPosts.length,
          customPrompt: state.customPrompt,
          audience: state.targetAudience,
          length: state.contentLength
        });

        // Создаем контекст для генерации
        const contentContext = `
          Тип поста: ${state.selectedType}
          Аудитория: ${state.targetAudience}
          Длина: ${state.contentLength}
          Дополнительные указания: ${state.customPrompt}
          Исторический контекст: ${state.selectedHistoricalPosts.map(p => p.title).join('; ')}
        `;

        // Симулируем AI вызов с кэшированием
        const aiResult = await aiService.generate(
          `Создай ${state.contentLength} пост типа "${state.selectedType}" для аудитории "${state.targetAudience}". ${state.customPrompt}`,
          {
            model: 'gpt-3.5-turbo',
            maxTokens: state.contentLength === 'short' ? 200 : state.contentLength === 'medium' ? 400 : 800,
            temperature: 0.8,
            systemPrompt: `Ты эксперт по созданию контента для телеграм-канала AstroBit, который объединяет астрономию и криптовалюты. 
            Аудитория: ${state.targetAudience}. 
            Контекст: ${contentContext}`
          }
        );

        // Получаем предложения тегов
        // const tagSuggestions = await tagRepository.suggestTags(contentContext, 8); // Временно отключено
                const suggestedTags: string[] = []; // Временно отключено

        const selectedType = postTypes.find(t => t.value === state.selectedType);
        const mockContent = `${selectedType?.icon} ${selectedType?.label}

🚀 Это улучшенный AI-генерированный контент с:
- ⚡ Intelligent кэшированием (экономия токенов)
- 🏷️ Smart предложениями тегов
- 📚 Контекстом из ${state.selectedHistoricalPosts.length} исторических постов
- 🎯 Настройкой под аудиторию: ${state.targetAudience}
- 📏 Оптимальной длиной: ${state.contentLength}

${selectedType?.description}

${state.customPrompt ? `🎨 Специальные требования: ${state.customPrompt}` : ''}

${suggestedTags.length > 0 ? `🏷️ Предложенные теги: ${suggestedTags.slice(0, 5).map((tag: any) => `#${tag}`).join(' ')}` : ''}

#астрономия #криптовалюты #анализ #образование #astrobit`;

        result = {
          title: `${selectedType?.icon} ${selectedType?.label}`,
          content: mockContent,
          suggestedTags: suggestedTags.map((tag: any) => ({ name: tag } as any)), // Временное решение
          metadata: {
            model: aiResult.metadata.model || 'gpt-3.5-turbo',
            tokens: aiResult.metadata.tokens || 200,
            confidence: aiResult.metadata.confidence || 0.9,
            generationType: state.selectedType,
            contextUsed: {
              astronomicalEvents: 0,
              historicalPosts: state.selectedHistoricalPosts.length,
              marketDataIncluded: false
            }
          }
        };
      }

      setState(prev => ({
        ...prev,
        isGenerating: false,
        generatedContent: result.content,
        suggestedTags: result.suggestedTags ? result.suggestedTags.map(tag => tag.name) : [],
        lastGeneration: {
          content: result.content,
          metadata: result.metadata,
          timestamp: new Date()
        }
      }));

      // Записываем статистику использования тегов
      if (result.suggestedTags && result.suggestedTags.length > 0) {
        // tagRepository.recordTagUsage(result.suggestedTags.map(tag => tag.name), result.content); // Временно отключено
      }

      onContentGenerated(result.content, result.metadata);

    } catch (error) {
      setState(prev => ({ ...prev, isGenerating: false }));
      const errorMessage = error instanceof Error ? error.message : 'Ошибка генерации контента';
      console.error('[ContentGenerator] Ошибка:', error);
      onError(errorMessage);
    }
  }, [state, disabled, onContentGenerated, onError, generateContentUseCase, postTypes, aiService]);

  const handleTypeChange = (type: string) => {
    setState(prev => ({ 
      ...prev, 
      selectedType: type,
      selectedHistoricalPosts: [] // Сбрасываем исторические посты при смене типа
    }));
  };

  const handlePromptChange = (prompt: string) => {
    setState(prev => ({ ...prev, customPrompt: prompt }));
  };

  const handleAudienceChange = (audience: 'beginner' | 'intermediate' | 'advanced') => {
    setState(prev => ({ ...prev, targetAudience: audience }));
  };

  const handleLengthChange = (length: 'short' | 'medium' | 'long') => {
    setState(prev => ({ ...prev, contentLength: length }));
  };

  const handleHistoricalPostsSelected = (posts: any[]) => {
    setState(prev => ({ ...prev, selectedHistoricalPosts: posts }));
  };

  const toggleHistoricalSelector = () => {
    setState(prev => ({ ...prev, showHistoricalSelector: !prev.showHistoricalSelector }));
  };

  const toggleAdvancedOptions = () => {
    setState(prev => ({ ...prev, showAdvancedOptions: !prev.showAdvancedOptions }));
  };

  const clearCache = () => {
    aiService.clearCache();
    setState(prev => ({ ...prev, cacheStats: aiService.getCacheStats() }));
  };

  const selectedPostType = postTypes.find(t => t.value === state.selectedType);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            🤖 AI Генератор контента
            {state.cacheStats && (
              <span className="ml-3 text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                ⚡ {Math.round(state.cacheStats.hitRate * 100)}% cache hit
              </span>
            )}
          </h2>
          
          {/* Cache stats и управление */}
          <div className="flex items-center space-x-2">
            {state.cacheStats && (
              <div className="text-xs text-gray-500">
                📊 {state.cacheStats.totalRequests} запросов, 
                💰 {state.cacheStats.tokensSaved} токенов сэкономлено
              </div>
            )}
            <button
              onClick={toggleAdvancedOptions}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
            >
              ⚙️ {state.showAdvancedOptions ? 'Скрыть' : 'Настройки'}
            </button>
          </div>
        </div>

        {/* Advanced Options */}
        {state.showAdvancedOptions && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">🔧 Дополнительные настройки</h3>
            <div className="flex items-center space-x-4">
              <button
                onClick={clearCache}
                className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                🗑️ Очистить кэш
              </button>
              <button
                onClick={() => aiService.refreshCache()}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                🔄 Обновить кэш
              </button>
              {state.cacheStats && (
                <div className="text-xs text-gray-600">
                  Cache размер: {state.cacheStats.totalRequests} записей
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Выбор типа поста */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Тип поста
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {postTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => handleTypeChange(type.value)}
                className={`p-4 text-left rounded-lg border transition-colors ${
                  state.selectedType === type.value
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                disabled={disabled}
              >
                <div className="flex items-center mb-2">
                  <span className="text-lg mr-2">{type.icon}</span>
                  <span className="font-medium">{type.label}</span>
                </div>
                <p className="text-xs text-gray-600">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Настройки генерации */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Целевая аудитория */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Целевая аудитория
            </label>
            <select
              value={state.targetAudience}
              onChange={(e) => handleAudienceChange(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={disabled}
            >
              <option value="beginner">Начинающие</option>
              <option value="intermediate">Средний уровень</option>
              <option value="advanced">Продвинутые</option>
            </select>
          </div>

          {/* Длина контента */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Длина контента
            </label>
            <select
              value={state.contentLength}
              onChange={(e) => handleLengthChange(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={disabled}
            >
              <option value="short">Короткий (200-400 символов)</option>
              <option value="medium">Средний (400-800 символов)</option>
              <option value="long">Длинный (800-1200 символов)</option>
            </select>
          </div>
        </div>

        {/* Кнопка для выбора исторических постов */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Исторический контекст
            </label>
            <button
              onClick={toggleHistoricalSelector}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              📚 {state.showHistoricalSelector ? 'Скрыть' : 'Выбрать посты'}
            </button>
          </div>
          
          {state.selectedHistoricalPosts.length > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 mb-2">
                ✅ Выбрано постов: {state.selectedHistoricalPosts.length}
              </p>
              <div className="space-y-1">
                {state.selectedHistoricalPosts.slice(0, 3).map(post => (
                  <div key={post.id} className="text-xs text-blue-700 truncate">
                    📄 {post.title}
                  </div>
                ))}
                {state.selectedHistoricalPosts.length > 3 && (
                  <div className="text-xs text-blue-600">
                    +{state.selectedHistoricalPosts.length - 3} еще...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Historical Posts Selector */}
        {state.showHistoricalSelector && (
          <div className="mb-6">
            <HistoricalPostsSelector
              onPostsSelected={handleHistoricalPostsSelected}
              maxSelections={10}
              autoSelectRelevant={true}
              contentContext={`${state.selectedType} ${state.customPrompt}`}
              postType={state.selectedType}
            />
          </div>
        )}

        {/* Дополнительные указания */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Дополнительные указания (опционально)
          </label>
          <textarea
            value={state.customPrompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            placeholder="Опишите особые требования к контенту, стиль изложения, акценты..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
            disabled={disabled}
          />
        </div>

        {/* Кнопка генерации */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleGenerate}
            disabled={state.isGenerating || disabled}
            className={`px-6 py-3 rounded-md font-medium transition-colors ${
              state.isGenerating || disabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
            }`}
          >
            {state.isGenerating ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Генерация...
              </div>
            ) : (
              `✨ Сгенерировать ${selectedPostType?.label.toLowerCase()}`
            )}
          </button>

          {state.lastGeneration && (
            <div className="text-xs text-gray-500">
              Последняя генерация: {state.lastGeneration.timestamp.toLocaleTimeString()}
              {state.lastGeneration.metadata.cached && (
                <span className="ml-2 text-green-600">⚡ из кэша</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Предварительный просмотр */}
      {state.generatedContent && (
        <div className="border-t pt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            📝 Сгенерированный контент
            <span className="ml-2 text-xs text-gray-500">
              ({state.generatedContent.length} символов)
            </span>
          </h3>
          <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
              {state.generatedContent}
            </pre>
          </div>

          {/* Предложенные теги */}
          {state.suggestedTags.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">🏷️ Предложенные теги</h4>
              <div className="flex flex-wrap gap-2">
                {state.suggestedTags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full border border-blue-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {state.lastGeneration && (
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <span>Модель: {state.lastGeneration.metadata.model}</span>
                <span>Токены: {state.lastGeneration.metadata.tokens}</span>
                <span>Уверенность: {Math.round(state.lastGeneration.metadata.confidence * 100)}%</span>
                {state.lastGeneration.metadata.cached && (
                  <span className="text-green-600">⚡ Кэшированный результат</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span>Контекст:</span>
                <span>{state.lastGeneration.metadata.contextUsed?.historicalPosts || 0} постов</span>
                <span>{state.lastGeneration.metadata.contextUsed?.tagSuggestions || 0} тегов</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
