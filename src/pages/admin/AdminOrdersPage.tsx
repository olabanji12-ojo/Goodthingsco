import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ArrowUpRight, ShoppingBag, Trash2, Clock, Phone, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { listAdminOrders, deleteAdminOrder, clearAdminOrders } from '../../services/orderManagementService';
import type { OrderListResult } from '../../types/orderManagement';
import { ORDER_STATUS_LABELS, formatOrderMoney } from '../../utils/orderManagement';
import { OrderStatusBadge } from '../../components/orders/OrderStatusBadge';

export default function AdminOrdersPage() {
  const [params, setParams] = useSearchParams();
  const activeView = params.get('view') || 'completed';
  const [search, setSearch] = useState(params.get('search') || '');
  const [result, setResult] = useState<OrderListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    const queryParams = new URLSearchParams(params);
    if (!queryParams.has('view')) queryParams.set('view', activeView);
    listAdminOrders(queryParams, controller.signal)
      .then(setResult)
      .catch((err) => {
        if (!controller.signal.aborted) setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [params, reload]);

  function filter(key: string, value: string) {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    next.delete('page');
    setParams(next);
  }

  function setView(view: 'completed' | 'incomplete') {
    const next = new URLSearchParams(params);
    if (view === 'completed') {
      next.delete('view');
    } else {
      next.set('view', view);
    }
    next.delete('page');
    setParams(next);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    filter('search', search);
  }

  async function handleDeleteOrder(id: string, orderNumber: string) {
    if (!window.confirm(`Are you sure you want to delete order "${orderNumber}"? This cannot be undone.`)) return;
    try {
      setActionBusy(true);
      await deleteAdminOrder(id);
      setReload((v) => v + 1);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete order.');
    } finally {
      setActionBusy(false);
    }
  }

  async function handleClearAll() {
    const isInc = activeView === 'incomplete';
    const label = isInc ? 'ALL incomplete/unpaid checkout attempts' : 'ALL orders currently in the system';
    if (!window.confirm(`⚠️ WARNING: Are you sure you want to permanently delete ${label}?\n\nThis will remove all corresponding records permanently. This cannot be undone.`)) {
      return;
    }
    try {
      setActionBusy(true);
      const res = await clearAdminOrders(isInc ? 'incomplete' : 'all');
      alert(`Successfully deleted ${res.deletedCount} order(s).`);
      setReload((v) => v + 1);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to clear orders.');
    } finally {
      setActionBusy(false);
    }
  }

  const page = result?.page || 1;
  const isIncView = activeView === 'incomplete';

  return (
    <section className="max-w-7xl mx-auto text-slate-800 space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Order management</p>
          <h1 className="text-3xl font-semibold">Orders</h1>
          <p className="text-slate-500 mt-2">
            {isIncView
              ? 'Unpaid checkout attempts and abandoned customer sessions.'
              : 'Every thoughtful delivery, from confirmed payment to arrival.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setReload((value) => value + 1)}
            disabled={actionBusy}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Refresh orders
          </button>
          <button
            onClick={handleClearAll}
            disabled={actionBusy || (result?.total === 0)}
            className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-2 text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-40"
          >
            {isIncView ? 'Clear All Incomplete' : 'Clear All Orders'}
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          type="button"
          onClick={() => setView('completed')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            !isIncView
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 size={16} />
          <span>Completed Orders (Paid)</span>
          {result?.completedCount !== undefined && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                !isIncView ? 'bg-slate-800 text-amber-300' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {result.completedCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setView('incomplete')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            isIncView
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock size={16} />
          <span>Incomplete Orders</span>
          {result?.incompleteCount !== undefined && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                isIncView ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {result.incompleteCount}
            </span>
          )}
        </button>
      </div>

      {/* Incomplete Banner */}
      {isIncView && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 flex items-start gap-3 text-amber-900 text-sm">
          <AlertCircle size={20} className="shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Incomplete & Abandoned Checkouts</p>
            <p className="text-amber-800 text-xs sm:text-sm">
              These are customers who initiated checkout but have not completed payment yet. Real, confirmed customer orders are kept in the <strong>Completed Orders (Paid)</strong> tab to avoid any fulfillment confusion.
            </p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4 shadow-sm">
        <form onSubmit={submit} className="flex gap-2">
          <label className="flex-1 min-w-0">
            <span className="sr-only">Search orders</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Order number, customer name, email or phone"
              className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </label>
          <button className="rounded-lg bg-slate-900 px-4 text-white flex items-center gap-2 hover:bg-slate-800 transition-colors">
            <Search size={17} />
            <span className="hidden sm:inline">Search</span>
            <span className="sr-only sm:hidden">Search</span>
          </button>
        </form>

        <div className="grid sm:grid-cols-3 gap-3">
          <label className="text-xs font-medium">
            Order status
            <select
              value={params.get('status') || ''}
              onChange={(e) => filter('status', e.target.value)}
              className="block w-full mt-1 rounded-lg border border-slate-300 p-2.5 text-sm"
            >
              <option value="">All statuses</option>
              {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium">
            Payment
            <select
              value={params.get('payment') || ''}
              onChange={(e) => filter('payment', e.target.value)}
              className="block w-full mt-1 rounded-lg border border-slate-300 p-2.5 text-sm"
            >
              <option value="">All payments</option>
              {['pending', 'paid', 'failed', 'refunded', 'abandoned'].map((value) => (
                <option key={value} value={value}>
                  {value[0].toUpperCase() + value.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium">
            Sort by
            <select
              value={params.get('sort') || 'newest'}
              onChange={(e) => filter('sort', e.target.value)}
              className="block w-full mt-1 rounded-lg border border-slate-300 p-2.5 text-sm"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="delivery">Delivery date</option>
            </select>
          </label>
        </div>
      </div>

      {/* Orders List */}
      {error ? (
        <p role="alert" className="p-5 bg-red-50 text-red-800 rounded-xl">
          {error}
        </p>
      ) : loading ? (
        <p role="status" className="p-8 text-center text-slate-500">
          Loading orders…
        </p>
      ) : (
        <>
          <p className="text-sm text-slate-500">
            {result?.total || 0} matching {isIncView ? 'incomplete checkout(s)' : 'order(s)'}
          </p>

          {!result?.orders.length && (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <ShoppingBag className="mx-auto text-slate-400 mb-3" size={32} />
              <h2 className="font-semibold text-lg text-slate-900">
                {isIncView ? 'No incomplete orders' : 'No orders found'}
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                {isIncView
                  ? 'All customers who initiated checkout have either completed payment or no abandoned sessions exist.'
                  : 'There are no active orders matching your filter criteria.'}
              </p>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            {result?.orders.map((order) => (
              <div
                key={order.id}
                className="relative rounded-xl border border-slate-200 bg-white p-5 hover:border-amber-600 transition-colors shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-3">
                    <Link
                      to={`/admin/orders/${order.id}`}
                      className="group flex-1 min-w-0"
                    >
                      <h2 className="font-semibold text-slate-900 break-all group-hover:text-amber-700 transition-colors">
                        {order.orderNumber}
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDeleteOrder(order.id, order.orderNumber)}
                        disabled={actionBusy}
                        title="Delete order"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                      <Link
                        to={`/admin/orders/${order.id}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 transition-colors"
                      >
                        <ArrowUpRight size={18} />
                      </Link>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 my-4">
                    <OrderStatusBadge status={order.orderStatus} />
                    <span
                      className={`text-xs rounded-full px-3 py-1 capitalize font-medium ${
                        order.paymentStatus === 'paid'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      Payment: {order.paymentStatus}
                    </span>
                  </div>

                  <p className="font-medium text-slate-900">{order.customerName}</p>

                  {/* Customer Contact Links for Incomplete Orders */}
                  {(order.customerEmail || order.customerPhone) && (
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600">
                      {order.customerPhone && (
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="inline-flex items-center gap-1 hover:text-amber-700 transition-colors font-mono"
                        >
                          <Phone size={12} />
                          <span>{order.customerPhone}</span>
                        </a>
                      )}
                      {order.customerEmail && (
                        <a
                          href={`mailto:${order.customerEmail}`}
                          className="inline-flex items-center gap-1 hover:text-amber-700 transition-colors"
                        >
                          <Mail size={12} />
                          <span>{order.customerEmail}</span>
                        </a>
                      )}
                    </div>
                  )}

                  <p className="text-sm text-slate-500 mt-2">{order.deliveryLocation || 'Location not specified'}</p>
                </div>

                <div className="flex flex-wrap justify-between gap-3 pt-4 mt-4 border-t border-slate-100">
                  <span className="text-sm">
                    {order.itemCount} items · <strong>{formatOrderMoney(order.total)}</strong>
                  </span>
                  <span className="text-xs text-slate-500">
                    Preferred: {order.preferredDeliveryDate || 'Not specified'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {result && result.total > result.pageSize && (
            <nav aria-label="Order pages" className="flex items-center justify-between pt-4">
              <button
                disabled={page <= 1}
                onClick={() => {
                  const p = new URLSearchParams(params);
                  p.set('page', String(page - 1));
                  setParams(p);
                }}
                className="border border-slate-300 rounded-lg px-4 py-2 text-sm disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600">
                Page {page} of {Math.ceil(result.total / result.pageSize)}
              </span>
              <button
                disabled={page * result.pageSize >= result.total}
                onClick={() => {
                  const p = new URLSearchParams(params);
                  p.set('page', String(page + 1));
                  setParams(p);
                }}
                className="border border-slate-300 rounded-lg px-4 py-2 text-sm disabled:opacity-40 hover:bg-slate-50"
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
