import * as cron from 'node-cron';
import { IPostRepository } from '../../Domain/repositories/IPostRepository';
import { TelegramBotService } from './TelegramBotService';
import { PostStatus } from '../../Domain/value-objects/PostStatus';


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
    // Планировщик запущен
  }

  stop(): void {
    this.isRunning = false;
    // Планировщик остановлен
  }

  private async processScheduledPosts(): Promise<void> {
    try {
      const now = new Date();
      const result = await this.postRepository.findScheduledPosts(now);

      if (result.isSuccess && result.value.length > 0) {
        // Найдено постов для публикации

        for (const post of result.value) {
          await this.publishPost(post);
        }
      }
    } catch (error) {
      // Ошибка в планировщике
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
        // Пост опубликован
      } else {
        post.updateStatus(PostStatus.FAILED);
        // Ошибка публикации
      }

      await this.postRepository.save(post);
    } catch (error) {
      // Ошибка публикации поста
      post.updateStatus(PostStatus.FAILED);
      await this.postRepository.save(post);
    }
  }
}
