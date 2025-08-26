import React from 'react';
import { Post } from '../../Domain/entities/Post';
import { DateTimeFormatter } from '../../../Shared/infrastructure/utils/DateTimeFormatter';
import { useTelegramPost } from '../hooks/useTelegramPost';
import { PostType, POST_TYPE_LABELS } from '../../Domain/value-objects/PostType';

interface PostCardProps {
  post: Post;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onTelegramSent?: (postId: string, messageId: number) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onEdit, onDelete, onTelegramSent }) => {
  const { state, sendToTelegram, retryLastSend } = useTelegramPost();
  
  const handleDeleteClick = () => {
    onDelete(post.id);
  };

  const handleTelegramSend = async () => {
    // Передаем callback прямо в sendToTelegram
    await sendToTelegram(post, undefined, (messageId: number) => {
      if (onTelegramSent) {
        onTelegramSent(post.id, messageId);
      }
    });
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
              {POST_TYPE_LABELS[post.type as PostType] || post.type}
            </span>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 mb-4">
        <p>Запланировано: {DateTimeFormatter.formatDateTime(post.scheduledAt)}</p>
        {post.publishedAt && (
          <p>Опубликовано: {DateTimeFormatter.formatDateTime(post.publishedAt)}</p>
        )}
        {post.telegramMessageId && (
          <p>Telegram ID: {post.telegramMessageId}</p>
        )}
      </div>

      {/* Индикатор статуса отправки в Telegram */}
      {(state.loading || state.success || state.error) && (
        <div className="mb-4 p-2 rounded-lg text-xs">
          {state.loading && (
            <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-2 rounded">
              <span>⏳</span>
              <span>Отправка в Telegram...</span>
            </div>
          )}
          {state.success && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded">
              <span>✅</span>
              <span>Отправлено! ID: {state.messageId}</span>
            </div>
          )}
          {state.error && (
            <div className="flex items-center justify-between text-red-600 bg-red-50 p-2 rounded">
              <div className="flex items-center gap-2">
                <span>❌</span>
                <span>{state.error}</span>
              </div>
              <button
                onClick={retryLastSend}
                className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
              >
                🔄 Повторить
              </button>
            </div>
          )}
        </div>
      )}

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
            onClick={handleTelegramSend}
            disabled={state.loading}
            className={`px-3 py-1 rounded text-sm ${
              state.loading
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {state.loading ? '⏳' : '📤'} Опубликовать в Telegram
          </button>
        )}
      </div>
    </div>
  );
};
