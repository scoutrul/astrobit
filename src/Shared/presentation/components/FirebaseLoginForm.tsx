import React, { useState } from 'react';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';

/**
 * Форма входа в систему через Firebase
 */
export const FirebaseLoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  
  const { login, resetPassword, loading, error, clearError } = useFirebaseAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!email || !password) {
      return;
    }

    const success = await login(email, password);
    if (success) {
      // Перенаправление произойдет автоматически через useFirebaseAuth
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail) {
      return;
    }

    const success = await resetPassword(resetEmail);
    if (success) {
      setResetSent(true);
    }
  };

  if (showResetForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8">
          {/* Заголовок */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Восстановление пароля
            </h1>
            <p className="text-gray-300 text-sm">
              {resetSent ? 'Проверьте вашу почту' : 'Введите ваш email адрес'}
            </p>
          </div>

          {resetSent ? (
            <div className="text-center">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
                <p className="text-green-300 text-sm">
                  Инструкции по восстановлению пароля отправлены на ваш email
                </p>
              </div>
              <button
                onClick={() => {
                  setShowResetForm(false);
                  setResetSent(false);
                  setResetEmail('');
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
              >
                Вернуться к входу
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} autoComplete="on">
              <div className="mb-6">
                <label htmlFor="reset-email" className="sr-only">Email для восстановления</label>
                <input
                  id="reset-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="Email администратора"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                  required
                  spellCheck="false"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
                >
                  {loading ? 'Отправляем...' : 'Восстановить пароль'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowResetForm(false)}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
                >
                  Назад к входу
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8">
        {/* Логотип и заголовок */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-gray-900">AB</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            AstroBit Admin
          </h1>
          <p className="text-gray-300 text-sm">
            Вход в административную панель
          </p>
        </div>

        {/* Форма входа */}
        <form onSubmit={handleSubmit} autoComplete="on">
          <div className="space-y-4 mb-6">
            <div>
              <label htmlFor="admin-email" className="sr-only">Email администратора</label>
              <input
                id="admin-email"
                type="email"
                name="username"
                autoComplete="username email"
                autoFocus
                placeholder="Email администратора"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                required
                spellCheck="false"
              />
            </div>
            
            <div>
              <label htmlFor="admin-password" className="sr-only">Пароль</label>
              <input
                id="admin-password"
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                required
              />
            </div>
          </div>

          {/* Ошибки */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Кнопки */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              {loading ? 'Вход...' : 'Войти в админку'}
            </button>
            
            <button
              type="button"
              onClick={() => setShowResetForm(true)}
              className="w-full text-gray-300 hover:text-white text-sm transition-colors duration-200"
            >
              Забыли пароль?
            </button>

            <button
              type="button"
              onClick={() => window.location.href = '/'}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
            >
              Вернуться на главную
            </button>
          </div>
        </form>

        {/* Информация */}
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-gray-400 text-xs">
            Безопасная авторизация через Firebase
          </p>
        </div>
      </div>
    </div>
  );
};

