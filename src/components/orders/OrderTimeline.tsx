import { Check, Circle } from 'lucide-react';
import type { TrackingOrder } from '../../types/orderManagement';
import { FULFILLMENT_STEPS, ORDER_STATUS_LABELS } from '../../utils/orderManagement';
import type { OrderStatus } from '../../types/order';

export function OrderTimeline({ order }: { order: TrackingOrder }) {
  const steps: OrderStatus[] = ['pending-payment', ...FULFILLMENT_STEPS];
  if (!steps.includes(order.orderStatus)) steps.push(order.orderStatus);
  return <ol aria-label="Order progress" className="space-y-0">{steps.map((status, index) => {
    const entry = [...order.statusHistory].reverse().find(event => event.status === status);
    const current = order.orderStatus === status;
    return <li key={status} aria-current={current ? 'step' : undefined} className="relative flex gap-4 pb-7 last:pb-0">
      {index < steps.length - 1 && <span className="absolute left-[15px] top-8 bottom-0 w-px bg-brand-dark/15" />}
      <span className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${current ? 'bg-brand-dark text-white border-brand-dark' : entry ? 'bg-gold-50 border-gold-600 text-gold-800' : 'bg-white border-brand-dark/15 text-brand-light'}`}>{entry && !current ? <Check size={16} /> : <Circle size={current ? 10 : 8} fill={current ? 'currentColor' : 'none'} />}</span>
      <div className="pt-1"><p className={`text-sm ${current ? 'font-semibold text-brand-dark' : entry ? 'text-brand-medium' : 'text-brand-light'}`}>{status === 'pending-payment' ? 'Order received' : ORDER_STATUS_LABELS[status]}{current && <span className="ml-2 text-[10px] uppercase tracking-wider">Current</span>}</p>
        <p className="text-xs text-brand-light mt-1">{entry ? new Date(entry.changedAt).toLocaleString() : 'No update recorded yet'}</p></div>
    </li>;
  })}</ol>;
}
