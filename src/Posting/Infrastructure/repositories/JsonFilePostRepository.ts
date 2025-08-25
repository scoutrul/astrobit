import { promises as fs } from 'fs';
import { join } from 'path';
import { Result } from '../../../Shared/domain/Result';
import { Post } from '../../Domain/entities/Post';
import { IPostRepository } from '../../Domain/repositories/IPostRepository';

export class JsonFilePostRepository implements IPostRepository {
  private filePath = join(process.cwd(), 'src/Posting/Infrastructure/data/posts.json');

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
      return Result.fail(`Failed to save post: ${error}`);
    }
  }

  async findById(id: string): Promise<Result<Post | null>> {
    try {
      const posts = await this.loadPosts();
      const post = posts.find(p => p.id === id) || null;
      return Result.ok(post);
    } catch (error) {
      return Result.fail(`Failed to find post: ${error}`);
    }
  }

  async findAll(): Promise<Result<Post[]>> {
    try {
      const posts = await this.loadPosts();
      return Result.ok(posts);
    } catch (error) {
      return Result.fail(`Failed to load posts: ${error}`);
    }
  }

  async findByStatus(status: string): Promise<Result<Post[]>> {
    try {
      const posts = await this.loadPosts();
      const filtered = posts.filter(p => p.status === status);
      return Result.ok(filtered);
    } catch (error) {
      return Result.fail(`Failed to find posts by status: ${error}`);
    }
  }

  async findByType(type: string): Promise<Result<Post[]>> {
    try {
      const posts = await this.loadPosts();
      const filtered = posts.filter(p => p.type === type);
      return Result.ok(filtered);
    } catch (error) {
      return Result.fail(`Failed to find posts by type: ${error}`);
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      const posts = await this.loadPosts();
      const filtered = posts.filter(p => p.id !== id);
      await this.savePosts(filtered);
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(`Failed to delete post: ${error}`);
    }
  }

  async findScheduledPosts(before: Date): Promise<Result<Post[]>> {
    try {
      const posts = await this.loadPosts();
      const scheduled = posts.filter(p => 
        p.status === 'scheduled' && new Date(p.scheduledAt) <= before
      );
      return Result.ok(scheduled);
    } catch (error) {
      return Result.fail(`Failed to find scheduled posts: ${error}`);
    }
  }

  private async loadPosts(): Promise<Post[]> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  private async savePosts(posts: Post[]): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify(posts, null, 2));
  }
}
