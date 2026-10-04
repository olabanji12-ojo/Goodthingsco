import type { Order } from '../../src/types/order.js';
import type { OrderUpdateResult } from '../../src/types/orderManagement.js';
import { getAdminFirestore } from '../firebase.js';
import { inMemoryOrders } from '../orderService.js';

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

const inMemoryTrackingSessions = new Map<string, { orderId: string; expiresAt: number }>();
const inMemoryThrottles = new Map<string, { count: number; resetAt: number }>();

export const firestoreOrders: OrderRepository = {
  async saveSession(hash, orderId, expiresAt) {
    try {
      await getAdminFirestore().collection('orderTrackingSessions').doc(hash).set({ orderId, expiresAt, deleteAfter: new Date(expiresAt) });
    } catch {
      inMemoryTrackingSessions.set(hash, { orderId, expiresAt });
    }
  },
  async session(hash) {
    try {
      const snap = await getAdminFirestore().collection('orderTrackingSessions').doc(hash).get();
      if (snap.exists) return snap.data() as { orderId: string; expiresAt: number };
    } catch {
      // ignore
    }
    return inMemoryTrackingSessions.get(hash) || null;
  },
  async deleteSession(hash) {
    try {
      await getAdminFirestore().collection('orderTrackingSessions').doc(hash).delete();
    } catch {
      inMemoryTrackingSessions.delete(hash);
    }
  },
  async list() {
    try {
      const result = await getAdminFirestore().collection('orders').get();
      return result.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Order);
    } catch {
      return Array.from(inMemoryOrders.values());
    }
  },
  async get(id) {
    try {
      const doc = await getAdminFirestore().collection('orders').doc(id).get();
      if (doc.exists) return { ...doc.data(), id: doc.id } as Order;
    } catch {
      // ignore
    }
    return inMemoryOrders.get(id) || null;
  },
  async find(number) {
    try {
      const result = await getAdminFirestore().collection('orders').where('orderNumber', '==', number).limit(2).get();
      if (!result.empty) return result.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Order);
    } catch {
      // ignore
    }
    const memMatch: Order[] = [];
    for (const ord of inMemoryOrders.values()) {
      if (ord.orderNumber.toUpperCase() === number.trim().toUpperCase()) {
        memMatch.push(ord);
      }
    }
    return memMatch;
  },
  async change(id, eventId, work) {
    try {
      const db = getAdminFirestore();
      const orderRef = db.collection('orders').doc(id);
      const eventRef = orderRef.collection('managementEvents').doc(eventId);
      return await db.runTransaction(async transaction => {
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
    } catch {
      const current = inMemoryOrders.get(id) || null;
      const change = work(current, null);
      if (change.order) inMemoryOrders.set(id, change.order);
      return change.result;
    }
  },
  async recordResult(id, eventId, notifications) {
    try {
      await getAdminFirestore().collection('orders').doc(id).collection('managementEvents').doc(eventId).update({ notifications });
    } catch {
      // ignore
    }
  },
  async throttle(key, max, windowMs) {
    try {
      const db = getAdminFirestore();
      const ref = db.collection('orderTrackingLimits').doc(key);
      return await db.runTransaction(async transaction => {
        const snap = await transaction.get(ref);
        const now = Date.now();
        const prior = snap.data();
        const current = prior && prior.resetAt > now ? prior : { count: 0, resetAt: now + windowMs };
        if (current.count >= max) return false;
        transaction.set(ref, { count: current.count + 1, resetAt: current.resetAt,
          expiresAt: new Date(current.resetAt + windowMs) });
        return true;
      });
    } catch {
      const now = Date.now();
      const entry = inMemoryThrottles.get(key);
      const current = entry && entry.resetAt > now ? entry : { count: 0, resetAt: now + windowMs };
      if (current.count >= max) return false;
      inMemoryThrottles.set(key, { count: current.count + 1, resetAt: current.resetAt });
      return true;
    }
  },
};

