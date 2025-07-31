import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AppDependencyConfig } from './config/DependencyConfig'

// Инициализация DI контейнера
AppDependencyConfig.configure();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
) 