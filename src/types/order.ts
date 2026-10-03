/**
 * Good Things Co. — Order & Payment Type Definitions
 *
 * Types for customer orders, snapshot line items, delivery details,
 * and Paystack payment transactions.
 */

export interface OrderItem {
  productId: string;
  slug: string;
  name: string;
  imageUrl?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;

  selectedVariants?: Record<string, string>;
  packaging?: string;
  ribbonColour?: string;
  giftMessage?: string;
  personalisationText?: string;
}

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'abandoned'
  | 'refunded';

export type OrderStatus =
  | 'pending-payment'
  | 'confirmed'
  | 'preparing'
  | 'packaged'
  | 'dispatched'
  | 'out-for-delivery'
  | 'delivered'
  | 'cancelled'
  | 'confirmed-review-required';

export interface OrderCustomer {
  fullName: string;
  email: string;
  phone: string;
}

export interface OrderRecipient {
  isSelf: boolean;
  fullName: string;
  phone: string;
}

export interface OrderDeliveryAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
}

export interface OrderDelivery {
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  expectedDeliveryDate?: string;
  address: OrderDeliveryAddress;
  zone: string;
  preferredDate: string;
  specialInstructions?: string;
  deliveryFee: number;
}

export interface OrderPayment {
  status: PaymentStatus;
  provider: 'paystack';
  reference: string;
  paidAt?: string;
  channel?: string;
  transactionId?: string;
  currency: 'NGN';
  amountKobo: number;
  paymentException?: string;
}

export interface Order {
  revision?: number;
  statusHistory?: OrderStatusEntry[];
  deliveryIssue?: DeliveryIssue;
  id?: string;
  orderNumber: string;

  customer: OrderCustomer;
  recipient: OrderRecipient;
  delivery: OrderDelivery;

  giftMessage?: string;
  items: OrderItem[];

  subtotal: number;
  deliveryFee: number;
  total: number;
  currency: 'NGN';

  payment: OrderPayment;
  orderStatus: OrderStatus;

  checkoutSessionId?: string;

  createdAt: string;
  updatedAt: string;
}

export interface OrderStatusEntry {
  eventId: string;
  status: OrderStatus;
  changedAt: string;
  changedBy: string;
  note?: string;
}

export interface DeliveryIssue {
  active: boolean;
  message: string;
  createdAt: string;
  updatedAt: string;
  updatedExpectedDeliveryDate?: string;
}

export interface PaystackInitResponse {
  success: boolean;
  authorizationUrl?: string;
  accessCode?: string;
  reference: string;
  orderNumber: string;
  orderId: string;
  message?: string;
}

export interface PaystackVerifyResponse {
  success: boolean;
  orderNumber?: string;
  orderId?: string;
  order?: Order;
  message: string;
  alreadyProcessed?: boolean;
}
