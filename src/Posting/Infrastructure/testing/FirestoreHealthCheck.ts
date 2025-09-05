import { collection, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { Result } from '../../../Shared/domain/Result';

export async function runFirestoreHealthCheck(): Promise<Result<string>> {
  try {
    const col = collection(db, '__health');
    const id = 'posts_migration_check';
    await setDoc(doc(col, id), {
      ok: true,
      ts: serverTimestamp()
    }, { merge: true });

    const snap = await getDoc(doc(col, id));
    if (!snap.exists()) return Result.fail('Health doc not found after write');
    return Result.ok('Firestore health-check OK');
  } catch (e: any) {
    return Result.fail(`Firestore health-check failed: ${e?.message || e}`);
  }
}
