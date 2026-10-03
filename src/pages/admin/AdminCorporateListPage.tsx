import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ArrowUpRight, Inbox, Building2 } from 'lucide-react';
import { listAdminCorporateRequests } from '../../services/corporateService';
import type { CorporateRequest, CorporateRequestStatus, CorporateQuoteStatus } from '../../types/corporate';

const REQUEST_STATUS_LABELS: Record<CorporateRequestStatus, string> = {
  submitted: 'Submitted',
  'under-review': 'Under Review',
  'quote-prepared': 'Quote Prepared',
  'quote-sent': 'Quote Sent',
  accepted: 'Accepted',
  declined: 'Declined',
  production: 'In Production',
  packaging: 'Packaging',
  delivery: 'Dispatched',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const QUOTE_STATUS_LABELS: Record<CorporateQuoteStatus, string> = {
  'not-prepared': 'Not Prepared',
  draft: 'Draft',
  sent: 'Quote Sent',
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Expired',
};

export default function AdminCorporateListPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const [requests, setRequests] = useState<CorporateRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  const page = Math.max(1, Number(params.get('page')) || 1);
  const pageSize = 25;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    listAdminCorporateRequests(params, controller.signal)
      .then((res) => {
        setRequests(res.requests);
        setTotal(res.total);
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err.message || 'Failed to load corporate requests.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [params, reload]);

  function filter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.delete('page');
    setParams(next);
  }

  function submitSearch(e: FormEvent) {
    e.preventDefault();
    filter('search', search);
  }

  const getStatusBadgeClass = (status: CorporateRequestStatus) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'under-review':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'quote-prepared':
      case 'quote-sent':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'accepted':
      case 'delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'production':
      case 'packaging':
      case 'delivery':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'declined':
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <section className="max-w-7xl mx-auto text-slate-800 space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Concierge Atelier</p>
          <h1 className="text-3xl font-semibold">Corporate Gifting Requests</h1>
          <p className="text-slate-500 mt-2">
            Enterprise inquiries, bespoke packaging requests, and pro-forma quote lifecycle.
          </p>
        </div>
        <button
          onClick={() => setReload((v) => v + 1)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          Refresh Inquiries
        </button>
      </header>

      {/* Filter & Search Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4 shadow-xs">
        <form onSubmit={submitSearch} className="flex gap-2">
          <label className="flex-1 min-w-0">
            <span className="sr-only">Search inquiries</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference, company name, contact, email or phone..."
              className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-5 text-white flex items-center gap-2 hover:bg-slate-800 transition-colors"
          >
            <Search size={16} />
            <span className="hidden sm:inline text-sm font-medium">Search</span>
          </button>
        </form>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <label className="text-xs font-medium text-slate-600">
            Request Status
            <select
              value={params.get('status') || ''}
              onChange={(e) => filter('status', e.target.value)}
              className="block w-full mt-1 rounded-lg border border-slate-200 bg-white p-2.5 text-sm"
            >
              <option value="">All Request Statuses</option>
              {Object.entries(REQUEST_STATUS_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-medium text-slate-600">
            Quote Status
            <select
              value={params.get('quoteStatus') || ''}
              onChange={(e) => filter('quoteStatus', e.target.value)}
              className="block w-full mt-1 rounded-lg border border-slate-200 bg-white p-2.5 text-sm"
            >
              <option value="">All Quote Statuses</option>
              {Object.entries(QUOTE_STATUS_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Main Content List */}
      {error ? (
        <div role="alert" className="p-5 bg-red-50 text-red-800 rounded-xl border border-red-200">
          {error}
        </div>
      ) : loading ? (
        <div role="status" className="p-12 text-center text-slate-500">
          Loading corporate inquiries...
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500">{total} corporate inquiries matching filters</p>

          {requests.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
              <Inbox className="mx-auto text-slate-400 mb-3" size={32} />
              <h2 className="font-medium text-slate-800">No Corporate Requests Found</h2>
              <p className="text-sm text-slate-500 mt-1">Try another search keyword or adjust filter criteria.</p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {requests.map((req) => (
                <Link
                  key={req.id}
                  to={`/admin/corporate/${req.id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-5 hover:border-amber-600 transition-colors shadow-xs group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-xs font-semibold text-slate-900 group-hover:text-amber-800 transition-colors">
                        {req.referenceNumber}
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(req.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <ArrowUpRight size={18} className="text-slate-400 group-hover:text-amber-700 transition-colors shrink-0" />
                  </div>

                  <div className="flex flex-wrap gap-2 my-3">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${getStatusBadgeClass(req.requestStatus)}`}>
                      {REQUEST_STATUS_LABELS[req.requestStatus] || req.requestStatus}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-600 font-medium">
                      Quote: {QUOTE_STATUS_LABELS[req.quote.status] || req.quote.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-1.5 font-medium text-slate-900">
                      <Building2 size={15} className="text-slate-500 shrink-0" />
                      <span>{req.company.companyName}</span>
                    </div>
                    <p className="text-xs text-slate-500 pl-5">
                      Attn: {req.company.contactName} · {req.company.email}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-3 border-t border-slate-100 text-xs text-slate-600">
                    <span>
                      Qty: <strong>{req.quantity}</strong> ({req.budgetRange})
                    </span>
                    {req.quote.total ? (
                      <span className="font-mono font-semibold text-slate-900">
                        Quote: ₦{req.quote.total.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">No quote prepared</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {total > pageSize && (
            <nav aria-label="Corporate inquiry pagination" className="flex items-center justify-between pt-4">
              <button
                disabled={page <= 1}
                onClick={() => {
                  const p = new URLSearchParams(params);
                  p.set('page', String(page - 1));
                  setParams(p);
                }}
                className="border rounded-lg px-4 py-2 text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600">
                Page {page} of {Math.ceil(total / pageSize)}
              </span>
              <button
                disabled={page * pageSize >= total}
                onClick={() => {
                  const p = new URLSearchParams(params);
                  p.set('page', String(page + 1));
                  setParams(p);
                }}
                className="border rounded-lg px-4 py-2 text-sm disabled:opacity-40"
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
