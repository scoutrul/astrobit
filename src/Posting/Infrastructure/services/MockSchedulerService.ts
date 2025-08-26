import { Post } from '../../Domain/entities/Post';
import { IPostRepository } from '../../Domain/repositories/IPostRepository';
import { MockTelegramBotService } from './MockTelegramBotService';


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

    // Планировщик запущен
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    // Планировщик остановлен
  }

  private async processScheduledPosts(): Promise<void> {
    try {
      const now = new Date();
      const scheduledPosts = await this.postRepository.findScheduledPosts(now);
      
      if (scheduledPosts.isSuccess && scheduledPosts.value.length > 0) {
        // Найдено постов для публикации
        
        for (const post of scheduledPosts.value) {
          await this.publishPost(post);
        }
      }
    } catch (error) {
      // Ошибка в планировщике
    }
  }

  private async publishPost(post: Post): Promise<void> {
    try {
                  // Публикуем пост
      
      // Отправляем в Telegram
      const telegramResult = await this.telegramService.sendPost(post);
      
      if (telegramResult.success) {
        // Обновляем статус поста
        post.updateStatus('published');
        post.publishedAt = new Date();
        
        // Сохраняем обновленный пост
        await this.postRepository.save(post);
        
        // Пост успешно опубликован
              } else {
          // Ошибка отправки в Telegram
        }
      } catch (error) {
        // Ошибка публикации поста
      }
  }
}
