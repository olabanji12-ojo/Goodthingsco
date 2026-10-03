// Compatibility boundary: retain existing payment algorithms using trusted server credentials.
import type { Firestore, DocumentReference, DocumentData, Query, WhereFilterOp } from 'firebase-admin/firestore';
type Database = () => Firestore;
type Snapshot = { exists(): boolean; data(): DocumentData; id: string };
function snapshot(value: { exists: boolean; data(): DocumentData | undefined; id: string }): Snapshot {
  return { exists: () => value.exists, data: () => value.data()!, id: value.id };
}
export const collection = (db: Database, name: string) => db().collection(name);
export const doc = (db: Database, name: string, id: string) => db().collection(name).doc(id);
export const addDoc = (ref: ReturnType<typeof collection>, data: DocumentData) => ref.add(data);
export const getDoc = async (ref: DocumentReference) => snapshot(await ref.get());
export const getDocs = async (ref: Query) => { const value = await ref.get(); return { empty: value.empty, docs: value.docs.map(snapshot) }; };
type Constraint = (query: Query) => Query;
export const where = (field: string, op: WhereFilterOp, value: unknown): Constraint => query => query.where(field, op, value);
export const limit = (count: number): Constraint => query => query.limit(count);
export const query = (ref: Query, ...constraints: Constraint[]) => constraints.reduce((current, apply) => apply(current), ref);
export interface Transaction {
  get(ref: DocumentReference): Promise<Snapshot>;
  update(ref: DocumentReference, data: DocumentData): void;
}
export const runTransaction = (db: Database, work: (transaction: Transaction) => Promise<void>) => db().runTransaction(transaction => work({
  get: async ref => snapshot(await transaction.get(ref)),
  update: (ref, data) => { transaction.update(ref, data); },
}));
