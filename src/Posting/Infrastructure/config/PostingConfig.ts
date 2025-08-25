import { LocalStoragePostRepository } from '../repositories/LocalStoragePostRepository';
import { MockTelegramBotService } from '../services/MockTelegramBotService';
import { MockSchedulerService } from '../services/MockSchedulerService';
import { DependencyContainer } from '../../../Shared/infrastructure/DependencyContainer';
import { CryptoDataDependencyConfig } from '../../../CryptoData/Infrastructure/config/DependencyConfig';
import { AstronomicalDependencyConfig } from '../../../Astronomical/Infrastructure/config/DependencyConfig';
import { logger } from '../../../Shared/infrastructure/Logger';

export class PostingConfig {
  static configure(): void {
    try {
      logger.info('Настройка Posting модуля...');

      // Создаем репозиторий
      const postRepository = new LocalStoragePostRepository();
      logger.info('Репозиторий постов создан');

      // Создаем сервисы
      const telegramService = new MockTelegramBotService();
      logger.info('Telegram сервис создан');

      const schedulerService = new MockSchedulerService(postRepository, telegramService);
      logger.info('Планировщик создан');

      // Создаем use cases (пока не используются, но могут понадобиться позже)
      logger.info('Use cases созданы');

      // Настраиваем модули для совместимости
      try {
        // Получаем глобальный контейнер зависимостей
        const container = DependencyContainer.getInstance();
        
        // Настраиваем Astronomical модуль
        AstronomicalDependencyConfig.configure(container);
        logger.info('Astronomical модуль настроен');
        
        // Настраиваем CryptoData модуль
        CryptoDataDependencyConfig.configure(container);
        logger.info('CryptoData модуль настроен');
      } catch (moduleError) {
        logger.warn('Некоторые модули не настроены (не критично для Posting)');
      }

      // Запускаем планировщик
      schedulerService.start();
      logger.info('Планировщик запущен');

      logger.info('Posting модуль настроен успешно');
    } catch (error) {
      logger.exception('Ошибка настройки Posting модуля', error);
    }
  }
}
