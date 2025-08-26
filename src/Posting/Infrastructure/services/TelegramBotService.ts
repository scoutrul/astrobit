import TelegramBot from 'node-telegram-bot-api';
import { Post } from '../../Domain/entities/Post';
import { DateTimeFormatter } from '../../../Shared/infrastructure/utils/DateTimeFormatter';

export interface TelegramConfig {
  token: string;
  chatId: string;
}

export class TelegramBotService {
  private bot: TelegramBot;
  private chatId: string;

  constructor(config: TelegramConfig) {
    this.bot = new TelegramBot(config.token);
    this.chatId = config.chatId;
  }

  async sendPost(post: Post): Promise<{ success: boolean; messageId?: number; error?: string }> {
    try {
      const message = this.formatPostMessage(post);
      
      const result = await this.bot.sendMessage(this.chatId, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: false
      });

      return { success: true, messageId: result.message_id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async sendPostWithImage(post: Post, imagePath: string): Promise<{ success: boolean; messageId?: number; error?: string }> {
    try {
      const caption = this.formatPostMessage(post);
      
      const result = await this.bot.sendPhoto(this.chatId, imagePath, {
        caption,
        parse_mode: 'HTML'
      });

      return { success: true, messageId: result.message_id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  private formatPostMessage(post: Post): string {
    const typeIcon = this.getTypeIcon(post.type);
    
    return `${typeIcon} <b>${post.title}</b>\n\n${post.content}\n\n📅 ${DateTimeFormatter.formatDate(post.scheduledAt)}\n🏷️ ${post.metadata.tags.join(' #')}`;
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
}
