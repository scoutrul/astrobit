import { IPostRepository } from '../../Domain/repositories/IPostRepository';
import { Post } from '../../Domain/entities/Post';
import { Result } from '../../../Shared/domain/Result';

/**
 * Простой in-memory репозиторий для постов
 * Используется вместо Firestore для чистого фронтенда
 */
export class InMemoryPostRepository implements IPostRepository {
  private posts: Map<string, Post> = new Map();

  async save(post: Post): Promise<Result<Post>> {
    try {
      this.posts.set(post.id, post);
      return Result.ok(post);
    } catch (e: any) {
      console.error('[InMemoryPostRepository] save error:', e);
      return Result.fail(`Ошибка сохранения поста: ${e?.message || e}`);
    }
  }

  async findById(id: string): Promise<Result<Post | null>> {
    try {
      const post = this.posts.get(id) || null;
      return Result.ok(post);
    } catch (_e) {
      return Result.fail('Ошибка получения поста');
    }
  }

  async findAll(): Promise<Result<Post[]>> {
    try {
      const items = Array.from(this.posts.values())
        .sort((a, b) => {
          const aDate = (a as any).createdAt || new Date(0);
          const bDate = (b as any).createdAt || new Date(0);
          return bDate.getTime() - aDate.getTime();
        })
        .slice(0, 100);
      return Result.ok(items);
    } catch (_e) {
      return Result.fail('Ошибка получения списка постов');
    }
  }

  async findByStatus(status: string): Promise<Result<Post[]>> {
    try {
      const items = Array.from(this.posts.values())
        .filter(post => post.status === status)
        .sort((a, b) => {
          const aDate = (a as any).createdAt || new Date(0);
          const bDate = (b as any).createdAt || new Date(0);
          return bDate.getTime() - aDate.getTime();
        })
        .slice(0, 100);
      return Result.ok(items);
    } catch (_e) {
      return Result.fail('Ошибка фильтрации постов по статусу');
    }
  }

  async findByType(type: string): Promise<Result<Post[]>> {
    try {
      const items = Array.from(this.posts.values())
        .filter(post => post.type === type)
        .sort((a, b) => {
          const aDate = (a as any).createdAt || new Date(0);
          const bDate = (b as any).createdAt || new Date(0);
          return bDate.getTime() - aDate.getTime();
        })
        .slice(0, 100);
      return Result.ok(items);
    } catch (_e) {
      return Result.fail('Ошибка фильтрации постов по типу');
    }
  }

  async findScheduledPosts(before: Date): Promise<Result<Post[]>> {
    try {
      const items = Array.from(this.posts.values())
        .filter(post => post.status === 'scheduled' && post.scheduledAt <= before)
        .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
        .slice(0, 100);
      return Result.ok(items);
    } catch (_e) {
      return Result.fail('Ошибка получения запланированных постов');
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      this.posts.delete(id);
      return Result.ok();
    } catch (_e) {
      return Result.fail('Ошибка удаления поста');
    }
  }
}

