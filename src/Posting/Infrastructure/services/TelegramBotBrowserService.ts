import { Post } from '../../Domain/entities/Post';

export interface TelegramConfig {
  token: string;
  chatId: string;
}

export interface TelegramSendResult {
  success: boolean;
  messageId?: number;
  error?: string;
}

export class TelegramBotBrowserService {
  private token: string;
  private chatId: string;
  private baseUrl = 'https://api.telegram.org/bot';

  constructor(config: TelegramConfig) {
    this.token = config.token;
    this.chatId = config.chatId;
  }

  async sendPost(post: Post): Promise<TelegramSendResult> {
    try {
      const message = this.formatPostMessage(post);
      
      const response = await fetch(`${this.baseUrl}${this.token}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorData.description || 'Unknown error'}`
        };
      }

      const result = await response.json();
      
      if (result.ok) {
        return {
          success: true,
          messageId: result.result.message_id
        };
      } else {
        return {
          success: false,
          error: result.description || 'Unknown Telegram API error'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  async sendPostWithImage(post: Post, imageUrl: string): Promise<TelegramSendResult> {
    try {
      const caption = this.formatPostMessage(post);
      
      const response = await fetch(`${this.baseUrl}${this.token}/sendPhoto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.chatId,
          photo: imageUrl,
          caption: caption,
          parse_mode: 'HTML'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorData.description || 'Unknown error'}`
        };
      }

      const result = await response.json();
      
      if (result.ok) {
        return {
          success: true,
          messageId: result.result.message_id
        };
      } else {
        return {
          success: false,
          error: result.description || 'Unknown Telegram API error'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  private formatPostMessage(post: Post): string {
    const typeIcon = this.getTypeIcon(post.type);
    
    // Создаем базовое сообщение
    let message = `${typeIcon} <b>${post.title}</b>\n\n${post.content}\n\n`;
    
    // Добавляем дату
    message += `📅 ${this.formatDate(post.scheduledAt)}\n`;
    
    // Добавляем теги, если есть
    if (post.metadata.tags && post.metadata.tags.length > 0) {
      message += `🏷️ ${post.metadata.tags.join(' #')}\n`;
    }
    
    // Добавляем приоритет, если есть
    if (post.metadata.priority) {
      const priorityEmoji = {
        'low': '🟢',
        'medium': '🟡', 
        'high': '🔴'
      }[post.metadata.priority] || '🟡';
      message += `${priorityEmoji} Приоритет: ${post.metadata.priority}\n`;
    }
    
    return message;
  }

  private getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'announcement': '📢',
      'event_analysis': '🌟',
      'market_analysis': '📈',
      'weekly_review': '📅',
      'monthly_review': '🗓️',
      'astronomical_update': '🌙',
      'trading_signal': '📊'
    };
    return icons[type] || '📝';
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  // Метод для проверки конфигурации
  async testConnection(): Promise<TelegramSendResult> {
    try {
      const response = await fetch(`${this.baseUrl}${this.token}/getMe`);
      
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: Invalid bot token`
        };
      }

      const result = await response.json();
      
      if (result.ok) {
        return {
          success: true,
          messageId: undefined
        };
      } else {
        return {
          success: false,
          error: 'Invalid bot token'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }
}
