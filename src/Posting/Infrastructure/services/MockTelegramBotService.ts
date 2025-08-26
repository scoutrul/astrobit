import { Post } from '../../Domain/entities/Post';


export interface TelegramConfig {
  token: string;
  chatId: string;
}

export class MockTelegramBotService {
  constructor() {
    // MockTelegramBotService инициализирован
  }

  async sendPost(_post: Post): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Отправляем пост в Telegram

      // Имитируем задержку отправки
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Генерируем mock message ID
      const messageId = Math.floor(Math.random() * 1000000).toString();

              // Пост успешно отправлен в Telegram (mock)

      return {
        success: true,
        messageId
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async sendPostWithImage(_post: Post): Promise<{ success: boolean; messageId?: number; error?: string }> {
    // Отправляем пост с изображением

    await new Promise(resolve => setTimeout(resolve, 1200));

    return {
      success: true,
      messageId: Math.floor(Math.random() * 100000)
    };
  }
}
