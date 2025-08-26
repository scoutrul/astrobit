import React from 'react';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { FirebaseLoginForm } from './FirebaseLoginForm';

interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Компонент для защиты админских страниц через Firebase
 */
export const AdminGuard: React.FC<AdminGuardProps> = ({ children, fallback }) => {
  const { isAdmin, loading } = useFirebaseAuth();

  // Показываем загрузку пока проверяем авторизацию
  if (loading) {
    return <AdminLoading />;
  }

  // Если не авторизован как админ - показываем форму входа
  if (!isAdmin) {
    return fallback || <FirebaseLoginForm />;
  }

  // Если авторизован - показываем защищенный контент
  return <>{children}</>;
};

/**
 * Компонент загрузки проверки авторизации
 */
const AdminLoading: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800 flex items-center justify-center px-4">
      <div className="text-center">
        {/* Spinner */}
        <div className="w-16 h-16 mx-auto mb-4">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
        </div>
        
        {/* Текст */}
        <h2 className="text-xl font-semibold text-white mb-2">
          Проверка доступа
        </h2>
        <p className="text-gray-300 text-sm">
          Подождите, проверяем ваши права...
        </p>
      </div>
    </div>
  );
};
