import { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';

const STORAGE_KEY = 'admin_authenticated';
const ADMIN_HASH = import.meta.env.VITE_ADMIN_KEY_HASH || 'a8d6b85c9d2e4f7a3b5c8e1f4a7b9d2c5e8f1a4b7c9e2f5a8b1d4e7f0c3a6b9d2';

/**
 * Хук для управления админским доступом через комбинацию клавиш
 */
export const useAdminAccess = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [keySequence, setKeySequence] = useState<string>('');

  // Проверяем сохраненный статус при загрузке
  useEffect(() => {
    const savedAuth = localStorage.getItem(STORAGE_KEY);
    if (savedAuth === 'true') {
      setIsAdmin(true);
    }
  }, []);

  // Обработчик нажатий клавиш для секретной комбинации
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Игнорируем если фокус на поле ввода
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const newSequence = keySequence + event.key;
      
      // Ограничиваем длину последовательности
      const trimmedSequence = newSequence.length > 20 ? newSequence.slice(-20) : newSequence;
      setKeySequence(trimmedSequence);

      // Проверяем, содержит ли последовательность хеш
      const hash = CryptoJS.SHA256(trimmedSequence).toString();
      
      if (hash === ADMIN_HASH) {
        setIsAdmin(true);
        localStorage.setItem(STORAGE_KEY, 'true');
        setKeySequence('');
        
        // Показываем уведомление о входе
        console.log('🔐 Админский доступ активирован');
        
        // Опционально: показать toast уведомление
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('AstroBit Admin', {
            body: 'Админский доступ активирован',
            icon: '/favicon.ico'
          });
        }
        
        // Автоматически перенаправляем в админку (только если не на странице админки)
        if (window.location.pathname !== '/admin') {
          setTimeout(() => {
            window.location.href = '/admin';
          }, 500); // Небольшая задержка для показа уведомления
        }
      }
    };

    document.addEventListener('keypress', handleKeyPress);
    
    return () => {
      document.removeEventListener('keypress', handleKeyPress);
    };
  }, [keySequence]);

  // Функция выхода из админки
  const logout = () => {
    setIsAdmin(false);
    localStorage.removeItem(STORAGE_KEY);
    setKeySequence('');
    console.log('🔐 Админский доступ деактивирован');
  };

  // Функция принудительного входа (для разработки)
  const forceLogin = (password: string) => {
    const hash = CryptoJS.SHA256(password).toString();
    if (hash === ADMIN_HASH) {
      setIsAdmin(true);
      localStorage.setItem(STORAGE_KEY, 'true');
      
      // Автоматически перенаправляем в админку (только если не на странице админки)
      if (window.location.pathname !== '/admin') {
        setTimeout(() => {
          window.location.href = '/admin';
        }, 500);
      }
      
      return true;
    }
    return false;
  };

  return {
    isAdmin,
    logout,
    forceLogin,
    keySequence: keySequence.slice(-10) // Показываем только последние 10 символов для отладки
  };
};
