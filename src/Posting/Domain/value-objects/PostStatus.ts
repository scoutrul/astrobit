export enum PostStatus {
  DRAFT = 'draft',
  APPROVED = 'approved',
  SCHEDULED = 'scheduled',
  PUBLISHING = 'publishing',
  PUBLISHED = 'published',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export const POST_STATUS_TRANSITIONS: Record<PostStatus, PostStatus[]> = {
  [PostStatus.DRAFT]: [PostStatus.APPROVED, PostStatus.CANCELLED],
  [PostStatus.APPROVED]: [PostStatus.SCHEDULED, PostStatus.DRAFT],
  [PostStatus.SCHEDULED]: [PostStatus.PUBLISHING, PostStatus.CANCELLED],
  [PostStatus.PUBLISHING]: [PostStatus.PUBLISHED, PostStatus.FAILED],
  [PostStatus.PUBLISHED]: [],
  [PostStatus.FAILED]: [PostStatus.SCHEDULED, PostStatus.CANCELLED],
  [PostStatus.CANCELLED]: [PostStatus.DRAFT]
};
