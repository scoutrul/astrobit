# 🌟 Astronomical Module - AstroBit

Модуль для работы с астрономическими событиями в системе AstroBit.

## 📋 Обзор

Astronomical модуль предоставляет полную систему для работы с астрономическими событиями, включая:

- **350+ предварительно рассчитанных событий** на период 2022-2027
- **7 типов событий** с детальной классификацией
- **4 категории событий** с уникальными цветами и иконками
- **Гибкую систему фильтрации** по типам и значимости
- **Интеграцию с торговыми графиками** для астрологического анализа

## 🏗️ Архитектура

```
Astronomical/
├── Domain/                    # Доменная логика
│   ├── entities/             # Сущности
│   ├── value-objects/        # Value Objects
│   └── repositories/         # Интерфейсы репозиториев
├── Application/              # Бизнес-логика
│   └── use-cases/           # Use Cases
├── Infrastructure/           # Реализация
│   ├── data/                # JSON данные
│   ├── repositories/         # Реализации репозиториев
│   └── services/            # Сервисы
└── Presentation/             # UI компоненты
    ├── components/           # React компоненты
    ├── containers/           # Контейнеры
    └── hooks/               # React хуки
```

## 🎯 Типы событий

| Тип | Категория | Иконка | Описание |
|-----|-----------|---------|----------|
| `moon_phase` | lunar | 🌙 | Фазы луны |
| `planet_aspect` | planetary | 🪐 | Планетарные аспекты |
| `solar_event` | solar | ☀️ | Солнечные события |
| `lunar_eclipse` | lunar | 🌑 | Лунные затмения |
| `solar_eclipse` | solar | ☀️🌑 | Солнечные затмения |
| `comet_event` | cosmic | ☄️ | Кометы |
| `meteor_shower` | cosmic | ⭐ | Метеорные потоки |

## 📊 Категории событий

| Категория | Цвет | Описание |
|-----------|------|----------|
| `lunar` | `#fbbf24` | События, связанные с Луной |
| `solar` | `#f59e0b` | События, связанные с Солнцем |
| `planetary` | `#8b5cf6` | События, связанные с планетами |
| `cosmic` | `#10b981` | Кометы, метеоры, астероиды |

## 🚀 Быстрый старт

### 1. Импорт модуля

```typescript
import { AstronomicalEvent, EventType, EventSignificance } from './Astronomical';
```

### 2. Создание события

```typescript
const event = new AstronomicalEvent(
  'unique-id',
  new Date('2025-01-01'),
  new EventType('moon_phase'),
  'Новолуние',
  'Новая луна - время для новых начинаний',
  new EventSignificance('high')
);
```

### 3. Получение событий

```typescript
import { astronomicalEventsService } from './Astronomical';

const events = astronomicalEventsService.getEventsForPeriod(
  new Date('2025-01-01'),
  new Date('2025-12-31')
);
```

### 4. Фильтрация по типу

```typescript
const lunarEvents = astronomicalEventsService.getEventsByCategory('lunar');
const highSignificanceEvents = astronomicalEventsService.getEventsBySignificance('high');
```

## 📁 Структура данных

### JSON файлы

Все астрономические данные хранятся в JSON файлах в директории `Infrastructure/data/`:

- `eventTypes.json` - Типы и категории событий
- `moonPhases.json` - Лунные фазы (2022-2027)
- `planetaryEvents.json` - Планетарные события
- `solarEvents.json` - Солнечные события
- `lunarEclipses.json` - Лунные затмения
- `solarEclipses.json` - Солнечные затмения
- `cometEvents.json` - Кометные события
- `meteorShowers.json` - Метеорные потоки

### Формат события

```json
{
  "date": "2025-01-01",
  "name": "Название события",
  "description": "Описание события",
  "significance": "high",
  "constellation": "Название созвездия",
  "icon": "🎯"
}
```

## 🔧 Обновление данных

### Автоматическая валидация

```bash
cd src/Astronomical/Infrastructure/data
npm run validate
```

### Добавление нового события

1. Откройте соответствующий JSON файл
2. Добавьте новое событие в массив
3. Сохраните файл
4. Запустите валидацию: `npm run validate`
5. Перезапустите приложение

### Добавление нового типа

1. Откройте `eventTypes.json`
2. Добавьте новый тип в массив `types`
3. При необходимости добавьте новую категорию
4. Обновите соответствующие TypeScript типы

## 🎨 UI компоненты

### EventFilters

Компонент фильтрации событий по категориям:

```tsx
<EventFilters
  eventFilters={{
    lunar: true,
    solar: true,
    planetary: true,
    meteor: true
  }}
  onFiltersChange={handleFiltersChange}
/>
```

### AstronomicalContainer

Основной контейнер для астрономических компонентов:

```tsx
<AstronomicalContainer
  eventFilters={eventFilters}
  onFiltersChange={handleFiltersChange}
/>
```

## 📈 Интеграция с графиками

Астрономические события интегрируются с торговыми графиками через:

- **Маркеры на временной шкале** для каждого события
- **Фильтрация по типам** для выборочного отображения
- **Влияние на генерацию свечей** для астрологического анализа

## 🔍 Отладка

### Логирование

Система логирует все операции в консоль браузера:

```typescript
console.log('[AstronomicalEvents] События загружены:', events.length);
```

### Валидация данных

```bash
# Проверка всех JSON файлов
npm run validate

# Статистика событий
npm run stats

# Автоматическая валидация при изменениях
npm run validate:watch
```

## 📚 API Reference

### AstronomicalEvent

```typescript
class AstronomicalEvent extends BaseEntity {
  // Свойства
  readonly timestamp: Date;
  readonly type: EventType;
  readonly name: string;
  readonly description: string;
  readonly significance: EventSignificance;
  readonly price?: number;

  // Методы
  occurredOn(date: Date): boolean;
  occurredBetween(startDate: Date, endDate: Date): boolean;
  isSignificant(): boolean;
  withPrice(price: number): AstronomicalEvent;
}
```

### EventType

```typescript
class EventType extends ValueObject {
  // Свойства
  readonly value: AstronomicalEventType;

  // Методы
  getMetadata(): EventTypeMetadata | null;
  getCategory(): string;
  getIcon(): string;
  getDescription(): string;
  isLunar(): boolean;
  isSolar(): boolean;
  isPlanetary(): boolean;
  isCosmic(): boolean;

  // Статические методы
  static getAllTypes(): AstronomicalEventType[];
  static getAllCategories(): EventCategories;
}
```

### AstronomicalEventsService

```typescript
class AstronomicalEventsService {
  getEventsForPeriod(startDate: Date, endDate: Date): AstronomicalEvent[];
  getEventsByType(type: string): AstronomicalEvent[];
  getEventsBySignificance(significance: string): AstronomicalEvent[];
  getEventsByCategory(category: string): AstronomicalEvent[];
  getEventStatistics(): Record<string, number>;
  getTotalEventCount(): number;
  getMoonPhaseForDate(date: Date): string;
}
```

## 🧪 Тестирование

### Unit тесты

```bash
npm test -- --testPathPattern=Astronomical
```

### Интеграционные тесты

```bash
npm run test:integration -- --testPathPattern=Astronomical
```

## 📊 Производительность

- **In-memory хранение** для быстрого доступа
- **Lazy loading** метаданных типов событий
- **Кэширование** результатов фильтрации
- **Оптимизированные запросы** по периодам

## 🔮 Планы развития

- [ ] **API интеграция** с внешними астрономическими сервисами
- [ ] **Real-time обновления** событий
- [ ] **Расширенная фильтрация** по географическим координатам
- [ ] **Машинное обучение** для прогнозирования влияния событий
- [ ] **Мобильное приложение** для отслеживания событий

## 🤝 Вклад в проект

1. **Fork** репозитория
2. **Создайте ветку** для новой функции
3. **Внесите изменения** и добавьте тесты
4. **Запустите валидацию** данных
5. **Создайте Pull Request**

## 📄 Лицензия

MIT License - см. файл [LICENSE](../../../LICENSE) для деталей.

---

**Разработано командой AstroBit** 🌟  
**Версия**: 1.0.0  
**Последнее обновление**: Декабрь 2024
