import { useState } from 'react';
import { Post } from '../../Domain/entities/Post';
import { TelegramBotBrowserService, TelegramConfig } from '../../Infrastructure/services/TelegramBotBrowserService';

interface TelegramPostState {
  loading: boolean;
  success: boolean;
  error: string | null;
  messageId?: number;
}

interface UseTelegramPostReturn {
  state: TelegramPostState;
  sendToTelegram: (post: Post, imagePath?: string, onSuccess?: (messageId: number) => void) => Promise<void>;
  resetState: () => void;
  retryLastSend: () => Promise<void>;
}

export const useTelegramPost = (): UseTelegramPostReturn => {
  const [state, setState] = useState<TelegramPostState>({
    loading: false,
    success: false,
    error: null
  });

  const [lastSendParams, setLastSendParams] = useState<{ post: Post; imagePath?: string; onSuccess?: (messageId: number) => void } | null>(null);

  const sendToTelegram = async (post: Post, imagePath?: string, onSuccess?: (messageId: number) => void): Promise<void> => {
    setState({ loading: true, success: false, error: null });
    setLastSendParams({ post, imagePath, onSuccess });

    try {
      // Получаем конфигурацию Telegram из переменных окружения
      const telegramConfig: TelegramConfig = {
        token: import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '',
        chatId: import.meta.env.VITE_TELEGRAM_CHAT_ID || ''
      };

      // Проверяем наличие обязательных переменных
      if (!telegramConfig.token || !telegramConfig.chatId) {
        throw new Error('Telegram Bot не настроен. Проверьте переменные окружения TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID');
      }

      const telegramService = new TelegramBotBrowserService(telegramConfig);

      let result;
      if (imagePath) {
        result = await telegramService.sendPostWithImage(post, imagePath);
      } else {
        result = await telegramService.sendPost(post);
      }

      if (result.success) {
        setState({
          loading: false,
          success: true,
          error: null,
          messageId: result.messageId
        });
        
        // Вызываем callback сразу при успешной отправке
        if (onSuccess && result.messageId) {
          onSuccess(result.messageId);
        }
      } else {
        setState({
          loading: false,
          success: false,
          error: result.error || 'Неизвестная ошибка при отправке в Telegram'
        });
      }
    } catch (error) {
      setState({
        loading: false,
        success: false,
        error: error instanceof Error ? error.message : 'Произошла ошибка при отправке'
      });
    }
  };

  const retryLastSend = async (): Promise<void> => {
    if (!lastSendParams) {
      return;
    }
    
    await sendToTelegram(lastSendParams.post, lastSendParams.imagePath, lastSendParams.onSuccess);
  };

  const resetState = (): void => {
    setState({
      loading: false,
      success: false,
      error: null
    });
  };

  return {
    state,
    sendToTelegram,
    resetState,
    retryLastSend
  };
};
