import type { Order, OrderStatus, PaymentStatus } from './order';

export interface OrderUpdateInput {
  eventId: string;
  expectedRevision: number;
  status?: OrderStatus;
  note?: string;
  confirmCancellation?: boolean;
  delivery?: { courierName: string; trackingNumber: string; trackingUrl: string; expectedDeliveryDate: string };
  deliveryIssue?: { active: boolean; message: string };
}
export interface OrderListItem {
  id: string;
  orderNumber: string;
  customerName: string;
  createdAt: string;
  total: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  preferredDeliveryDate: string;
  deliveryLocation: string;
  itemCount: number;
}
export interface OrderListResult { orders: OrderListItem[]; total: number; page: number; pageSize: number }
export interface OrderUpdateResult {
  order: Order;
  replayed: boolean;
  changed: boolean;
  notifications: 'none' | 'attempted' | 'accepted' | 'skipped' | 'failed';
}
export interface TrackingOrder {
  orderNumber: string;
  createdAt: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  items: Array<{ name: string; quantity: number }>;
  destination: string;
  preferredDeliveryDate: string;
  expectedDeliveryDate?: string;
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  deliveryIssue?: { active: boolean; message: string; updatedExpectedDeliveryDate?: string };
  statusHistory: Array<{ status: OrderStatus; changedAt: string }>;
}
