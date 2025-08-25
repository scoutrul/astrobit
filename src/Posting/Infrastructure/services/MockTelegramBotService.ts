import { Post } from '../../Domain/entities/Post';
import { logger } from '../../../Shared/infrastructure/Logger';

export interface TelegramConfig {
  token: string;
  chatId: string;
}

export class MockTelegramBotService {
  constructor() {
    logger.info('MockTelegramBotService инициализирован');
  }

  async sendPost(post: Post): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      logger.info(`Отправляем пост в Telegram: ${post.title}`);

      // Имитируем задержку отправки
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Генерируем mock message ID
      const messageId = Math.floor(Math.random() * 1000000).toString();

      logger.info(`Пост успешно отправлен в Telegram (mock), messageId: ${messageId}`);

      return {
        success: true,
        messageId
      };
    } catch (error) {
      logger.exception('Ошибка отправки в Telegram', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async sendPostWithImage(post: Post): Promise<{ success: boolean; messageId?: number; error?: string }> {
    logger.info(`Отправляем пост с изображением: ${post.title}`);

    await new Promise(resolve => setTimeout(resolve, 1200));

    return {
      success: true,
      messageId: Math.floor(Math.random() * 100000)
    };
  }
}
