import React, { useState, useRef } from 'react';
import {
  CreationType,
  UploadedFileState,
} from './types';
import {
  CREATION_TYPE_OPTIONS,
  BUDGET_RANGES,
  COMMON_PURPOSES,
  MATERIAL_PRESETS,
  BRANDING_OPTIONS,
} from './createData';

export interface CreateFlowContainerProps {
  className?: string;
  onComplete?: (quoteRef: string) => void;
}

export const CreateFlowContainer: React.FC<CreateFlowContainerProps> = ({
  className = '',
  onComplete,
}) => {
  // Current active step (0 for intro, 1 to 9 for the exact flow)
  const [currentStep, setCurrentStep] = useState<number>(0);

  // ── Step 1: Creation Type ──
  const [creationType, setCreationType] = useState<CreationType>('custom-gift');

  // ── Step 2: What You Need ──
  const [productItem, setProductItem] = useState<string>('VIP Milestone Appreciation Chest');
  const [quantity, setQuantity] = useState<number>(50);
  const [budgetRange, setBudgetRange] = useState<string>('50k-100k');
  const [purpose, setPurpose] = useState<string>('Corporate Milestone');
  const [deliveryDate, setDeliveryDate] = useState<string>(
    () => new Date(Date.now() + 86400000 * 21).toISOString().split('T')[0]
  );

  // ── Step 3: Upload Design ──
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileState[]>([
    {
      id: 'f-1',
      category: 'logo',
      name: 'brand_vector_mark.svg',
      size: '1.2 MB',
      previewUrl: null,
      uploadedAt: 'Just now',
    },
    {
      id: 'f-2',
      category: 'brief',
      name: 'creative_custom_brief.pdf',
      size: '840 KB',
      previewUrl: null,
      uploadedAt: 'Just now',
    },
  ]);
  const [uploadCategory, setUploadCategory] = useState<'logo' | 'artwork' | 'reference' | 'brief'>('logo');

  // ── Step 4: Details (Dynamic based on creationType) ──
  const [material, setMaterial] = useState<string>('Rigid Matte Bookbinder Board (1200 GSM)');
  const [colour, setColour] = useState<string>('Obsidian Black & Champagne Gold');
  const [size, setSize] = useState<string>('Custom Box (32cm × 24cm × 10cm)');
  const [packaging, setPackaging] = useState<string>('Custom Velvet Tray with Slide Lid');
  const [branding, setBranding] = useState<string>('Metallic Gold Foil Stamping');
  const [personalisation, setPersonalisation] = useState<string>('Individual Recipient Name Laser Inscription');
  const [specialNotes, setSpecialNotes] = useState<string>(
    'Please ensure metallic foil matches champagne gold pantone 465C.'
  );

  // ── Step 5 & 6: Contact Information for Quote ──
  const [contactName, setContactName] = useState<string>('Damilola Adeleke');
  const [contactEmail, setContactEmail] = useState<string>('d.adeleke@enterprise.com');
  const [contactPhone, setContactPhone] = useState<string>('+234 803 456 7890');
  const [companyName, setCompanyName] = useState<string>('Adeleke Capital Holdings');

  // ── Step 6 & 7: Quote & Approval ──
  const [quoteReference, setQuoteReference] = useState<string>('');
  const quoteAmount = quantity * 65000 + 225000;
  const [quoteStatus, setQuoteStatus] = useState<'requested' | 'ready' | 'approved' | 'paid'>('requested');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // ── Step 8 & 9: Production & Delivery ──
  const [productionStage, setProductionStage] = useState<'design' | 'sample' | 'approval' | 'production' | 'packaging'>('sample');

  const containerRef = useRef<HTMLDivElement>(null);

  const goToStep = (step: number) => {
    setCurrentStep(step);
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Step Meta Titles (1 to 9)
  const stepMeta: Record<number, { title: string; subtitle: string }> = {
    0: { title: 'Bring Your Idea to Life', subtitle: 'Custom products, packaging, apparel and gifting made around your requirements' },
    1: { title: 'What would you like to create?', subtitle: 'Select a custom category to begin tailoring your commission' },
    2: { title: 'Tell us what you need', subtitle: 'Specify item details, quantity, budget, and target timeline' },
    3: { title: 'Upload your design', subtitle: 'Provide your logo, artwork files, reference images, or creative brief' },
    4: { title: 'Add specifications & details', subtitle: 'Specify materials, dimensions, finishes, and personalization' },
    5: { title: 'Review your custom request', subtitle: 'Verify all project parameters before requesting an official quote' },
    6: { title: 'Request a Quote', subtitle: 'Your custom specifications are saved and submitted for atelier evaluation' },
    7: { title: 'Approve & Pay', subtitle: 'Review your official bespoke quotation and authorize production' },
    8: { title: 'Bespoke Production', subtitle: 'Follow your handcrafted order through design, sampling, and packaging' },
    9: { title: 'White-Glove Delivery', subtitle: 'Your completed custom creation is prepared and dispatched' },
  };

  // Add mock file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newFile: UploadedFileState = {
        id: `f-${Date.now()}`,
        category: uploadCategory,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        uploadedAt: 'Just now',
      };
      setUploadedFiles((prev) => [...prev, newFile]);
    }
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Submit quote request
  const handleSubmitQuote = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const randDigits = Math.floor(10000 + Math.random() * 90000);
      const ref = `GTC-BESPOKE-${randDigits}`;
      setQuoteReference(ref);
      setQuoteStatus('requested');
      goToStep(6);
      if (onComplete) onComplete(ref);
    }, 750);
  };

  // Approve quote
  const handleApproveQuote = () => {
    setQuoteStatus('approved');
    setTimeout(() => {
      setQuoteStatus('paid');
      setProductionStage('sample');
      goToStep(8);
    }, 850);
  };

  return (
    <div
      ref={containerRef}
      className={`w-full max-w-4xl mx-auto bg-white rounded-3xl border border-brand-dark/10 shadow-[0_12px_40px_rgba(28,20,14,0.06)] overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* ── Top Header & Progress Bar ── */}
      <div className="bg-[#FAF8F5] border-b border-brand-dark/10 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gold-600 animate-pulse" />
            <span className="font-sans text-[11px] font-semibold tracking-[0.24em] uppercase text-gold-600">
              Good Things Co. · Bespoke Atelier
            </span>
          </div>

          {currentStep > 0 && (
            <div className="flex items-center gap-2 font-sans text-xs">
              <span className="font-bold text-brand-dark">Step {currentStep} of 9</span>
              <span className="text-brand-light">({Math.round((currentStep / 9) * 100)}%)</span>
            </div>
          )}
        </div>

        {/* Thin progress line */}
        {currentStep > 0 && (
          <div className="w-full bg-brand-dark/10 h-1.5 rounded-full overflow-hidden mb-6">
            <div
              className="bg-brand-dark h-full transition-all duration-500 ease-out rounded-full"
              style={{ width: `${(currentStep / 9) * 100}%` }}
            />
          </div>
        )}

        {/* Step Title & Subtitle */}
        <div className="text-left">
          <h2 className="font-serif text-2xl sm:text-3xl text-brand-dark font-normal tracking-tight">
            {stepMeta[currentStep]?.title}
          </h2>
          <p className="font-sans text-xs sm:text-sm text-brand-medium/85 mt-1">
            {stepMeta[currentStep]?.subtitle}
          </p>
        </div>
      </div>

      {/* ── Main Dynamic Flow Body: Only Active Step Rendered ── */}
      <div className="p-6 sm:p-8 md:p-10 min-h-[380px] flex flex-col justify-between">
        {/* =========================================================
            PAGE INTRO (STEP 0)
            ========================================================= */}
        {currentStep === 0 && (
          <div key="step-0" className="space-y-6 animate-fade-in text-center sm:text-left py-4">
            <div className="max-w-xl">
              <span className="font-sans text-xs font-semibold uppercase tracking-widest text-gold-600 block mb-2">
                CREATE
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl text-brand-dark font-normal mb-3">
                Bring your idea to life.
              </h3>
              <p className="font-sans text-xs sm:text-sm text-brand-medium/85 leading-relaxed mb-6">
                Custom products, packaging, apparel and gifting made around your requirements.
              </p>
            </div>

            {/* Atelier Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 text-left">
                <span className="text-xl mb-2 block">🎨</span>
                <h4 className="font-serif text-sm font-semibold text-brand-dark mb-1">
                  Custom Concepts
                </h4>
                <p className="font-sans text-xs text-brand-medium/80">
                  From apparel to artisan hampers, engineered to your brand standards.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 text-left">
                <span className="text-xl mb-2 block">📐</span>
                <h4 className="font-serif text-sm font-semibold text-brand-dark mb-1">
                  Sampling & Proofs
                </h4>
                <p className="font-sans text-xs text-brand-medium/80">
                  Review digital renders and physical prototypes before final production.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 text-left">
                <span className="text-xl mb-2 block">✨</span>
                <h4 className="font-serif text-sm font-semibold text-brand-dark mb-1">
                  White-Glove Delivery
                </h4>
                <p className="font-sans text-xs text-brand-medium/80">
                  Delivered directly to company hubs or dispatched individually to recipients.
                </p>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="w-full sm:w-auto px-9 py-4 bg-brand-dark text-white hover:bg-gold-600 font-sans text-xs font-semibold tracking-widest uppercase transition-all shadow-md cursor-pointer"
              >
                Start Creating →
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 1 — WHAT WOULD YOU LIKE TO CREATE?
            ========================================================= */}
        {currentStep === 1 && (
          <div key="step-1" className="space-y-6 animate-fade-in">
            <p className="font-sans text-xs text-brand-medium">
              Select one creation category to tailor the custom specifications:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {CREATION_TYPE_OPTIONS.map((item) => {
                const isSelected = creationType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setCreationType(item.id);
                      if (MATERIAL_PRESETS[item.id]) {
                        setMaterial(MATERIAL_PRESETS[item.id][0]);
                      }
                    }}
                    className={`p-5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-brand-dark text-brand-ivory border-brand-dark shadow-md ring-1 ring-brand-dark'
                        : 'bg-[#FAF8F5] text-brand-dark border-brand-dark/10 hover:border-brand-dark/30 hover:bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{item.icon}</span>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${
                            isSelected
                              ? 'border-gold-500 bg-gold-500 text-white font-bold'
                              : 'border-brand-dark/20 bg-white'
                          }`}
                        >
                          {isSelected ? '✓' : ''}
                        </div>
                      </div>
                      <h3 className="font-serif text-base font-medium mb-1">{item.title}</h3>
                      <p
                        className={`font-sans text-xs leading-relaxed mb-3 ${
                          isSelected ? 'text-brand-ivory/80' : 'text-brand-medium/75'
                        }`}
                      >
                        {item.description}
                      </p>
                    </div>

                    <div
                      className={`pt-2 border-t text-[10px] font-sans ${
                        isSelected
                          ? 'border-brand-ivory/15 text-gold-400'
                          : 'border-brand-dark/10 text-brand-light'
                      }`}
                    >
                      Examples: {item.examples}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 2 — TELL US WHAT YOU NEED
            ========================================================= */}
        {currentStep === 2 && (
          <div key="step-2" className="space-y-6 animate-fade-in text-left">
            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 space-y-4">
              <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-brand-dark block">
                Item Requirements for{' '}
                <strong className="text-gold-700 capitalize">
                  {CREATION_TYPE_OPTIONS.find((c) => c.id === creationType)?.title}
                </strong>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Product / Item */}
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-sans font-bold uppercase tracking-wider text-brand-dark block mb-1">
                    Product / Item Name or Concept
                  </label>
                  <input
                    type="text"
                    required
                    value={productItem}
                    onChange={(e) => setProductItem(e.target.value)}
                    placeholder="e.g. Heavyweight Organic Linen Shirt, VIP Executive Keepsake Chest"
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-brand-dark/15 text-xs font-sans focus:outline-none focus:border-brand-dark"
                  />
                </div>

                {/* Quantity */}
                <div>
                  <label className="text-[11px] font-sans font-bold uppercase tracking-wider text-brand-dark block mb-1">
                    Quantity Needed
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-brand-dark/15 text-xs font-sans font-bold text-brand-dark focus:outline-none focus:border-brand-dark"
                    />
                    <div className="flex gap-1">
                      {[25, 50, 100].map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => setQuantity(q)}
                          className={`px-2.5 py-2 rounded-lg border text-[11px] font-sans transition-colors ${
                            quantity === q
                              ? 'bg-brand-dark text-white border-brand-dark'
                              : 'bg-white text-brand-dark border-brand-dark/15'
                          }`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Budget */}
                <div>
                  <label className="text-[11px] font-sans font-bold uppercase tracking-wider text-brand-dark block mb-1">
                    Estimated Budget Tier
                  </label>
                  <select
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-brand-dark/15 text-xs font-sans focus:outline-none focus:border-brand-dark cursor-pointer"
                  >
                    {BUDGET_RANGES.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.label} ({b.desc})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Purpose */}
                <div>
                  <label className="text-[11px] font-sans font-bold uppercase tracking-wider text-brand-dark block mb-1">
                    Occasion / Purpose
                  </label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-brand-dark/15 text-xs font-sans focus:outline-none focus:border-brand-dark cursor-pointer"
                  >
                    {COMMON_PURPOSES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Delivery Date */}
                <div>
                  <label className="text-[11px] font-sans font-bold uppercase tracking-wider text-brand-dark block mb-1">
                    Required Delivery Date
                  </label>
                  <input
                    type="date"
                    required
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-brand-dark/15 text-xs font-sans focus:outline-none focus:border-brand-dark"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 3 — UPLOAD YOUR DESIGN
            ========================================================= */}
        {currentStep === 3 && (
          <div key="step-3" className="space-y-6 animate-fade-in text-left">
            {/* Upload Selector Tabs */}
            <div className="flex border-b border-brand-dark/10">
              {[
                { id: 'logo', label: '1. Logo' },
                { id: 'artwork', label: '2. Artwork' },
                { id: 'reference', label: '3. Reference Image' },
                { id: 'brief', label: '4. Creative Brief' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setUploadCategory(tab.id as any)}
                  className={`py-2.5 px-4 font-sans text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                    uploadCategory === tab.id
                      ? 'border-brand-dark text-brand-dark'
                      : 'border-transparent text-brand-light hover:text-brand-dark'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Drag & Drop Area */}
            <div className="p-8 rounded-2xl bg-[#FAF8F5] border-2 border-dashed border-brand-dark/20 text-center space-y-3">
              <span className="text-3xl block">📎</span>
              <h4 className="font-serif text-base text-brand-dark">
                Upload {uploadCategory.toUpperCase()} File
              </h4>
              <p className="font-sans text-xs text-brand-medium max-w-sm mx-auto leading-relaxed">
                Accepts vector artwork (.ai, .eps, .svg), PDF briefs, or high-res images (.png, .jpg).
              </p>

              <div>
                <input
                  type="file"
                  id="custom-file-upload"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="custom-file-upload"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-dark text-white hover:bg-gold-600 font-sans text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer shadow-xs"
                >
                  Choose File to Attach
                </label>
              </div>
            </div>

            {/* Uploaded Files List */}
            <div>
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-brand-light block mb-2">
                Attached Design Files ({uploadedFiles.length})
              </span>
              <div className="space-y-2">
                {uploadedFiles.map((f) => (
                  <div
                    key={f.id}
                    className="p-3.5 rounded-xl bg-white border border-brand-dark/10 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-gold-50 border border-gold-200 text-gold-700 flex items-center justify-center text-xs font-bold uppercase">
                        {f.category[0]}
                      </span>
                      <div>
                        <span className="font-sans text-xs font-semibold text-brand-dark block">
                          {f.name}
                        </span>
                        <span className="font-sans text-[10px] text-brand-light">
                          {f.category.toUpperCase()} · {f.size} · {f.uploadedAt}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveFile(f.id)}
                      className="text-[11px] font-sans font-semibold text-red-600 hover:text-red-800 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 4 — ADD DETAILS (Progressive Disclosure)
            ========================================================= */}
        {currentStep === 4 && (
          <div key="step-4" className="space-y-6 animate-fade-in text-left">
            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 space-y-4">
              <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-brand-dark block">
                Finishing Specifications for{' '}
                <strong className="text-gold-700 capitalize">
                  {CREATION_TYPE_OPTIONS.find((c) => c.id === creationType)?.title}
                </strong>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Material (Presets matching creation category) */}
                <div>
                  <label className="text-[11px] font-sans font-bold uppercase tracking-wider text-brand-dark block mb-1">
                    Preferred Material
                  </label>
                  <select
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-brand-dark/15 text-xs font-sans focus:outline-none focus:border-brand-dark cursor-pointer"
                  >
                    {(MATERIAL_PRESETS[creationType] || MATERIAL_PRESETS['custom-gift']).map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Colour */}
                <div>
                  <label className="text-[11px] font-sans font-bold uppercase tracking-wider text-brand-dark block mb-1">
                    Colour Palette / Tones
                  </label>
                  <input
                    type="text"
                    value={colour}
                    onChange={(e) => setColour(e.target.value)}
                    placeholder="e.g. Champagne Gold & Deep Navy, Natural Ecru"
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-brand-dark/15 text-xs font-sans focus:outline-none focus:border-brand-dark"
                  />
                </div>

                {/* Size / Dimensions */}
                <div>
                  <label className="text-[11px] font-sans font-bold uppercase tracking-wider text-brand-dark block mb-1">
                    {creationType === 'custom-apparel' ? 'Sizing Breakdown' : 'Dimensions / Sizing'}
                  </label>
                  <input
                    type="text"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder={
                      creationType === 'custom-apparel'
                        ? 'e.g. 10 S, 20 M, 15 L, 5 XL'
                        : 'e.g. 30cm × 20cm × 8cm, or standard fit'
                    }
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-brand-dark/15 text-xs font-sans focus:outline-none focus:border-brand-dark"
                  />
                </div>

                {/* Branding / Technique */}
                <div>
                  <label className="text-[11px] font-sans font-bold uppercase tracking-wider text-brand-dark block mb-1">
                    Branding Technique
                  </label>
                  <select
                    value={branding}
                    onChange={(e) => setBranding(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-brand-dark/15 text-xs font-sans focus:outline-none focus:border-brand-dark cursor-pointer"
                  >
                    {BRANDING_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Packaging */}
                <div>
                  <label className="text-[11px] font-sans font-bold uppercase tracking-wider text-brand-dark block mb-1">
                    Packaging Finish
                  </label>
                  <input
                    type="text"
                    value={packaging}
                    onChange={(e) => setPackaging(e.target.value)}
                    placeholder="e.g. Slide rigid box, solid wooden box, dust bag"
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-brand-dark/15 text-xs font-sans focus:outline-none focus:border-brand-dark"
                  />
                </div>

                {/* Personalisation */}
                <div>
                  <label className="text-[11px] font-sans font-bold uppercase tracking-wider text-brand-dark block mb-1">
                    Individual Personalisation
                  </label>
                  <input
                    type="text"
                    value={personalisation}
                    onChange={(e) => setPersonalisation(e.target.value)}
                    placeholder="e.g. Individual name hot stamping, handwritten card"
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-brand-dark/15 text-xs font-sans focus:outline-none focus:border-brand-dark"
                  />
                </div>

                {/* Special Instructions */}
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-sans font-bold uppercase tracking-wider text-brand-dark block mb-1">
                    Special Atelier Notes / Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder="Any specific tolerances, design preferences, or reference links..."
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-brand-dark/15 text-xs font-sans focus:outline-none focus:border-brand-dark resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 5 — REVIEW YOUR REQUEST
            ========================================================= */}
        {currentStep === 5 && (
          <div key="step-5" className="space-y-6 animate-fade-in text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Core Parameters */}
              <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 space-y-4">
                <div className="flex items-center justify-between border-b border-brand-dark/10 pb-3">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-gold-600">
                    Custom Commission Overview
                  </span>
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="text-xs font-sans text-brand-dark underline font-semibold cursor-pointer"
                  >
                    Edit
                  </button>
                </div>

                <div className="space-y-2.5 text-xs font-sans text-brand-medium">
                  <div className="flex justify-between">
                    <span>Category:</span>
                    <strong className="text-brand-dark uppercase">
                      {CREATION_TYPE_OPTIONS.find((c) => c.id === creationType)?.title}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Item / Concept:</span>
                    <strong className="text-brand-dark">{productItem}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Quantity:</span>
                    <strong className="text-brand-dark">{quantity} Units</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Budget Range:</span>
                    <strong className="text-brand-dark">
                      {BUDGET_RANGES.find((b) => b.id === budgetRange)?.label}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Purpose:</span>
                    <strong className="text-brand-dark">{purpose}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Target Delivery:</span>
                    <strong className="text-brand-dark">{deliveryDate}</strong>
                  </div>
                </div>
              </div>

              {/* Right Column: Specifications & Artwork */}
              <div className="p-6 rounded-2xl bg-white border border-brand-dark/10 space-y-4">
                <div className="flex items-center justify-between border-b border-brand-dark/10 pb-3">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-gold-600">
                    Atelier Specifications
                  </span>
                  <button
                    type="button"
                    onClick={() => goToStep(4)}
                    className="text-xs font-sans text-brand-dark underline font-semibold cursor-pointer"
                  >
                    Edit
                  </button>
                </div>

                <div className="space-y-2.5 text-xs font-sans text-brand-medium">
                  <div className="flex justify-between">
                    <span>Material:</span>
                    <strong className="text-brand-dark line-clamp-1">{material}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Colour:</span>
                    <strong className="text-brand-dark">{colour}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Sizing:</span>
                    <strong className="text-brand-dark">{size}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Branding:</span>
                    <strong className="text-brand-dark">{branding}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Packaging:</span>
                    <strong className="text-brand-dark">{packaging}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Uploaded Files:</span>
                    <strong className="text-brand-dark">{uploadedFiles.length} File(s) Attached</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Details Before Submitting */}
            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 space-y-3">
              <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-brand-dark block">
                Primary Contact for Official Quote
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="px-3 py-2 bg-white rounded-lg border border-brand-dark/15 text-xs font-sans"
                />
                <input
                  type="email"
                  required
                  placeholder="Work Email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="px-3 py-2 bg-white rounded-lg border border-brand-dark/15 text-xs font-sans"
                />
                <input
                  type="tel"
                  required
                  placeholder="Phone Number"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="px-3 py-2 bg-white rounded-lg border border-brand-dark/15 text-xs font-sans"
                />
                <input
                  type="text"
                  required
                  placeholder="Company Name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="px-3 py-2 bg-white rounded-lg border border-brand-dark/15 text-xs font-sans"
                />
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 6 — SUBMIT REQUEST (REQUEST A QUOTE)
            ========================================================= */}
        {currentStep === 6 && (
          <div key="step-6" className="space-y-6 animate-fade-in text-left">
            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-50 text-gold-700 font-sans text-xs font-semibold mb-2">
                  <span className="w-2 h-2 rounded-full bg-gold-600 animate-pulse" />
                  <span>Custom Quote {quoteStatus === 'requested' ? 'Requested' : 'Ready'}</span>
                </div>
                <h3 className="font-serif text-2xl text-brand-dark font-normal">
                  Reference: #{quoteReference}
                </h3>
                <p className="font-sans text-xs text-brand-medium mt-1">
                  Issued to <strong className="text-brand-dark">{contactName}</strong> at{' '}
                  <strong className="text-brand-dark">{companyName}</strong> ({contactEmail}).
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-sans text-brand-light block">Estimated Value</span>
                <span className="font-serif text-2xl text-gold-700 font-bold">
                  ₦{quoteAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Clear Pending Stages */}
            <div className="p-6 rounded-2xl bg-white border border-brand-dark/10 space-y-4">
              <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-600 block">
                Quote & Approval Lifecycle
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: '1', label: '1. Quote Requested', desc: 'Request logged with atelier', done: true, active: false },
                  { id: '2', label: '2. Quote Ready', desc: 'Pricing & proofs calculated', done: true, active: true },
                  { id: '3', label: '3. Client Approval', desc: 'Sign-off on specs & costs', done: false, active: false },
                  { id: '4', label: '4. Payment', desc: 'Production deposit authorization', done: false, active: false },
                ].map((st) => (
                  <div key={st.id} className="p-4 rounded-xl border border-brand-dark/10 bg-[#FAF8F5]">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-sans text-xs font-bold ${
                          st.done
                            ? 'bg-gold-600 text-white'
                            : st.active
                            ? 'bg-brand-dark text-white ring-2 ring-brand-dark/20 animate-pulse'
                            : 'bg-brand-dark/10 text-brand-dark/40'
                        }`}
                      >
                        {st.done ? '✓' : ''}
                      </div>
                      <span className="font-sans text-xs font-bold text-brand-dark">{st.label}</span>
                    </div>
                    <p className="font-sans text-[11px] text-brand-medium/70 leading-snug">{st.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs font-sans text-brand-medium">
                Our atelier lead is reviewing your uploaded artwork and materials.
              </span>
              <button
                type="button"
                onClick={() => goToStep(7)}
                className="w-full sm:w-auto px-8 py-3.5 bg-brand-dark text-white hover:bg-gold-600 font-sans text-xs font-semibold tracking-wider uppercase rounded-xl transition-all shadow-md cursor-pointer"
              >
                Proceed to Approve Quote →
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 7 — APPROVE & PAY
            ========================================================= */}
        {currentStep === 7 && (
          <div key="step-7" className="space-y-6 animate-fade-in text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quotation Itemization */}
              <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 space-y-4">
                <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-gold-600 block">
                  Official Atelier Pro-Forma Quotation
                </span>

                <div className="space-y-2.5 text-xs font-sans text-brand-medium pb-4 border-b border-brand-dark/10">
                  <div className="flex justify-between">
                    <span>
                      {productItem} ({quantity} units × ₦65,000):
                    </span>
                    <span>₦{(quantity * 65000).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Custom Tooling, Foil Die & Setup:</span>
                    <span>₦150,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pre-Production Physical Proof Sample:</span>
                    <span>₦75,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Direct White-Glove Hub Delivery:</span>
                    <span className="text-green-700 font-semibold">Complimentary</span>
                  </div>
                </div>

                <div className="flex justify-between items-baseline pt-1">
                  <span className="font-sans text-xs uppercase font-bold text-brand-dark">Total Quotation</span>
                  <span className="font-serif text-2xl text-brand-dark font-bold">
                    ₦{quoteAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Sign-off & Authorize */}
              <div className="p-6 rounded-2xl bg-white border border-brand-dark/10 space-y-4 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-brand-dark block mb-2">
                    Client Approval & Sign-Off ({quoteStatus === 'approved' || quoteStatus === 'paid' ? 'Approved' : 'Pending Authorization'})
                  </span>
                  <p className="font-sans text-xs text-brand-medium leading-relaxed mb-4">
                    By approving this quotation, our master craftsmen commence technical CAD drawings, material procurement, and pre-production sampling.
                  </p>

                  <div className="p-3.5 rounded-xl bg-gold-50/60 border border-gold-200 text-xs font-sans text-brand-dark space-y-1">
                    <p>
                      <strong>Authorized By:</strong> {contactName} ({companyName})
                    </p>
                    <p>
                      <strong>Target Delivery:</strong> {deliveryDate}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-4">
                  <button
                    type="button"
                    onClick={handleApproveQuote}
                    className="w-full py-3.5 bg-brand-dark hover:bg-gold-600 text-white font-sans text-xs font-semibold tracking-widest uppercase rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    Approve Quote & Authorize Production →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 8 — PRODUCTION STATUS
            ========================================================= */}
        {currentStep === 8 && (
          <div key="step-8" className="space-y-6 animate-fade-in text-left">
            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 font-sans text-xs font-semibold mb-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span>Approved & In Production</span>
                </div>
                <h3 className="font-serif text-2xl text-brand-dark font-normal">
                  Job Reference: #{quoteReference || 'GTC-BESPOKE-84920'}
                </h3>
                <p className="font-sans text-xs text-brand-medium mt-1">
                  Commission: <strong>{quantity} units</strong> of {productItem}.
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-sans text-brand-light block">Target Dispatch</span>
                <span className="font-serif text-lg text-brand-dark font-bold">
                  {deliveryDate}
                </span>
              </div>
            </div>

            {/* 5-Stage Production Tracker */}
            <div className="p-6 rounded-2xl bg-white border border-brand-dark/10 space-y-4">
              <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-600 block">
                Production Progress Tracker (Current Phase: {productionStage.toUpperCase()})
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { id: 'design', label: '1. Design', desc: 'Vector proofs complete', done: true, active: false },
                  { id: 'sample', label: '2. Sample', desc: 'Prototype in crafting', done: false, active: true },
                  { id: 'approval', label: '3. Approval', desc: 'Physical sign-off', done: false, active: false },
                  { id: 'production', label: '4. Production', desc: 'Full batch assembly', done: false, active: false },
                  { id: 'packaging', label: '5. Packaging', desc: 'Deboss boxing & ribbons', done: false, active: false },
                ].map((st) => (
                  <div key={st.id} className="p-3.5 rounded-xl border border-brand-dark/10 bg-[#FAF8F5]">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-sans text-xs font-bold ${
                          st.done
                            ? 'bg-gold-600 text-white'
                            : st.active
                            ? 'bg-brand-dark text-white ring-2 ring-brand-dark/20 animate-pulse'
                            : 'bg-brand-dark/10 text-brand-dark/40'
                        }`}
                      >
                        {st.done ? '✓' : ''}
                      </div>
                      <span className="font-sans text-xs font-bold text-brand-dark">{st.label}</span>
                    </div>
                    <p className="font-sans text-[10px] text-brand-medium/70 leading-snug">{st.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => goToStep(9)}
                className="w-full sm:w-auto px-8 py-3.5 bg-brand-dark text-white hover:bg-gold-600 font-sans text-xs font-semibold tracking-wider uppercase rounded-xl transition-all shadow-md cursor-pointer"
              >
                View Delivery Details →
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 9 — DELIVERY
            ========================================================= */}
        {currentStep === 9 && (
          <div key="step-9" className="space-y-6 animate-fade-in text-left">
            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 font-sans text-xs font-semibold mb-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span>White-Glove Delivery Scheduled</span>
                </div>
                <h3 className="font-serif text-2xl text-brand-dark font-normal">
                  Tracking Reference: #{quoteReference || 'GTC-BESPOKE-84920'}
                </h3>
                <p className="font-sans text-xs text-brand-medium mt-1">
                  Destination: <strong className="text-brand-dark">{companyName}</strong> ({contactName}).
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-sans text-brand-light block">Scheduled Date</span>
                <span className="font-serif text-xl text-gold-700 font-bold">
                  {deliveryDate}
                </span>
              </div>
            </div>

            {/* Delivery Specifications */}
            <div className="p-6 rounded-2xl bg-white border border-brand-dark/10 space-y-4">
              <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-600 block">
                Fulfillment & Handover Status
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans text-brand-medium">
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-brand-dark/10">
                  <strong className="text-brand-dark block mb-1">Status:</strong>
                  <span className="text-green-700 font-semibold">Packaging Complete · Ready for Courier</span>
                </div>
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-brand-dark/10">
                  <strong className="text-brand-dark block mb-1">Delivery Method:</strong>
                  <span>Direct White-Glove Courier with Handover Receipt</span>
                </div>
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-brand-dark/10">
                  <strong className="text-brand-dark block mb-1">Atelier Liaison:</strong>
                  <span>concierge@goodthingsco.ng (+234 800 GOOD THINGS)</span>
                </div>
              </div>
            </div>

            {/* Step 9 Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-brand-dark/10">
              <button
                type="button"
                onClick={() => alert(`Downloading atelier documentation for #${quoteReference || 'GTC-BESPOKE-84920'}...`)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-brand-dark/20 text-brand-dark hover:border-brand-dark font-sans text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer"
              >
                📥 Download Specification Dossier
              </button>

              <button
                type="button"
                onClick={() => goToStep(1)}
                className="w-full sm:w-auto px-8 py-3.5 bg-brand-dark text-white hover:bg-gold-600 font-sans text-xs font-semibold tracking-wider uppercase rounded-xl transition-all shadow-md cursor-pointer"
              >
                Start Another Custom Order →
              </button>
            </div>
          </div>
        )}

        {/* ── Persistent Bottom Navigation Controls (Steps 1 to 5) ── */}
        {currentStep >= 1 && currentStep <= 5 && (
          <div className="pt-6 mt-6 border-t border-brand-dark/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Back Button */}
            <button
              type="button"
              onClick={() => goToStep(currentStep - 1)}
              className="font-sans text-xs font-semibold uppercase tracking-wider text-brand-dark hover:text-gold-600 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>← Back</span>
            </button>

            {/* Step Status Pill */}
            <div className="text-xs font-sans text-brand-light hidden sm:block">
              {currentStep === 1 && (
                <span>
                  Creating:{' '}
                  <strong className="text-brand-dark capitalize">
                    {CREATION_TYPE_OPTIONS.find((c) => c.id === creationType)?.title}
                  </strong>
                </span>
              )}
              {currentStep === 2 && (
                <span>
                  Item: <strong className="text-brand-dark">{productItem}</strong> ({quantity} units)
                </span>
              )}
              {currentStep === 3 && (
                <span>
                  Files: <strong className="text-brand-dark">{uploadedFiles.length} attached</strong>
                </span>
              )}
              {currentStep === 4 && (
                <span>
                  Material: <strong className="text-brand-dark">{material}</strong>
                </span>
              )}
              {currentStep === 5 && (
                <span>
                  Reviewing custom request for <strong className="text-brand-dark">{companyName}</strong>
                </span>
              )}
            </div>

            {/* Continue Button or Submit Quote Button */}
            {currentStep === 5 ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitQuote}
                className="w-full sm:w-auto px-10 py-3.5 bg-brand-dark hover:bg-gold-600 text-white font-sans text-xs font-semibold tracking-widest uppercase rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{isSubmitting ? 'Submitting Request...' : 'Request a Quote →'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => goToStep(currentStep + 1)}
                className="w-full sm:w-auto px-8 py-3.5 bg-brand-dark text-white hover:bg-gold-600 font-sans text-xs font-semibold tracking-widest uppercase rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Continue to Step {currentStep + 1}</span>
                <span>→</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateFlowContainer;
