# 🏗️ Рефакторинг AstroBit под DDD и Чистую Архитектуру

**Дата:** 28 декабря 2024  
**Тип:** Архитектурный рефакторинг  
**Статус:** В процессе  

## 📋 Цель рефакторинга

Переосмыслить архитектуру проекта AstroBit с применением принципов **Domain-Driven Design (DDD)** и **Чистой архитектуры** для обеспечения:

- ✅ Четкого разделения ответственности между слоями
- ✅ Инверсии зависимостей (внутренние слои не зависят от внешних)
- ✅ Тестируемости каждого слоя
- ✅ Возможности замены фреймворков без затрагивания бизнес-логики
- ✅ Масштабируемости и добавления новых контекстов

## 🏛️ Новая архитектура

### Структура проекта

```
src/
├── Astronomical/           # Контекст астрономических расчетов
│   ├── Domain/            # Доменная модель
│   │   ├── entities/      # Сущности
│   │   ├── value-objects/ # Value Objects
│   │   ├── repositories/  # Интерфейсы репозиториев
│   │   └── services/      # Доменные сервисы
│   ├── Application/       # Слой приложения
│   │   ├── use-cases/     # Use Cases
│   │   └── services/      # Application Services
│   ├── Infrastructure/    # Инфраструктурный слой
│   │   ├── repositories/  # Реализации репозиториев
│   │   └── external-services/ # Внешние сервисы
│   └── Presentation/      # Презентационный слой
│       └── components/    # React компоненты
├── Charting/              # Контекст визуализации графиков
├── CryptoData/            # Контекст данных криптовалют
├── UserInterface/         # Контекст UI взаимодействия
├── Shared/                # Общие компоненты
│   ├── domain/           # Базовые доменные классы
│   ├── application/      # Базовые application классы
│   └── infrastructure/   # Базовые infrastructure классы
└── config/               # Конфигурация DI контейнера
```

### Принципы архитектуры

#### 1. Разделение на слои (Layered Architecture)
- **Domain Layer** — описывает предметную область: сущности, интерфейсы репозиториев, value objects, бизнес-правила
- **Application Layer** — содержит координацию задач (use cases, сервисы), не включает инфраструктуру или фреймворки
- **Infrastructure Layer** — реализует интерфейсы, работает с внешними сервисами, API, хранилищами и библиотеками
- **Presentation Layer** — UI-компоненты и связанная с ними логика взаимодействия с пользователем

#### 2. Изоляция зависимостей (Dependency Rule)
- Внутренние слои (Domain, Application) не знают о внешних (Infrastructure, Presentation)
- Зависимости направлены внутрь, т.е. UI и адаптеры зависят от use cases, а не наоборот

#### 3. Явные границы контекста (Bounded Contexts)
- Весь функционал разбит на контексты, каждый из которых отвечает за одну предметную зону
- Контексты не должны напрямую зависеть друг от друга

## 🔧 Реализованные компоненты

### 1. Shared/Domain базовые классы

#### BaseEntity
```typescript
export abstract class BaseEntity<T> {
  protected readonly _id: string;
  protected readonly _createdAt: Date;
  protected readonly _updatedAt: Date;
  
  // Базовые методы для всех сущностей
  equals(entity?: BaseEntity<T>): boolean;
  abstract clone(): T;
}
```

#### ValueObject
```typescript
export abstract class ValueObject<T> {
  equals(valueObject?: ValueObject<T>): boolean;
  abstract clone(): T;
}
```

#### Result
```typescript
export class Result<T> {
  static ok<U>(value?: U): Result<U>;
  static fail<U>(error: string): Result<U>;
  
  isSuccess: boolean;
  isFailure: boolean;
  value: T;
  error: string;
}
```

### 2. Astronomical Context

#### Domain Layer
- **AstronomicalEvent** — доменная сущность астрономического события
- **EventType** — value object для типов событий
- **EventSignificance** — value object для значимости событий
- **IAstronomicalEventRepository** — интерфейс репозитория
- **IAstronomicalCalculationService** — интерфейс для расчетов

#### Application Layer
- **GetAstronomicalEventsUseCase** — получение астрономических событий
- **GetCurrentMoonPhaseUseCase** — получение текущей фазы луны
- **GetMoonPhaseForDateUseCase** — получение фазы луны для даты

#### Infrastructure Layer
- **InMemoryAstronomicalEventRepository** — in-memory реализация репозитория

#### Presentation Layer
- **useAstronomicalEvents** — React hook для работы с событиями

### 3. Dependency Injection

#### DependencyContainer
```typescript
export class DependencyContainer {
  static getInstance(): DependencyContainer;
  register<T>(key: string, factory: () => T): void;
  resolve<T>(key: string): T;
  has(key: string): boolean;
  clear(): void;
}
```

#### Конфигурация зависимостей
```typescript
export class AstronomicalDependencyConfig {
  static configure(container: DependencyContainer): void {
    // Регистрация репозитория
    container.register<IAstronomicalEventRepository>(
      'IAstronomicalEventRepository',
      () => new InMemoryAstronomicalEventRepository()
    );

    // Регистрация use cases
    container.register<GetAstronomicalEventsUseCase>(
      'GetAstronomicalEventsUseCase',
      () => new GetAstronomicalEventsUseCase(
        container.resolve<IAstronomicalEventRepository>('IAstronomicalEventRepository')
      )
    );
  }
}
```

## 📊 Преимущества новой архитектуры

### 1. Тестируемость
- **Domain** и **Application** слои можно тестировать без React, API или базы данных
- Использование интерфейсов позволяет легко создавать моки
- Result pattern обеспечивает безопасную обработку ошибок

### 2. Независимость от фреймворков
- Бизнес-логика не зависит от React, Zustand, Axios
- Можно заменить React на Next.js, Vue или Angular без изменения бизнес-логики
- Use cases можно использовать в CLI, API или других интерфейсах

### 3. Масштабируемость
- Новые контексты добавляются изолированно
- Каждый контекст может иметь свою реализацию репозитория
- Легко добавлять новые use cases и доменные сервисы

### 4. Читаемость и поддерживаемость
- Четкое разделение ответственности
- Явные зависимости через DI контейнер
- Доменная модель выражает бизнес-правила

## 🚧 Следующие шаги

### 1. Миграция остальных контекстов
- [ ] **CryptoData Context** — миграция API интеграции
- [ ] **Charting Context** — миграция визуализации
- [ ] **UserInterface Context** — миграция UI состояния

### 2. Улучшения
- [ ] Добавить полную базу астрономических событий в InMemoryAstronomicalEventRepository
- [ ] Создать тесты для Domain и Application слоев
- [ ] Добавить валидацию в value objects
- [ ] Реализовать кэширование в репозиториях

### 3. Интеграция
- [ ] Обновить существующие компоненты для использования новых use cases
- [ ] Создать адаптеры для совместимости со старым кодом
- [ ] Постепенно мигрировать все компоненты

## 📝 Ключевые изменения

### До рефакторинга
```typescript
// Смешение слоев - hook напрямую использует service
export function useAstronomicalEvents(startDate: Date, endDate: Date) {
  const { events } = useAstronomicalEventsService.getEventsForPeriod(startDate, endDate);
  return { events };
}
```

### После рефакторинга
```typescript
// Четкое разделение - hook использует use case
export function useAstronomicalEvents(
  getAstronomicalEventsUseCase: GetAstronomicalEventsUseCase,
  startDate: Date,
  endDate: Date
) {
  const result = await getAstronomicalEventsUseCase.execute({ startDate, endDate });
  return result.isSuccess ? result.value : { events: [] };
}
```

## 🎯 Результаты

✅ **Создана базовая структура DDD архитектуры**  
✅ **Реализован Astronomical контекст**  
✅ **Создан DI контейнер**  
✅ **Обеспечена инверсия зависимостей**  
✅ **Подготовлена основа для масштабирования**  

---

**Следующий этап:** Миграция CryptoData контекста и интеграция с существующими компонентами. 