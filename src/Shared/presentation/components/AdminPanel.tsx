import React from 'react';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { DateTimeFormatter } from '../../infrastructure/utils/DateTimeFormatter';

interface AdminPanelProps {
  children: React.ReactNode;
  title?: string;
}

/**
 * Обертка для админской панели с кнопкой выхода
 */
export const AdminPanel: React.FC<AdminPanelProps> = ({ children, title = 'Панель администратора' }) => {
  const { logout, user } = useFirebaseAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Админская шапка */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Логотип и заголовок */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="text-white font-semibold text-lg">AstroBit</span>
              </div>
              <div className="h-6 w-px bg-white/30"></div>
              <h1 className="text-white font-medium">{title}</h1>
            </div>

            {/* Кнопки управления */}
            <div className="flex items-center space-x-3">
              {/* Ссылка на главную */}
              <a
                href="/"
                className="text-white/80 hover:text-white transition-colors duration-200 flex items-center space-x-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-sm">Главная</span>
              </a>

              {/* Разделитель */}
              <div className="h-6 w-px bg-white/30"></div>

              {/* Статус админа */}
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white/80 text-sm">
                  {user?.email || 'Админ активен'}
                </span>
              </div>

              {/* Кнопка выхода */}
              <button
                onClick={handleLogout}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center space-x-1.5 text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Выход</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </div>

      {/* Подвал админки */}
      <div className="mt-auto bg-gray-100 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <p>
              © 2025 AstroBit. Административная панель.
            </p>
            <div className="flex items-center space-x-4 text-xs">
              <span>{DateTimeFormatter.formatDate(new Date())}</span>
              <span>Локаль: {DateTimeFormatter.getCurrentLocale()}</span>
              <span>Часовой пояс: {DateTimeFormatter.getTimezoneInfo().offset}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
