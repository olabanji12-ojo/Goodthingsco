// Used exclusively by scripts/email.mjs test bundling; never imported by application code.
import { sampleOrder } from './fixtures';

export const db = {};
type Ref = { collection: string; id?: string };
type RecordData = Record<string, any>;
export const state = {
  orders: new Map<string, RecordData>(),
  stock: 10,
  initializationsSucceed: true,
  verification: { success: true, status: 'success', amountKobo: 5350000, currency: 'NGN',
    paidAt: '2026-10-02T12:05:00.000Z', channel: 'card', transactionId: 'txn-1', message: 'Verified', isSimulated: false },
};
let queue = Promise.resolve();
export function resetOrderMocks() {
  state.orders.clear(); state.orders.set('order-1', sampleOrder()); state.stock = 10;
  state.initializationsSucceed = true;
  Object.assign(state.verification, { success: true, status: 'success', amountKobo: 5350000, currency: 'NGN', isSimulated: false });
  queue = Promise.resolve();
}
export function collection(_db: unknown, name: string): Ref { return { collection: name }; }
export function doc(_db: unknown, name: string, id: string): Ref { return { collection: name, id }; }
export function query(ref: Ref, ..._constraints: unknown[]) { return ref; }
export function where(..._args: unknown[]) { return {}; }
export function limit(..._args: unknown[]) { return {}; }
export async function getDoc(ref: Ref) {
  const data = ref.collection === 'orders' ? state.orders.get(ref.id!) : {
    name: 'The Thoughtful Gift Box', price: 25000, stock: state.stock, isAvailable: true, isArchived: false,
  };
  const snapshot = structuredClone(data);
  return { id: ref.id, exists: () => Boolean(snapshot), data: () => snapshot };
}
export async function getDocs(_ref: Ref) {
  const order = structuredClone(state.orders.get('order-1'));
  return { empty: !order, docs: order ? [{ id: 'order-1', data: () => order }] : [] };
}
export async function addDoc(_ref: Ref, data: RecordData) {
  state.orders.set('new-order', structuredClone(data));
  return { id: 'new-order' };
}
export async function runTransaction(_db: unknown, work: (transaction: any) => Promise<void>) {
  const previous = queue;
  let release!: () => void;
  queue = new Promise<void>(resolve => { release = resolve; });
  await previous;
  try {
    await work({ get: getDoc, update(ref: Ref, data: RecordData) {
      if (ref.collection === 'products') { state.stock = data.stock; return; }
      const order = state.orders.get(ref.id!)!;
      for (const [key, value] of Object.entries(data)) {
        const [parent, child] = key.split('.');
        if (child) order[parent][child] = value;
        else order[parent] = value;
      }
    } });
  } finally { release(); }
}
export async function initializePaystackTransaction() {
  return { success: state.initializationsSucceed, authorizationUrl: 'https://example.com/pay', accessCode: 'test', message: 'Initialization result' };
}
export async function verifyPaystackTransaction() { return { ...state.verification }; }
