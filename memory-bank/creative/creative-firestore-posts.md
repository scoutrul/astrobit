# 🎨🎨🎨 ENTERING CREATIVE PHASE: ARCHITECTURE (Firestore Posts)

## Описание компонента
Система управления постами должна перейти с localStorage/JSON на Firebase Firestore, сохранив публичные интерфейсы DDD: сущность `Post`, value-objects (статусы, теги), интерфейсы репозиториев (`IPostRepository`, `ITagStatsRepository`) и use cases. Требуется спроектировать схему коллекций, индексы, правила безопасности и варианты запросов, чтобы поддержать CRUD, фильтры (status, type, tags, даты), пагинацию и архивирование.

## Требования и ограничения
- DDD/SOLID: UI и Application зависят от абстракций, репозитории — адаптеры к Firestore.
- Функции:
  - CRUD для постов
  - Фильтрация по `status`, `type`, `tags[]`, временным полям (`createdAt`, `scheduledAt`)
  - Пагинация (cursor-based)
  - Архивирование/статусы: `draft, approved, scheduled, publishing, published, failed, cancelled`
  - Статистика тегов (счётчики/последнее использование)
- Нефункциональные:
  - Прозрачные индексы, предсказуемая стоимость запросов
  - Явные правила безопасности под админку (read/write только для аутентифицированного админа)
  - Минимизация fan-out и горячих ключей

## Варианты архитектуры

### Вариант A: Одна коллекция `posts` + отдельная `tagStats`
- Коллекции:
  - `posts/{postId}`: все поля поста
  - `tagStats/{tagId}`: агрегаты по тегу
- Документ `posts` (минимум):
  - id (string, docId)
  - title (string)
  - content (string)
  - status (string enum)
  - type (string)
  - tags (array<string>)
  - createdAt (Timestamp)
  - updatedAt (Timestamp)
  - scheduledAt (Timestamp | null)
  - authorId (string)
  - publishedAt (Timestamp | null)
  - metadata (map: template, variables, priority, astronomicalEvents[], marketData)
  - images (array<string>)
  - telegramMessageId (string | null)
- Запросы: комбинированные where + orderBy + limit; массивные теги через `array-contains`/`array-contains-any`.
- Индексы: составные по популярным комбинациям (см. ниже).
- Плюсы:
  - Простая модель, меньше накладных расходов
  - Лёгкая миграция, mapping домен↔DTO прямолинеен
- Минусы:
  - Крупные документы при богатом `metadata` (но укладывается в лимиты, можно поджать через выборочные поля)

### Вариант B: `posts` + подколлекции `posts/{id}/revisions`, `posts/{id}/meta`
- Хранить историю ревизий/большие поля отдельно
- Плюсы: гибкость, снижение размера основного документа, аудит
- Минусы: усложнение запросов и индексов; дорого для стартовой миграции

### Вариант C: Денормализация под каналы публикации
- Разделить по статусам/каналам: `posts_draft`, `posts_published`, и т.п.
- Плюсы: простые однообразные индексы в каждой коллекции
- Минусы: сложная консистентность и миграции между коллекциями, фан-аут

## Анализ и оценка
- Критерии: простота миграции, соответствие DDD, стоимость запросов, масштабируемость, безопасность.
- A побеждает как минимально сложный и масштабируемый стартовый вариант. B можно добавить позже для `revisions` без слома контракта. C отклоняем.

## Рекомендованный подход
- Принять Вариант A сейчас; зарезервировать опцию B для истории ревизий в будущем.

## Схема данных (Рекомендация)
- Коллекции:
  - `posts`: основной ресурс
  - `tagStats`: агрегаты по тегам
- `posts` поля:
  - id (docId)
  - title, content, type
  - status ∈ {draft, approved, scheduled, publishing, published, failed, cancelled}
  - tags[]
  - createdAt, updatedAt, scheduledAt?, publishedAt?
  - authorId
  - images[]?, telegramMessageId?
  - metadata: { template, variables(map), priority('low'|'medium'|'high'), astronomicalEvents[], marketData }
- `tagStats` поля:
  - id (docId = tag)
  - count (number)
  - lastUsedAt (Timestamp)

## Индексы Firestore (минимальный набор)
- posts:
  - where(status == X) orderBy(createdAt desc)
  - where(type == X) orderBy(createdAt desc)
  - where(tags array-contains X) orderBy(createdAt desc)
  - where(status == 'scheduled') orderBy(scheduledAt asc)
  - orderBy(createdAt desc) (single-field достаточен, но явно проверяем)
- Реализация: создать через консоль/`indexes.json` (перечень в IMPLEMENT-фазе).

## Запросы и пагинация
- Cursor-based пагинация через `startAfter(lastSnapshot)` + `limit(pageSize)`
- Фильтры:
  - По статусу: `where('status','==',value).orderBy('createdAt','desc')`
  - По типу: `where('type','==',value).orderBy('createdAt','desc')`
  - По тегу: `where('tags','array-contains',tag).orderBy('createdAt','desc')`
  - Запланированные: `where('status','==','scheduled').orderBy('scheduledAt','asc')`

## Маппинг Domain ↔ Firestore DTO
- `Post.id` ↔ docId
- Date ↔ Timestamp (при чтении/записи конвертировать)
- `metadata.variables` — map<string, any> (валидировать типы ключевых полей)
- Гарантировать заполнение `createdAt/updatedAt` (клиентом) и обновление `updatedAt` при каждом `save`

## Безопасность (Security Rules) — варианты

### Вариант S1: Жёсткая админ-панель (только аутентифицированные админы)
- Допуск: `request.auth != null` и email ∈ ADMIN_EMAILS
- Плюсы: просто и безопасно; соответствует текущему сценарию
- Минусы: требует синхронизации списка админов

### Вариант S2: Ролевые клеймы (custom claims)
- Настраивать `request.auth.token.role == 'admin'`
- Плюсы: централизованные роли
- Минусы: нужна серверная выдача клеймов

Рекомендация: S1 сейчас; S2 — как эволюция.

Пример правил (S1, упрощённо):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null &&
             request.auth.token.email != null &&
             ['admin@example.com'].hasAny([request.auth.token.email]);
    }

    match /posts/{postId} {
      allow read, write: if isAdmin();
    }

    match /tagStats/{tag} {
      allow read, write: if isAdmin();
    }
  }
}
```
(В IMPLEMENT: подставить реальный список/механику `ADMIN_EMAILS`.)

## Логирование и наблюдаемость
- Использовать `Shared/infrastructure/Logger`: `info` для успешных операций, `warn` при деградации (пустые выборки/недостающие индексы), `error` для сбоев SDK. Не использовать `console.log`.

## Эволюция (опционально)
- Подколлекция `posts/{id}/revisions` для истории контента
- Квоты/лимиты: вынести тяжёлые поля из `metadata` при росте
- Счётчики `tagStats` обновлять батчами/транзакциями

## Гайд по внедрению (Implementation Guidelines)
1) Подготовка Firestore в коде
   - Экспортировать `db` из `src/firebase/config.ts` (`getFirestore(app)`), убедиться в инициализации при наличии env
2) Контракты Domain
   - Уточнить `IPostRepository` (добавить фильтры/пагинацию, если нужно), value-objects не менять по именованию
3) Репозитории Infrastructure
   - `FirestorePostRepository` с методами: save, findById, findAll (пагинированный), findByStatus, findByType, findScheduledPosts, delete
   - Маппинг Date↔Timestamp, нормализация `metadata`
4) Индексы
   - Создать 3–4 составных индекса из раздела выше
5) Security Rules
   - Реализовать S1 (email в allowlist), протестировать с реальным админом
6) DI
   - Подключить реализации в `PostingDependencyConfig`/`DependencyContainer`
7) UI интеграция
   - Заменить источники данных на use cases с Firestore, внешнее поведение не менять
8) Чистка
   - Исключить `JsonDataManager` и json-файлы из прод-пути, удалить обращения к localStorage

## Верификация
- Поддержаны все фильтры и CRUD? Да (через рекомендованные индексы и репозитории)
- Соответствие DDD/SOLID? Да (интерфейсы -> адаптер Firestore)
- Безопасность админ-панели? Да (S1), эволюция к S2 возможна
- Масштабируемость запросов? Да (cursor-based, индексы)

# 🎨🎨🎨 EXITING CREATIVE PHASE
