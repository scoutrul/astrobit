import { ValueObject } from '../../../Shared/domain/ValueObject';

export type PostTypeValue = 
  | 'astronomical_announcement'
  | 'market_retrospective' 
  | 'analytical_post'
  | 'general_post';

export const POST_TYPE_LABELS: Record<PostTypeValue, string> = {
  'astronomical_announcement': 'Анонс астрономического события',
  'market_retrospective': 'Ретроспектива рынка',
  'analytical_post': 'Аналитический пост',
  'general_post': 'Обычный пост'
};

export interface PostTypeProps {
  value: PostTypeValue;
}

export class PostType extends ValueObject<PostType> {
  protected readonly props: PostTypeProps;

  private constructor(props: PostTypeProps) {
    super();
    this.props = props;
  }

  public static create(value: PostTypeValue): PostType {
    return new PostType({ value });
  }

  public static astronomicalAnnouncement(): PostType {
    return new PostType({ value: 'astronomical_announcement' });
  }

  public static marketRetrospective(): PostType {
    return new PostType({ value: 'market_retrospective' });
  }

  public static analyticalPost(): PostType {
    return new PostType({ value: 'analytical_post' });
  }

  public static generalPost(): PostType {
    return new PostType({ value: 'general_post' });
  }

  get value(): PostTypeValue {
    return this.props.value;
  }

  get displayName(): string {
    return POST_TYPE_LABELS[this.props.value];
  }

  public requiresAI(): boolean {
    return ['astronomical_announcement', 'market_retrospective', 'analytical_post'].includes(this.props.value);
  }

  public getGenerationComplexity(): 'simple' | 'medium' | 'complex' {
    switch (this.props.value) {
      case 'astronomical_announcement':
        return 'medium';
      case 'market_retrospective':
        return 'complex';
      case 'analytical_post':
        return 'complex';
      default:
        return 'simple';
    }
  }

  public clone(): PostType {
    return new PostType({ value: this.props.value });
  }
}