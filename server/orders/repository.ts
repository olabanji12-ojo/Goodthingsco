import type { Order } from '../../src/types/order.js';
import type { OrderUpdateResult } from '../../src/types/orderManagement.js';
import { getAdminFirestore } from '../firebase.js';

export interface ChangeReceipt {
  hash: string;
  actor: string;
  createdAt: string;
  revision: number;
  changed: boolean;
  notifications: OrderUpdateResult['notifications'];
  note: string;
}
export interface OrderRepository {
  list(): Promise<Order[]>;
  get(id: string): Promise<Order | null>;
  find(number: string): Promise<Order[]>;
  change<T>(id: string, eventId: string, work: (order: Order | null, receipt: ChangeReceipt | null) => {
    order?: Order; receipt?: ChangeReceipt; result: T;
  }): Promise<T>;
  recordResult(id: string, eventId: string, result: OrderUpdateResult['notifications']): Promise<void>;
  throttle(key: string, max: number, windowMs: number): Promise<boolean>;
  saveSession(hash: string, orderId: string, expiresAt: number): Promise<void>;
  session(hash: string): Promise<{ orderId: string; expiresAt: number } | null>;
  deleteSession(hash: string): Promise<void>;
}
export const firestoreOrders: OrderRepository = {
  async saveSession(hash, orderId, expiresAt) {
    await getAdminFirestore().collection('orderTrackingSessions').doc(hash).set({ orderId, expiresAt, deleteAfter: new Date(expiresAt) });
  },
  async session(hash) {
    const snap = await getAdminFirestore().collection('orderTrackingSessions').doc(hash).get();
    return snap.exists ? snap.data() as { orderId: string; expiresAt: number } : null;
  },
  async deleteSession(hash) { await getAdminFirestore().collection('orderTrackingSessions').doc(hash).delete(); },
  async list() {
    const result = await getAdminFirestore().collection('orders').get();
    return result.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Order);
  },
  async get(id) {
    const doc = await getAdminFirestore().collection('orders').doc(id).get();
    return doc.exists ? { ...doc.data(), id: doc.id } as Order : null;
  },
  async find(number) {
    const result = await getAdminFirestore().collection('orders').where('orderNumber', '==', number).limit(2).get();
    return result.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Order);
  },
  async change(id, eventId, work) {
    const db = getAdminFirestore();
    const orderRef = db.collection('orders').doc(id);
    const eventRef = orderRef.collection('managementEvents').doc(eventId);
    return db.runTransaction(async transaction => {
      const [orderDoc, eventDoc] = await transaction.getAll(orderRef, eventRef);
      const change = work(orderDoc.exists ? { ...orderDoc.data(), id } as Order : null,
        eventDoc.exists ? eventDoc.data() as ChangeReceipt : null);
      if (change.order) {
        const { id: _id, ...data } = change.order;
        transaction.set(orderRef, data);
      }
      if (change.receipt) transaction.create(eventRef, change.receipt);
      return change.result;
    });
  },
  async recordResult(id, eventId, notifications) {
    await getAdminFirestore().collection('orders').doc(id).collection('managementEvents').doc(eventId).update({ notifications });
  },
  async throttle(key, max, windowMs) {
    const db = getAdminFirestore();
    const ref = db.collection('orderTrackingLimits').doc(key);
    return db.runTransaction(async transaction => {
      const snap = await transaction.get(ref);
      const now = Date.now();
      const prior = snap.data();
      const current = prior && prior.resetAt > now ? prior : { count: 0, resetAt: now + windowMs };
      if (current.count >= max) return false;
      transaction.set(ref, { count: current.count + 1, resetAt: current.resetAt,
        expiresAt: new Date(current.resetAt + windowMs) });
      return true;
    });
  },
};
