import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { JsonDataManager } from '../../../Infrastructure/services/JsonDataManager';
import { Post } from '../../../Domain/entities/Post';

interface ArchiveMetadata {
  id: string;
  filename: string;
  startDate: string;
  endDate: string;
  postCount: number;
  fileSize: number;
  compressed: boolean;
  tags: string[];
  categories: string[];
  createdAt: Date;
}

interface ArchiveStats {
  totalArchives: number;
  totalPosts: number;
  totalSize: number;
  oldestArchive: string;
  newestArchive: string;
  categoryDistribution: Record<string, number>;
}

interface ArchiveManagerProps {
  onPostSelected?: (post: Post) => void;
  onError?: (error: string) => void;
}

interface ArchiveManagerState {
  archives: ArchiveMetadata[];
  selectedArchive: ArchiveMetadata | null;
  archivePosts: Post[];
  stats: ArchiveStats | null;
  isLoading: boolean;
  searchQuery: string;
  selectedCategory: string;
  dateRange: {
    start: string;
    end: string;
  };
  sortBy: 'date' | 'size' | 'posts';
  sortOrder: 'asc' | 'desc';
}

export const ArchiveManager: React.FC<ArchiveManagerProps> = ({
  onPostSelected,
  onError
}) => {
  const [state, setState] = useState<ArchiveManagerState>({
    archives: [],
    selectedArchive: null,
    archivePosts: [],
    stats: null,
    isLoading: false,
    searchQuery: '',
    selectedCategory: '',
    dateRange: { start: '', end: '' },
    sortBy: 'date',
    sortOrder: 'desc'
  });

  const dataManager = useMemo(() => new JsonDataManager<ArchiveMetadata>(), []);

  // Загрузка списка архивов
  const loadArchives = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Загружаем архивный индекс напрямую, так как это не массив
      const response = await fetch('src/Posting/Infrastructure/data/archives/archive-index.json');
      if (response.ok) {
        const indexData = await response.json();
        const archives = indexData.archives || [];
        const stats = calculateStats(archives);
        
        setState(prev => ({
          ...prev,
          archives,
          stats,
          isLoading: false
        }));

        console.info('[ArchiveManager] Загружено', archives.length, 'архивов');
      } else {
        // Создаем пустой индекс если файла нет
        setState(prev => ({
          ...prev,
          archives: [],
          stats: null,
          isLoading: false
        }));
      }
    } catch (error) {
      const errorMessage = `Ошибка загрузки архивов: ${error}`;
      onError?.(errorMessage);
      console.error('[ArchiveManager]', errorMessage);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [onError]);

  // Загрузка постов из конкретного архива
  const loadArchivePosts = useCallback(async (archive: ArchiveMetadata) => {
    setState(prev => ({ ...prev, isLoading: true, selectedArchive: archive }));
    
    try {
      const archivePath = `src/Posting/Infrastructure/data/archives/${archive.filename}`;
      const response = await fetch(archivePath);
      
      if (response.ok) {
        const posts = await response.json() as Post[];
        setState(prev => ({
          ...prev,
          archivePosts: posts,
          isLoading: false
        }));

        console.info('[ArchiveManager] Загружено', posts.length, 'постов из архива', archive.filename);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      const errorMessage = `Ошибка загрузки архива: ${error}`;
      onError?.(errorMessage);
      console.error('[ArchiveManager]', errorMessage);
      setState(prev => ({ ...prev, isLoading: false, archivePosts: [] }));
    }
  }, [onError, dataManager]);

  // Поиск и фильтрация архивов
  const filteredArchives = state.archives.filter(archive => {
    const matchesSearch = state.searchQuery === '' || 
      archive.filename.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      (archive.tags && Array.isArray(archive.tags) && archive.tags.some(tag => tag.toLowerCase().includes(state.searchQuery.toLowerCase())));
    
    const matchesCategory = state.selectedCategory === '' ||
      (archive.categories && Array.isArray(archive.categories) && archive.categories.includes(state.selectedCategory));
    
    const matchesDateRange = (!state.dateRange.start || (archive.startDate && archive.startDate >= state.dateRange.start)) &&
      (!state.dateRange.end || (archive.endDate && archive.endDate <= state.dateRange.end));
    
    return matchesSearch && matchesCategory && matchesDateRange;
  }).sort((a, b) => {
    let comparison = 0;
    
    switch (state.sortBy) {
      case 'date':
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
        comparison = dateA - dateB;
        break;
      case 'size':
        comparison = (a.fileSize || 0) - (b.fileSize || 0);
        break;
      case 'posts':
        comparison = (a.postCount || 0) - (b.postCount || 0);
        break;
    }
    
    return state.sortOrder === 'asc' ? comparison : -comparison;
  });

  // Поиск постов в выбранном архиве
  const filteredPosts = state.archivePosts.filter(post => {
    if (state.searchQuery === '') return true;
    
    const query = state.searchQuery.toLowerCase();
    return post.title.toLowerCase().includes(query) ||
           post.content.toLowerCase().includes(query) ||
           (post.metadata.tags && Array.isArray(post.metadata.tags) && post.metadata.tags.some(tag => tag.toLowerCase().includes(query)));
  });

  useEffect(() => {
    loadArchives();
  }, [loadArchives]);

  // Вспомогательные функции
  const calculateStats = (archives: ArchiveMetadata[]): ArchiveStats => {
    if (archives.length === 0) {
      return {
        totalArchives: 0,
        totalPosts: 0,
        totalSize: 0,
        oldestArchive: '',
        newestArchive: '',
        categoryDistribution: {}
      };
    }

    const totalPosts = archives.reduce((sum, arch) => sum + arch.postCount, 0);
    const totalSize = archives.reduce((sum, arch) => sum + arch.fileSize, 0);
    
    const categoryDistribution: Record<string, number> = {};
    archives.forEach(arch => {
      if (arch.categories && Array.isArray(arch.categories)) {
        arch.categories.forEach(category => {
          categoryDistribution[category] = (categoryDistribution[category] || 0) + arch.postCount;
        });
      }
    });

    // Фильтруем только валидные даты
    const validDates = archives
      .filter(arch => arch.startDate && !isNaN(new Date(arch.startDate).getTime()))
      .map(arch => arch.startDate)
      .sort();
    
    return {
      totalArchives: archives.length,
      totalPosts,
      totalSize,
      oldestArchive: validDates[0] || '',
      newestArchive: validDates[validDates.length - 1] || '',
      categoryDistribution
    };
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    if (!dateString || dateString === '') {
      return 'Не указана';
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Неверная дата';
    }
    
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, searchQuery: e.target.value }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setState(prev => ({ ...prev, selectedCategory: e.target.value }));
  };

  const handleSortChange = (sortBy: 'date' | 'size' | 'posts') => {
    setState(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    setState(prev => ({
      ...prev,
      dateRange: { ...prev.dateRange, [field]: value }
    }));
  };

  const clearFilters = () => {
    setState(prev => ({
      ...prev,
      searchQuery: '',
      selectedCategory: '',
      dateRange: { start: '', end: '' },
      sortBy: 'date',
      sortOrder: 'desc'
    }));
  };

  // Получение уникальных категорий
  const allCategories = [...new Set(
    state.archives
      .filter(arch => arch.categories && Array.isArray(arch.categories))
      .flatMap(arch => arch.categories)
  )];

  return (
    <div className="archive-manager bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Заголовок и статистика */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">📦 Управление архивами</h2>
          <button
            onClick={loadArchives}
            disabled={state.isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {state.isLoading ? '🔄 Загрузка...' : '🔄 Обновить'}
          </button>
        </div>

        {state.stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{state.stats.totalArchives}</div>
              <div className="text-sm text-blue-800">Архивов</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{state.stats.totalPosts}</div>
              <div className="text-sm text-green-800">Постов</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{formatFileSize(state.stats.totalSize)}</div>
              <div className="text-sm text-purple-800">Общий размер</div>
            </div>
                         <div className="bg-orange-50 p-3 rounded-lg">
               <div className="text-lg font-bold text-orange-600">
                 {state.stats.oldestArchive ? formatDate(state.stats.oldestArchive) : 'Нет данных'}
               </div>
               <div className="text-sm text-orange-800">Старейший</div>
             </div>
             <div className="bg-pink-50 p-3 rounded-lg">
               <div className="text-lg font-bold text-pink-600">
                 {state.stats.newestArchive ? formatDate(state.stats.newestArchive) : 'Нет данных'}
               </div>
               <div className="text-sm text-pink-800">Новейший</div>
             </div>
          </div>
        )}
      </div>

      {/* Фильтры и поиск */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">🔍 Поиск</label>
            <input
              type="text"
              value={state.searchQuery}
              onChange={handleSearchChange}
              placeholder="Поиск по названию, тегам..."
              className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg bg-white text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">📂 Категория</label>
            <select
              value={state.selectedCategory}
              onChange={handleCategoryChange}
              className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Все категории</option>
              {allCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">📅 От даты</label>
            <input
              type="date"
              value={state.dateRange.start}
              onChange={(e) => handleDateRangeChange('start', e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">📅 До даты</label>
            <input
              type="date"
              value={state.dateRange.end}
              onChange={(e) => handleDateRangeChange('end', e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Сортировка:</span>
            {(['date', 'size', 'posts'] as const).map(sort => (
              <button
                key={sort}
                onClick={() => handleSortChange(sort)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  state.sortBy === sort
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {sort === 'date' && '📅 Дата'}
                {sort === 'size' && '📦 Размер'}
                {sort === 'posts' && '📄 Посты'}
                {state.sortBy === sort && (state.sortOrder === 'desc' ? ' ↓' : ' ↑')}
              </button>
            ))}
          </div>
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            🗑️ Очистить фильтры
          </button>
        </div>
      </div>

      <div className="flex h-96">
        {/* Список архивов */}
        <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📋 Архивы ({filteredArchives.length})
            </h3>
            {state.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredArchives.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                📭 Архивы не найдены
              </div>
            ) : (
              <div className="space-y-2">
                {filteredArchives.map(archive => (
                  <div
                    key={archive.id}
                    onClick={() => loadArchivePosts(archive)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                      state.selectedArchive?.id === archive.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                                             <span className="font-medium text-gray-900">{archive.filename || 'Без имени'}</span>
                                             <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                         {formatFileSize(archive.fileSize || 0)}
                       </span>
                    </div>
                                         <div className="text-sm text-gray-600 mb-2">
                       📅 {archive.startDate ? formatDate(archive.startDate) : 'Не указана'} - {archive.endDate ? formatDate(archive.endDate) : 'Не указана'}
                     </div>
                                         <div className="flex items-center justify-between">
                       <span className="text-sm text-gray-500">📄 {archive.postCount || 0} постов</span>
                       {archive.compressed && (
                         <span className="text-xs text-green-600">🗜️ Сжат</span>
                       )}
                     </div>
                    {archive.tags && Array.isArray(archive.tags) && archive.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {archive.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {archive.tags.length > 3 && (
                          <span className="text-xs text-gray-500">+{archive.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Список постов в выбранном архиве */}
        <div className="w-1/2 overflow-y-auto">
          <div className="p-4">
            {state.selectedArchive ? (
              <>
                                 <h3 className="text-lg font-semibold text-gray-900 mb-4">
                   📄 Посты в архиве: {state.selectedArchive.filename || 'Без имени'} ({filteredPosts.length})
                 </h3>
                {state.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    📭 Посты не найдены
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredPosts.map(post => (
                      <div
                        key={post.id}
                        onClick={() => onPostSelected?.(post)}
                        className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm cursor-pointer transition-all"
                      >
                                                 <h4 className="font-medium text-gray-900 mb-2">{post.title || 'Без заголовка'}</h4>
                                                 <div className="text-sm text-gray-600 mb-2">
                           📅 {post.createdAt ? formatDate(post.createdAt.toISOString()) : 'Дата не указана'} • 
                           📋 {post.type || 'Тип не указан'}
                         </div>
                                                 <div className="text-sm text-gray-700 line-clamp-2 mb-2">
                           {post.content ? post.content.substring(0, 150) + '...' : 'Содержимое не указано'}
                         </div>
                                                 {post.metadata.tags && Array.isArray(post.metadata.tags) && post.metadata.tags.length > 0 && (
                           <div className="flex flex-wrap gap-1">
                             {post.metadata.tags.slice(0, 5).map(tag => (
                               <span
                                 key={tag}
                                 className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                               >
                                 {tag}
                               </span>
                             ))}
                             {post.metadata.tags.length > 5 && (
                               <span className="text-xs text-gray-500">+{post.metadata.tags.length - 5}</span>
                             )}
                           </div>
                         )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                👈 Выберите архив для просмотра постов
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchiveManager;
