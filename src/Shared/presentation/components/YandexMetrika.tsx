import React, { useEffect } from 'react';
import { useYandexMetrika, useYandexMetrikaRouter } from '../hooks/useYandexMetrika';

interface YandexMetrikaProps {
  /** ID счетчика Яндекс.Метрики */
  metrikaId: number;
  /** Дополнительные настройки метрики */
  config?: {
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
  };
  /** Включить/выключить метрику */
  enabled?: boolean;
  /** Включить отслеживание роутинга для SPA */
  enableRouter?: boolean;
  /** Дополнительные параметры визита */
  visitParams?: Record<string, any>;
  /** Пользовательские параметры */
  userParams?: Record<string, any>;
}

/**
 * Компонент для интеграции Яндекс.Метрики в React приложение
 * Поддерживает SPA навигацию и правильную инициализацию
 */
export const YandexMetrika: React.FC<YandexMetrikaProps> = ({
  metrikaId,
  config = {},
  enabled = true,
  visitParams,
  userParams
}) => {
  // Инициализируем метрику
  const metrika = useYandexMetrika(metrikaId, { config, enabled });

  // Включаем отслеживание роутинга для SPA
  useYandexMetrikaRouter(metrikaId);

  // Отправляем дополнительные параметры при инициализации
  useEffect(() => {
    if (!enabled || !metrikaId) return;

    if (visitParams) {
      metrika.params(visitParams);
    }

    if (userParams) {
      metrika.userParams(userParams);
    }
  }, [enabled, metrikaId, visitParams, userParams, metrika]);

  // Компонент не рендерит ничего видимого
  return null;
};

/**
 * HOC для добавления Яндекс.Метрики к любому компоненту
 */
export const withYandexMetrika = <P extends object>(
  Component: React.ComponentType<P>,
  metrikaId: number,
  options?: Omit<YandexMetrikaProps, 'metrikaId'>
) => {
  const WrappedComponent: React.FC<P> = (props) => {
    return (
      <>
        <YandexMetrika metrikaId={metrikaId} {...options} />
        <Component {...props} />
      </>
    );
  };

  WrappedComponent.displayName = `withYandexMetrika(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

/**
 * Хук для получения функций метрики в любом компоненте
 */
export const useMetrika = (metrikaId: number) => {
  return useYandexMetrika(metrikaId);
};

export default YandexMetrika;
