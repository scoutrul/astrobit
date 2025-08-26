import React from 'react';
import { Post } from '../../Domain/entities/Post';
import { DateTimeFormatter } from '../../../Shared/infrastructure/utils/DateTimeFormatter';

interface PostCardProps {
  post: Post;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onEdit, onDelete, onPublish }) => {
  const handleDeleteClick = () => {
    onDelete(post.id);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
          <p className="text-gray-600 text-sm mb-2">{post.content}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className={`px-2 py-1 rounded-full ${
              post.status === 'draft' ? 'bg-gray-100 text-gray-700' :
              post.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
              post.status === 'published' ? 'bg-green-100 text-green-700' :
              'bg-red-100 text-red-700'
            }`}>
              {post.status}
            </span>
            <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-700">
              {post.type}
            </span>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 mb-4">
        <p>Запланировано: {DateTimeFormatter.formatDateTime(post.scheduledAt)}</p>
        {post.publishedAt && (
          <p>Опубликовано: {DateTimeFormatter.formatDateTime(post.publishedAt)}</p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(post.id)}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
        >
          ✏️ Редактировать
        </button>
        <button
          onClick={handleDeleteClick}
          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
        >
          🗑️ Удалить
        </button>
        {post.status === 'draft' && (
          <button
            onClick={() => onPublish(post.id)}
            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
          >
            📤 Опубликовать
          </button>
        )}
      </div>
    </div>
  );
};
