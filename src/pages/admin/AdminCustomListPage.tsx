import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ArrowUpRight, Sparkles, Scissors, Clock } from 'lucide-react';
import { listAdminCustomRequests } from '../../services/customRequestService';
import type { CustomRequest, CustomRequestStatus, CustomQuoteStatus } from '../../types/customRequest';

const REQUEST_STATUS_LABELS: Record<CustomRequestStatus, string> = {
  submitted: 'Submitted',
  'under-review': 'Under Review',
  'quote-prepared': 'Quote Prepared',
  'quote-sent': 'Quote Sent',
  accepted: 'Accepted',
  design: 'Design & Proofing',
  sample: 'Sampling',
  'awaiting-approval': 'Awaiting Sign-off',
  production: 'In Production',
  packaging: 'Packaging',
  delivery: 'Dispatched',
  delivered: 'Delivered',
  declined: 'Declined',
  cancelled: 'Cancelled',
};

const QUOTE_STATUS_LABELS: Record<CustomQuoteStatus, string> = {
  'not-prepared': 'Not Prepared',
  draft: 'Draft',
  sent: 'Quote Sent',
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Expired',
};

export default function AdminCustomListPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const [requests, setRequests] = useState<CustomRequest[]>([]);
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

    listAdminCustomRequests(params, controller.signal)
      .then((res) => {
        setRequests(res.requests);
        setTotal(res.total);
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err.message || 'Failed to load custom commission requests.');
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

  const getStatusBadgeClass = (status: CustomRequestStatus) => {
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
      case 'design':
      case 'sample':
      case 'awaiting-approval':
      case 'production':
      case 'packaging':
      case 'delivery':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'declined':
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-stone-50 text-stone-700 border-stone-200';
    }
  };

  const getQuoteBadgeClass = (status?: CustomQuoteStatus) => {
    switch (status) {
      case 'sent':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'accepted':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'draft':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'declined':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-stone-50 text-stone-500 border-stone-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-brand-dark/10 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-gold-600 animate-pulse" />
            <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-600">
              Atelier Commissions
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-brand-dark font-normal tracking-tight">
            Custom & Create Requests
          </h1>
          <p className="font-sans text-xs sm:text-sm text-brand-medium mt-1">
            Review bespoke commissions, client specifications, quotations, and active production stages.
          </p>
        </div>

        <button
          onClick={() => setReload((n) => n + 1)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-brand-dark/15 rounded-xl font-sans text-xs font-semibold text-brand-dark hover:bg-[#FAF8F5] transition-colors shadow-sm"
        >
          <Clock className="w-4 h-4 text-brand-medium" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-brand-dark/10 shadow-sm space-y-4">
        <form onSubmit={submitSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-medium" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by reference, client name, email, item, or company..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-brand-dark/10 rounded-xl text-xs sm:text-sm font-sans text-brand-dark placeholder-brand-light focus:outline-none focus:border-brand-dark"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-brand-dark text-white rounded-xl text-xs font-sans font-semibold hover:bg-gold-600 transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-brand-dark/5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-sans font-semibold text-brand-medium uppercase tracking-wider">
              Status:
            </span>
            <select
              value={params.get('status') || ''}
              onChange={(e) => filter('status', e.target.value)}
              className="px-3 py-1.5 bg-[#FAF8F5] border border-brand-dark/10 rounded-lg text-xs font-sans text-brand-dark focus:outline-none"
            >
              <option value="">All Statuses</option>
              {Object.entries(REQUEST_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-sans font-semibold text-brand-medium uppercase tracking-wider">
              Quote:
            </span>
            <select
              value={params.get('quoteStatus') || ''}
              onChange={(e) => filter('quoteStatus', e.target.value)}
              className="px-3 py-1.5 bg-[#FAF8F5] border border-brand-dark/10 rounded-lg text-xs font-sans text-brand-dark focus:outline-none"
            >
              <option value="">All Quotes</option>
              {Object.entries(QUOTE_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {(params.get('status') || params.get('quoteStatus') || params.get('search')) && (
            <button
              onClick={() => {
                setSearch('');
                setParams(new URLSearchParams());
              }}
              className="text-xs font-sans text-gold-600 hover:text-brand-dark font-medium underline ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-sans">
          {error}
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-brand-dark/10 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-brand-medium font-sans text-xs">
            <div className="w-6 h-6 border-2 border-gold-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading custom commission requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="py-20 text-center px-4">
            <Scissors className="w-10 h-10 text-brand-medium/40 mx-auto mb-3" />
            <h3 className="font-serif text-lg text-brand-dark font-normal">No custom commissions found</h3>
            <p className="font-sans text-xs text-brand-medium mt-1">
              There are no bespoke requests matching your selected search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-brand-dark/10 font-sans text-[11px] font-semibold uppercase tracking-wider text-brand-medium">
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Client / Company</th>
                  <th className="py-3 px-4">Item & Scope</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Quote</th>
                  <th className="py-3 px-4">Target Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-dark/5 font-sans text-xs text-brand-dark">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                    {/* Reference & Date */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-brand-dark">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-gold-600" />
                        <span>{req.referenceNumber}</span>
                      </div>
                      <div className="text-[10px] font-sans font-normal text-brand-light mt-0.5">
                        {new Date(req.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </td>

                    {/* Client / Company */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-brand-dark">{req.customer?.fullName}</div>
                      {req.customer?.companyName && (
                        <div className="text-[11px] text-brand-medium">{req.customer.companyName}</div>
                      )}
                      <div className="text-[10px] text-brand-light">{req.customer?.email}</div>
                    </td>

                    {/* Item & Scope */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-brand-dark line-clamp-1">
                        {req.requestDetails?.item}
                      </div>
                      <div className="text-[11px] text-brand-medium flex items-center gap-2 mt-0.5">
                        <span className="capitalize">{req.requestType.replace('custom-', '')}</span>
                        <span>•</span>
                        <span>{req.requestDetails?.quantity} units</span>
                        {req.requestDetails?.budgetRange && (
                          <>
                            <span>•</span>
                            <span className="text-gold-700">{req.requestDetails.budgetRange}</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getStatusBadgeClass(
                          req.requestStatus
                        )}`}
                      >
                        {REQUEST_STATUS_LABELS[req.requestStatus] || req.requestStatus}
                      </span>
                    </td>

                    {/* Quote Badge & Total */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getQuoteBadgeClass(
                            req.quote?.status
                          )}`}
                        >
                          {QUOTE_STATUS_LABELS[req.quote?.status || 'not-prepared']}
                        </span>
                        {req.quote?.total !== undefined && req.quote.total > 0 && (
                          <span className="font-serif font-semibold text-brand-dark text-xs">
                            ₦{req.quote.total.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Target Date */}
                    <td className="py-3.5 px-4 text-brand-medium text-[11px]">
                      {req.requestDetails?.preferredDeliveryDate || 'Flexible'}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/admin/custom/${req.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FAF8F5] hover:bg-brand-dark hover:text-white text-brand-dark rounded-lg text-xs font-semibold transition-all border border-brand-dark/10"
                      >
                        <span>Inspect</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer / Pagination */}
        <div className="py-3 px-4 bg-[#FAF8F5] border-t border-brand-dark/10 flex items-center justify-between text-xs font-sans text-brand-medium">
          <span>
            Showing {requests.length} of {total} custom requests
          </span>
          {total > pageSize && (
            <div className="flex gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => filter('page', String(page - 1))}
                className="px-2.5 py-1 bg-white border border-brand-dark/15 rounded-md disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page * pageSize >= total}
                onClick={() => filter('page', String(page + 1))}
                className="px-2.5 py-1 bg-white border border-brand-dark/15 rounded-md disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
