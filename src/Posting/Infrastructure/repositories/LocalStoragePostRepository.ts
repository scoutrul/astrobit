import { Post } from '../../Domain/entities/Post';
import { IPostRepository } from '../../Domain/repositories/IPostRepository';
import { Result } from '../../../Shared/domain/Result';


export class LocalStoragePostRepository implements IPostRepository {
  private readonly storageKey = 'astrobit_posts';

  async save(post: Post): Promise<Result<Post>> {
    try {
      const posts = await this.loadPosts();
      const existingIndex = posts.findIndex(p => p.id === post.id);
      
      if (existingIndex >= 0) {
        posts[existingIndex] = post;
      } else {
        posts.push(post);
      }
      
      await this.savePosts(posts);
      return Result.ok(post);
    } catch (error) {
      return Result.fail('Ошибка сохранения поста');
    }
  }

  async findById(id: string): Promise<Result<Post | null>> {
    try {
      const posts = await this.loadPosts();
      const post = posts.find(p => p.id === id);
      return Result.ok(post || null);
    } catch (error) {
      return Result.fail('Ошибка поиска поста');
    }
  }

  async findAll(): Promise<Result<Post[]>> {
    try {
      const posts = await this.loadPosts();
      return Result.ok(posts);
    } catch (error) {
      return Result.fail('Ошибка загрузки постов');
    }
  }

  async findByStatus(status: string): Promise<Result<Post[]>> {
    try {
      const posts = await this.loadPosts();
      const filteredPosts = posts.filter(post => post.status === status);
      return Result.ok(filteredPosts);
    } catch (error) {
      return Result.fail('Ошибка поиска постов по статусу');
    }
  }

  async findByType(type: string): Promise<Result<Post[]>> {
    try {
      const posts = await this.loadPosts();
      const filteredPosts = posts.filter(post => post.type === type);
      return Result.ok(filteredPosts);
    } catch (error) {
      return Result.fail('Ошибка поиска постов по типу');
    }
  }

  async findScheduledPosts(before: Date): Promise<Result<Post[]>> {
    try {
      const posts = await this.loadPosts();
      const scheduledPosts = posts.filter(post => 
        post.status === 'scheduled' && post.scheduledAt <= before
      );
      return Result.ok(scheduledPosts);
    } catch (error) {
      return Result.fail('Ошибка поиска запланированных постов');
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      const posts = await this.loadPosts();
      const filteredPosts = posts.filter(post => post.id !== id);
      
      if (filteredPosts.length === posts.length) {
        return Result.fail('Пост не найден');
      }
      
      await this.savePosts(filteredPosts);
      return Result.ok();
    } catch (error) {
      return Result.fail('Ошибка удаления поста');
    }
  }

  private async loadPosts(): Promise<Post[]> {
    try {
      const rawData = localStorage.getItem(this.storageKey);
      if (!rawData) {
        return [];
      }

      const rawPosts = JSON.parse(rawData);
      const posts = rawPosts.map((raw: any) => {
        try {
          const postId = raw.id || raw._id || crypto.randomUUID();
          const post = new Post(
            postId,
            raw.title,
            raw.content,
            raw.status,
            raw.type,
            new Date(raw.scheduledAt),
            raw.metadata || {},
            raw.authorId || 'admin',
            raw.publishedAt ? new Date(raw.publishedAt) : undefined,
            raw.images || [],
            raw.telegramMessageId
          );
          return post;
        } catch (error) {
          return null;
        }
      }).filter(Boolean) as Post[];

      return posts;
    } catch (error) {
      return [];
    }
  }

  private async savePosts(posts: Post[]): Promise<void> {
    try {
      const rawPosts = posts.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        status: post.status,
        type: post.type,
        scheduledAt: post.scheduledAt.toISOString(),
        metadata: post.metadata,
        authorId: post.authorId,
        publishedAt: post.publishedAt?.toISOString(),
        images: post.images,
        telegramMessageId: post.telegramMessageId
      }));
      
      localStorage.setItem(this.storageKey, JSON.stringify(rawPosts));
    } catch (error) {
      throw error;
    }
  }
}

