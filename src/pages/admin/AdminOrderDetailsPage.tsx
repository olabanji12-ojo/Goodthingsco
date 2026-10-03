import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Package } from 'lucide-react';
import { getAdminOrder, updateAdminOrder } from '../../services/orderManagementService';
import type { Order, OrderStatus } from '../../types/order';
import type { OrderUpdateInput } from '../../types/orderManagement';
import { ORDER_STATUS_LABELS, ORDER_TRANSITIONS, formatOrderMoney, safeTrackingUrl } from '../../utils/orderManagement';
import { OrderStatusBadge } from '../../components/orders/OrderStatusBadge';

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"><h2 className="font-semibold text-lg mb-4">{title}</h2>{children}</section>;
}
function Detail({ label, children }: { label: string; children: ReactNode }) {
  return <div className="mb-3"><dt className="text-xs text-slate-500 mb-1">{label}</dt><dd className="text-sm break-words whitespace-pre-wrap">{children || '—'}</dd></div>;
}
const inputClass = 'w-full rounded-lg border border-slate-300 bg-white p-2.5 mt-1 text-sm';
export default function AdminOrderDetailsPage() {
  const { orderId = '' } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState(''); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(''); const [reload, setReload] = useState(0);
  const [status, setStatus] = useState<OrderStatus>('confirmed'); const [note, setNote] = useState('');
  const [cancel, setCancel] = useState(false);
  const [delivery, setDelivery] = useState({ courierName: '', trackingNumber: '', trackingUrl: '', expectedDeliveryDate: '' });
  const [issue, setIssue] = useState({ active: false, message: '' });
  const retry = useRef<{ payload: string; eventId: string }>();
  function populate(value: Order) {
    setOrder(value); setStatus(value.orderStatus); setNote(''); setCancel(false);
    setDelivery({ courierName: value.delivery.courierName || '', trackingNumber: value.delivery.trackingNumber || '',
      trackingUrl: value.delivery.trackingUrl || '', expectedDeliveryDate: value.delivery.expectedDeliveryDate || '' });
    setIssue({ active: Boolean(value.deliveryIssue?.active), message: value.deliveryIssue?.message || '' });
  }
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    getAdminOrder(orderId, controller.signal).then(value => { if (!controller.signal.aborted) populate(value); })
      .catch(error => { if (!controller.signal.aborted) setError(error.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [orderId, reload]);
  async function save(event: FormEvent) {
    event.preventDefault(); if (!order) return; setError(''); setNotice('');
    if (delivery.trackingUrl && !safeTrackingUrl(delivery.trackingUrl)) { setError('Tracking URL must start with HTTPS and contain no embedded credentials.'); return; }
    const payload = { expectedRevision: order.revision || 0, status, note, confirmCancellation: cancel, delivery, deliveryIssue: issue };
    const serialized = JSON.stringify(payload);
    if (retry.current?.payload !== serialized) retry.current = { payload: serialized, eventId: crypto.randomUUID() };
    const update: OrderUpdateInput = { ...payload, eventId: retry.current!.eventId };
    setBusy(true);
    try {
      const result = await updateAdminOrder(orderId, update);
      populate(result.order); retry.current = undefined;
      setNotice(!result.changed ? 'No changes to save.' : result.notifications === 'failed' ? 'Order saved. Email delivery failed; the order update is safe.'
        : result.notifications === 'skipped' ? 'Order saved. Email was skipped because delivery is not configured.'
        : result.notifications === 'accepted' ? 'Order saved. Notification accepted by the email provider.' : 'Order saved.');
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not save. You can retry safely.'); }
    finally { setBusy(false); }
  }
  if (loading) return <p role="status" className="p-8 text-center">Loading order…</p>;
  if (!order) return <div role="alert" className="text-red-700">{error || 'Order not found.'}<button className="block underline mt-3" onClick={() => setReload(value => value + 1)}>Try again</button></div>;
  return <div className="max-w-6xl mx-auto text-slate-800 space-y-6">
    <Link to="/admin/orders" className="inline-flex items-center gap-2 text-sm text-slate-500"><ArrowLeft size={16} />All orders</Link>
    <header className="flex flex-wrap justify-between items-start gap-4"><div><p className="text-xs uppercase tracking-[0.15em] text-slate-500 mb-2">Order details</p><h1 className="text-2xl sm:text-3xl font-semibold break-all">{order.orderNumber}</h1><p className="text-sm text-slate-500 mt-2">Created {new Date(order.createdAt).toLocaleString()}</p></div><OrderStatusBadge status={order.orderStatus} /></header>
    {error && <div role="alert" className="bg-red-50 text-red-800 p-4 rounded-lg">{error}<button type="button" onClick={() => { retry.current = undefined; setReload(value => value + 1); }} className="block underline mt-2">Reload latest order (discards unsaved changes)</button></div>}
    {notice && <p role="status" className="bg-emerald-50 text-emerald-800 p-4 rounded-lg">{notice}</p>}
    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)] gap-6 items-start">
      <div className="space-y-6 min-w-0">
        <Panel title="Purchased items"><div className="divide-y">{order.items.map((item, index) => <div key={index} className="py-4 first:pt-0 flex gap-4">
          {safeTrackingUrl(item.imageUrl) ? <img src={safeTrackingUrl(item.imageUrl)} alt={item.name} className="w-14 h-14 sm:w-20 sm:h-20 rounded-lg object-cover shrink-0" /> : <Package size={40} className="shrink-0 text-slate-300" />}
          <div className="min-w-0 flex-1"><h3 className="font-medium break-words">{item.name}</h3><p className="text-sm text-slate-500 mt-1">{item.quantity} × {formatOrderMoney(item.unitPrice)}</p><p className="font-semibold text-sm mt-1">{formatOrderMoney(item.subtotal)}</p>
            <dl className="mt-3 text-xs space-y-1">{Object.entries(item.selectedVariants || {}).map(([key, value]) => <div key={key}><dt className="inline text-slate-500">{key}: </dt><dd className="inline">{value}</dd></div>)}
              {([['Packaging', item.packaging], ['Ribbon', item.ribbonColour], ['Personalisation', item.personalisationText], ['Gift message', item.giftMessage]] as const).map(([key, value]) => value ? <div key={key}><dt className="inline text-slate-500">{key}: </dt><dd className="inline whitespace-pre-wrap break-words">{value}</dd></div> : null)}</dl>
          </div></div>)}</div>
          <dl className="border-t pt-4 mt-3 space-y-2 text-sm"><div className="flex justify-between"><dt>Subtotal</dt><dd>{formatOrderMoney(order.subtotal)}</dd></div><div className="flex justify-between"><dt>Delivery fee</dt><dd>{formatOrderMoney(order.deliveryFee)}</dd></div><div className="flex justify-between font-semibold text-lg pt-2"><dt>Total</dt><dd>{formatOrderMoney(order.total)}</dd></div></dl>
        </Panel>
        <div className="grid sm:grid-cols-2 gap-6"><Panel title="Customer"><dl><Detail label="Name">{order.customer.fullName}</Detail><Detail label="Email">{order.customer.email}</Detail><Detail label="Phone">{order.customer.phone}</Detail></dl></Panel><Panel title="Recipient"><dl><Detail label="Name">{order.recipient.fullName}</Detail><Detail label="Phone">{order.recipient.phone}</Detail><Detail label="Self order">{order.recipient.isSelf ? 'Yes' : 'No'}</Detail></dl></Panel></div>
        <Panel title="Delivery address"><dl><Detail label="Address">{[order.delivery.address.addressLine1, order.delivery.address.addressLine2, order.delivery.address.city, order.delivery.address.state, order.delivery.address.country, order.delivery.address.postalCode].filter(Boolean).join(', ')}</Detail><Detail label="Preferred delivery date">{order.delivery.preferredDate}</Detail><Detail label="Special instructions">{order.delivery.specialInstructions}</Detail></dl></Panel>
        {order.giftMessage && <Panel title="Order gift message"><p className="text-sm whitespace-pre-wrap">{order.giftMessage}</p></Panel>}
        <Panel title="Payment"><dl className="grid sm:grid-cols-2 gap-x-5"><Detail label="Status">{order.payment.status}</Detail><Detail label="Amount paid">{order.payment.paidAt ? formatOrderMoney(order.payment.amountKobo / 100) : 'Not confirmed'}</Detail><Detail label="Provider">{order.payment.provider}</Detail><Detail label="Reference">{order.payment.reference}</Detail><Detail label="Paid at">{order.payment.paidAt ? new Date(order.payment.paidAt).toLocaleString() : undefined}</Detail><Detail label="Manual attention">{order.payment.paymentException}</Detail></dl></Panel>
        <Panel title="Status history"><ol className="space-y-4">{order.statusHistory?.map(entry => <li key={entry.eventId} className="border-l-2 border-amber-600 pl-4"><p className="text-sm font-medium">{ORDER_STATUS_LABELS[entry.status]}</p><p className="text-xs text-slate-500 mt-1">{new Date(entry.changedAt).toLocaleString()} · {entry.changedBy}</p>{entry.note && <p className="text-sm mt-2 whitespace-pre-wrap">{entry.note}</p>}</li>)}</ol></Panel>
      </div>
      <Panel title="Manage fulfillment"><form onSubmit={save} className="space-y-5"><fieldset disabled={busy} className="space-y-5 disabled:opacity-60">
        <label className="block text-sm font-medium">Order status<select className={inputClass} value={status} onChange={e => { setStatus(e.target.value as OrderStatus); setCancel(false); }}><option value={order.orderStatus}>{ORDER_STATUS_LABELS[order.orderStatus]}</option>{ORDER_TRANSITIONS[order.orderStatus].map(value => <option key={value} value={value}>{ORDER_STATUS_LABELS[value]}</option>)}</select></label>
        {order.orderStatus === 'confirmed-review-required' && <p className="text-sm bg-amber-50 p-3 rounded-lg">Review the payment and inventory exception before confirming fulfillment.</p>}
        {status === 'cancelled' && order.orderStatus !== 'cancelled' && <label className="flex gap-2 text-sm text-red-800 bg-red-50 p-3 rounded-lg"><input type="checkbox" checked={cancel} onChange={e => setCancel(e.target.checked)} required /><span>I confirm cancellation. This does not issue a refund or restore stock.</span></label>}
        <label className="block text-sm">Internal change note<textarea className={inputClass} maxLength={1000} value={note} onChange={e => setNote(e.target.value)} required={status === 'cancelled' && order.orderStatus !== 'cancelled'} rows={3} /><span className="text-xs text-slate-500">Saved with this change; never shown in customer tracking.</span></label>
        <div className="border-t pt-4 space-y-4"><h3 className="font-medium text-sm">Courier & timing</h3>
          <label className="block text-sm">Courier name<input className={inputClass} maxLength={120} value={delivery.courierName} onChange={e => setDelivery({ ...delivery, courierName: e.target.value })} /></label>
          <label className="block text-sm">Tracking number<input className={inputClass} maxLength={160} value={delivery.trackingNumber} onChange={e => setDelivery({ ...delivery, trackingNumber: e.target.value })} /></label>
          <label className="block text-sm">Tracking URL<input className={inputClass} type="url" placeholder="https://" maxLength={2048} value={delivery.trackingUrl} onChange={e => setDelivery({ ...delivery, trackingUrl: e.target.value })} /></label>
          <label className="block text-sm">Expected delivery date<input className={inputClass} type="date" value={delivery.expectedDeliveryDate} onChange={e => setDelivery({ ...delivery, expectedDeliveryDate: e.target.value })} /></label>
        </div>
        <div className="border-t pt-4 space-y-3"><label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={issue.active} onChange={e => setIssue({ active: e.target.checked, message: e.target.checked ? issue.message : '' })} />Delivery delay or issue</label>
          {issue.active && <label className="block text-sm">Customer-facing message<textarea className={inputClass} rows={4} maxLength={1000} required value={issue.message} onChange={e => setIssue({ ...issue, message: e.target.value })} /><span className="text-xs text-slate-500">Shown in tracking and included in the delay email. Set the revised date above.</span></label>}
        </div>
        <button className="w-full rounded-lg bg-slate-900 text-white p-3 font-medium disabled:opacity-50">{busy ? 'Saving…' : 'Save changes'}</button>
        <p className="text-xs text-slate-500">Status and active issue changes notify the customer after saving.</p>
      </fieldset></form></Panel>
    </div>
  </div>;
}
