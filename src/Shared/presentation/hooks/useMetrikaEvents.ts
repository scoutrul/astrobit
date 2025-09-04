import { useMetrika } from '../components/YandexMetrika';

/**
 * Хук для отправки событий в Яндекс.Метрику
 * Предоставляет готовые методы для отслеживания действий пользователей
 */
export const useMetrikaEvents = (metrikaId: number = 104028714) => {
  const metrika = useMetrika(metrikaId);

  return {
    /**
     * Отслеживание просмотра страницы
     */
    trackPageView: (pageName: string, additionalParams?: Record<string, any>) => {
      metrika.hit(window.location.pathname, {
        title: pageName,
        ...additionalParams
      });
    },

    /**
     * Отслеживание клика по кнопке
     */
    trackButtonClick: (buttonName: string, additionalParams?: Record<string, any>) => {
      metrika.reachGoal('button_click', {
        button_name: buttonName,
        ...additionalParams
      });
    },

    /**
     * Отслеживание перехода по ссылке
     */
    trackLinkClick: (linkName: string, url: string, additionalParams?: Record<string, any>) => {
      metrika.reachGoal('link_click', {
        link_name: linkName,
        link_url: url,
        ...additionalParams
      });
    },

    /**
     * Отслеживание загрузки данных
     */
    trackDataLoad: (dataType: string, success: boolean, additionalParams?: Record<string, any>) => {
      metrika.reachGoal('data_load', {
        data_type: dataType,
        success,
        ...additionalParams
      });
    },

    /**
     * Отслеживание ошибок
     */
    trackError: (errorType: string, errorMessage: string, additionalParams?: Record<string, any>) => {
      metrika.reachGoal('error', {
        error_type: errorType,
        error_message: errorMessage,
        ...additionalParams
      });
    },

    /**
     * Отслеживание пользовательских действий
     */
    trackUserAction: (action: string, additionalParams?: Record<string, any>) => {
      metrika.reachGoal('user_action', {
        action,
        ...additionalParams
      });
    },

    /**
     * Отслеживание времени на странице
     */
    trackTimeOnPage: (timeInSeconds: number, pageName: string) => {
      metrika.reachGoal('time_on_page', {
        time_seconds: timeInSeconds,
        page_name: pageName
      });
    },

    /**
     * Отслеживание скролла
     */
    trackScroll: (scrollPercent: number, pageName: string) => {
      metrika.reachGoal('scroll', {
        scroll_percent: scrollPercent,
        page_name: pageName
      });
    },

    /**
     * Отслеживание поиска
     */
    trackSearch: (searchQuery: string, resultsCount: number, additionalParams?: Record<string, any>) => {
      metrika.reachGoal('search', {
        search_query: searchQuery,
        results_count: resultsCount,
        ...additionalParams
      });
    },

    /**
     * Отслеживание фильтрации
     */
    trackFilter: (filterType: string, filterValue: string, additionalParams?: Record<string, any>) => {
      metrika.reachGoal('filter', {
        filter_type: filterType,
        filter_value: filterValue,
        ...additionalParams
      });
    }
  };
};
