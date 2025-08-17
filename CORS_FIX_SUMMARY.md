# Исправление CORS проблемы для Binance API

## Проблема
В продакшене возникала CORS ошибка при обращении к Binance API:
```
Access to fetch at 'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=3000' 
from origin 'https://astrobit.online' has been blocked by CORS policy: 
Request header field expires is not allowed by Access-Control-Allow-Headers in preflight response.
```

## Причина
Binance API не поддерживает CORS (`'CORS': false` согласно CCXT документации), что делает невозможным прямое обращение из браузера.

## Решение
Реализован серверный прокси для обхода CORS ограничений.

### 1. Изменения в коде

#### BinanceApiService.ts
- Убраны лишние заголовки (`Cache-Control`, `Pragma`, `Expires`)
- Оставлены только необходимые заголовки (`Accept`, `Content-Type`)
- URL изменен на относительный `/binance-api/api/v3`

#### BinanceWebSocketService.ts
- WebSocket URL изменен на относительный `/binance-ws/ws/`
- Убрана условная логика dev/prod

#### vite.config.ts
- Убраны лишние заголовки из прокси конфигурации

### 2. Новые файлы

#### server.js
Express сервер с прокси для Binance API и WebSocket:
- `/binance-api/*` → `https://api.binance.com/*`
- `/binance-ws/*` → `wss://stream.binance.com:9443/*`
- Статические файлы из `dist/`

#### package.json
- Добавлены зависимости: `express`, `http-proxy-middleware`
- Изменен тип модуля на `commonjs`
- Добавлен скрипт `npm start`

#### postcss.config.js
- Исправлен для CommonJS (`module.exports` вместо `export default`)

### 3. Инструкции по развертыванию

#### DEPLOYMENT.md
Подробные инструкции по настройке:
- Nginx/Apache конфигурация
- PM2 для управления процессом
- Переменные окружения

#### deploy.sh
Автоматический скрипт развертывания:
- Проверка зависимостей
- Сборка проекта
- Запуск через PM2

## Архитектура
```
Клиент → Nginx/Apache → Express сервер → Binance API
                ↓
            Статические файлы (dist/)
```

## Преимущества решения
1. ✅ Решает CORS проблему полностью
2. ✅ Работает в dev и prod режимах
3. ✅ Безопасность - все запросы проходят через ваш сервер
4. ✅ Легкость развертывания
5. ✅ Возможность добавления rate limiting и других защит

## Использование

### Разработка
```bash
npm run dev  # Vite dev сервер с прокси
```

### Продакшен
```bash
npm run build  # Сборка
npm start      # Запуск Express сервера
# или
./deploy.sh   # Автоматическое развертывание
```

## Проверка
1. Откройте приложение в браузере
2. Проверьте консоль на наличие CORS ошибок
3. Убедитесь что данные загружаются корректно
4. Проверьте WebSocket соединения 