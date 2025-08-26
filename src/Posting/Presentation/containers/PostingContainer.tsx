import React, { useState, useEffect } from 'react';
import { Post } from '../../Domain/entities/Post';
import { PostCard } from '../components/PostCard';
import { PostStats } from '../components/PostStats';
import { LocalStoragePostRepository } from '../../Infrastructure/repositories/LocalStoragePostRepository';
import { PostType, POST_TYPE_LABELS } from '../../Domain/value-objects/PostType';
import { DateTimeFormatter } from '../../../Shared/infrastructure/utils/DateTimeFormatter';


export const PostingContainer: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [removingPostIds, setRemovingPostIds] = useState<Set<string>>(new Set()); // Для анимации удаления
  const [newPostIds, setNewPostIds] = useState<Set<string>>(new Set()); // Для анимации появления

  const repository = new LocalStoragePostRepository();

  useEffect(() => {
    loadPosts();
    initializeSampleData();
  }, []);

  useEffect(() => {
    applyFilter(posts, selectedFilter);
  }, [posts, selectedFilter]);

  const initializeSampleData = async () => {
    try {
      // Проверяем, есть ли уже данные в localStorage
      const existingPosts = await repository.findAll();
      if (existingPosts.isSuccess && existingPosts.value.length > 0) {
        return;
      }
      const response = await fetch('/src/Posting/Infrastructure/data/samplePosts.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const rawPosts = await response.json();
      
      // Создаем уникальные посты с разными заголовками для демо
      const uniquePosts = [
        {
          ...rawPosts[0],
          id: 'demo-1',
          title: '🌙 Лунное затмение - декабрь 2024',
          status: 'draft'
        },
        {
          ...rawPosts[1],
          id: 'demo-2', 
          title: '📈 BTC анализ - бычий тренд',
          status: 'scheduled'
        },
        {
          ...rawPosts[2],
          id: 'demo-3',
          title: '🌠 Метеорный поток Квадрантиды',
          status: 'draft'
        },
        {
          id: 'demo-4',
          title: '☀️ Солнечное затмение - апрель 2025',
          content: 'Кольцеобразное солнечное затмение будет наблюдаться в северных регионах.\n\n📅 8 апреля 2025\n⭐ Продолжительность: 4 минуты\n\n#солнце #затмение #астрономия',
          status: 'published',
          type: 'astronomical_update',
          scheduledAt: new Date('2025-04-07T15:00:00.000Z'),
          metadata: {
            template: 'astronomical_event',
            variables: {},
            tags: ['астрономия', 'солнце'],
            priority: 'high'
          },
          authorId: 'admin',
          publishedAt: new Date('2025-04-07T15:05:00.000Z')
        },
        {
          id: 'demo-5',
          title: '💰 ETH прогноз на неделю',
          content: 'Ethereum показывает консолидацию в диапазоне $2800-$3200.\n\n🎯 Цели: $3400 при пробое вверх\n🛡️ Стоп: $2650\n\n🌟 Астрологический фактор: Полнолуние в Близнецах может дать волатильность.\n\n#ethereum #прогноз #криптоанализ',
          status: 'scheduled',
          type: 'market_analysis', 
          scheduledAt: new Date('2024-12-28T10:00:00.000Z'),
          metadata: {
            template: 'market_analysis',
            variables: {
              symbol: 'ETH/USD',
              trend: 'sideways'
            },
            tags: ['ethereum', 'анализ'],
            priority: 'medium'
          },
          authorId: 'admin'
        }
      ];

      for (const postData of uniquePosts) {
        const post = new Post(
          postData.id,
          postData.title,
          postData.content,
          postData.status,
          postData.type,
          new Date(postData.scheduledAt),
          postData.metadata || {},
          postData.authorId || 'admin',
          postData.publishedAt ? new Date(postData.publishedAt) : undefined,
          postData.images || [],
          postData.telegramMessageId
        );
        await repository.save(post);
      }
      
      await loadPosts();
    } catch (error) {
      // Ошибка инициализации sample данных
    }
  };

  const loadPosts = async () => {
    try {
      setLoading(true);
      const result = await repository.findAll();

      if (result.isSuccess) {
        setPosts(result.value);
        applyFilter(result.value, selectedFilter);
      }
    } catch (error) {
      // Ошибка загрузки постов
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = (postsToFilter: Post[], filter: string) => {
    if (filter === 'all') {
      setFilteredPosts(postsToFilter);
    } else {
      const filtered = postsToFilter.filter(post => post.status === filter);
      setFilteredPosts(filtered);
    }
  };

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    setRemovingPostIds(new Set()); // Очищаем анимации при смене фильтра
    setNewPostIds(new Set());
    applyFilter(posts, filter);
  };

  const handleCreatePost = async (postData: any) => {
    try {
      const post = new Post(
        crypto.randomUUID(),
        postData.title,
        postData.content,
        'draft', // New posts start as draft
        postData.type,
        new Date(postData.scheduledAt),
        {
          template: 'default',
          variables: {},
          tags: [],
          priority: postData.priority || 'medium'
        },
        'admin',
        undefined,
        postData.images || []
      );

      const result = await repository.save(post);

      if (result.isSuccess) {
        setShowCreateForm(false);
        await loadPosts();
        
        // Если выбрана автоматическая отправка в Telegram
        if (postData.sendToTelegram) {
          // Инициируем отправку в Telegram
          // Используем TelegramBotService напрямую для создания поста
          const { TelegramBotBrowserService } = await import('../../Infrastructure/services/TelegramBotBrowserService');
          
          try {
            const telegramConfig = {
              token: import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '',
              chatId: import.meta.env.VITE_TELEGRAM_CHAT_ID || ''
            };

            if (telegramConfig.token && telegramConfig.chatId) {
              const telegramService = new TelegramBotBrowserService(telegramConfig);
              const telegramResult = await telegramService.sendPost(post);
              
              if (telegramResult.success && telegramResult.messageId) {
                // Обновляем пост с messageId
                await handleTelegramSent(post.id, telegramResult.messageId);
              }
            }
          } catch (error) {
            console.error('Ошибка автоматической отправки в Telegram:', error);
          }
        }
      } else {
        alert(`Ошибка создания: ${result.error}`);
      }
    } catch (error) {
      alert(`Ошибка создания: ${error}`);
    }
  };

  const handleUpdatePost = async (updatedData: any) => {
    try {
      if (!editingPost) {
        return;
      }

      // Создаем новый объект поста с обновленными данными
      const updatedPost = new Post(
        editingPost.id,
        updatedData.title,
        updatedData.content,
        editingPost.status,
        updatedData.type,
        editingPost.scheduledAt,
        updatedData.metadata || editingPost.metadata,
        editingPost.authorId,
        editingPost.publishedAt,
        editingPost.images,
        editingPost.telegramMessageId
      );

      const result = await repository.save(updatedPost);

      if (result.isSuccess) {
        setShowEditForm(false);
        setEditingPost(null);
        
        // Обновляем локальное состояние вместо полной перезагрузки
        const updatedPosts = posts.map(p => p.id === updatedPost.id ? updatedPost : p);
        setPosts(updatedPosts);
        applyFilter(updatedPosts, selectedFilter);
        
      } else {
        alert(`Ошибка обновления: ${result.error}`);
      }
    } catch (error) {
      alert(`Ошибка обновления: ${error}`);
    }
  };

  const handleEdit = (id: string) => {
    const postToEdit = posts.find(p => p.id === id);
    if (postToEdit) {
      setEditingPost(postToEdit);
      setShowEditForm(true);
    }
  };

  const handleDelete = async (id: string) => {
    const postToDelete = posts.find(p => p.id === id);

    if (!postToDelete) {
      return;
    }

    const confirmed = window.confirm(`Вы уверены, что хотите удалить пост "${postToDelete.title}"?`);

    if (!confirmed) {
      return;
    }

    try {
      // Сначала показываем анимацию удаления
      setRemovingPostIds(new Set([id]));
      
      const result = await repository.delete(id);

      if (result.isSuccess) {
        const postsAfterDelete = await repository.findAll();

        if (postsAfterDelete.isSuccess) {
          const updatedPosts = postsAfterDelete.value;
          
          // Через 300ms обновляем списки (после анимации)
          setTimeout(() => {
            setPosts(updatedPosts);
            applyFilter(updatedPosts, selectedFilter);
            setRemovingPostIds(new Set());
          }, 300);
        } else {
          // Fallback: обновляем локально
          const updatedPosts = posts.filter(p => p.id !== id);
          
          setTimeout(() => {
            setPosts(updatedPosts);
            applyFilter(updatedPosts, selectedFilter);
            setRemovingPostIds(new Set());
          }, 300);
        }
      } else {
        // Если удаление не удалось, убираем анимацию
        setRemovingPostIds(new Set());
        alert(`Ошибка удаления: ${result.error}`);
      }
    } catch (error) {
      // Если произошла ошибка, убираем анимацию
      setRemovingPostIds(new Set());
      alert(`Ошибка удаления: ${error}`);
    }
  };



  const handleCancelEdit = () => {
    setShowEditForm(false);
    setEditingPost(null);
  };

  const handleCancelCreate = () => {
    setShowCreateForm(false);
  };

  const handleShowCreateForm = () => {
    setShowCreateForm(true);
  };

  const handleTelegramSent = async (postId: string, messageId: number) => {
    try {
      const postToUpdate = posts.find(p => p.id === postId);
      if (!postToUpdate) return;

      // Создаем обновленный пост с telegramMessageId и статусом "scheduled"
      const updatedPost = new Post(
        postToUpdate.id,
        postToUpdate.title,
        postToUpdate.content,
        'scheduled', // Переводим в статус "scheduled" после отправки в Telegram
        postToUpdate.type,
        postToUpdate.scheduledAt,
        postToUpdate.metadata,
        postToUpdate.authorId,
        postToUpdate.publishedAt,
        postToUpdate.images,
        messageId.toString()
      );

      const result = await repository.save(updatedPost);

      if (result.isSuccess) {
        // Обновляем локальное состояние
        const updatedPosts = posts.map(p => p.id === postId ? updatedPost : p);
        setPosts(updatedPosts);
        applyFilter(updatedPosts, selectedFilter);
      }
    } catch (error) {
      console.error('Ошибка сохранения messageId:', error);
    }
  };

  const handleClearAllPosts = async () => {
    const confirmed = window.confirm('Вы уверены, что хотите удалить ВСЕ посты? Это действие нельзя отменить!');
    
    if (!confirmed) {
      return;
    }

    try {
      // Очищаем localStorage
      localStorage.removeItem('astrobit_posts');
      
      // Обновляем состояние
      setPosts([]);
      setFilteredPosts([]);
      
      // Все посты удалены
      
      // Загружаем fresh sample данные
      await initializeSampleData();
      
    } catch (error) {
      alert('Ошибка при очистке данных');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Загрузка...</div>;
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-[1600px] mx-auto w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Административная панель AstroBit</h1>

      <div className="mb-6 w-full">
        <PostStats posts={posts} selectedFilter={selectedFilter} onFilterChange={handleFilterChange} />
      </div>

      <div className="mb-6 py-4">
        <div className="flex gap-2">
          <button
            onClick={handleShowCreateForm}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            ➕ Создать новый пост
          </button>
          <button
            onClick={handleClearAllPosts}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            🗑️ Очистить все данные
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-white">Создать новый пост</h2>
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
                className="border border-gray-600 rounded-lg px-3 py-2 bg-gray-100 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <select name="type" className="border border-gray-600 rounded-lg px-3 py-2 bg-gray-100 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                <option value="">Тип поста</option>
                {Object.values(PostType).map(type => (
                  <option key={type} value={type}>{POST_TYPE_LABELS[type as PostType]}</option>
                ))}
              </select>
            </div>
            <textarea
              name="content"
              placeholder="Содержание поста"
              className="w-full border border-gray-600 rounded-lg px-3 py-2 mb-4 bg-gray-100 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              required
            />
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                name="scheduledAt"
                type="datetime-local"
                className="border border-gray-600 rounded-lg px-3 py-2 bg-gray-100 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue={new Date().toISOString().slice(0, 16)}
                required
              />
              <select name="priority" className="border border-gray-600 rounded-lg px-3 py-2 bg-gray-100 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
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
                  className="rounded bg-gray-100 border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-300">📤 Сразу отправить в Telegram</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Создать
              </button>
              <button
                type="button"
                onClick={handleCancelCreate}
                className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {showEditForm && editingPost && (
        <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-white">Редактировать пост</h2>
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
                className="border border-gray-600 rounded-lg px-3 py-2 bg-gray-100 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue={editingPost.title}
                required
              />
              <select name="type" className="border border-gray-600 rounded-lg px-3 py-2 bg-gray-100 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" required defaultValue={editingPost.type}>
                <option value="">Тип поста</option>
                {Object.values(PostType).map(type => (
                  <option key={type} value={type}>{POST_TYPE_LABELS[type as PostType]}</option>
                ))}
              </select>
            </div>
            <textarea
              name="content"
              placeholder="Содержание поста"
              className="w-full border border-gray-600 rounded-lg px-3 py-2 mb-4 bg-gray-100 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              defaultValue={editingPost.content}
              required
            />
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                name="scheduledAt"
                type="datetime-local"
                className="border border-gray-600 rounded-lg px-3 py-2 bg-gray-100 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue={DateTimeFormatter.formatForDateTimeInput(editingPost.scheduledAt)}
                required
              />
              <select name="priority" className="border border-gray-600 rounded-lg px-3 py-2 bg-gray-100 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" defaultValue={editingPost.metadata.priority}>
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Обновить
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Список постов</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map((post, index) => (
          <div
            key={post.id || `post-${index}`}
            className={`transition-all duration-300 ease-in-out hover:scale-105 ${
              removingPostIds.has(post.id) 
                ? 'opacity-0 scale-75 transform translate-y-4 rotate-1' 
                : newPostIds.has(post.id)
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
    </div>
  );
};
