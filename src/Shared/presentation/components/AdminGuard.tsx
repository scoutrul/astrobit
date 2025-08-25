import React from 'react';
import { useAdminAccess } from '../hooks/useAdminAccess';

interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Компонент для защиты админских страниц
 */
export const AdminGuard: React.FC<AdminGuardProps> = ({ children, fallback }) => {
  const { isAdmin } = useAdminAccess();

  if (!isAdmin) {
    return fallback || <AccessDenied />;
  }

  return <>{children}</>;
};

/**
 * Компонент отказа в доступе
 */
const AccessDenied: React.FC = () => {
  const { keySequence } = useAdminAccess();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 text-center">
        {/* Иконка замка */}
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>

        {/* Заголовок */}
        <h1 className="text-2xl font-bold text-white mb-4">
          Доступ запрещен
        </h1>

        {/* Описание */}
        <p className="text-gray-300 mb-6">
          У вас нет прав доступа к административной панели AstroBit.
        </p>

        {/* Подсказка для разработчика */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
            <p className="text-yellow-200 text-sm">
              <strong>Dev mode:</strong> Введите секретную комбинацию клавиш для доступа
            </p>
            {keySequence && (
              <p className="text-yellow-300 text-xs mt-2 font-mono">
                Последние символы: ...{keySequence}
              </p>
            )}
          </div>
        )}

        {/* Кнопка возврата */}
        <button
          onClick={() => window.location.href = '/'}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
        >
          Вернуться на главную
        </button>

        {/* Информация */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-gray-400 text-sm">
            AstroBit Admin Panel
          </p>
        </div>
      </div>
    </div>
  );
};
