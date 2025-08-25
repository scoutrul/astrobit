# Технический контекст AstroBit

## Платформа и окружение
- **OS:** Windows 10 (win32 10.0.19045)
- **Shell:** PowerShell
- **Node.js:** Требуется версия >=14.0.0
- **Package Manager:** npm/pnpm (pnpm-lock.yaml присутствует)

## Зависимости проекта

### Основные зависимости
- **React 19.1.0:** Основной UI фреймворк
- **TypeScript 5.8.3:** Типизация и компиляция
- **Vite 6.0.1:** Сборка и разработка
- **Tailwind CSS 3.4.4:** Стилизация

### Специализированные библиотеки
- **Lightweight Charts 4.1.3:** Финансовые графики
- **CCXT 4.4.97:** Криптовалютные API
- **Собственные алгоритмы:** Астрономические расчеты лунных фаз, затмений и планетарных аспектов
- **Zustand 5.0.6:** Управление состоянием

### Dev зависимости
- **@vitejs/plugin-react:** React плагин для Vite
- **PostCSS + Autoprefixer:** CSS обработка
- **ESLint:** Линтинг кода

## Конфигурация сборки
- **Vite:** React плагин настроен
- **TypeScript:** ES2020 target, React JSX
- **PostCSS:** Tailwind CSS интеграция
- **Build scripts:** dev, build, lint, preview

## Архитектурные паттерны
- **Clean Architecture:** Разделение на слои
- **Domain-Driven Design:** Бизнес-логика в Domain
- **Repository Pattern:** Абстракция данных
- **Use Case Pattern:** Бизнес-операции
- **Component-Based UI:** React компоненты
