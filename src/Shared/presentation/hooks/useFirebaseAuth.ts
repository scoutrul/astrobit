import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  User,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, ADMIN_EMAILS } from '../../../firebase/config';


interface AuthState {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Хук для управления Firebase авторизацией
 */
export const useFirebaseAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAdmin: false,
    loading: true,
    error: null
  });

  // Слушаем изменения состояния авторизации
  useEffect(() => {
    if (!auth) {
      setAuthState({
        user: null,
        isAdmin: false,
        loading: false,
        error: 'Firebase не настроен'
      });
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const isAdmin = user ? ADMIN_EMAILS.includes(user.email || '') : false;
      
      setAuthState({
        user,
        isAdmin,
        loading: false,
        error: null
      });

      if (user && isAdmin) {
        // Админ авторизован
      } else if (user && !isAdmin) {
        // Неавторизованная попытка входа
      }
    });

    return unsubscribe;
  }, []);

  /**
   * Вход в систему
   */
  const login = async (email: string, password: string): Promise<boolean> => {
    if (!auth) {
      setAuthState(prev => ({ 
        ...prev, 
        error: 'Firebase не настроен',
        loading: false 
      }));
      return false;
    }

    try {
      setAuthState(prev => ({ ...prev, error: null, loading: true }));
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Проверяем, что пользователь в списке админов
      if (!ADMIN_EMAILS.includes(user.email || '')) {
        await signOut(auth);
        throw new Error('У вас нет прав администратора');
      }

      // Успешный вход администратора
      return true;
      
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error.code);
      // Ошибка авторизации
      
      setAuthState(prev => ({ 
        ...prev, 
        error: errorMessage,
        loading: false 
      }));
      
      return false;
    }
  };

  /**
   * Выход из системы
   */
  const logout = async (): Promise<void> => {
    if (!auth) return;
    
    try {
      await signOut(auth);
      // Администратор вышел из системы
    } catch (error) {
      // Ошибка выхода
    }
  };

  /**
   * Сброс пароля
   */
  const resetPassword = async (email: string): Promise<boolean> => {
    if (!auth) {
      setAuthState(prev => ({ ...prev, error: 'Firebase не настроен' }));
      return false;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      // Отправлен запрос на сброс пароля
      return true;
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error.code);
      setAuthState(prev => ({ ...prev, error: errorMessage }));
      // Ошибка сброса пароля
      return false;
    }
  };

  /**
   * Очистка ошибки
   */
  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  return {
    user: authState.user,
    isAdmin: authState.isAdmin,
    loading: authState.loading,
    error: authState.error,
    login,
    logout,
    resetPassword,
    clearError
  };
};

/**
 * Преобразование Firebase ошибок в понятные сообщения
 */
const getFirebaseErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'Пользователь с таким email не найден';
    case 'auth/wrong-password':
      return 'Неверный пароль';
    case 'auth/invalid-email':
      return 'Некорректный email адрес';
    case 'auth/user-disabled':
      return 'Аккаунт заблокирован';
    case 'auth/too-many-requests':
      return 'Слишком много попыток входа. Попробуйте позже';
    case 'auth/network-request-failed':
      return 'Ошибка сети. Проверьте подключение к интернету';
    case 'auth/invalid-credential':
      return 'Неверные учетные данные';
    default:
      return 'Произошла ошибка авторизации. Попробуйте еще раз';
  }
};
