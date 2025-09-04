export enum PostStatus {
  DRAFT = 'draft',
  APPROVED = 'approved',
  SCHEDULED = 'scheduled',
  PUBLISHING = 'publishing',
  PUBLISHED = 'published',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  [PostStatus.DRAFT]: 'Черновик',
  [PostStatus.APPROVED]: 'Одобрен',
  [PostStatus.SCHEDULED]: 'Запланирован',
  [PostStatus.PUBLISHING]: 'Публикуется',
  [PostStatus.PUBLISHED]: 'Опубликован',
  [PostStatus.FAILED]: 'Ошибка',
  [PostStatus.CANCELLED]: 'Отменен'
};

export const POST_STATUS_TRANSITIONS: Record<PostStatus, PostStatus[]> = {
  [PostStatus.DRAFT]: [PostStatus.APPROVED, PostStatus.CANCELLED],
  [PostStatus.APPROVED]: [PostStatus.SCHEDULED, PostStatus.DRAFT],
  [PostStatus.SCHEDULED]: [PostStatus.PUBLISHING, PostStatus.CANCELLED],
  [PostStatus.PUBLISHING]: [PostStatus.PUBLISHED, PostStatus.FAILED],
  [PostStatus.PUBLISHED]: [],
  [PostStatus.FAILED]: [PostStatus.SCHEDULED, PostStatus.CANCELLED],
  [PostStatus.CANCELLED]: [PostStatus.DRAFT]
};
