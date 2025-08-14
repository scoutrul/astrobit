import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './Shared/Presentation/styles/index.css'
import { AppDependencyConfig } from './Shared/infrastructure'

// Инициализация DI контейнера
AppDependencyConfig.configure();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
) 