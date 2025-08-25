import { Result } from '../../../Shared/domain/Result';
import { Post } from '../entities/Post';

export interface IPostRepository {
  save(post: Post): Promise<Result<Post>>;
  findById(id: string): Promise<Result<Post | null>>;
  findAll(): Promise<Result<Post[]>>;
  findByStatus(status: string): Promise<Result<Post[]>>;
  findByType(type: string): Promise<Result<Post[]>>;
  delete(id: string): Promise<Result<void>>;
  findScheduledPosts(before: Date): Promise<Result<Post[]>>;
}
