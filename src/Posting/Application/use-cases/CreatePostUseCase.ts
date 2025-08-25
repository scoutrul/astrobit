import { UseCase } from '../../../Shared/application/UseCase';
import { Result } from '../../../Shared/domain/Result';
import { Post, PostMetadata } from '../../Domain/entities/Post';
import { IPostRepository } from '../../Domain/repositories/IPostRepository';
import { logger } from '../../../Shared/infrastructure/Logger';

export interface CreatePostRequest {
  title: string;
  content: string;
  type: string;
  scheduledAt: Date;
  metadata?: PostMetadata;
  authorId?: string;
  images?: string[];
}

export class CreatePostUseCase extends UseCase<CreatePostRequest, Post> {
  constructor(private postRepository: IPostRepository) {
    super();
  }

  protected validateRequest(request: CreatePostRequest): Result<CreatePostRequest> {
    if (!request.title || request.title.trim().length === 0) {
      return Result.fail('Заголовок поста обязателен');
    }
    if (!request.content || request.content.trim().length === 0) {
      return Result.fail('Содержание поста обязательно');
    }
    if (!request.type || request.type.trim().length === 0) {
      return Result.fail('Тип поста обязателен');
    }
    if (!request.scheduledAt || !(request.scheduledAt instanceof Date)) {
      return Result.fail('Дата публикации обязательна');
    }
    return Result.ok(request);
  }

  async execute(request: CreatePostRequest): Promise<Result<Post>> {
    try {
      logger.info('Создание нового поста...');

      const validationResult = this.validateRequest(request);
      if (!validationResult.isSuccess) {
        return Result.fail(validationResult.error);
      }

      // Создаем правильный PostMetadata
      const metadata: PostMetadata = {
        template: 'default',
        variables: {},
        tags: [],
        priority: 'medium',
        ...request.metadata
      };

      const post = new Post(
        crypto.randomUUID(),
        request.title,
        request.content,
        'draft',
        request.type,
        request.scheduledAt,
        metadata,
        request.authorId || 'admin',
        undefined,
        request.images || []
      );

      const saveResult = await this.postRepository.save(post);
      if (!saveResult.isSuccess) {
        return Result.fail(`Ошибка сохранения поста: ${saveResult.error}`);
      }

      logger.info(`Пост "${post.title}" успешно создан`);
      return Result.ok(post);
    } catch (error) {
      logger.exception('Ошибка создания поста', error);
      return Result.fail('Ошибка создания поста');
    }
  }
}
