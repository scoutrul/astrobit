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
      const response = await fetch('/src/Posting/Infrastructure/data/samplePosts.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const rawPosts = await response.json();
      const postsWithIds = rawPosts.map((raw: any) => ({
        ...raw,
        id: raw.id || crypto.randomUUID()
      }));

      for (const postData of postsWithIds) {
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
    } else {
      const filtered = postsToFilter.filter(post => post.status === filter);
      setFilteredPosts(filtered);
    }
  };

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
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

      // Обновляем поля поста
      editingPost.title = updatedData.title;
      editingPost.content = updatedData.content;
      editingPost.type = updatedData.type;
      editingPost.metadata = updatedData.metadata || {};

      const result = await repository.save(editingPost);

      if (result.isSuccess) {
        setShowEditForm(false);
        setEditingPost(null);
        await loadPosts();
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
      const result = await repository.delete(id);

      if (result.isSuccess) {
        const postsAfterDelete = await repository.findAll();

        if (postsAfterDelete.isSuccess) {
          const updatedPosts = postsAfterDelete.value;
          setPosts(updatedPosts);
          applyFilter(updatedPosts, selectedFilter);
        } else {
          logger.error('Ошибка получения постов после удаления:', postsAfterDelete.error);
          // Fallback: обновляем локально
          const updatedPosts = posts.filter(p => p.id !== id);
          setPosts(updatedPosts);
          applyFilter(updatedPosts, selectedFilter);
        }
      } else {
        logger.error('Ошибка удаления поста:', result.error);
        alert(`Ошибка удаления: ${result.error}`);
      }
    } catch (error) {
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

      // Для демо сразу публикуем
      post.updateStatus('scheduled');
      post.scheduledAt = new Date();

      const result = await repository.save(post);

      if (result.isSuccess) {
        // Обновляем локальное состояние
        const updatedPosts = posts.map(p => p.id === id ? post : p);
        setPosts(updatedPosts);
        applyFilter(updatedPosts, selectedFilter);
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

  if (loading) {
    return <div className="flex justify-center p-8">Загрузка...</div>;
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Административная панель AstroBit</h1>

      <div className="mb-6 flex justify-between items-center">
        <PostStats posts={posts} selectedFilter={selectedFilter} onFilterChange={handleFilterChange} />
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          ➕ Создать новый пост
        </button>
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
          <PostCard
            key={post.id || `post-${index}`}
            post={post}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPublish={handlePublish}
          />
        ))}
      </div>
    </div>
  );
};
