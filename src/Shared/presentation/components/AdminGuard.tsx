import React from 'react';

interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Компонент защиты админских маршрутов
 * В чистом фронтенде просто возвращает children без проверки авторизации
 */
export const AdminGuard: React.FC<AdminGuardProps> = ({ children, fallback }) => {
  // В чистом фронтенде без бекенда просто возвращаем children
  return <>{children}</>;
};
