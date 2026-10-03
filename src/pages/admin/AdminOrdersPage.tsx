import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ArrowUpRight, ShoppingBag } from 'lucide-react';
import { listAdminOrders } from '../../services/orderManagementService';
import type { OrderListResult } from '../../types/orderManagement';
import { ORDER_STATUS_LABELS, formatOrderMoney } from '../../utils/orderManagement';
import { OrderStatusBadge } from '../../components/orders/OrderStatusBadge';

export default function AdminOrdersPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const [result, setResult] = useState<OrderListResult | null>(null);
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    listAdminOrders(params, controller.signal).then(setResult).catch(error => { if (!controller.signal.aborted) setError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [params, reload]);
  function filter(key: string, value: string) { const next = new URLSearchParams(params); value ? next.set(key, value) : next.delete(key); next.delete('page'); setParams(next); }
  function submit(event: FormEvent) { event.preventDefault(); filter('search', search); }
  const page = result?.page || 1;
  return <section className="max-w-7xl mx-auto text-slate-800 space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Order management</p><h1 className="text-3xl font-semibold">Orders</h1><p className="text-slate-500 mt-2">Every thoughtful delivery, from payment to arrival.</p></div>
      <button onClick={() => setReload(value => value + 1)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm">Refresh orders</button></header>
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
      <form onSubmit={submit} className="flex gap-2"><label className="flex-1 min-w-0"><span className="sr-only">Search orders</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Order number, name, email or phone" className="w-full rounded-lg border border-slate-300 p-3 text-sm" /></label><button className="rounded-lg bg-slate-900 px-4 text-white flex items-center gap-2"><Search size={17} /><span className="hidden sm:inline">Search</span><span className="sr-only sm:hidden">Search</span></button></form>
      <div className="grid sm:grid-cols-3 gap-3">
        <label className="text-xs font-medium">Order status<select value={params.get('status') || ''} onChange={e => filter('status', e.target.value)} className="block w-full mt-1 rounded-lg border p-2.5 text-sm"><option value="">All statuses</option>{Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="text-xs font-medium">Payment<select value={params.get('payment') || ''} onChange={e => filter('payment', e.target.value)} className="block w-full mt-1 rounded-lg border p-2.5 text-sm"><option value="">All payments</option>{['pending', 'paid', 'failed', 'refunded', 'abandoned'].map(value => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select></label>
        <label className="text-xs font-medium">Sort by<select value={params.get('sort') || 'newest'} onChange={e => filter('sort', e.target.value)} className="block w-full mt-1 rounded-lg border p-2.5 text-sm"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="delivery">Delivery date</option></select></label>
      </div>
    </div>
    {error ? <p role="alert" className="p-5 bg-red-50 text-red-800 rounded-xl">{error}</p> : loading ? <p role="status" className="p-8 text-center">Loading orders…</p> : <>
      <p className="text-sm text-slate-500">{result?.total || 0} matching orders</p>
      {!result?.orders.length && <div className="rounded-xl border bg-white p-12 text-center"><ShoppingBag className="mx-auto text-slate-400 mb-3" /><h2 className="font-medium">No orders found</h2><p className="text-sm text-slate-500 mt-2">Try another search or change the filters.</p></div>}
      <div className="grid gap-4 lg:grid-cols-2">{result?.orders.map(order => <Link key={order.id} to={`/admin/orders/${order.id}`} className="block rounded-xl border border-slate-200 bg-white p-5 hover:border-amber-600 transition-colors">
        <div className="flex justify-between gap-3"><div><h2 className="font-semibold break-all">{order.orderNumber}</h2><p className="text-sm text-slate-500 mt-1">{new Date(order.createdAt).toLocaleString()}</p></div><ArrowUpRight size={20} className="shrink-0" /></div>
        <div className="flex flex-wrap gap-2 my-4"><OrderStatusBadge status={order.orderStatus} /><span className="text-xs rounded-full bg-slate-100 px-3 py-1 capitalize">Payment: {order.paymentStatus}</span></div>
        <p className="font-medium">{order.customerName}</p><p className="text-sm text-slate-500 mt-1">{order.deliveryLocation}</p>
        <div className="flex flex-wrap justify-between gap-3 pt-4 mt-4 border-t"><span className="text-sm">{order.itemCount} items · <strong>{formatOrderMoney(order.total)}</strong></span><span className="text-xs text-slate-500">Preferred: {order.preferredDeliveryDate || 'Not specified'}</span></div>
      </Link>)}</div>
      {result && result.total > result.pageSize && <nav aria-label="Order pages" className="flex items-center justify-between"><button disabled={page <= 1} onClick={() => { const p = new URLSearchParams(params); p.set('page', String(page - 1)); setParams(p); }} className="border rounded-lg px-4 py-2 disabled:opacity-40">Previous</button><span className="text-sm">Page {page} of {Math.ceil(result.total / result.pageSize)}</span><button disabled={page * result.pageSize >= result.total} onClick={() => { const p = new URLSearchParams(params); p.set('page', String(page + 1)); setParams(p); }} className="border rounded-lg px-4 py-2 disabled:opacity-40">Next</button></nav>}
    </>}
  </section>;
}
