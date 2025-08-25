import React from 'react';
import { useAdminAccess } from '../hooks/useAdminAccess';

/**
 * Компонент для отображения статуса админа (только в dev режиме)
 */
export const AdminStatus: React.FC = () => {
  const { isAdmin, logout, keySequence } = useAdminAccess();

  // Показываем только в режиме разработки
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white text-sm max-w-xs ${
        isAdmin ? 'border-l-4 border-green-400' : 'border-l-4 border-gray-400'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isAdmin ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
            }`}></div>
            <span className="font-medium">
              {isAdmin ? 'Админ активен' : 'Админ неактивен'}
            </span>
          </div>
          
          {isAdmin && (
            <button
              onClick={logout}
              className="ml-2 text-gray-300 hover:text-white transition-colors"
              title="Выйти из админки"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Показываем последние символы для отладки */}
        {!isAdmin && keySequence && (
          <div className="mt-2 pt-2 border-t border-gray-600">
            <div className="text-xs text-gray-300">
              Последние символы: <span className="font-mono">{keySequence}</span>
            </div>
          </div>
        )}

        {/* Ссылка на админку если авторизован */}
        {isAdmin && (
          <div className="mt-2 pt-2 border-t border-gray-600">
            <a
              href="/admin"
              className="text-blue-300 hover:text-blue-200 underline text-xs"
            >
              Перейти в админку
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
