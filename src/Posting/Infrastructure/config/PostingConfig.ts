import { FirestorePostRepository } from '../repositories/FirestorePostRepository';
import { MockTelegramBotService } from '../services/MockTelegramBotService';
import { MockSchedulerService } from '../services/MockSchedulerService';
import { DependencyContainer } from '../../../Shared/infrastructure/DependencyContainer';
import { CryptoDataDependencyConfig } from '../../../CryptoData/Infrastructure/config/DependencyConfig';
import { AstronomicalDependencyConfig } from '../../../Astronomical/Infrastructure/config/DependencyConfig';


export class PostingConfig {
  static configure(): void {
    try {
      // Настройка Posting модуля...

      // Создаем репозиторий
      const postRepository = new FirestorePostRepository();
              // Репозиторий постов создан

      // Создаем сервисы
      const telegramService = new MockTelegramBotService();
              // Telegram сервис создан

      const schedulerService = new MockSchedulerService(postRepository, telegramService);
              // Планировщик создан

      // Создаем use cases (пока не используются, но могут понадобиться позже)
              // Use cases созданы

      // Настраиваем модули для совместимости
      try {
        // Получаем глобальный контейнер зависимостей
        const container = DependencyContainer.getInstance();
        
        // Настраиваем Astronomical модуль
        AstronomicalDependencyConfig.configure(container);
        // Astronomical модуль настроен
        
        // Настраиваем CryptoData модуль
        CryptoDataDependencyConfig.configure(container);
        // CryptoData модуль настроен
      } catch (moduleError) {
        // Некоторые модули не настроены (не критично для Posting)
      }

      // Запускаем планировщик
      schedulerService.start();
      // Планировщик запущен

      // Posting модуль настроен успешно
    } catch (error) {
      // Ошибка настройки Posting модуля
    }
  }
}
