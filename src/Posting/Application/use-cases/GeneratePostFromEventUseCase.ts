import { UseCase } from '../../../Shared/application/UseCase';
import { Result } from '../../../Shared/domain/Result';
import { Post, PostMetadata } from '../../Domain/entities/Post';
import { IPostRepository } from '../../Domain/repositories/IPostRepository';
import { DateTimeFormatter } from '../../../Shared/infrastructure/utils/DateTimeFormatter';


export interface GeneratePostFromEventRequest {
  eventName: string;
  eventDescription: string;
  eventDate: Date;
  eventType: string;
  metadata?: Partial<PostMetadata>;
}

export class GeneratePostFromEventUseCase extends UseCase<GeneratePostFromEventRequest, Post> {
  constructor(private postRepository: IPostRepository) {
    super();
  }

  protected validateRequest(request: GeneratePostFromEventRequest): Result<GeneratePostFromEventRequest> {
    if (!request.eventName || request.eventName.trim().length === 0) {
      return Result.fail('Название события обязательно');
    }
    if (!request.eventDescription || request.eventDescription.trim().length === 0) {
      return Result.fail('Описание события обязательно');
    }
    if (!request.eventDate || !(request.eventDate instanceof Date)) {
      return Result.fail('Дата события обязательна');
    }
    if (!request.eventType || request.eventType.trim().length === 0) {
      return Result.fail('Тип события обязателен');
    }
    return Result.ok(request);
  }

  async execute(request: GeneratePostFromEventRequest): Promise<Result<Post>> {
    try {
      // Генерация поста для события

      const validationResult = this.validateRequest(request);
      if (!validationResult.isSuccess) {
        return Result.fail(validationResult.error);
      }

      // Генерируем заголовок и содержание на основе события
      const title = `🌟 ${request.eventName}`;
      const content = this.generateContent(request);

      // Создаем правильный PostMetadata
      const metadata: PostMetadata = {
        template: 'astronomical_event',
        variables: {
          eventName: request.eventName,
          eventType: request.eventType,
          eventDate: request.eventDate.toISOString(),
          description: request.eventDescription
        },
        tags: ['астрономия', request.eventType.toLowerCase()],
        priority: 'medium',
        astronomicalEvents: [request.eventName],
        ...request.metadata
      };

      const post = new Post(
        crypto.randomUUID(),
        title,
        content,
        'draft',
        'astronomical',
        request.eventDate,
        metadata,
        'admin',
        undefined,
        []
      );

      const saveResult = await this.postRepository.save(post);
      if (!saveResult.isSuccess) {
        return Result.fail(`Ошибка сохранения поста: ${saveResult.error}`);
      }

      // Пост для события успешно создан
      return Result.ok(post);
          } catch (error) {
        return Result.fail('Ошибка генерации поста из события');
      }
  }

  private generateContent(request: GeneratePostFromEventRequest): string {
    const dateStr = DateTimeFormatter.formatDate(request.eventDate);

    return `📅 ${dateStr}\n\n${request.eventDescription}\n\n🔭 Тип события: ${request.eventType}\n\n#астрономия #${request.eventType.toLowerCase()}`;
  }
}
