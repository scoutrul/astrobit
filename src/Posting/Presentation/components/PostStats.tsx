import React from 'react';
import { Post } from '../../Domain/entities/Post';
import { PostStatus } from '../../Domain/value-objects/PostStatus';

interface PostStatsProps {
  posts: Post[];
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
}

export const PostStats: React.FC<PostStatsProps> = ({ posts, selectedFilter, onFilterChange }) => {
  const stats = {
    total: posts.length,
    draft: posts.filter(p => p.status === PostStatus.DRAFT).length,
    scheduled: posts.filter(p => p.status === PostStatus.SCHEDULED).length,
    published: posts.filter(p => p.status === PostStatus.PUBLISHED).length,
    failed: posts.filter(p => p.status === PostStatus.FAILED).length
  };

  const cards = [
    { label: 'Все посты', value: stats.total, icon: '📊', color: 'bg-blue-500', filter: 'all' },
    { label: 'Черновики', value: stats.draft, icon: '📝', color: 'bg-gray-500', filter: PostStatus.DRAFT },
    { label: 'Запланированы', value: stats.scheduled, icon: '⏰', color: 'bg-yellow-500', filter: PostStatus.SCHEDULED },
    { label: 'Опубликованы', value: stats.published, icon: '✅', color: 'bg-green-500', filter: PostStatus.PUBLISHED },
    { label: 'Ошибки', value: stats.failed, icon: '❌', color: 'bg-red-500', filter: PostStatus.FAILED }
  ];

  return (
    <div className="flex flex-wrap gap-4 mb-6">
      {cards.map((card, index) => (
        <div 
          key={index} 
          className={`bg-white rounded-lg shadow p-4 border cursor-pointer transition-all hover:shadow-lg min-w-[200px] ${
            selectedFilter === card.filter ? 'ring-2 ring-blue-500 border-blue-300' : 'border-gray-200'
          }`}
          onClick={() => onFilterChange(card.filter)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
            <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center text-white text-xl`}>
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
