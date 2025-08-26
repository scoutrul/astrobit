import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PostingConfig } from './Posting/Infrastructure/config/PostingConfig';

import './Shared/presentation/styles/index.css';

try {
  // Запуск приложения AstroBit...
  
  // Настраиваем Posting модуль
  PostingConfig.configure();
  
  const root = ReactDOM.createRoot(document.getElementById('root')!);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
      // Приложение успешно запущено
} catch (error) {
  console.error('Критическая ошибка при запуска приложения:', error);
} 