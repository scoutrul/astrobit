# AstroBit - Инструкции по развертыванию

## Проблема с CORS

В продакшене Binance API не поддерживает CORS, что вызывает ошибки:
```
Access to fetch at 'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=3000' 
from origin 'https://astrobit.online' has been blocked by CORS policy: 
Request header field expires is not allowed by Access-Control-Allow-Headers in preflight response.
```

## Решение

Для решения проблемы CORS используется серверный прокси, который перенаправляет запросы к Binance API.

## Развертывание

### 1. Сборка проекта
```bash
npm run build
```

### 2. Запуск продакшн сервера
```bash
npm start
```

Сервер запустится на порту 3000 (или PORT из переменных окружения).

### 3. Настройка веб-сервера (Nginx/Apache)

#### Nginx конфигурация:
```nginx
server {
    listen 80;
    server_name astrobit.online;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /binance-api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /binance-ws/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Apache конфигурация:
```apache
<VirtualHost *:80>
    ServerName astrobit.online
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    ProxyPass /binance-api/ http://localhost:3000/binance-api/
    ProxyPassReverse /binance-api/ http://localhost:3000/binance-api/
    
    ProxyPass /binance-ws/ http://localhost:3000/binance-ws/
    ProxyPassReverse /binance-ws/ http://localhost:3000/binance-ws/
</VirtualHost>
```

### 4. Использование PM2 для управления процессом

```bash
# Установка PM2
npm install -g pm2

# Запуск приложения
pm2 start server.js --name astrobit

# Автозапуск при перезагрузке
pm2 startup
pm2 save

# Мониторинг
pm2 status
pm2 logs astrobit
```

### 5. Переменные окружения

```bash
# Порт сервера (по умолчанию 3000)
PORT=3000

# Другие настройки
NODE_ENV=production
```

## Архитектура прокси

```
Клиент → Nginx/Apache → Express сервер → Binance API
                ↓
            Статические файлы (dist/)
```

## Проверка работы

1. Откройте `https://astrobit.online`
2. Проверьте консоль браузера на наличие CORS ошибок
3. Убедитесь, что данные загружаются корректно

## Отладка

### Логи сервера:
```bash
npm start
# или
pm2 logs astrobit
```

### Проверка прокси:
```bash
curl http://localhost:3000/binance-api/api/v3/ping
```

## Безопасность

- Прокси удаляет заголовки `origin` и `referer` для предотвращения CORS проблем
- Все запросы проходят через ваш сервер
- Рекомендуется настроить rate limiting для предотвращения злоупотреблений 