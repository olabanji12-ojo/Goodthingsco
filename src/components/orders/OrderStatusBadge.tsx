import type { OrderStatus } from '../../types/order';
import { ORDER_STATUS_LABELS } from '../../utils/orderManagement';
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const color = status === 'delivered' ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
    : status === 'cancelled' || status === 'confirmed-review-required' ? 'bg-red-50 text-red-800 border-red-200'
    : 'bg-amber-50 text-amber-900 border-amber-200';
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${color}`}>{ORDER_STATUS_LABELS[status]}</span>;
}
