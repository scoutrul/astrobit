# 🚀 Быстрый старт Firebase для AstroBit

## ⚡ 5 минут до работающей админки

### 1. Создайте проект Firebase
- Перейдите на [console.firebase.google.com](https://console.firebase.google.com/)
- Нажмите "Создать проект" → `astrobit-admin`
- Отключите Google Analytics

### 2. Включите Authentication
- В меню выберите "Authentication" → "Начать"
- Включите "Email/Password" в "Sign-in method"

### 3. Создайте админа
- Перейдите на "Users" → "Добавить пользователя"
- Email: `admin@astrobit.online`
- Пароль: `Admin123!`

### 4. Получите конфигурацию
- В "Project Overview" нажмите на иконку веб-приложения (</>)
- Название: `AstroBit Admin`
- Скопируйте `firebaseConfig`

### 5. Настройте переменные
Создайте `.env` в корне проекта:
```bash
VITE_FIREBASE_API_KEY=ваш_api_key
VITE_FIREBASE_AUTH_DOMAIN=astrobit-admin.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=astrobit-admin
VITE_FIREBASE_STORAGE_BUCKET=astrobit-admin.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_ADMIN_EMAILS=admin@astrobit.online
```

### 6. Запустите и тестируйте
```bash
npm run dev
```
Откройте `/admin` и войдите с созданными учетными данными!

## 📚 Подробная инструкция
См. [FIREBASE_ADMIN_SETUP.md](./FIREBASE_ADMIN_SETUP.md) для детального описания всех шагов.

## 🆘 Если что-то не работает
- Проверьте консоль браузера на ошибки
- Убедитесь, что `.env` файл создан в корне проекта
- Перезапустите dev сервер после изменения `.env`
- Проверьте, что все переменные начинаются с `VITE_`
