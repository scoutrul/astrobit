import { BaseEntity } from '../../../Shared/domain/BaseEntity';
import { PostStatus } from '../value-objects/PostStatus';

export interface PostMetadata {
  astronomicalEvents?: string[];
  marketData?: any;
  template: string;
  variables: Record<string, any>;
  tags: string[];
  priority: 'low' | 'medium' | 'high';
}

export class Post extends BaseEntity<Post> {
  constructor(
    id: string,
    public title: string,
    public content: string,
    public status: string,
    public type: string,
    public scheduledAt: Date,
    public metadata: PostMetadata,
    public authorId: string = 'admin',
    public publishedAt?: Date,
    public images?: string[],
    public telegramMessageId?: string
  ) {
    super(id);
  }

  static create(
    title: string,
    content: string,
    type: string,
    scheduledAt: Date,
    metadata: PostMetadata
  ): Post {
    return new Post(
      crypto.randomUUID(),
      title,
      content,
      'draft',
      type,
      scheduledAt,
      metadata
    );
  }

  updateStatus(newStatus: string): void {
    this.status = newStatus;
    if (newStatus === PostStatus.PUBLISHED) {
      this.publishedAt = new Date();
    }
  }

  updateContent(title: string, content: string): void {
    this.title = title;
    this.content = content;
  }

  clone(): Post {
    return new Post(
      this.id,
      this.title,
      this.content,
      this.status,
      this.type,
      this.scheduledAt,
      this.metadata,
      this.authorId,
      this.publishedAt,
      this.images,
      this.telegramMessageId
    );
  }
}
