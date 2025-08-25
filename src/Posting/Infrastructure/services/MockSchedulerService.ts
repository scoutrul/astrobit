import { Post } from '../../Domain/entities/Post';
import { IPostRepository } from '../../Domain/repositories/IPostRepository';
import { MockTelegramBotService } from './MockTelegramBotService';
import { logger } from '../../../Shared/infrastructure/Logger';

export class MockSchedulerService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(
    private postRepository: IPostRepository,
    private telegramService: MockTelegramBotService
  ) {}

  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.processScheduledPosts();
    }, 5000); // Проверяем каждые 5 секунд

    logger.info('Планировщик запущен');
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    logger.info('Планировщик остановлен');
  }

  private async processScheduledPosts(): Promise<void> {
    try {
      const now = new Date();
      const scheduledPosts = await this.postRepository.findScheduledPosts(now);
      
      if (scheduledPosts.isSuccess && scheduledPosts.value.length > 0) {
        logger.info(`Найдено ${scheduledPosts.value.length} постов для публикации`);
        
        for (const post of scheduledPosts.value) {
          await this.publishPost(post);
        }
      }
    } catch (error) {
      logger.exception('Ошибка в планировщике', error);
    }
  }

  private async publishPost(post: Post): Promise<void> {
    try {
      logger.info(`Публикуем пост: ${post.title}`);
      
      // Отправляем в Telegram
      const telegramResult = await this.telegramService.sendPost(post);
      
      if (telegramResult.success) {
        // Обновляем статус поста
        post.updateStatus('published');
        post.publishedAt = new Date();
        
        // Сохраняем обновленный пост
        await this.postRepository.save(post);
        
        logger.info(`Пост "${post.title}" успешно опубликован`);
      } else {
        logger.error(`Ошибка отправки в Telegram: ${telegramResult.error}`);
      }
    } catch (error) {
      logger.exception(`Ошибка публикации поста "${post.title}"`, error);
    }
  }
}
