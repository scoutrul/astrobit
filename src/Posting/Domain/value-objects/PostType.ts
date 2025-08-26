export enum PostType {
  ANNOUNCEMENT = 'announcement',
  EVENT_ANALYSIS = 'event_analysis',
  MARKET_ANALYSIS = 'market_analysis',
  WEEKLY_REVIEW = 'weekly_review',
  MONTHLY_REVIEW = 'monthly_review',
  ASTRONOMICAL_UPDATE = 'astronomical_update',
  TRADING_SIGNAL = 'trading_signal'
}

export const POST_TYPE_ICONS: Record<PostType, string> = {
  [PostType.ANNOUNCEMENT]: '📢',
  [PostType.EVENT_ANALYSIS]: '🌟',
  [PostType.MARKET_ANALYSIS]: '📈',
  [PostType.WEEKLY_REVIEW]: '📅',
  [PostType.MONTHLY_REVIEW]: '🗓️',
  [PostType.ASTRONOMICAL_UPDATE]: '🌙',
  [PostType.TRADING_SIGNAL]: '📊'
};

export const POST_TYPE_LABELS: Record<PostType, string> = {
  [PostType.ANNOUNCEMENT]: '📢 Объявление',
  [PostType.EVENT_ANALYSIS]: '🌟 Анализ события',
  [PostType.MARKET_ANALYSIS]: '📈 Рыночный анализ',
  [PostType.WEEKLY_REVIEW]: '📅 Недельный обзор',
  [PostType.MONTHLY_REVIEW]: '🗓️ Месячный обзор',
  [PostType.ASTRONOMICAL_UPDATE]: '🌙 Астрономические новости',
  [PostType.TRADING_SIGNAL]: '📊 Торговый сигнал'
};