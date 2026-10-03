import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  FileText,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  Send,
  Save,
  Check,
  X,
  History,
  Tag,
  Scissors,
  Layers,
  Palette,
  ExternalLink,
  Shield,
} from 'lucide-react';
import {
  getAdminCustomRequest,
  updateAdminCustomStatus,
  saveAdminCustomQuoteDraft,
  sendAdminCustomQuote,
  acceptAdminCustomQuote,
  declineAdminCustomQuote,
  updateAdminCustomProductionStage,
  updateAdminCustomNotes,
} from '../../services/customRequestService';
import type {
  CustomRequest,
  CustomRequestStatus,
} from '../../types/customRequest';

const VALID_NEXT_STATUSES: Record<CustomRequestStatus, CustomRequestStatus[]> = {
  submitted: ['under-review', 'quote-prepared', 'quote-sent', 'cancelled'],
  'under-review': ['quote-prepared', 'quote-sent', 'declined', 'cancelled'],
  'quote-prepared': ['quote-sent', 'under-review', 'cancelled'],
  'quote-sent': ['accepted', 'declined', 'under-review', 'quote-prepared', 'cancelled'],
  accepted: ['design', 'sample', 'awaiting-approval', 'production', 'packaging', 'delivery', 'delivered', 'cancelled'],
  design: ['sample', 'awaiting-approval', 'production', 'cancelled'],
  sample: ['awaiting-approval', 'design', 'production', 'cancelled'],
  'awaiting-approval': ['production', 'design', 'sample', 'cancelled'],
  production: ['packaging', 'delivery', 'delivered', 'cancelled'],
  packaging: ['delivery', 'delivered', 'cancelled'],
  delivery: ['delivered', 'cancelled'],
  delivered: [],
  declined: ['under-review', 'quote-prepared'],
  cancelled: [],
};

const PRODUCTION_STAGES_LIST: { id: CustomRequestStatus; label: string; desc: string }[] = [
  { id: 'design', label: '1. Design & Proofing', desc: 'Atelier blueprints and 3D mockups' },
  { id: 'sample', label: '2. Prototyping', desc: 'Physical strike-off sample creation' },
  { id: 'awaiting-approval', label: '3. Client Sign-off', desc: 'Client prototype review & sign-off' },
  { id: 'production', label: '4. Batch Production', desc: 'Handcrafted atelier manufacturing' },
  { id: 'packaging', label: '5. Custom Packaging', desc: 'Presentation boxes & ribbon branding' },
  { id: 'delivery', label: '6. White-Glove Transit', desc: 'Dispatched for bespoke delivery' },
  { id: 'delivered', label: '7. Delivered & Signed', desc: 'Handover completed successfully' },
];

export default function AdminCustomDetailPage() {
  const { requestId } = useParams<{ requestId: string }>();

  const [request, setRequest] = useState<CustomRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Status Change State
  const [targetStatus, setTargetStatus] = useState<CustomRequestStatus | ''>('');
  const [statusNote, setStatusNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Quote Form State
  const [subtotal, setSubtotal] = useState<number>(0);
  const [designFee, setDesignFee] = useState<number>(0);
  const [productionFee, setProductionFee] = useState<number>(0);
  const [packagingFee, setPackagingFee] = useState<number>(0);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [quoteNotes, setQuoteNotes] = useState<string>('');
  const [validUntil, setValidUntil] = useState<string>('');
  const [savingQuote, setSavingQuote] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineModal, setShowDeclineModal] = useState(false);

  // Admin Internal Notes State
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (!requestId) return;
    const controller = new AbortController();
    setLoading(true);
    setError('');

    getAdminCustomRequest(requestId, controller.signal)
      .then((data) => {
        setRequest(data);
        // Pre-fill quote form
        setSubtotal(data.quote.subtotal || 0);
        setDesignFee(data.quote.designFee || 0);
        setProductionFee(data.quote.productionFee || 0);
        setPackagingFee(data.quote.packagingFee || 0);
        setDeliveryFee(data.quote.deliveryFee || 0);
        setDiscount(data.quote.discount || 0);
        setQuoteNotes(data.quote.notes || '');
        setValidUntil(data.quote.validUntil || '');
        setAdminNotes(data.adminNotes || '');
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
  const calculatedTotal = Math.max(
    0,
    subtotal + designFee + productionFee + packagingFee + deliveryFee - discount
  );

  async function handleStatusUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!requestId || !targetStatus) return;

    setUpdatingStatus(true);
    setError('');
    setSuccessMessage('');

    try {
      const updated = await updateAdminCustomStatus(requestId, {
        status: targetStatus,
        note: statusNote || undefined,
      });
      setRequest(updated);
      setTargetStatus('');
      setStatusNote('');
      setSuccessMessage(`Commission status updated to ${updated.requestStatus}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update commission status.');
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleSaveQuoteDraft() {
    if (!requestId) return;
    setSavingQuote(true);
    setError('');
    setSuccessMessage('');

    try {
      const updated = await saveAdminCustomQuoteDraft(requestId, {
        subtotal,
        designFee,
        productionFee,
        packagingFee,
        deliveryFee,
        discount,
        notes: quoteNotes,
        validUntil,
      });
      setRequest(updated);
      setSuccessMessage('Quotation draft saved successfully. (No email dispatched)');
    } catch (err: any) {
      setError(err.message || 'Failed to save quote draft.');
    } finally {
      setSavingQuote(false);
    }
  }

  async function handleSendQuote() {
    if (!requestId) return;
    setSavingQuote(true);
    setError('');
    setSuccessMessage('');

    try {
      const updated = await sendAdminCustomQuote(requestId, {
        subtotal,
        designFee,
        productionFee,
        packagingFee,
        deliveryFee,
        discount,
        notes: quoteNotes,
        validUntil,
      });
      setRequest(updated);
      setSuccessMessage(
        `Official quotation for ₦${calculatedTotal.toLocaleString()} dispatched to ${updated.customer.email}`
      );
    } catch (err: any) {
      setError(err.message || 'Failed to send quote.');
    } finally {
      setSavingQuote(false);
    }
  }

  async function handleAcceptQuote() {
    if (!requestId) return;
    setSavingQuote(true);
    setError('');
    setSuccessMessage('');

    try {
      const updated = await acceptAdminCustomQuote(requestId, 'Quotation marked accepted by atelier admin.');
      setRequest(updated);
      setSuccessMessage('Quotation accepted! Project is now ready for atelier production.');
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
      const updated = await declineAdminCustomQuote(
        requestId,
        declineReason || undefined,
        'Declined by administrator.'
      );
      setRequest(updated);
      setShowDeclineModal(false);
      setDeclineReason('');
      setSuccessMessage('Commission declined.');
    } catch (err: any) {
      setError(err.message || 'Failed to decline quote.');
    } finally {
      setSavingQuote(false);
    }
  }

  async function handleAdvanceProduction(stage: CustomRequestStatus) {
    if (!requestId) return;
    setUpdatingStatus(true);
    setError('');
    setSuccessMessage('');

    try {
      const updated = await updateAdminCustomProductionStage(
        requestId,
        stage,
        `Production progressed to ${stage}`
      );
      setRequest(updated);
      setSuccessMessage(`Production milestone advanced to: ${stage}`);
    } catch (err: any) {
      setError(err.message || 'Failed to advance production stage.');
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleSaveAdminNotes() {
    if (!requestId) return;
    setSavingNotes(true);
    setError('');
    setSuccessMessage('');

    try {
      const updated = await updateAdminCustomNotes(requestId, adminNotes);
      setRequest(updated);
      setSuccessMessage('Internal admin notes saved.');
    } catch (err: any) {
      setError(err.message || 'Failed to save admin notes.');
    } finally {
      setSavingNotes(false);
    }
  }

  if (loading) {
    return (
      <div className="py-24 text-center font-sans text-xs text-brand-medium">
        <div className="w-8 h-8 border-2 border-gold-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Opening bespoke commission dossier...
      </div>
    );
  }

  if (error && !request) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-sans inline-block">
          {error}
        </div>
        <div>
          <Link
            to="/admin/custom"
            className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold text-brand-dark hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Commissions Queue</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!request) return null;

  const allowedNextStatuses = VALID_NEXT_STATUSES[request.requestStatus] || [];
  const currentStageIndex = PRODUCTION_STAGES_LIST.findIndex((s) => s.id === request.requestStatus);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* ── Top Navigation & Quick Banner ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-brand-dark/10 pb-5">
        <div>
          <Link
            to="/admin/custom"
            className="inline-flex items-center gap-1 text-xs font-sans text-brand-medium hover:text-brand-dark transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Custom Requests</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl sm:text-3xl text-brand-dark font-normal">
              {request.referenceNumber}
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-gold-50 text-gold-700 border border-gold-200">
              {request.requestType.replace('custom-', 'Bespoke ')}
            </span>
          </div>
          <p className="font-sans text-xs text-brand-medium mt-1">
            Submitted on{' '}
            {new Date(request.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] font-sans text-brand-light block">Current Lifecycle</span>
            <span className="font-sans text-xs font-bold uppercase tracking-wider text-brand-dark">
              {request.requestStatus.replace('-', ' ')}
            </span>
          </div>
          <div className="h-8 w-px bg-brand-dark/10" />
          <div className="text-right">
            <span className="text-[11px] font-sans text-brand-light block">Quote Status</span>
            <span className="font-sans text-xs font-bold uppercase tracking-wider text-purple-700">
              {request.quote.status.replace('-', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-sans flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-sans flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Client, Specifications, Files, Quote Builder */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Client & Request Overview */}
          <div className="bg-white p-6 rounded-2xl border border-brand-dark/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-brand-dark/10 pb-3">
              <span className="font-sans text-xs font-bold uppercase tracking-wider text-gold-600 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Client & Project Scope</span>
              </span>
              <span className="text-xs font-sans font-semibold text-brand-dark">
                {request.requestDetails.quantity} Units Requested
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
              <div>
                <span className="text-brand-light block">Client Name</span>
                <span className="font-semibold text-brand-dark text-sm">{request.customer.fullName}</span>
                {request.customer.companyName && (
                  <span className="text-brand-medium block mt-0.5">{request.customer.companyName}</span>
                )}
              </div>

              <div>
                <span className="text-brand-light block">Item / Concept</span>
                <span className="font-semibold text-brand-dark text-sm">
                  {request.requestDetails.item}
                </span>
              </div>

              <div>
                <span className="text-brand-light block">Contact Email</span>
                <a
                  href={`mailto:${request.customer.email}`}
                  className="font-medium text-brand-dark hover:text-gold-600 transition-colors flex items-center gap-1 mt-0.5"
                >
                  <Mail className="w-3.5 h-3.5 text-brand-medium" />
                  <span>{request.customer.email}</span>
                </a>
              </div>

              <div>
                <span className="text-brand-light block">Contact Phone</span>
                <a
                  href={`tel:${request.customer.phone}`}
                  className="font-medium text-brand-dark hover:text-gold-600 transition-colors flex items-center gap-1 mt-0.5"
                >
                  <Phone className="w-3.5 h-3.5 text-brand-medium" />
                  <span>{request.customer.phone}</span>
                </a>
              </div>

              <div>
                <span className="text-brand-light block">Target Budget</span>
                <span className="font-semibold text-brand-dark">
                  {request.requestDetails.budgetRange ||
                    (request.requestDetails.budgetAmount
                      ? `₦${request.requestDetails.budgetAmount.toLocaleString()}`
                      : 'Not specified')}
                </span>
              </div>

              <div>
                <span className="text-brand-light block">Target Delivery Date</span>
                <span className="font-semibold text-brand-dark">
                  {request.requestDetails.preferredDeliveryDate || 'Flexible / To be confirmed'}
                </span>
              </div>
            </div>

            {request.requestDetails.purpose && (
              <div className="pt-2 border-t border-brand-dark/5 text-xs font-sans">
                <span className="text-brand-light block mb-1">Commission Purpose</span>
                <p className="text-brand-dark bg-[#FAF8F5] p-3 rounded-xl border border-brand-dark/5">
                  {request.requestDetails.purpose}
                </p>
              </div>
            )}

            {request.requestDetails.description && (
              <div className="pt-2 border-t border-brand-dark/5 text-xs font-sans">
                <span className="text-brand-light block mb-1">Creative Brief / Description</span>
                <p className="text-brand-dark bg-[#FAF8F5] p-3 rounded-xl border border-brand-dark/5 leading-relaxed whitespace-pre-wrap">
                  {request.requestDetails.description}
                </p>
              </div>
            )}
          </div>

          {/* 2. Atelier Specifications */}
          <div className="bg-white p-6 rounded-2xl border border-brand-dark/10 shadow-sm space-y-4">
            <span className="font-sans text-xs font-bold uppercase tracking-wider text-gold-600 flex items-center gap-1.5 border-b border-brand-dark/10 pb-3 block">
              <Layers className="w-4 h-4" />
              <span>Bespoke Atelier Specifications</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-brand-dark/5">
                <span className="text-brand-light block font-medium">Material Preference</span>
                <strong className="text-brand-dark block mt-1">
                  {request.specifications?.material || 'Atelier Standard / Client to specify'}
                </strong>
              </div>

              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-brand-dark/5">
                <span className="text-brand-light block font-medium">Color Palette</span>
                <strong className="text-brand-dark block mt-1">
                  {request.specifications?.colour || 'Standard / Unspecified'}
                </strong>
              </div>

              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-brand-dark/5">
                <span className="text-brand-light block font-medium">Dimensions / Sizing</span>
                <strong className="text-brand-dark block mt-1">
                  {request.specifications?.size || 'Bespoke / Custom sizing required'}
                </strong>
              </div>

              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-brand-dark/5">
                <span className="text-brand-light block font-medium">Branding Technique</span>
                <strong className="text-brand-dark block mt-1">
                  {request.specifications?.branding || 'None specified'}
                </strong>
              </div>

              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-brand-dark/5">
                <span className="text-brand-light block font-medium">Custom Packaging Finish</span>
                <strong className="text-brand-dark block mt-1">
                  {request.specifications?.packaging || 'Presentation Box'}
                </strong>
              </div>

              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-brand-dark/5">
                <span className="text-brand-light block font-medium">Individual Personalisation</span>
                <strong className="text-brand-dark block mt-1">
                  {request.specifications?.personalisation || 'None requested'}
                </strong>
              </div>
            </div>

            {request.specifications?.additionalNotes && (
              <div className="pt-2 border-t border-brand-dark/5 text-xs font-sans">
                <span className="text-brand-light block mb-1">Additional Client Notes</span>
                <p className="text-brand-dark bg-[#FAF8F5] p-3 rounded-xl border border-brand-dark/5 whitespace-pre-wrap">
                  {request.specifications.additionalNotes}
                </p>
              </div>
            )}
          </div>

          {/* 3. Design Files & Uploaded References */}
          <div className="bg-white p-6 rounded-2xl border border-brand-dark/10 shadow-sm space-y-4">
            <span className="font-sans text-xs font-bold uppercase tracking-wider text-gold-600 flex items-center gap-1.5 border-b border-brand-dark/10 pb-3 block">
              <Palette className="w-4 h-4" />
              <span>Design Files & Inspiration Assets ({request.assets?.length || 0})</span>
            </span>

            {request.assets && request.assets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {request.assets.map((asset, idx) => (
                  <div
                    key={asset.id || idx}
                    className="p-4 rounded-xl border border-brand-dark/10 bg-[#FAF8F5] flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-brand-dark text-white text-[10px] font-sans font-bold uppercase tracking-wider">
                          {asset.type}
                        </span>
                        {asset.fileSize && (
                          <span className="text-[10px] font-sans text-brand-light">
                            {(asset.fileSize / (1024 * 1024)).toFixed(2)} MB
                          </span>
                        )}
                      </div>
                      <div className="font-sans text-xs font-semibold text-brand-dark line-clamp-1">
                        {asset.fileName || `Design Asset #${idx + 1}`}
                      </div>
                      {asset.mimeType && (
                        <span className="text-[10px] font-sans text-brand-light block">
                          Format: {asset.mimeType}
                        </span>
                      )}
                    </div>

                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-brand-dark hover:text-white border border-brand-dark/10 rounded-lg text-xs font-sans font-semibold text-brand-dark transition-colors"
                    >
                      <span>Inspect Asset</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-[#FAF8F5] rounded-xl text-center font-sans text-xs text-brand-medium">
                No external design files were attached with this request.
              </div>
            )}
          </div>

          {/* 4. Official Quotation Workflow */}
          <div className="bg-white p-6 rounded-2xl border border-brand-dark/10 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-brand-dark/10 pb-3">
              <span className="font-sans text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                <Tag className="w-4 h-4" />
                <span>Bespoke Quotation Management</span>
              </span>
              <span className="text-xs font-sans text-brand-light">
                All totals are verified & computed server-side
              </span>
            </div>

            {/* Quotation inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans">
              <div>
                <label className="text-brand-light font-medium block mb-1">
                  Materials & Subtotal (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={subtotal}
                  onChange={(e) => setSubtotal(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-brand-dark/10 rounded-lg font-mono text-sm font-semibold text-brand-dark focus:outline-none focus:border-brand-dark"
                />
              </div>

              <div>
                <label className="text-brand-light font-medium block mb-1">
                  Atelier Design Fee (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={designFee}
                  onChange={(e) => setDesignFee(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-brand-dark/10 rounded-lg font-mono text-sm font-semibold text-brand-dark focus:outline-none focus:border-brand-dark"
                />
              </div>

              <div>
                <label className="text-brand-light font-medium block mb-1">
                  Production & Tooling (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={productionFee}
                  onChange={(e) => setProductionFee(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-brand-dark/10 rounded-lg font-mono text-sm font-semibold text-brand-dark focus:outline-none focus:border-brand-dark"
                />
              </div>

              <div>
                <label className="text-brand-light font-medium block mb-1">
                  Custom Packaging (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={packagingFee}
                  onChange={(e) => setPackagingFee(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-brand-dark/10 rounded-lg font-mono text-sm font-semibold text-brand-dark focus:outline-none focus:border-brand-dark"
                />
              </div>

              <div>
                <label className="text-brand-light font-medium block mb-1">
                  White-Glove Delivery (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-brand-dark/10 rounded-lg font-mono text-sm font-semibold text-brand-dark focus:outline-none focus:border-brand-dark"
                />
              </div>

              <div>
                <label className="text-brand-light font-medium block mb-1">
                  Commission Discount (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-brand-dark/10 rounded-lg font-mono text-sm font-semibold text-brand-dark focus:outline-none focus:border-brand-dark"
                />
              </div>
            </div>

            {/* Validity & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
              <div>
                <label className="text-brand-light font-medium block mb-1">
                  Quotation Valid Until
                </label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-brand-dark/10 rounded-lg text-xs font-sans text-brand-dark focus:outline-none focus:border-brand-dark"
                />
              </div>

              <div>
                <label className="text-brand-light font-medium block mb-1">
                  Client-Facing Quote Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Price includes bespoke embossing tooling and delivery"
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-brand-dark/10 rounded-lg text-xs font-sans text-brand-dark focus:outline-none focus:border-brand-dark"
                />
              </div>
            </div>

            {/* Total Banner */}
            <div className="p-4 bg-[#FAF8F5] rounded-xl border border-brand-dark/10 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-sans text-brand-light block">Calculated Total</span>
                <span className="font-serif text-2xl font-bold text-gold-700">
                  ₦{calculatedTotal.toLocaleString()}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={savingQuote}
                  onClick={handleSaveQuoteDraft}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-brand-dark/15 rounded-xl font-sans text-xs font-semibold text-brand-dark hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Draft</span>
                </button>

                <button
                  type="button"
                  disabled={savingQuote}
                  onClick={handleSendQuote}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-sans text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Official Quote →</span>
                </button>

                {request.quote.status === 'sent' && (
                  <button
                    type="button"
                    disabled={savingQuote}
                    onClick={handleAcceptQuote}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-sans text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Mark Accepted</span>
                  </button>
                )}

                {request.quote.status !== 'declined' && (
                  <button
                    type="button"
                    disabled={savingQuote}
                    onClick={() => setShowDeclineModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-rose-700 hover:bg-rose-50 rounded-xl font-sans text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Decline</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Production Stepper, Status Form, Admin Notes, Audit Timeline */}
        <div className="space-y-6">
          {/* Production Stage Stepper */}
          <div className="bg-white p-6 rounded-2xl border border-brand-dark/10 shadow-sm space-y-4">
            <span className="font-sans text-xs font-bold uppercase tracking-wider text-brand-dark flex items-center gap-1.5 border-b border-brand-dark/10 pb-3 block">
              <Scissors className="w-4 h-4 text-gold-600" />
              <span>Production Pipeline</span>
            </span>

            <div className="space-y-3">
              {PRODUCTION_STAGES_LIST.map((stage, idx) => {
                const isCurrent = request.requestStatus === stage.id;
                const isPassed = currentStageIndex > idx;
                return (
                  <div
                    key={stage.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-brand-dark text-white border-brand-dark shadow-sm'
                        : isPassed
                        ? 'bg-emerald-50/50 border-emerald-200 text-brand-dark'
                        : 'bg-[#FAF8F5] border-brand-dark/5 text-brand-medium'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-sans text-[10px] font-bold ${
                            isCurrent
                              ? 'bg-gold-600 text-white'
                              : isPassed
                              ? 'bg-emerald-600 text-white'
                              : 'bg-brand-dark/10 text-brand-dark/40'
                          }`}
                        >
                          {isPassed ? '✓' : idx + 1}
                        </div>
                        <span className="font-sans text-xs font-semibold">{stage.label}</span>
                      </div>

                      {!isCurrent && (
                        <button
                          type="button"
                          disabled={updatingStatus}
                          onClick={() => handleAdvanceProduction(stage.id)}
                          className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded cursor-pointer ${
                            isPassed
                              ? 'text-brand-medium hover:text-brand-dark'
                              : 'bg-white text-brand-dark border border-brand-dark/10 hover:bg-gold-50'
                          }`}
                        >
                          Set Milestone
                        </button>
                      )}
                    </div>
                    <p
                      className={`text-[11px] font-sans mt-1 pl-7 ${
                        isCurrent ? 'text-white/70' : 'text-brand-medium/70'
                      }`}
                    >
                      {stage.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Workflow Transition Form */}
          <div className="bg-white p-6 rounded-2xl border border-brand-dark/10 shadow-sm space-y-4">
            <span className="font-sans text-xs font-bold uppercase tracking-wider text-brand-dark flex items-center gap-1.5 border-b border-brand-dark/10 pb-3 block">
              <Shield className="w-4 h-4 text-gold-600" />
              <span>Request Lifecycle Transition</span>
            </span>

            <form onSubmit={handleStatusUpdate} className="space-y-3">
              <div>
                <label className="text-[11px] font-sans font-medium text-brand-light block mb-1">
                  Permitted Next Status
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as CustomRequestStatus)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-brand-dark/10 rounded-lg text-xs font-sans text-brand-dark focus:outline-none"
                >
                  <option value="">Select transition...</option>
                  {allowedNextStatuses.map((st) => (
                    <option key={st} value={st}>
                      {st.replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-sans font-medium text-brand-light block mb-1">
                  Transition Audit Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Scope confirmed with client"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-brand-dark/10 rounded-lg text-xs font-sans text-brand-dark focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={!targetStatus || updatingStatus}
                className="w-full py-2.5 bg-brand-dark text-white rounded-xl text-xs font-sans font-semibold hover:bg-gold-600 transition-colors disabled:opacity-40 cursor-pointer"
              >
                {updatingStatus ? 'Updating...' : 'Commit Status Transition'}
              </button>
            </form>
          </div>

          {/* Private Admin Notes */}
          <div className="bg-white p-6 rounded-2xl border border-brand-dark/10 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-brand-dark/10 pb-2">
              <span className="font-sans text-xs font-bold uppercase tracking-wider text-brand-dark flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-gold-600" />
                <span>Private Admin Notes</span>
              </span>
              <span className="text-[10px] font-sans text-brand-light">Never shared with client</span>
            </div>

            <textarea
              rows={4}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Internal pricing assumptions, artisan contacts, material supplier notes..."
              className="w-full p-3 bg-[#FAF8F5] border border-brand-dark/10 rounded-xl text-xs font-sans text-brand-dark resize-none focus:outline-none focus:border-brand-dark"
            />

            <button
              type="button"
              disabled={savingNotes}
              onClick={handleSaveAdminNotes}
              className="w-full py-2 bg-stone-100 hover:bg-brand-dark hover:text-white rounded-lg text-xs font-sans font-semibold text-brand-dark transition-colors cursor-pointer"
            >
              {savingNotes ? 'Saving...' : 'Save Internal Notes'}
            </button>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white p-6 rounded-2xl border border-brand-dark/10 shadow-sm space-y-4">
            <span className="font-sans text-xs font-bold uppercase tracking-wider text-brand-dark flex items-center gap-1.5 border-b border-brand-dark/10 pb-3 block">
              <History className="w-4 h-4 text-gold-600" />
              <span>Activity & Audit Trail</span>
            </span>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {request.statusHistory?.map((entry, idx) => (
                <div key={entry.changeId || idx} className="text-xs font-sans border-l-2 border-gold-600 pl-3 py-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-brand-dark capitalize">
                      {entry.status.replace('-', ' ')}
                    </span>
                    <span className="text-brand-light">
                      {new Date(entry.changedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {entry.note && <p className="text-brand-medium mt-0.5">{entry.note}</p>}
                  <span className="text-[10px] text-brand-light block mt-0.5">By: {entry.changedBy}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Decline Reason Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-brand-dark/10">
            <div className="flex items-center justify-between border-b border-brand-dark/10 pb-3">
              <h3 className="font-serif text-lg text-brand-dark">Decline Custom Commission</h3>
              <button
                type="button"
                onClick={() => setShowDeclineModal(false)}
                className="text-brand-medium hover:text-brand-dark"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs font-sans text-brand-medium">
              Please provide an internal reason for declining this request (e.g., beyond atelier capabilities, production capacity full, timeline unfeasible).
            </p>

            <textarea
              rows={3}
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Reason for declining..."
              className="w-full p-3 bg-[#FAF8F5] border border-brand-dark/10 rounded-xl text-xs font-sans text-brand-dark resize-none focus:outline-none focus:border-brand-dark"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeclineModal(false)}
                className="px-4 py-2 bg-stone-100 rounded-lg text-xs font-sans font-semibold text-brand-dark hover:bg-stone-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingQuote}
                onClick={handleDeclineQuote}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-sans font-semibold"
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
