# 🔐 Настройка Firebase Authentication для AstroBit

## 📋 Обзор

Этот документ содержит пошаговую инструкцию по настройке Firebase Authentication для админ-панели AstroBit. Firebase предоставляет бесплатный и безопасный способ аутентификации пользователей.

## 🚀 Шаг 1: Создание проекта Firebase

### 1.1 Переход на Firebase Console
1. Откройте [Firebase Console](https://console.firebase.google.com/)
2. Войдите в свой Google аккаунт
3. Нажмите "Создать проект"

### 1.2 Настройка проекта
1. **Название проекта**: `astrobit-admin` (или любое другое)
2. **Google Analytics**: Отключить (не обязательно для админки)
3. Нажмите "Создать проект"

## 🔧 Шаг 2: Настройка Authentication

### 2.1 Включение Authentication
1. В левом меню выберите "Authentication"
2. Нажмите "Начать"
3. Выберите вкладку "Sign-in method"

### 2.2 Настройка Email/Password
1. Нажмите на "Email/Password"
2. Включите "Email/Password"
3. Включите "Email link (passwordless sign-in)" - опционально
4. Нажмите "Сохранить"

### 2.3 Создание первого пользователя
1. Перейдите на вкладку "Users"
2. Нажмите "Добавить пользователя"
3. Введите email: `admin@astrobit.online` (или ваш email)
4. Введите временный пароль (например: `Admin123!`)
5. Нажмите "Добавить пользователя"

## 📱 Шаг 3: Настройка веб-приложения

### 3.1 Добавление веб-приложения
1. В левом меню выберите "Project Overview"
2. Нажмите на иконку веб-приложения (</>)
3. Введите название: `AstroBit Admin`
4. Включите "Firebase Hosting" - опционально
5. Нажмите "Зарегистрировать приложение"

### 3.2 Получение конфигурации
После регистрации вы получите код конфигурации:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "astrobit-admin.firebaseapp.com",
  projectId: "astrobit-admin",
  storageBucket: "astrobit-admin.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

## 🔑 Шаг 4: Настройка переменных окружения

### 4.1 Создание .env файла
Создайте файл `.env` в корне проекта:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyC...
VITE_FIREBASE_AUTH_DOMAIN=astrobit-admin.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=astrobit-admin
VITE_FIREBASE_STORAGE_BUCKET=astrobit-admin.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123def456

# Admin Emails (через запятую)
VITE_ADMIN_EMAILS=admin@astrobit.online,another@example.com
```

### 4.2 Обновление .env.example
Файл `.env.example` уже создан с правильными переменными.

## 📦 Шаг 5: Установка зависимостей

### 5.1 Установка Firebase SDK
```bash
npm install firebase
```

### 5.2 Проверка package.json
Убедитесь, что в `package.json` добавлена зависимость:
```json
{
  "dependencies": {
    "firebase": "^10.x.x"
  }
}
```

## ⚙️ Шаг 6: Настройка Firebase в коде

### 6.1 Обновление конфигурации
Откройте `src/firebase/config.ts` и замените конфигурацию:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Получаем список админов из переменных окружения
export const ADMIN_EMAILS = import.meta.env.VITE_ADMIN_EMAILS?.split(',') || ['admin@astrobit.online'];
```

## 🧪 Шаг 7: Тестирование

### 7.1 Запуск приложения
```bash
npm run dev
```

### 7.2 Проверка входа
1. Откройте `/admin` в браузере
2. Войдите с созданными учетными данными
3. Убедитесь, что вы перенаправлены в админ-панель

### 7.3 Проверка безопасности
1. Попробуйте войти с неверным email/паролем
2. Убедитесь, что не-админы не могут войти
3. Проверьте, что выход работает корректно

## 🔒 Шаг 8: Дополнительная безопасность

### 8.1 Правила Firebase
В Firebase Console > Firestore Database > Rules (если используете базу данных):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Только аутентифицированные админы
    match /{document=**} {
      allow read, write: if request.auth != null && 
        request.auth.token.email in ['admin@astrobit.online'];
    }
  }
}
```

### 8.2 Ограничения по IP (опционально)
В Firebase Console > Authentication > Settings > Authorized domains:
- Добавьте только ваши домены
- Удалите `localhost` для продакшена

## 🚨 Шаг 9: Устранение неполадок

### 9.1 Ошибка "Firebase: Error (auth/invalid-api-key)"
- Проверьте правильность `VITE_FIREBASE_API_KEY`
- Убедитесь, что `.env` файл создан в корне проекта

### 9.2 Ошибка "Firebase: Error (auth/user-not-found)"
- Проверьте, что пользователь создан в Firebase Console
- Убедитесь, что email точно совпадает

### 9.3 Ошибка "Firebase: Error (auth/wrong-password)"
- Проверьте правильность пароля
- Попробуйте сбросить пароль через Firebase Console

### 9.4 Проблемы с переменными окружения
- Перезапустите dev сервер после изменения `.env`
- Убедитесь, что переменные начинаются с `VITE_`
- Проверьте синтаксис файла `.env`

## 📚 Шаг 10: Полезные ссылки

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Auth Guide](https://firebase.google.com/docs/auth)
- [Firebase Console](https://console.firebase.google.com/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

## ✅ Чек-лист завершения

- [ ] Проект Firebase создан
- [ ] Authentication включен
- [ ] Первый админ создан
- [ ] Веб-приложение зарегистрировано
- [ ] `.env` файл настроен
- [ ] Зависимости установлены
- [ ] Конфигурация обновлена
- [ ] Тестирование пройдено
- [ ] Дополнительная безопасность настроена

## 🎯 Готово!

После выполнения всех шагов у вас будет:
- 🔐 Безопасная админ-панель с Firebase Authentication
- 👤 Система ролей на основе email
- 🚫 Защита от несанкционированного доступа
- 📱 Адаптивный интерфейс входа
- 🔄 Автоматическое перенаправление после входа
- 🚪 Простой выход без подтверждения

Админ-панель будет доступна по адресу `/admin` только для аутентифицированных пользователей с email из списка `ADMIN_EMAILS`.

