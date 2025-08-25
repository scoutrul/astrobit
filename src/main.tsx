import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PostingConfig } from './Posting/Infrastructure/config/PostingConfig';
import { logger } from './Shared/infrastructure/Logger';
import './Shared/presentation/styles/index.css';

try {
  logger.info('Запуск приложения AstroBit...');
  
  // Настраиваем Posting модуль
  PostingConfig.configure();
  
  const root = ReactDOM.createRoot(document.getElementById('root')!);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  logger.info('Приложение успешно запущено');
} catch (error) {
  logger.exception('Критическая ошибка при запуске приложения', error);
} 