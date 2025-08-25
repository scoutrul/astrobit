import React, { useState, useEffect } from 'react';
import { Post } from '../../Domain/entities/Post';
import { PostCard } from '../components/PostCard';
import { PostStats } from '../components/PostStats';
import { LocalStoragePostRepository } from '../../Infrastructure/repositories/LocalStoragePostRepository';
import { PostType } from '../../Domain/value-objects/PostType';
import { logger } from '../../../Shared/infrastructure/Logger';

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
        logger.info('Sample данные уже загружены, пропускаем инициализацию');
        return;
      }

      logger.info('Загружаем sample данные...');
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
      
      logger.info(`Загружено ${uniquePosts.length} уникальных демо-постов`);
      await loadPosts();
    } catch (error) {
      logger.exception('Ошибка инициализации sample данных', error);
    }
  };

  const loadPosts = async () => {
    try {
      setLoading(true);
      const result = await repository.findAll();

      if (result.isSuccess) {
        setPosts(result.value);
        applyFilter(result.value, selectedFilter);
      } else {
        logger.error('Ошибка загрузки постов:', result.error);
      }
    } catch (error) {
      logger.exception('Исключение при загрузке постов', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = (postsToFilter: Post[], filter: string) => {
    if (filter === 'all') {
      setFilteredPosts(postsToFilter);
      logger.info(`[FILTER] Фильтр "all": показано ${postsToFilter.length} постов`);
    } else {
      const filtered = postsToFilter.filter(post => post.status === filter);
      setFilteredPosts(filtered);
      logger.info(`[FILTER] Фильтр "${filter}": показано ${filtered.length} из ${postsToFilter.length} постов`);
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
      } else {
        logger.error('Ошибка создания поста:', result.error);
        alert(`Ошибка создания: ${result.error}`);
      }
    } catch (error) {
      logger.exception('Исключение при создании поста', error);
      alert(`Ошибка создания: ${error}`);
    }
  };

  const handleUpdatePost = async (updatedData: any) => {
    try {
      if (!editingPost) {
        logger.error('Нет поста для редактирования');
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
        
        logger.info(`Пост "${updatedPost.title}" обновлен`);
      } else {
        logger.error('Ошибка обновления поста:', result.error);
        alert(`Ошибка обновления: ${result.error}`);
      }
    } catch (error) {
      logger.exception('Исключение при обновлении поста', error);
      alert(`Ошибка обновления: ${error}`);
    }
  };

  const handleEdit = (id: string) => {
    const postToEdit = posts.find(p => p.id === id);
    if (postToEdit) {
      setEditingPost(postToEdit);
      setShowEditForm(true);
    } else {
      logger.error('Пост не найден для редактирования:', id);
    }
  };

  const handleDelete = async (id: string) => {
    const postToDelete = posts.find(p => p.id === id);

    if (!postToDelete) {
      logger.error('Пост не найден для удаления!');
      return;
    }

    const confirmed = window.confirm(`Вы уверены, что хотите удалить пост "${postToDelete.title}"?`);

    if (!confirmed) {
      logger.warn('Удаление отменено пользователем');
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
          logger.error('Ошибка получения постов после удаления:', postsAfterDelete.error);
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
        logger.error('Ошибка удаления поста:', result.error);
        alert(`Ошибка удаления: ${result.error}`);
      }
    } catch (error) {
      // Если произошла ошибка, убираем анимацию
      setRemovingPostIds(new Set());
      logger.exception('Исключение при удалении поста', error);
      alert(`Ошибка удаления: ${error}`);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      const post = posts.find(p => p.id === id);
      if (!post) {
        logger.error('Пост не найден для публикации:', id);
        return;
      }

      // Проверяем, что можно публиковать только черновики
      if (post.status !== 'draft') {
        logger.warn(`Нельзя публиковать пост со статусом "${post.status}". Можно публиковать только черновики.`);
        alert(`Этот пост уже имеет статус "${post.status}". Можно публиковать только черновики.`);
        return;
      }

      // Создаем новый объект поста с обновленным статусом
      const updatedPost = new Post(
        post.id,
        post.title,
        post.content,
        'scheduled', // Новый статус
        post.type,
        new Date(), // Новое время планирования
        post.metadata,
        post.authorId,
        undefined, // publishedAt пока undefined
        post.images,
        post.telegramMessageId
      );

      const result = await repository.save(updatedPost);

      if (result.isSuccess) {
        // Обновляем локальное состояние с новым объектом
        const updatedPosts = posts.map(p => p.id === id ? updatedPost : p);
        setPosts(updatedPosts);
        
        // Сначала помечаем пост для анимации исчезновения
        setRemovingPostIds(new Set([id]));
        
        // Через 300ms применяем фильтр (пост исчезнет из списка)
        setTimeout(() => {
          applyFilter(updatedPosts, selectedFilter);
          setRemovingPostIds(new Set());
        }, 300);
        
        logger.info(`Пост "${updatedPost.title}" переведен в статус "scheduled"`);
      } else {
        logger.error('Ошибка обновления поста:', result.error);
        alert(`Ошибка публикации: ${result.error}`);
      }
    } catch (error) {
      logger.exception('Исключение при публикации поста', error);
      alert(`Ошибка публикации: ${error}`);
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
      
      logger.info('Все посты удалены');
      
      // Загружаем fresh sample данные
      await initializeSampleData();
      
    } catch (error) {
      logger.exception('Ошибка очистки постов', error);
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
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border">
          <h2 className="text-xl font-semibold mb-4">Создать новый пост</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            handleCreatePost({
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
                className="border rounded-lg px-3 py-2"
                required
              />
              <select name="type" className="border rounded-lg px-3 py-2" required>
                <option value="">Тип поста</option>
                {Object.values(PostType).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <textarea
              name="content"
              placeholder="Содержание поста"
              className="w-full border rounded-lg px-3 py-2 mb-4"
              rows={4}
              required
            />
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                name="scheduledAt"
                type="datetime-local"
                className="border rounded-lg px-3 py-2"
                required
              />
              <select name="priority" className="border rounded-lg px-3 py-2">
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
              </select>
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
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border">
          <h2 className="text-xl font-semibold mb-4">Редактировать пост</h2>
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
                className="border rounded-lg px-3 py-2"
                defaultValue={editingPost.title}
                required
              />
              <select name="type" className="border rounded-lg px-3 py-2" required defaultValue={editingPost.type}>
                <option value="">Тип поста</option>
                {Object.values(PostType).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <textarea
              name="content"
              placeholder="Содержание поста"
              className="w-full border rounded-lg px-3 py-2 mb-4"
              rows={4}
              defaultValue={editingPost.content}
              required
            />
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                name="scheduledAt"
                type="datetime-local"
                className="border rounded-lg px-3 py-2"
                defaultValue={editingPost.scheduledAt.toISOString().slice(0, 16)}
                required
              />
              <select name="priority" className="border rounded-lg px-3 py-2" defaultValue={editingPost.metadata.priority}>
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
              onPublish={handlePublish}
            />
          </div>
        ))}
      </div>
      </div>
    </div>
  );
};
