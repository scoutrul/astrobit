import { useEffect } from 'react';

// Типы для Яндекс.Метрики
declare global {
  interface Window {
    ym: {
      (id: number, method: string, ...args: any[]): void;
      a?: any[];
    };
  }
}

interface YandexMetrikaConfig {
  id: number;
  clickmap?: boolean;
  trackLinks?: boolean;
  accurateTrackBounce?: boolean;
  webvisor?: boolean;
  defer?: boolean;
  ecommerce?: boolean;
  trackHash?: boolean;
  trackBounce?: boolean;
  type?: number;
  triggerEvent?: boolean;
  ssr?: boolean;
}

interface UseYandexMetrikaOptions {
  config?: Partial<YandexMetrikaConfig>;
  enabled?: boolean;
}

/**
 * Хук для работы с Яндекс.Метрикой в React приложении
 * Поддерживает SPA навигацию и правильную инициализацию
 */
export const useYandexMetrika = (metrikaId: number, options: UseYandexMetrikaOptions = {}) => {
  const { config = {}, enabled = true } = options;

  useEffect(() => {
    if (!enabled || !metrikaId) return;

    // Проверяем, что мы в браузере
    if (typeof window === 'undefined') return;

    // Инициализируем Яндекс.Метрику
    const initMetrika = () => {
      // Создаем функцию ym если её нет
      window.ym = window.ym || function(...args: any[]) {
        (window.ym.a = window.ym.a || []).push(args);
      };

      // Настройки по умолчанию
      const defaultConfig: YandexMetrikaConfig = {
        id: metrikaId,
        clickmap: true,
        trackLinks: true,
        accurateTrackBounce: true,
        webvisor: true,
        defer: true,
        ecommerce: false,
        trackHash: true,
        trackBounce: true,
        type: 0,
        triggerEvent: false,
        ssr: true,
        ...config
      };

      // Инициализируем метрику
      window.ym(metrikaId, 'init', defaultConfig);
    };

    // Загружаем скрипт метрики
    const loadMetrikaScript = () => {
      // Проверяем, не загружен ли уже скрипт
      const existingScript = document.querySelector('script[src*="metrika"]');
      if (existingScript) {
        initMetrika();
        return;
      }

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = `https://mc.webvisor.org/metrika/tag_ww.js?id=${metrikaId}`;
      
      script.onload = initMetrika;
      script.onerror = () => {
        console.error('Ошибка загрузки Яндекс.Метрики');
      };

      document.head.appendChild(script);
    };

    loadMetrikaScript();

    // Очистка при размонтировании
    return () => {
      // Метрика не требует специальной очистки
    };
  }, [metrikaId, enabled, config]);

  // Функции для работы с метрикой
  const metrika = {
    /**
     * Отправка события достижения цели
     */
    reachGoal: (target: string, params?: Record<string, any>) => {
      if (typeof window !== 'undefined' && window.ym) {
        window.ym(metrikaId, 'reachGoal', target, params);
      }
    },

    /**
     * Отправка события
     */
    hit: (url: string, options?: Record<string, any>) => {
      if (typeof window !== 'undefined' && window.ym) {
        window.ym(metrikaId, 'hit', url, options);
      }
    },

    /**
     * Отправка параметров визита
     */
    params: (params: Record<string, any>) => {
      if (typeof window !== 'undefined' && window.ym) {
        window.ym(metrikaId, 'params', params);
      }
    },

    /**
     * Отправка пользовательских данных
     */
    userParams: (params: Record<string, any>) => {
      if (typeof window !== 'undefined' && window.ym) {
        window.ym(metrikaId, 'userParams', params);
      }
    }
  };

  return metrika;
};

/**
 * Хук для отслеживания изменений роута в SPA
 */
export const useYandexMetrikaRouter = (metrikaId: number) => {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ym) return;

    // Отслеживаем изменения URL для SPA
    const trackPageView = () => {
      const url = window.location.pathname + window.location.search;
      window.ym(metrikaId, 'hit', url, {
        title: document.title
      });
    };

    // Отслеживаем изменения URL
    const handlePopState = () => {
      setTimeout(trackPageView, 100);
    };

    // Отслеживаем программные изменения URL
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      setTimeout(trackPageView, 100);
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      setTimeout(trackPageView, 100);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [metrikaId]);
};
