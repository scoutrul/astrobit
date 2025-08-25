# Системные паттерны AstroBit

## Архитектурные принципы

### Clean Architecture
- **Domain Layer:** Чистая бизнес-логика без внешних зависимостей
- **Application Layer:** Use Cases и координация между слоями
- **Infrastructure Layer:** Внешние сервисы, API, базы данных
- **Presentation Layer:** UI компоненты и пользовательский интерфейс

### Domain-Driven Design
- **Entities:** AstronomicalEvent, CryptoData, Chart
- **Value Objects:** EventSignificance, EventType, Symbol, Timeframe
- **Repositories:** IAstronomicalEventRepository, ICryptoDataRepository
- **Services:** IAstronomicalCalculationService

## Паттерны проектирования

### Repository Pattern
```typescript
interface IAstronomicalEventRepository {
  getEvents(): Promise<AstronomicalEvent[]>
  getEventsByDate(date: Date): Promise<AstronomicalEvent[]>
}
```

### Use Case Pattern
```typescript
class GetAstronomicalEventsUseCase {
  constructor(private repository: IAstronomicalEventRepository) {}
  execute(): Promise<AstronomicalEvent[]> {}
}
```

### Dependency Injection
- Централизованная конфигурация зависимостей
- Inversion of Control через DependencyContainer
- Легкое тестирование и замена реализаций

## Структура модулей

### Astronomical Module
- **Domain:** Астрономические события и расчеты
- **Application:** Получение событий, расчет фаз Луны
- **Infrastructure:** JSON данные, in-memory репозиторий
- **Presentation:** Фильтры событий, отображение

### Charting Module
- **Domain:** Графики и конфигурация
- **Application:** Рендеринг графиков, обновление данных
- **Infrastructure:** Lightweight Charts интеграция
- **Presentation:** Компоненты графиков, селекторы времени

### CryptoData Module
- **Domain:** Криптовалютные данные
- **Application:** Получение данных, подписка на real-time
- **Infrastructure:** Binance API, WebSocket
- **Presentation:** Селекторы символов, отображение данных

## Паттерны UI/UX

### Component Composition
- Контейнеры для бизнес-логики
- Презентационные компоненты для UI
- Hooks для логики состояния
- Адаптеры для legacy интеграции

### State Management
- **Zustand:** Централизованное состояние
- **Local State:** Компонентное состояние
- **Shared State:** Общие данные между модулями
