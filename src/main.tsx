import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PostingConfig } from './Posting/Infrastructure/config/PostingConfig';
import { AppDependencyConfig } from './Shared/infrastructure/config/AppDependencyConfig';

import './Shared/presentation/styles/index.css';

try {
  // Запуск приложения AstroBit...
  
  // Настраиваем зависимости приложения (CryptoData, Astronomical, Charting)
  try {
    AppDependencyConfig.configure();
    console.info('[main] Зависимости приложения настроены');
  } catch (error) {
    console.error('[main] Ошибка настройки зависимостей приложения:', error);
    // Продолжаем выполнение, так как некоторые модули могут работать без зависимостей
  }
  
  // Настраиваем Posting модуль
  try {
    PostingConfig.configure();
    console.info('[main] Posting модуль настроен');
  } catch (error) {
    console.error('[main] Ошибка настройки Posting модуля:', error);
    // Продолжаем выполнение, так как Posting модуль не критичен для основного функционала
  }
  
  const root = ReactDOM.createRoot(document.getElementById('root')!);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.info('[main] Приложение успешно запущено');
} catch (error) {
  console.error('[main] Критическая ошибка при запуске приложения:', error);
} 