import React, { useState, useEffect } from 'react';
import { Post } from '../../Domain/entities/Post';
import { PostCard } from '../components/PostCard';
import { PostStats } from '../components/PostStats';
import { ContentGenerator } from '../components/ai/ContentGenerator';
import { ArchiveManager } from '../components/archive/ArchiveManager';
import { InMemoryPostRepository } from '../../Infrastructure/repositories/InMemoryPostRepository';
import { PostTypeValue, POST_TYPE_LABELS } from '../../Domain/value-objects/PostType';
import { DateTimeFormatter } from '../../../Shared/infrastructure/utils/DateTimeFormatter';
import { PostingDependencyConfig } from '../../Infrastructure/config/PostingDependencyConfig';

interface EnhancedPostingContainerState {
  loading: boolean;
  posts: Post[];
  filteredPosts: Post[];
  selectedFilter: string;
  editingPost: Post | null;
  showEditForm: boolean;
  showCreateForm: boolean;
  showAIGenerator: boolean;
  showArchiveManager: boolean;
  removingPostIds: Set<string>;
  newPostIds: Set<string>;
  activeTab: 'posts' | 'ai' | 'archives';
}

export const EnhancedPostingContainer: React.FC = () => {
  const [state, setState] = useState<EnhancedPostingContainerState>({
    loading: true,
    posts: [],
    filteredPosts: [],
    selectedFilter: 'all',
    editingPost: null,
    showEditForm: false,
    showCreateForm: false,
    showAIGenerator: false,
    showArchiveManager: false,
    removingPostIds: new Set(),
    newPostIds: new Set(),
    activeTab: 'posts'
  });

  // Инициализация сервисов через DI конфигурацию
  const [repository] = useState(() => new InMemoryPostRepository());
  const [dependencyConfig] = useState(() => PostingDependencyConfig.getInstance());
    const [generateContentUseCase] = useState(() => dependencyConfig.getGenerateContentUseCase());

  useEffect(() => {
    // Логируем статус интеграции зависимостей
    dependencyConfig.logDependencyStatus();
    
    loadPosts();
    // Mock данные отключены - используем AI Generator для создания постов
  }, [dependencyConfig]);

  useEffect(() => {
    applyFilter(state.posts, state.selectedFilter);
  }, [state.posts, state.selectedFilter]);

  // Demo data initialization removed - используем только AI Generator

  const loadPosts = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const result = await repository.findAll();

      if (result.isSuccess) {
        setState(prev => ({ ...prev, posts: result.value }));
        applyFilter(result.value, state.selectedFilter);
      }
    } catch (error) {
      console.error('[EnhancedPostingContainer] Ошибка загрузки постов:', error);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };



  const applyFilter = (postsToFilter: Post[], filter: string) => {
    const filtered = filter === 'all' 
      ? postsToFilter 
      : postsToFilter.filter(post => post.status === filter);
    
    setState(prev => ({ ...prev, filteredPosts: filtered }));
  };

  const handleFilterChange = (filter: string) => {
    setState(prev => ({
      ...prev,
      selectedFilter: filter,
      removingPostIds: new Set(),
      newPostIds: new Set()
    }));
    applyFilter(state.posts, filter);
  };

  const handleTabChange = (tab: 'posts' | 'ai' | 'archives') => {
    setState(prev => ({ ...prev, activeTab: tab }));
  };

  const handleAIContentGenerated = async (content: string, metadata: any) => {
    try {
      // Извлекаем заголовок из первых строк контента
      const extractTitle = (content: string): string => {
        // Сначала пробуем разделить по \n\n (двойной перенос строки)
        const sections = content.split('\n\n');
        if (sections.length > 0) {
          const firstSection = sections[0]?.trim();
          if (firstSection && /[🌙📈📊📝🚀⚡🏷️📚🎯📏🎨🌠🌌🌘🔭🌟✨]/.test(firstSection)) {
            return firstSection;
          }
        }
        
        // Если не сработало, пробуем по одиночному \n
        const lines = content.split('\n');
        const firstLine = lines[0]?.trim();
        if (firstLine && /[🌙📈📊📝🚀⚡🏷️📚🎯📏🎨🌠🌌🌘🔭🌟✨]/.test(firstLine)) {
          return firstLine;
        }
        
        return 'AI Generated Post';
      };
      
      const extractedTitle = extractTitle(content);
      
      // Создаем новый пост из AI-генерированного контента
      const aiPost = new Post(
        crypto.randomUUID(),
        extractedTitle,
        content,
        'draft',
        metadata.generationType || 'general_post',
        new Date(Date.now() + 60 * 60 * 1000), // через час
        {
          template: 'ai_generated',
          variables: { aiModel: metadata.model },
          tags: metadata.suggestedTags || [],
          priority: 'medium'
        },
        'ai-system'
      );

      const result = await repository.save(aiPost);

      if (result.isSuccess) {
        await loadPosts();
        console.info('[EnhancedPostingContainer] AI пост создан:', aiPost.id);
        
        // Переключаемся на вкладку постов, чтобы показать результат
        setState(prev => ({ ...prev, activeTab: 'posts' }));
      }
    } catch (error) {
      console.error('[EnhancedPostingContainer] Ошибка сохранения AI поста:', error);
    }
  };

  const handleArchivePostSelected = (post: Post) => {
    // Создаем новый пост на основе архивного
    const restoredPost = new Post(
      crypto.randomUUID(),
      `📚 Восстановлено: ${post.title}`,
      post.content,
      'draft',
      post.type,
      new Date(Date.now() + 24 * 60 * 60 * 1000), // завтра
      {
        ...post.metadata
      },
      'admin'
    );

    repository.save(restoredPost).then(() => {
      loadPosts();
      setState(prev => ({ ...prev, activeTab: 'posts' }));
    });
  };

  const handleCreatePost = async (postData: any) => {
    try {
      const post = new Post(
        crypto.randomUUID(),
        postData.title,
        postData.content,
        'draft',
        postData.type,
        new Date(postData.scheduledAt),
        {
          template: 'manual',
          variables: {},
          tags: postData.tags || [],
          priority: postData.priority || 'medium'
        },
        'admin',
        undefined,
        postData.images || []
      );

      const result = await repository.save(post);

      if (result.isSuccess) {
        setState(prev => ({ ...prev, showCreateForm: false }));
        await loadPosts();

        if (postData.sendToTelegram) {
          // Telegram integration logic
          try {
            const { TelegramBotBrowserService } = await import('../../Infrastructure/services/TelegramBotBrowserService');
            
            const telegramConfig = {
              token: import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '',
              chatId: import.meta.env.VITE_TELEGRAM_CHAT_ID || ''
            };

            if (telegramConfig.token && telegramConfig.chatId) {
              const telegramService = new TelegramBotBrowserService(telegramConfig);
              const telegramResult = await telegramService.sendPost(post);
              
              if (telegramResult.success && telegramResult.messageId) {
                await handleTelegramSent(post.id, telegramResult.messageId);
              }
            }
          } catch (error) {
            console.error('[EnhancedPostingContainer] Ошибка отправки в Telegram:', error);
          }
        }
      } else {
        alert(`Ошибка создания: ${result.error}`);
      }
    } catch (error) {
      alert(`Ошибка создания: ${error}`);
    }
  };

  const handleTelegramSent = async (postId: string, messageId: number) => {
    try {
      const postToUpdate = state.posts.find(p => p.id === postId);
      if (!postToUpdate) return;

      const updatedPost = new Post(
        postToUpdate.id,
        postToUpdate.title,
        postToUpdate.content,
        'scheduled',
        postToUpdate.type,
        postToUpdate.scheduledAt,
        postToUpdate.metadata,
        postToUpdate.authorId,
        postToUpdate.publishedAt,
        postToUpdate.images,
        postToUpdate.telegramMessageId
      );

      const result = await repository.save(updatedPost);

      if (result.isSuccess) {
        const updatedPosts = state.posts.map(p => p.id === postId ? updatedPost : p);
        setState(prev => ({ ...prev, posts: updatedPosts }));
        applyFilter(updatedPosts, state.selectedFilter);
      }
    } catch (error) {
      console.error('[EnhancedPostingContainer] Ошибка сохранения messageId:', error);
    }
  };

  const handleDelete = async (id: string) => {
    const postToDelete = state.posts.find(p => p.id === id);
    if (!postToDelete) return;

    const confirmed = window.confirm(`Удалить пост "${postToDelete.title}"?`);
    if (!confirmed) return;

    try {
      setState(prev => ({ ...prev, removingPostIds: new Set([id]) }));
      
      const result = await repository.delete(id);

      if (result.isSuccess) {
        setTimeout(() => {
          const updatedPosts = state.posts.filter(p => p.id !== id);
          setState(prev => ({
            ...prev,
            posts: updatedPosts,
            removingPostIds: new Set()
          }));
          applyFilter(updatedPosts, state.selectedFilter);
        }, 300);
      } else {
        setState(prev => ({ ...prev, removingPostIds: new Set() }));
        alert(`Ошибка удаления: ${result.error}`);
      }
    } catch (error) {
      setState(prev => ({ ...prev, removingPostIds: new Set() }));
      alert(`Ошибка удаления: ${error}`);
    }
  };

  const handleEdit = (id: string) => {
    const postToEdit = state.posts.find(p => p.id === id);
    if (postToEdit) {
      setState(prev => ({
        ...prev,
        editingPost: postToEdit,
        showEditForm: true
      }));
    }
  };

  const handleUpdatePost = async (updatedData: any) => {
    try {
      if (!state.editingPost) return;

      const updatedPost = new Post(
        state.editingPost.id,
        updatedData.title,
        updatedData.content,
        state.editingPost.status,
        updatedData.type,
        state.editingPost.scheduledAt,
        updatedData.metadata || state.editingPost.metadata,
        state.editingPost.authorId,
        state.editingPost.publishedAt,
        state.editingPost.images,
        state.editingPost.telegramMessageId
      );

      const result = await repository.save(updatedPost);

      if (result.isSuccess) {
        setState(prev => ({
          ...prev,
          showEditForm: false,
          editingPost: null
        }));
        
        const updatedPosts = state.posts.map(p => p.id === updatedPost.id ? updatedPost : p);
        setState(prev => ({ ...prev, posts: updatedPosts }));
        applyFilter(updatedPosts, state.selectedFilter);
      } else {
        alert(`Ошибка обновления: ${result.error}`);
      }
    } catch (error) {
      alert(`Ошибка обновления: ${error}`);
    }
  };

  if (state.loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-[1800px] mx-auto w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center">
          🚀 AstroBit AI-Enhanced Admin Panel
        </h1>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'posts', label: '📄 Посты', icon: '📄' },
                { key: 'ai', label: '🤖 AI Генератор', icon: '🤖' },
                { key: 'archives', label: '📦 Архивы', icon: '📦' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key as any)}
                  className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
                    state.activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Posts Tab */}
        {state.activeTab === 'posts' && (
          <div>
            <div className="mb-6 w-full">
              <PostStats 
                posts={state.posts} 
                selectedFilter={state.selectedFilter} 
                onFilterChange={handleFilterChange} 
              />
            </div>

            <div className="mb-6 py-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setState(prev => ({ ...prev, showCreateForm: true }))}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ➕ Создать пост
                </button>
                <button
                  onClick={() => setState(prev => ({ ...prev, activeTab: 'ai' }))}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  🤖 AI Генератор
                </button>
                <button
                  onClick={() => setState(prev => ({ ...prev, activeTab: 'archives' }))}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  📦 Архивы
                </button>
              </div>
            </div>

            {/* Create Form */}
            {state.showCreateForm && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6 border">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Создать новый пост</h2>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  handleCreatePost({
                    title: formData.get('title'),
                    content: formData.get('content'),
                    type: formData.get('type'),
                    scheduledAt: formData.get('scheduledAt'),
                    priority: formData.get('priority'),
                    sendToTelegram: formData.get('sendToTelegram') === 'on'
                  });
                }}>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <input
                      name="title"
                      placeholder="Заголовок поста"
                      className="border-2 border-gray-500 rounded-lg px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white text-gray-800 placeholder-gray-600"
                      required
                    />
                    <select 
                      name="type" 
                      className="border-2 border-gray-500 rounded-lg px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white text-gray-800" 
                      required
                    >
                      <option value="">Тип поста</option>
                      {Object.keys(POST_TYPE_LABELS).map(type => (
                        <option key={type} value={type}>{POST_TYPE_LABELS[type as PostTypeValue]}</option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    name="content"
                    placeholder="Содержание поста"
                    className="w-full border-2 border-gray-500 rounded-lg px-3 py-2 mb-4 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white text-gray-800 placeholder-gray-600"
                    rows={4}
                    required
                  />
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <input
                      name="scheduledAt"
                      type="datetime-local"
                      className="border-2 border-gray-500 rounded-lg px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white text-gray-800"
                      defaultValue={new Date().toISOString().slice(0, 16)}
                      required
                    />
                    <select 
                      name="priority" 
                      className="border-2 border-gray-500 rounded-lg px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white text-gray-800"
                    >
                      <option value="low">Низкий</option>
                      <option value="medium">Средний</option>
                      <option value="high">Высокий</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="flex items-center gap-2">
                      <input
                        name="sendToTelegram"
                        type="checkbox"
                        className="rounded border-2 border-gray-500 text-blue-600 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="text-sm text-gray-800">📤 Отправить в Telegram</span>
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Создать
                    </button>
                    <button
                      type="button"
                      onClick={() => setState(prev => ({ ...prev, showCreateForm: false }))}
                      className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Edit Form */}
            {state.showEditForm && state.editingPost && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6 border">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Редактировать пост</h2>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  handleUpdatePost({
                    title: formData.get('title'),
                    content: formData.get('content'),
                    type: formData.get('type'),
                    scheduledAt: formData.get('scheduledAt'),
                    priority: formData.get('priority')
                  });
                }}>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <input
                      name="title"
                      placeholder="Заголовок поста"
                      className="border-2 border-gray-500 rounded-lg px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white text-gray-800 placeholder-gray-600"
                      defaultValue={state.editingPost.title}
                      required
                    />
                    <select 
                      name="type" 
                      className="border-2 border-gray-500 rounded-lg px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white text-gray-800" 
                      required 
                      defaultValue={state.editingPost.type}
                    >
                      <option value="">Тип поста</option>
                      {Object.keys(POST_TYPE_LABELS).map(type => (
                        <option key={type} value={type}>{POST_TYPE_LABELS[type as PostTypeValue]}</option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    name="content"
                    placeholder="Содержание поста"
                    className="w-full border-2 border-gray-500 rounded-lg px-3 py-2 mb-4 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white text-gray-800 placeholder-gray-600"
                    rows={4}
                    defaultValue={state.editingPost.content}
                    required
                  />
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <input
                      name="scheduledAt"
                      type="datetime-local"
                      className="border-2 border-gray-500 rounded-lg px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white text-gray-800"
                      defaultValue={DateTimeFormatter.formatForDateTimeInput(state.editingPost.scheduledAt)}
                      required
                    />
                    <select 
                      name="priority" 
                      className="border-2 border-gray-500 rounded-lg px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white text-gray-800" 
                      defaultValue={state.editingPost.metadata.priority}
                    >
                      <option value="low">Низкий</option>
                      <option value="medium">Средний</option>
                      <option value="high">Высокий</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Обновить
                    </button>
                    <button
                      type="button"
                      onClick={() => setState(prev => ({ ...prev, showEditForm: false, editingPost: null }))}
                      className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {state.filteredPosts.map((post, index) => (
                <div
                  key={post.id || `post-${index}`}
                  className={`transition-all duration-300 ease-in-out hover:scale-105 ${
                    state.removingPostIds.has(post.id) 
                      ? 'opacity-0 scale-75 transform translate-y-4 rotate-1' 
                      : state.newPostIds.has(post.id)
                      ? 'opacity-0 scale-50 transform -translate-y-8'
                      : 'opacity-100 scale-100 transform translate-y-0 rotate-0'
                  }`}
                >
                  <PostCard
                    post={post}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onTelegramSent={handleTelegramSent}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Generator Tab */}
        {state.activeTab === 'ai' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">🤖 AI Content Generator</h2>
              <p className="text-gray-600 mb-6">
                Создавайте высококачественный контент с помощью искусственного интеллекта. 
                Система использует кэширование для экономии токенов и smart теги для лучшей категоризации.
              </p>
            </div>

            <ContentGenerator
              onContentGenerated={handleAIContentGenerated}
              onError={(error) => alert(`AI Ошибка: ${error}`)}
              generateContentUseCase={generateContentUseCase}
            />
          </div>
        )}

        {/* Archives Tab */}
        {state.activeTab === 'archives' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">📦 Archive Manager</h2>
              <p className="text-gray-600 mb-6">
                Управляйте архивными данными, ищите исторические посты и восстанавливайте контент из архивов.
              </p>
            </div>

            <ArchiveManager
              onPostSelected={handleArchivePostSelected}
              onError={(error) => alert(`Archive Ошибка: ${error}`)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
