import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowRight, Package, Truck, AlertCircle } from 'lucide-react';
import { GatewayNav } from '../components/gateway';
import { Footer } from '../components/homepage/footer/Footer';
import { trackOrder, resumeTracking, forgetTracking } from '../services/orderManagementService';
import type { TrackingOrder } from '../types/orderManagement';
import { safeTrackingUrl } from '../utils/orderManagement';
import { OrderTimeline } from '../components/orders/OrderTimeline';
import { OrderStatusBadge } from '../components/orders/OrderStatusBadge';

export default function TrackOrderPage() {
  const [params] = useSearchParams();
  const prefill = params.get('orderNumber') || '';
  const [number, setNumber] = useState(prefill.slice(0, 40));
  const [verification, setVerification] = useState('');
  const [order, setOrder] = useState<TrackingOrder | null>(null);
  const [busy, setBusy] = useState(false); const [restoring, setRestoring] = useState(true); const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    resumeTracking().then(result => { if (active && (!prefill || prefill.trim().toUpperCase() === result.orderNumber)) { setOrder(result); setNumber(result.orderNumber); } })
      .catch(() => { /* No valid session: ask for verification. */ }).finally(() => { if (active) setRestoring(false); });
    return () => { active = false; };
  }, [prefill]);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setOrder(null);
    try { const result = await trackOrder(number, verification); setOrder(result); setVerification(''); }
    catch (error) { setError(error instanceof Error ? error.message : 'Unable to load your order. Please try again.'); }
    finally { setBusy(false); }
  }
  async function refresh() {
    setBusy(true); setError('');
    try { setOrder(await resumeTracking()); }
    catch (error) { setOrder(null); setError(error instanceof Error ? error.message : 'Please verify your details again.'); }
    finally { setBusy(false); }
  }
  async function forget() {
    setBusy(true); setError('');
    try { await forgetTracking(); setOrder(null); setVerification(''); }
    catch { setError('Unable to clear this session. Please try again.'); }
    finally { setBusy(false); }
  }
  const url = safeTrackingUrl(order?.trackingUrl);
  return <div className="min-h-screen bg-brand-ivory"><GatewayNav />
    <main className="max-w-5xl mx-auto px-5 sm:px-8 pt-32 pb-24">
      <header className="max-w-xl mb-10"><p className="text-xs tracking-[0.25em] uppercase text-gold-700 mb-4">From us, with care</p><h1 className="font-serif text-4xl sm:text-5xl text-brand-dark">Track your order</h1><p className="text-brand-light mt-4 leading-relaxed">Follow your thoughtful selection, from our hands to theirs.</p></header>
      {error && <p role="alert" className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-red-800 text-sm">{error}</p>}
      {restoring ? <p role="status">Checking your tracking session…</p> : !order ? <section className="max-w-xl bg-white border border-brand-dark/10 rounded-2xl p-6 sm:p-8">
        <Package className="text-gold-600 mb-5" size={26} /><h2 className="font-serif text-2xl text-brand-dark mb-2">A few details to find your order</h2><p className="text-sm text-brand-light mb-7">Use the email address or phone number entered as the customer at checkout. No account needed.</p>
        <form onSubmit={submit} className="space-y-5"><label className="block text-sm text-brand-dark">Order number<input required maxLength={40} autoComplete="off" placeholder="GTC-20261002-AB12" value={number} onChange={e => setNumber(e.target.value)} className="mt-2 block w-full rounded-lg border border-brand-dark/20 p-3.5 uppercase" /></label>
          <label className="block text-sm text-brand-dark">Email or phone<input required maxLength={254} autoComplete="off" value={verification} onChange={e => setVerification(e.target.value)} className="mt-2 block w-full rounded-lg border border-brand-dark/20 p-3.5" /></label>
          <button disabled={busy} className="w-full flex justify-center items-center gap-3 rounded-lg bg-brand-dark text-white p-3.5 text-sm disabled:opacity-50">{busy ? 'Finding your order…' : 'Find my order'}<ArrowRight size={17} /></button>
        </form><p className="text-xs text-brand-light mt-5">Your details are used only to verify access to this order.</p>
      </section> : <div className="space-y-6">
        <section className="rounded-2xl border border-brand-dark/10 bg-white p-6 sm:p-8"><div className="flex flex-wrap justify-between gap-4"><div><h2 className="text-xl sm:text-2xl font-serif text-brand-dark break-all">{order.orderNumber}</h2><p className="text-xs text-brand-light mt-2">Placed {new Date(order.createdAt).toLocaleDateString()}</p></div><OrderStatusBadge status={order.orderStatus} /></div><p className="text-sm text-brand-medium mt-5">Payment status: <strong className="capitalize">{order.paymentStatus}</strong></p></section>
        {order.deliveryIssue?.active && <aside className="rounded-xl border border-amber-200 bg-amber-50 p-5 flex gap-3"><AlertCircle size={22} className="shrink-0 text-amber-800" /><div><h3 className="font-semibold text-amber-950">A delivery update</h3><p className="mt-2 text-sm whitespace-pre-wrap text-amber-900">{order.deliveryIssue.message}</p>{order.deliveryIssue.updatedExpectedDeliveryDate && <p className="mt-2 text-sm font-medium">Updated expected date: {order.deliveryIssue.updatedExpectedDeliveryDate}</p>}</div></aside>}
        {order.orderStatus === 'confirmed-review-required' && <p className="text-sm bg-white border rounded-xl p-5">Your payment is recorded. Our team is reviewing your order before fulfillment.</p>}
        <div className="grid md:grid-cols-2 gap-6"><section className="rounded-2xl border border-brand-dark/10 bg-white p-6 sm:p-8"><h3 className="text-xl font-serif text-brand-dark mb-7">Your order’s journey</h3><OrderTimeline order={order} /></section>
          <div className="space-y-6"><section className="rounded-2xl border border-brand-dark/10 bg-white p-6 sm:p-8"><Truck className="text-gold-600 mb-4" /><h3 className="text-xl font-serif text-brand-dark mb-5">Delivery details</h3><dl className="space-y-4 text-sm">
            {([['Destination', order.destination], ['Preferred delivery date', order.preferredDeliveryDate], ['Expected delivery date', order.expectedDeliveryDate], ['Courier', order.courierName], ['Tracking number', order.trackingNumber]] as const).map(([label, value]) => value ? <div key={label}><dt className="text-xs text-brand-light mb-1">{label}</dt><dd className="text-brand-dark break-words">{value}</dd></div> : null)}</dl>
            {url && <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-6 bg-brand-dark text-white rounded-lg px-5 py-3 text-sm">Track package<ArrowRight size={16} /></a>}
          </section><section className="rounded-2xl border border-brand-dark/10 bg-white p-6 sm:p-8"><h3 className="text-xl font-serif text-brand-dark mb-5">Your selection</h3><ul className="divide-y divide-brand-dark/10">{order.items.map((item, index) => <li key={index} className="py-3 flex justify-between gap-4 text-sm text-brand-dark"><span>{item.name}</span><span className="whitespace-nowrap text-brand-light">Qty {item.quantity}</span></li>)}</ul></section></div>
        </div><div className="flex flex-wrap gap-4"><button disabled={busy} onClick={refresh} className="rounded-lg bg-brand-dark text-white px-5 py-3 text-sm disabled:opacity-50">{busy ? 'Please wait…' : 'Refresh updates'}</button><button disabled={busy} onClick={forget} className="text-sm underline text-brand-medium">Clear session / track another order</button></div>
      </div>}
      <Link to="/shop" className="inline-block text-sm text-brand-light underline mt-8">Back to the shop</Link>
    </main><Footer />
  </div>;
}
