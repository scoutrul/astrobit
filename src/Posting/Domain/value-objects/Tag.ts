import { ValueObject } from '../../../Shared/domain/ValueObject';

export type TagCategory = 
  | 'astronomical'
  | 'market'
  | 'technical'
  | 'general';

export interface TagProps {
  name: string;
  category: TagCategory;
  weight: number;
}

export class Tag extends ValueObject<Tag> {
  protected readonly props: TagProps;

  private constructor(props: TagProps) {
    super();
    this.props = props;
  }

  public static create(name: string, category: TagCategory, weight: number = 1.0): Tag {
    if (weight < 0 || weight > 1) {
      throw new Error('Tag weight must be between 0 and 1');
    }
    return new Tag({ name: name.toLowerCase().trim(), category, weight });
  }

  public static astronomical(name: string): Tag {
    return Tag.create(name, 'astronomical');
  }

  public static market(name: string): Tag {
    return Tag.create(name, 'market');
  }

  public static technical(name: string): Tag {
    return Tag.create(name, 'technical');
  }

  public static general(name: string): Tag {
    return Tag.create(name, 'general');
  }

  get name(): string {
    return this.props.name;
  }

  get category(): TagCategory {
    return this.props.category;
  }

  get weight(): number {
    return this.props.weight;
  }

  get displayName(): string {
    return `#${this.props.name}`;
  }

  get categoryIcon(): string {
    const icons: Record<TagCategory, string> = {
      'astronomical': '🌙',
      'market': '📈',
      'technical': '⚙️',
      'general': '🏷️'
    };
    return icons[this.props.category];
  }

  public clone(): Tag {
    return new Tag({ 
      name: this.props.name, 
      category: this.props.category, 
      weight: this.props.weight 
    });
  }

  public withWeight(weight: number): Tag {
    return Tag.create(this.props.name, this.props.category, weight);
  }
}
