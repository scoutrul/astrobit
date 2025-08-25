import * as cron from 'node-cron';
import { IPostRepository } from '../../Domain/repositories/IPostRepository';
import { TelegramBotService } from './TelegramBotService';
import { PostStatus } from '../../Domain/value-objects/PostStatus';
import { logger } from '../../../Shared/infrastructure/Logger';

export class SchedulerService {
  private isRunning = false;

  constructor(
    private postRepository: IPostRepository,
    private telegramService: TelegramBotService
  ) {}

  start(): void {
    if (this.isRunning) return;

    // Проверяем каждую минуту
    cron.schedule('* * * * *', async () => {
      await this.processScheduledPosts();
    });

    this.isRunning = true;
    logger.info('Планировщик запущен');
  }

  stop(): void {
    this.isRunning = false;
    logger.info('Планировщик остановлен');
  }

  private async processScheduledPosts(): Promise<void> {
    try {
      const now = new Date();
      const result = await this.postRepository.findScheduledPosts(now);

      if (result.isSuccess && result.value.length > 0) {
        logger.info(`Найдено ${result.value.length} постов для публикации`);

        for (const post of result.value) {
          await this.publishPost(post);
        }
      }
    } catch (error) {
      logger.exception('Ошибка в планировщике', error);
    }
  }

  private async publishPost(post: any): Promise<void> {
    try {
      // Обновляем статус на "публикуется"
      post.updateStatus(PostStatus.PUBLISHING);
      await this.postRepository.save(post);

      // Отправляем в Telegram
      const result = await this.telegramService.sendPost(post);

      if (result.success) {
        post.updateStatus(PostStatus.PUBLISHED);
        post.telegramMessageId = result.messageId?.toString();
        logger.info(`Пост "${post.title}" опубликован`);
      } else {
        post.updateStatus(PostStatus.FAILED);
        logger.error(`Ошибка публикации "${post.title}": ${result.error}`);
      }

      await this.postRepository.save(post);
    } catch (error) {
      logger.exception(`Ошибка публикации поста "${post.title}"`, error);
      post.updateStatus(PostStatus.FAILED);
      await this.postRepository.save(post);
    }
  }
}
