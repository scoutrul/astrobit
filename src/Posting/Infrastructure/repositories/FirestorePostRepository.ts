import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { IPostRepository } from '../../Domain/repositories/IPostRepository';
import { Post } from '../../Domain/entities/Post';
import { Result } from '../../../Shared/domain/Result';

function toFirestore(post: Post): any {
  return {
    title: post.title,
    content: post.content,
    status: post.status,
    type: post.type,
    tags: post.metadata?.tags || [],
    createdAt: post['createdAt'] ? Timestamp.fromDate(post['createdAt']) : Timestamp.fromDate(new Date()),
    updatedAt: Timestamp.fromDate(new Date()),
    scheduledAt: post.scheduledAt ? Timestamp.fromDate(post.scheduledAt) : null,
    publishedAt: post.publishedAt ? Timestamp.fromDate(post.publishedAt) : null,
    authorId: post.authorId,
    images: post.images || [],
    telegramMessageId: post.telegramMessageId || null,
    metadata: post.metadata || {}
  };
}

function fromFirestore(id: string, data: any): Post {
  return new Post(
    id,
    data.title,
    data.content,
    data.status,
    data.type,
    data.scheduledAt ? (data.scheduledAt.toDate ? data.scheduledAt.toDate() : new Date(data.scheduledAt)) : new Date(),
    data.metadata || { template: '', variables: {}, tags: [], priority: 'low' },
    data.authorId || 'admin',
    data.publishedAt ? (data.publishedAt.toDate ? data.publishedAt.toDate() : new Date(data.publishedAt)) : undefined,
    data.images || [],
    data.telegramMessageId || undefined
  );
}

export class FirestorePostRepository implements IPostRepository {
  private readonly col = collection(db, 'posts');

  async save(post: Post): Promise<Result<Post>> {
    try {
      await setDoc(doc(this.col, post.id), toFirestore(post), { merge: true });
      return Result.ok(post);
    } catch (e: any) {
      console.error('[FirestorePostRepository] save error:', e);
      return Result.fail(`Ошибка сохранения поста в Firestore: ${e?.message || e}`);
    }
  }

  async findById(id: string): Promise<Result<Post | null>> {
    try {
      const snap = await getDoc(doc(this.col, id));
      if (!snap.exists()) return Result.ok(null);
      return Result.ok(fromFirestore(snap.id, snap.data()));
    } catch (_e) {
      return Result.fail('Ошибка получения поста из Firestore');
    }
  }

  async findAll(): Promise<Result<Post[]>> {
    try {
      const q = query(this.col, orderBy('createdAt', 'desc'), limit(100));
      const snaps = await getDocs(q);
      const items = snaps.docs.map(d => fromFirestore(d.id, d.data()));
      return Result.ok(items);
    } catch (_e) {
      return Result.fail('Ошибка получения списка постов из Firestore');
    }
  }

  async findByStatus(status: string): Promise<Result<Post[]>> {
    try {
      const q = query(this.col, where('status', '==', status), orderBy('createdAt', 'desc'), limit(100));
      const snaps = await getDocs(q);
      const items = snaps.docs.map(d => fromFirestore(d.id, d.data()));
      return Result.ok(items);
    } catch (_e) {
      return Result.fail('Ошибка фильтрации постов по статусу');
    }
  }

  async findByType(type: string): Promise<Result<Post[]>> {
    try {
      const q = query(this.col, where('type', '==', type), orderBy('createdAt', 'desc'), limit(100));
      const snaps = await getDocs(q);
      const items = snaps.docs.map(d => fromFirestore(d.id, d.data()));
      return Result.ok(items);
    } catch (_e) {
      return Result.fail('Ошибка фильтрации постов по типу');
    }
  }

  async findScheduledPosts(before: Date): Promise<Result<Post[]>> {
    try {
      const q = query(this.col, where('status', '==', 'scheduled'), orderBy('scheduledAt', 'asc'), limit(100));
      const snaps = await getDocs(q);
      const items = snaps.docs
        .map(d => fromFirestore(d.id, d.data()))
        .filter(p => p.scheduledAt <= before);
      return Result.ok(items);
    } catch (_e) {
      return Result.fail('Ошибка получения запланированных постов');
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      await deleteDoc(doc(this.col, id));
      return Result.ok();
    } catch (_e) {
      return Result.fail('Ошибка удаления поста в Firestore');
    }
  }
}
