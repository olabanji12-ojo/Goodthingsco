import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  FileText,
  Mail,
  Phone,
  Package,
  CheckCircle2,
  AlertCircle,
  Truck,
  Download,
  Send,
  Save,
  Check,
  X,
  History,
  Tag,
} from 'lucide-react';
import {
  getAdminCorporateRequest,
  updateAdminCorporateStatus,
  manageAdminCorporateQuote,
  acceptAdminCorporateQuote,
  declineAdminCorporateQuote,
} from '../../services/corporateService';
import type {
  CorporateRequest,
  CorporateRequestStatus,
} from '../../types/corporate';

const VALID_NEXT_STATUSES: Record<CorporateRequestStatus, CorporateRequestStatus[]> = {
  submitted: ['under-review', 'quote-prepared', 'quote-sent', 'cancelled'],
  'under-review': ['quote-prepared', 'quote-sent', 'declined', 'cancelled'],
  'quote-prepared': ['quote-sent', 'under-review', 'cancelled'],
  'quote-sent': ['accepted', 'declined', 'under-review', 'quote-prepared', 'cancelled'],
  accepted: ['production', 'packaging', 'delivery', 'delivered', 'cancelled'],
  production: ['packaging', 'delivery', 'delivered', 'cancelled'],
  packaging: ['delivery', 'delivered', 'cancelled'],
  delivery: ['delivered', 'cancelled'],
  delivered: [],
  declined: ['under-review', 'quote-prepared'],
  cancelled: [],
};

export default function AdminCorporateDetailPage() {
  const { requestId } = useParams<{ requestId: string }>();

  const [request, setRequest] = useState<CorporateRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Status Change State
  const [targetStatus, setTargetStatus] = useState<CorporateRequestStatus | ''>('');
  const [statusNote, setStatusNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Quote Form State
  const [subtotal, setSubtotal] = useState<number>(0);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [brandingFee, setBrandingFee] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [quoteNotes, setQuoteNotes] = useState<string>('');
  const [validUntil, setValidUntil] = useState<string>('');
  const [savingQuote, setSavingQuote] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineModal, setShowDeclineModal] = useState(false);

  useEffect(() => {
    if (!requestId) return;
    const controller = new AbortController();
    setLoading(true);
    setError('');

    getAdminCorporateRequest(requestId, controller.signal)
      .then((data) => {
        setRequest(data);
        // Pre-fill quote form
        setSubtotal(data.quote.subtotal || 0);
        setDeliveryFee(data.quote.deliveryFee || 0);
        setBrandingFee(data.quote.brandingFee || 0);
        setDiscount(data.quote.discount || 0);
        setQuoteNotes(data.quote.notes || '');
        setValidUntil(data.quote.validUntil || '');
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [requestId]);

  // Live calculated total
  const calculatedTotal = Math.max(0, subtotal + deliveryFee + brandingFee - discount);

  async function handleStatusUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!requestId || !targetStatus) return;

    setUpdatingStatus(true);
    setError('');
    setSuccessMessage('');

    try {
      const updated = await updateAdminCorporateStatus(requestId, {
        status: targetStatus,
        note: statusNote || undefined,
      });
      setRequest(updated);
      setTargetStatus('');
      setStatusNote('');
      setSuccessMessage(`Status updated to ${targetStatus}.`);
    } catch (err: any) {
      setError(err.message || 'Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleQuoteAction(action: 'draft' | 'send') {
    if (!requestId) return;

    setSavingQuote(true);
    setError('');
    setSuccessMessage('');

    try {
      const updated = await manageAdminCorporateQuote(requestId, {
        subtotal,
        deliveryFee,
        brandingFee,
        discount,
        notes: quoteNotes || undefined,
        validUntil: validUntil || undefined,
        action,
      });
      setRequest(updated);
      setSuccessMessage(
        action === 'send'
          ? 'Official quote sent to client email successfully.'
          : 'Quote draft saved.'
      );
    } catch (err: any) {
      setError(err.message || 'Failed to save/send quote.');
    } finally {
      setSavingQuote(false);
    }
  }

  async function handleAcceptQuote() {
    if (!requestId) return;
    if (!window.confirm('Mark this quote as accepted by the client?')) return;

    setSavingQuote(true);
    setError('');
    setSuccessMessage('');

    try {
      const updated = await acceptAdminCorporateQuote(requestId);
      setRequest(updated);
      setSuccessMessage('Quote marked as accepted! Order moved to confirmed state.');
    } catch (err: any) {
      setError(err.message || 'Failed to accept quote.');
    } finally {
      setSavingQuote(false);
    }
  }

  async function handleDeclineQuote() {
    if (!requestId) return;

    setSavingQuote(true);
    setError('');
    setSuccessMessage('');

    try {
      const updated = await declineAdminCorporateQuote(requestId, declineReason || undefined);
      setRequest(updated);
      setShowDeclineModal(false);
      setDeclineReason('');
      setSuccessMessage('Quote marked as declined.');
    } catch (err: any) {
      setError(err.message || 'Failed to decline quote.');
    } finally {
      setSavingQuote(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 text-center text-slate-500">
        Loading corporate inquiry details...
      </div>
    );
  }

  if (error && !request) {
    return (
      <div className="max-w-5xl mx-auto py-12 space-y-4">
        <Link to="/admin/corporate" className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft size={16} /> Back to Corporate Inquiries
        </Link>
        <div className="p-6 bg-red-50 text-red-800 rounded-xl border border-red-200">
          {error}
        </div>
      </div>
    );
  }

  if (!request) return null;

  const allowedNext = VALID_NEXT_STATUSES[request.requestStatus] || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-slate-800 pb-16">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/corporate"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 font-medium"
        >
          <ArrowLeft size={16} /> Back to Inquiries
        </Link>
        <span className="font-mono text-xs text-slate-400">ID: {request.id}</span>
      </div>

      {/* Header card */}
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900">
              {request.referenceNumber}
            </h1>
            <span className="text-xs px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider">
              {request.requestStatus}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span>Submitted {new Date(request.createdAt).toLocaleString()}</span>
            <span>·</span>
            <span>Last Updated {new Date(request.updatedAt).toLocaleString()}</span>
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-500 block">Pro-Forma Quote</span>
          <span className="font-mono text-xl font-bold text-slate-900">
            {request.quote.total ? `₦${request.quote.total.toLocaleString()}` : 'Pending Quote'}
          </span>
          <span className="text-xs text-slate-500 block capitalize">Status: {request.quote.status}</span>
        </div>
      </header>

      {/* Alerts */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 flex items-center gap-2 text-sm">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 text-red-800 rounded-xl border border-red-200 flex items-center gap-2 text-sm">
          <AlertCircle size={16} className="shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Inquiry Details & Products */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company & Contact Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h2 className="font-serif text-lg font-medium text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 size={18} className="text-amber-700" />
              <span>Enterprise Client Information</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-slate-500 block">Company Registered Name</span>
                <span className="font-medium text-slate-900">{request.company.companyName}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Contact Person</span>
                <span className="font-medium text-slate-900">{request.company.contactName}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Work Email</span>
                <a href={`mailto:${request.company.email}`} className="text-amber-800 hover:underline flex items-center gap-1.5 mt-0.5">
                  <Mail size={14} /> {request.company.email}
                </a>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Direct Telephone</span>
                <a href={`tel:${request.company.phone}`} className="text-slate-900 flex items-center gap-1.5 mt-0.5 font-mono">
                  <Phone size={14} /> {request.company.phone}
                </a>
              </div>
            </div>
          </div>

          {/* Gifting Specifications */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h2 className="font-serif text-lg font-medium text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Tag size={18} className="text-amber-700" />
              <span>Gifting Objectives & Scope</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
              <div>
                <span className="text-xs text-slate-500 block">Purpose</span>
                <span className="font-medium text-slate-900 capitalize">{request.giftingPurpose.replace('-', ' ')}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Industry</span>
                <span className="font-medium text-slate-900 capitalize">
                  {request.industry
                    ? request.industry === 'other' && request.otherIndustry
                      ? `Other (${request.otherIndustry})`
                      : request.industry.replace(/-/g, ' ')
                    : 'Not specified'}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Gift Curation</span>
                <span className="font-medium text-slate-900 capitalize">{request.giftType.replace('-', ' ')}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Budget Tier</span>
                <span className="font-medium text-slate-900 capitalize">{request.budgetRange.replace('-', ' ')}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Quantity</span>
                <span className="font-serif text-lg font-bold text-slate-900">{request.quantity} units</span>
              </div>
            </div>
          </div>

          {/* Selected Products */}
          {request.selectedProducts && request.selectedProducts.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <h2 className="font-serif text-lg font-medium text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Package size={18} className="text-amber-700" />
                <span>Selected Gift Items ({request.selectedProducts.length})</span>
              </h2>

              <div className="divide-y divide-slate-100">
                {request.selectedProducts.map((p, i) => (
                  <div key={i} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {p.imageUrl && (
                        <img src={p.imageUrl} alt={p.name} className="w-12 h-12 rounded-lg object-cover border border-slate-100" />
                      )}
                      <div>
                        <p className="font-medium text-sm text-slate-900">{p.name}</p>
                        {p.description && <p className="text-xs text-slate-500 line-clamp-1">{p.description}</p>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {p.unitPriceSnapshot && (
                        <p className="font-mono text-sm font-semibold text-slate-900">
                          ₦{p.unitPriceSnapshot.toLocaleString()}
                        </p>
                      )}
                      <p className="text-xs text-slate-400">Qty: {p.quantity || request.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customisation & Branding */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h2 className="font-serif text-lg font-medium text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText size={18} className="text-amber-700" />
              <span>Branding & Atelier Customisation</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-slate-500 block">Packaging Selection</span>
                <span className="font-medium text-slate-900">{request.customisation?.packaging || 'Standard Luxury Box'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Satin Ribbon Colour</span>
                <span className="font-medium text-slate-900">{request.customisation?.ribbonColour || 'Gold'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-xs text-slate-500 block">Company Greeting Message</span>
                <p className="text-slate-700 text-xs italic bg-slate-50 p-3 rounded-lg border border-slate-100 mt-1">
                  "{request.customisation?.companyMessage || 'None provided'}"
                </p>
              </div>

              {request.customisation?.logoAsset && (
                <div className="sm:col-span-2">
                  <span className="text-xs text-slate-500 block mb-1">Company Logo / Vector File</span>
                  <a
                    href={request.customisation.logoAsset.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-amber-900 hover:bg-slate-100"
                  >
                    <Download size={14} /> Download {request.customisation.logoAsset.originalFilename || 'Logo File'}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Recipients Consignment */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-serif text-lg font-medium text-slate-900 flex items-center gap-2">
                <Truck size={18} className="text-amber-700" />
                <span>Recipient Distribution ({request.recipients?.length || 0})</span>
              </h2>
              {request.recipientListFile && (
                <a
                  href={request.recipientListFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-amber-800 hover:underline font-medium"
                >
                  <Download size={14} /> Download Consignment Sheet
                </a>
              )}
            </div>

            {request.delivery?.deliveryNotes && (
              <div className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-700 block mb-0.5">Special Delivery Instructions:</span>
                <span className="text-slate-600">{request.delivery.deliveryNotes}</span>
              </div>
            )}

            {request.recipients && request.recipients.length > 0 ? (
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
                {request.recipients.slice(0, 15).map((r, idx) => (
                  <div key={idx} className="py-2 flex items-start justify-between gap-4">
                    <div>
                      <span className="font-medium text-slate-900 block">{r.name}</span>
                      <span className="text-slate-500">{r.address}</span>
                    </div>
                    {r.phone && <span className="text-slate-400 font-mono shrink-0">{r.phone}</span>}
                  </div>
                ))}
                {request.recipients.length > 15 && (
                  <div className="pt-2 text-center text-slate-400 italic">
                    +{request.recipients.length - 15} more recipients listed
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No individual recipient addresses specified.</p>
            )}
          </div>
        </div>

        {/* Right 1 Col: Quotation & Status Actions */}
        <div className="space-y-6">
          {/* Quote Preparation Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h2 className="font-serif text-lg font-medium text-slate-900 flex items-center justify-between border-b border-slate-100 pb-3">
              <span>Official Quotation</span>
              <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                {request.quote.status}
              </span>
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Gifts Subtotal (₦)</label>
                <input
                  type="number"
                  min="0"
                  value={subtotal || ''}
                  onChange={(e) => setSubtotal(Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-300 p-2 font-mono text-sm"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Delivery Charges (₦)</label>
                <input
                  type="number"
                  min="0"
                  value={deliveryFee || ''}
                  onChange={(e) => setDeliveryFee(Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-300 p-2 font-mono text-sm"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Branding / Monogram Fee (₦)</label>
                <input
                  type="number"
                  min="0"
                  value={brandingFee || ''}
                  onChange={(e) => setBrandingFee(Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-300 p-2 font-mono text-sm"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Corporate Discount (₦)</label>
                <input
                  type="number"
                  min="0"
                  value={discount || ''}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-300 p-2 font-mono text-sm"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Valid Until (Optional)</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Quote Remarks / Scope</label>
                <textarea
                  rows={2}
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  placeholder="e.g. Includes gold deboss foil on packaging..."
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                />
              </div>

              {/* Live Authoritative Total */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="font-medium text-slate-700">Calculated Total</span>
                <span className="font-serif font-bold text-lg text-slate-900">
                  ₦{calculatedTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Quote Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={savingQuote}
                  onClick={() => handleQuoteAction('draft')}
                  className="w-full py-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Save size={14} /> Save Draft
                </button>
                <button
                  type="button"
                  disabled={savingQuote}
                  onClick={() => handleQuoteAction('send')}
                  className="w-full py-2.5 rounded-lg bg-amber-800 text-xs font-semibold text-white hover:bg-amber-900 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Send size={14} /> Send Quote
                </button>
              </div>

              {/* Accept & Decline shortcuts */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  disabled={savingQuote}
                  onClick={handleAcceptQuote}
                  className="w-full py-2 rounded-lg border border-emerald-300 text-emerald-800 bg-emerald-50 text-xs font-medium hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1"
                >
                  <Check size={13} /> Mark Accepted
                </button>
                <button
                  type="button"
                  disabled={savingQuote}
                  onClick={() => setShowDeclineModal(true)}
                  className="w-full py-2 rounded-lg border border-rose-300 text-rose-800 bg-rose-50 text-xs font-medium hover:bg-rose-100 transition-colors flex items-center justify-center gap-1"
                >
                  <X size={13} /> Mark Declined
                </button>
              </div>
            </div>
          </div>

          {/* Status Workflow Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h2 className="font-serif text-lg font-medium text-slate-900 border-b border-slate-100 pb-3">
              Request Status
            </h2>

            <form onSubmit={handleStatusUpdate} className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Next Workflow Status</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as CorporateRequestStatus)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs bg-white"
                >
                  <option value="">Select status...</option>
                  {allowedNext.map((st) => (
                    <option key={st} value={st}>
                      Move to {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Audit Note (Optional)</label>
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Production sample approved by client"
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={updatingStatus || !targetStatus}
                className="w-full py-2.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-40 transition-colors shadow-xs"
              >
                {updatingStatus ? 'Updating...' : 'Update Status'}
              </button>
            </form>
          </div>

          {/* Audit History Timeline */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
            <h2 className="font-serif text-sm font-medium text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <History size={15} className="text-slate-400" />
              <span>Status History</span>
            </h2>

            <div className="space-y-3 text-xs divide-y divide-slate-100">
              {request.statusHistory?.map((h, i) => (
                <div key={i} className="pt-2 first:pt-0">
                  <div className="flex items-center justify-between font-semibold text-slate-800">
                    <span className="capitalize">{h.status}</span>
                    <span className="font-normal text-[10px] text-slate-400">
                      {new Date(h.changedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">By {h.changedBy}</p>
                  {h.note && <p className="text-[11px] text-slate-600 italic mt-0.5">"{h.note}"</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Decline Reason Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-serif text-lg font-semibold text-slate-900">Decline Corporate Inquiry</h3>
            <p className="text-xs text-slate-500">
              Please specify the reason for declining this inquiry (internal notes and audit record):
            </p>
            <textarea
              rows={3}
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="e.g. Budget mismatch, insufficient lead time for custom branding..."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeclineModal(false)}
                className="px-4 py-2 border rounded-xl text-xs text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeclineQuote}
                className="px-4 py-2 bg-rose-700 text-white rounded-xl text-xs font-semibold hover:bg-rose-800"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
