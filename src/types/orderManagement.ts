import type { Order, OrderStatus, PaymentStatus } from './order.js';

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
  customerEmail?: string;
  customerPhone?: string;
  createdAt: string;
  total: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  preferredDeliveryDate: string;
  deliveryLocation: string;
  itemCount: number;
  isTestOrder?: boolean;
  environment?: 'test' | 'live';
}
export interface OrderListResult {
  orders: OrderListItem[];
  total: number;
  page: number;
  pageSize: number;
  completedCount?: number;
  incompleteCount?: number;
  isTestModeActive?: boolean;
  paymentGatewayModes?: {
    flutterwave: string;
    nomba: string;
    paystack: string;
  };
}
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
