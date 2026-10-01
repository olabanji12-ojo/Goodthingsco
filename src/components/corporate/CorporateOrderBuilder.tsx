import React, { useState, useMemo } from 'react';
import {
  CorporatePurpose,
  CorporateGiftType,
  CorporateBudgetTier,
  CorporateGiftProduct,
  CorporateRecipient,
  CorporateCustomisation,
} from './types';
import {
  CORPORATE_PURPOSES,
  CORPORATE_GIFT_TYPES,
  CORPORATE_BUDGET_TIERS,
  CORPORATE_PACKAGING,
  CORPORATE_RIBBONS,
  CORPORATE_PRODUCTS,
  SAMPLE_CORPORATE_RECIPIENTS,
} from './corporateData';

interface CorporateOrderBuilderProps {
  onClose?: () => void;
  className?: string;
}

export const CorporateOrderBuilder: React.FC<CorporateOrderBuilderProps> = ({
  onClose,
  className = '',
}) => {
  // Current Active Stage (1 to 5)
  const [currentStage, setCurrentStage] = useState<1 | 2 | 3 | 4 | 5>(1);

  // ── Stage 1 State: Build Your Order ──
  const [selectedPurpose, setSelectedPurpose] = useState<CorporatePurpose>('client');
  const [selectedGiftType, setSelectedGiftType] = useState<CorporateGiftType>('choose-gift');
  const [selectedBudget, setSelectedBudget] = useState<CorporateBudgetTier>('25k-50k');
  const [selectedProduct, setSelectedProduct] = useState<CorporateGiftProduct>(CORPORATE_PRODUCTS[0]);
  const [quantity, setQuantity] = useState<number>(25);

  // ── Stage 2 State: Customise ──
  const [customisation, setCustomisation] = useState<CorporateCustomisation>({
    logoFileName: 'acme_corporation_logo.png',
    logoPreviewUrl: null,
    packagingId: CORPORATE_PACKAGING[0].id,
    packagingName: CORPORATE_PACKAGING[0].name,
    packagingCost: CORPORATE_PACKAGING[0].cost,
    ribbonColorId: CORPORATE_RIBBONS[0].id,
    ribbonColorName: CORPORATE_RIBBONS[0].name,
    companyMessage: 'With deep appreciation for our shared partnership and inspiring achievements this year.',
    hasIndividualMonogram: false,
    monogramCostPerUnit: 2500,
  });

  // ── Stage 3 State: Recipients ──
  const [recipientsTab, setRecipientsTab] = useState<'individual' | 'bulk'>('individual');
  const [recipients, setRecipients] = useState<CorporateRecipient[]>(SAMPLE_CORPORATE_RECIPIENTS);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [bulkUploadedFileName, setBulkUploadedFileName] = useState<string | null>(null);

  // ── Stage 4 State: Review & Contact ──
  const [contactName, setContactName] = useState('Olumide Sterling');
  const [contactEmail, setContactEmail] = useState('o.sterling@company.com');
  const [contactPhone, setContactPhone] = useState('+234 803 555 0192');
  const [companyName, setCompanyName] = useState('Sterling & Partners Capital');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionChoice, setActionChoice] = useState<'pay' | 'quote'>('quote');
  const [generatedRefId, setGeneratedRefId] = useState<string>('');

  // ── Filtered Gifts for Stage 1 ──
  const filteredProducts = useMemo(() => {
    return CORPORATE_PRODUCTS.filter((prod) => {
      const matchPurpose = prod.purposes.includes(selectedPurpose);
      const matchType = prod.giftTypes.includes(selectedGiftType);
      const matchBudget = prod.budgetTier === selectedBudget;
      return matchPurpose || matchType || matchBudget;
    });
  }, [selectedPurpose, selectedGiftType, selectedBudget]);

  // Fallback if strict filter is empty
  const displayProducts = filteredProducts.length > 0 ? filteredProducts : CORPORATE_PRODUCTS.slice(0, 4);

  // ── Pricing Calculations ──
  const volumeDiscountRate = useMemo(() => {
    if (quantity >= 100) return 0.15; // 15% discount for 100+
    if (quantity >= 50) return 0.10;  // 10% discount for 50+
    if (quantity >= 25) return 0.05;  // 5% discount for 25+
    return 0;
  }, [quantity]);

  const baseItemsTotal = selectedProduct.unitPrice * quantity;
  const discountAmount = Math.round(baseItemsTotal * volumeDiscountRate);
  const packagingTotal = customisation.packagingCost * quantity;
  const monogramTotal = customisation.hasIndividualMonogram ? customisation.monogramCostPerUnit * quantity : 0;
  const brandingFee = 25000; // Flat fee for corporate foil plate/embossing
  const grandTotal = baseItemsTotal - discountAmount + packagingTotal + monogramTotal + brandingFee;

  // Add individual recipient
  const handleAddRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newAddress.trim()) return;
    const item: CorporateRecipient = {
      id: `cr-${Date.now()}`,
      name: newName.trim(),
      phone: newPhone.trim() || 'N/A',
      address: newAddress.trim(),
    };
    setRecipients((prev) => [...prev, item]);
    setNewName('');
    setNewPhone('');
    setNewAddress('');
  };

  const handleRemoveRecipient = (id: string) => {
    setRecipients((prev) => prev.filter((r) => r.id !== id));
  };

  // Mock CSV bulk upload
  const handleMockCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBulkUploadedFileName(file.name);
      // Add mock parsed recipients
      setRecipients([
        ...SAMPLE_CORPORATE_RECIPIENTS,
        { id: 'cr-4', name: 'Kemi Adeleke', phone: '+234 809 111 2233', address: 'Plot 10 Banana Island, Ikoyi, Lagos' },
        { id: 'cr-5', name: 'Tunde Bakare', phone: '+234 812 444 7788', address: '12 Trans Amadi Layout, Port Harcourt' },
        { id: 'cr-6', name: 'Fatima Al-Hassan', phone: '+234 803 777 9900', address: '8 Sultan Bello Road, Kaduna' },
      ]);
    }
  };

  // Submit Order or Quote
  const handleSubmitAction = (type: 'pay' | 'quote') => {
    setActionChoice(type);
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const randomDigits = Math.floor(10000 + Math.random() * 90000);
      const ref = type === 'quote' ? `GTC-QUOTE-${randomDigits}` : `GTC-CORP-${randomDigits}`;
      setGeneratedRefId(ref);
      setCurrentStage(5);
    }, 850);
  };

  return (
    <div className={`w-full max-w-5xl mx-auto bg-white rounded-3xl shadow-xl border border-brand-dark/10 overflow-hidden ${className}`}>
      {/* ── Top Header & 5-Stage Stepper ── */}
      <div className="bg-[#FAF8F5] border-b border-brand-dark/10 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="font-sans text-[11px] font-semibold tracking-[0.24em] uppercase text-gold-600 block mb-1">
              Corporate & Bespoke Gifting Concierge
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-brand-dark font-normal">
              Corporate Gifting Order
            </h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="self-end sm:self-auto w-9 h-9 rounded-full border border-brand-dark/15 hover:border-brand-dark flex items-center justify-center text-brand-dark transition-colors cursor-pointer"
              aria-label="Close corporate concierge"
            >
              ✕
            </button>
          )}
        </div>

        {/* 5-Stage Stepper Bar */}
        <div className="grid grid-cols-5 gap-2 sm:gap-3 text-center">
          {[
            { step: 1, label: '1. Build Order' },
            { step: 2, label: '2. Customise' },
            { step: 3, label: '3. Recipients' },
            { step: 4, label: '4. Review' },
            { step: 5, label: '5. Confirmation' },
          ].map((s) => {
            const isCurrent = currentStage === s.step;
            const isCompleted = currentStage > s.step;
            return (
              <button
                key={s.step}
                type="button"
                disabled={currentStage === 5 || s.step > currentStage + 1}
                onClick={() => setCurrentStage(s.step as any)}
                className={`py-2 px-1 sm:px-2 rounded-lg text-[10px] sm:text-xs font-sans font-medium transition-all ${
                  isCurrent
                    ? 'bg-brand-dark text-brand-ivory shadow-xs font-semibold'
                    : isCompleted
                    ? 'bg-gold-50 text-gold-700 hover:bg-gold-100/60 cursor-pointer'
                    : 'bg-white/60 text-brand-light/60 cursor-not-allowed'
                }`}
              >
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Dynamic Stage Views ── */}
      <div className="p-6 sm:p-8 md:p-10">
        {/* =========================================================
            STAGE 1: BUILD YOUR ORDER
            ========================================================= */}
        {currentStage === 1 && (
          <div className="space-y-8 animate-fade-in">
            {/* 1. Purpose */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="font-sans text-xs font-semibold uppercase tracking-wider text-brand-dark flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-brand-dark text-white text-[10px] flex items-center justify-center font-bold">
                    1
                  </span>
                  <span>What are you gifting for? (Purpose)</span>
                </label>
                <span className="text-[11px] font-sans text-brand-light italic">
                  {CORPORATE_PURPOSES.find((p) => p.id === selectedPurpose)?.desc}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {CORPORATE_PURPOSES.map((purpose) => {
                  const isSelected = selectedPurpose === purpose.id;
                  return (
                    <button
                      key={purpose.id}
                      type="button"
                      onClick={() => setSelectedPurpose(purpose.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-sans transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-brand-dark text-brand-ivory border-brand-dark shadow-2xs font-semibold'
                          : 'bg-[#FAF8F5] text-brand-dark/80 hover:text-brand-dark border-brand-dark/10 hover:border-brand-dark/30'
                      }`}
                    >
                      {purpose.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Gift Type */}
            <div>
              <label className="font-sans text-xs font-semibold uppercase tracking-wider text-brand-dark flex items-center gap-2 mb-3">
                <span className="w-5 h-5 rounded-full bg-brand-dark text-white text-[10px] flex items-center justify-center font-bold">
                  2
                </span>
                <span>What would you like? (Gift Type)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CORPORATE_GIFT_TYPES.map((type) => {
                  const isSelected = selectedGiftType === type.id;
                  return (
                    <div
                      key={type.id}
                      onClick={() => setSelectedGiftType(type.id)}
                      className={`p-4 rounded-xl cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-white border-gold-600 ring-1 ring-gold-600/50 shadow-xs'
                          : 'bg-[#FAF8F5] border-brand-dark/10 hover:border-brand-dark/30'
                      }`}
                    >
                      <h4 className="font-sans text-xs font-bold text-brand-dark mb-1">
                        {type.label}
                      </h4>
                      <p className="font-sans text-[11px] text-brand-medium/80 leading-snug">
                        {type.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Budget */}
            <div>
              <label className="font-sans text-xs font-semibold uppercase tracking-wider text-brand-dark flex items-center gap-2 mb-3">
                <span className="w-5 h-5 rounded-full bg-brand-dark text-white text-[10px] flex items-center justify-center font-bold">
                  3
                </span>
                <span>Choose Your Budget Per Recipient</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {CORPORATE_BUDGET_TIERS.map((tier) => {
                  const isSelected = selectedBudget === tier.id;
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setSelectedBudget(tier.id)}
                      className={`py-3 px-3 rounded-xl text-center text-xs font-sans transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-brand-dark text-brand-ivory border-brand-dark shadow-2xs font-semibold'
                          : 'bg-[#FAF8F5] text-brand-dark/80 hover:text-brand-dark border-brand-dark/10 hover:border-brand-dark/30'
                      }`}
                    >
                      {tier.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Choose Your Gift */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="font-sans text-xs font-semibold uppercase tracking-wider text-brand-dark flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-brand-dark text-white text-[10px] flex items-center justify-center font-bold">
                    4
                  </span>
                  <span>Choose Your Gift (Suitable Options Matching Your Criteria)</span>
                </label>
                <span className="text-xs font-sans text-brand-medium">
                  {displayProducts.length} options matching
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {displayProducts.map((product) => {
                  const isSelected = selectedProduct.id === product.id;
                  return (
                    <div
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      className={`group rounded-2xl overflow-hidden cursor-pointer transition-all border flex flex-col justify-between ${
                        isSelected
                          ? 'bg-white border-brand-dark ring-2 ring-brand-dark shadow-md'
                          : 'bg-[#FAF8F5] border-brand-dark/10 hover:border-brand-dark/30'
                      }`}
                    >
                      <div className="relative aspect-[4/3.5] overflow-hidden bg-brand-cream/80">
                        <img
                          src={product.image}
                          alt={product.alt}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        />
                        {product.badge && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-brand-dark text-white text-[9px] font-sans font-bold uppercase tracking-wider">
                            {product.badge}
                          </span>
                        )}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gold-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                            ✓
                          </div>
                        )}
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-sans font-semibold uppercase text-gold-600 block mb-0.5">
                            {product.category}
                          </span>
                          <h5 className="font-serif text-sm font-medium text-brand-dark mb-1 line-clamp-2">
                            {product.name}
                          </h5>
                          <div className="font-serif text-sm font-bold text-brand-dark">
                            {product.formattedPrice}
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-brand-dark/10 flex items-center justify-between text-[11px] font-sans text-brand-medium">
                          <span>Min: {product.minQuantity} units</span>
                          <span className={isSelected ? 'text-gold-700 font-bold' : ''}>
                            {isSelected ? 'Selected' : 'Select →'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. Quantity Selector */}
            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <label className="font-sans text-xs font-semibold uppercase tracking-wider text-brand-dark block mb-1">
                  5. Specify Required Quantity
                </label>
                <p className="font-sans text-xs text-brand-medium">
                  Volume tiers: 5% off (25+ units) · 10% off (50+ units) · 15% off (100+ units)
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  {[10, 25, 50, 100].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuantity(q)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-sans font-semibold transition-all border ${
                        quantity === q
                          ? 'bg-brand-dark text-white border-brand-dark'
                          : 'bg-white text-brand-dark border-brand-dark/15 hover:border-brand-dark/30'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>

                <div className="flex items-center border border-brand-dark/20 rounded-lg overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(selectedProduct.minQuantity, prev - 5))}
                    className="px-2.5 py-1.5 text-xs text-brand-dark hover:bg-black/5"
                  >
                    –
                  </button>
                  <input
                    type="number"
                    min={selectedProduct.minQuantity}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(selectedProduct.minQuantity, parseInt(e.target.value) || selectedProduct.minQuantity))}
                    className="w-14 text-center font-sans text-xs font-bold text-brand-dark outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => prev + 5)}
                    className="px-2.5 py-1.5 text-xs text-brand-dark hover:bg-black/5"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Stage 1 Footer Action */}
            <div className="pt-4 border-t border-brand-dark/10 flex items-center justify-between">
              <div>
                <span className="text-xs font-sans text-brand-light block">Selected Gift</span>
                <span className="font-serif text-lg text-brand-dark font-medium">
                  {selectedProduct.name} ({quantity} units)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStage(2)}
                className="btn-primary px-8 py-3.5 rounded-xl bg-brand-dark text-white hover:bg-gold-600 font-sans text-xs font-semibold tracking-widest uppercase transition-all shadow-md cursor-pointer"
              >
                Proceed to Customise →
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
            STAGE 2: CUSTOMISE
            ========================================================= */}
        {currentStage === 2 && (
          <div className="space-y-8 animate-fade-in">
            {/* 1. Company Logo */}
            <div>
              <label className="font-sans text-xs font-semibold uppercase tracking-wider text-brand-dark block mb-2">
                1. Upload Company Logo (High-Res Vector or PNG)
              </label>
              <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-dashed border-brand-dark/20 text-center">
                <input
                  type="file"
                  accept="image/*,.pdf,.svg,.eps"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setCustomisation((prev) => ({
                        ...prev,
                        logoFileName: file.name,
                        logoPreviewUrl: URL.createObjectURL(file),
                      }));
                    }
                  }}
                  id="corp-logo-upload"
                  className="hidden"
                />
                <label
                  htmlFor="corp-logo-upload"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-brand-dark/15 hover:border-brand-dark font-sans text-xs font-semibold text-brand-dark cursor-pointer shadow-2xs hover:shadow-xs transition-all"
                >
                  <span>📁 Select Logo File</span>
                </label>
                {customisation.logoFileName && (
                  <p className="mt-2 text-xs font-sans text-gold-700 font-medium">
                    ✓ Attached: {customisation.logoFileName}
                  </p>
                )}
                <span className="text-[11px] font-sans text-brand-light block mt-1">
                  Logo will be metallic gold, silver, or black foil debossed onto packaging.
                </span>
              </div>
            </div>

            {/* 2. Packaging */}
            <div>
              <label className="font-sans text-xs font-semibold uppercase tracking-wider text-brand-dark block mb-3">
                2. Select Corporate Packaging Finish
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CORPORATE_PACKAGING.map((pkg) => {
                  const isSelected = customisation.packagingId === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() =>
                        setCustomisation((prev) => ({
                          ...prev,
                          packagingId: pkg.id,
                          packagingName: pkg.name,
                          packagingCost: pkg.cost,
                        }))
                      }
                      className={`p-4 rounded-xl cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-white border-gold-600 ring-1 ring-gold-600/50 shadow-xs'
                          : 'bg-[#FAF8F5] border-brand-dark/10 hover:border-brand-dark/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-sans text-xs font-bold text-brand-dark">{pkg.name}</span>
                        <span className="font-sans text-xs text-gold-600 font-semibold">+₦{pkg.cost.toLocaleString()}</span>
                      </div>
                      <p className="font-sans text-[11px] text-brand-medium/80 leading-snug">{pkg.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Ribbon Colour */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-sans text-xs font-semibold uppercase tracking-wider text-brand-dark">
                  3. Select Hand-Tied Satin Ribbon
                </label>
                <span className="text-xs font-sans text-gold-600 font-semibold">
                  {customisation.ribbonColorName}
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {CORPORATE_RIBBONS.map((ribbon) => {
                  const isSelected = customisation.ribbonColorId === ribbon.id;
                  return (
                    <button
                      key={ribbon.id}
                      type="button"
                      onClick={() =>
                        setCustomisation((prev) => ({
                          ...prev,
                          ribbonColorId: ribbon.id,
                          ribbonColorName: ribbon.name,
                        }))
                      }
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-full border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white border-brand-dark ring-1 ring-brand-dark shadow-2xs font-semibold'
                          : 'bg-[#FAF8F5] border-brand-dark/10 hover:border-brand-dark/30'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: ribbon.hex }} />
                      <span className="text-xs font-sans text-brand-dark">{ribbon.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Company Message Card */}
            <div>
              <label className="font-sans text-xs font-semibold uppercase tracking-wider text-brand-dark block mb-2">
                4. Company Message (Calligraphed inside each gift)
              </label>
              <textarea
                rows={3}
                value={customisation.companyMessage}
                onChange={(e) => setCustomisation((prev) => ({ ...prev, companyMessage: e.target.value }))}
                placeholder="Write your company message to accompany each gift..."
                className="w-full p-4 rounded-xl bg-white border border-brand-dark/15 focus:border-brand-dark focus:outline-none font-sans text-xs sm:text-sm text-brand-dark resize-none"
              />
            </div>

            {/* 5. Personalisation (Individual Name Engraving) */}
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-brand-dark/10 flex items-center justify-between">
              <div>
                <span className="font-sans text-xs font-semibold text-brand-dark block">
                  Individual Recipient Name Engraving (+₦2,500 / unit)
                </span>
                <span className="text-[11px] font-sans text-brand-medium">
                  Laser engraved or hot-stamped with each individual's full name.
                </span>
              </div>
              <input
                type="checkbox"
                checked={customisation.hasIndividualMonogram}
                onChange={(e) => setCustomisation((prev) => ({ ...prev, hasIndividualMonogram: e.target.checked }))}
                className="w-5 h-5 rounded accent-brand-dark cursor-pointer"
              />
            </div>

            {/* Stage 2 Footer Actions */}
            <div className="pt-4 border-t border-brand-dark/10 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStage(1)}
                className="text-xs font-sans font-semibold uppercase text-brand-dark hover:text-gold-600 transition-colors cursor-pointer"
              >
                ← Back to Order
              </button>
              <button
                type="button"
                onClick={() => setCurrentStage(3)}
                className="btn-primary px-8 py-3.5 rounded-xl bg-brand-dark text-white hover:bg-gold-600 font-sans text-xs font-semibold tracking-widest uppercase transition-all shadow-md cursor-pointer"
              >
                Proceed to Recipients →
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
            STAGE 3: ADD RECIPIENTS
            ========================================================= */}
        {currentStage === 3 && (
          <div className="space-y-8 animate-fade-in">
            {/* Tabs for Individual vs Bulk Upload */}
            <div className="flex border-b border-brand-dark/10">
              <button
                type="button"
                onClick={() => setRecipientsTab('individual')}
                className={`py-3 px-6 font-sans text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  recipientsTab === 'individual'
                    ? 'border-brand-dark text-brand-dark'
                    : 'border-transparent text-brand-light hover:text-brand-dark'
                }`}
              >
                Individual Entry ({recipients.length} Added)
              </button>
              <button
                type="button"
                onClick={() => setRecipientsTab('bulk')}
                className={`py-3 px-6 font-sans text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  recipientsTab === 'bulk'
                    ? 'border-brand-dark text-brand-dark'
                    : 'border-transparent text-brand-light hover:text-brand-dark'
                }`}
              >
                Bulk CSV / Excel Upload
              </button>
            </div>

            {recipientsTab === 'individual' ? (
              <div className="space-y-6">
                {/* Form to add single recipient */}
                <form onSubmit={handleAddRecipient} className="p-5 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-brand-dark block mb-1">Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tayo Johnson"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-brand-dark/15 text-xs font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-brand-dark block mb-1">Phone</label>
                    <input
                      type="tel"
                      placeholder="+234..."
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-brand-dark/15 text-xs font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-brand-dark block mb-1">Delivery Address</label>
                    <input
                      type="text"
                      required
                      placeholder="Street, City, State"
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-brand-dark/15 text-xs font-sans"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 rounded-lg bg-brand-dark text-white hover:bg-gold-600 font-sans text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      + Add Recipient
                    </button>
                  </div>
                </form>

                {/* Recipients List Table */}
                <div className="overflow-x-auto border border-brand-dark/10 rounded-2xl">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-[#FAF8F5] border-b border-brand-dark/10 text-brand-light font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3.5">#</th>
                        <th className="p-3.5">Recipient Name</th>
                        <th className="p-3.5">Phone Number</th>
                        <th className="p-3.5">Delivery Address</th>
                        <th className="p-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-dark/5">
                      {recipients.map((rec, i) => (
                        <tr key={rec.id} className="hover:bg-brand-cream/30">
                          <td className="p-3.5 text-brand-light font-mono">{i + 1}</td>
                          <td className="p-3.5 font-semibold text-brand-dark">{rec.name}</td>
                          <td className="p-3.5 text-brand-medium">{rec.phone}</td>
                          <td className="p-3.5 text-brand-medium">{rec.address}</td>
                          <td className="p-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveRecipient(rec.id)}
                              className="text-red-600 hover:text-red-800 text-[11px] font-semibold cursor-pointer"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Bulk Upload Panel */
              <div className="p-8 rounded-2xl bg-[#FAF8F5] border-2 border-dashed border-brand-dark/20 text-center space-y-4">
                <div className="text-3xl">📊</div>
                <h4 className="font-serif text-lg text-brand-dark">Bulk Upload Recipients Spreadsheet</h4>
                <p className="font-sans text-xs text-brand-medium max-w-md mx-auto leading-relaxed">
                  Upload an Excel (.xlsx) or CSV file with columns: <strong>Name, Phone, Address, Notes</strong>.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    id="bulk-csv-input"
                    onChange={handleMockCsvUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="bulk-csv-input"
                    className="px-6 py-2.5 rounded-xl bg-brand-dark text-white hover:bg-gold-600 font-sans text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors shadow-2xs"
                  >
                    Select CSV / Excel File
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      alert('Downloading corporate_recipients_template.csv template...');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-white border border-brand-dark/20 hover:border-brand-dark font-sans text-xs text-brand-dark font-medium transition-colors cursor-pointer"
                  >
                    Download Template
                  </button>
                </div>
                {bulkUploadedFileName && (
                  <p className="text-xs font-sans text-green-700 font-semibold mt-2">
                    ✓ Uploaded & Parsed: {bulkUploadedFileName} ({recipients.length} recipients ready)
                  </p>
                )}
              </div>
            )}

            {/* Stage 3 Footer Actions */}
            <div className="pt-4 border-t border-brand-dark/10 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStage(2)}
                className="text-xs font-sans font-semibold uppercase text-brand-dark hover:text-gold-600 transition-colors cursor-pointer"
              >
                ← Back to Customise
              </button>
              <button
                type="button"
                onClick={() => setCurrentStage(4)}
                className="btn-primary px-8 py-3.5 rounded-xl bg-brand-dark text-white hover:bg-gold-600 font-sans text-xs font-semibold tracking-widest uppercase transition-all shadow-md cursor-pointer"
              >
                Review & Approve →
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
            STAGE 4: REVIEW & APPROVE (Pay Now vs Request Quote)
            ========================================================= */}
        {currentStage === 4 && (
          <div className="space-y-8 animate-fade-in">
            {/* Executive Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Specifications */}
              <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 space-y-4">
                <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-gold-600 block">
                  Order Specifications
                </span>

                <div className="flex items-center gap-4 pb-4 border-b border-brand-dark/10">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.alt}
                    className="w-16 h-16 object-cover rounded-xl border border-brand-dark/10 bg-white"
                  />
                  <div>
                    <h4 className="font-serif text-base text-brand-dark font-normal">{selectedProduct.name}</h4>
                    <span className="text-xs font-sans text-brand-medium">{quantity} Units ({selectedProduct.formattedPrice} / unit)</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-sans text-brand-medium">
                  <div className="flex justify-between">
                    <span>Purpose:</span>
                    <strong className="text-brand-dark uppercase">{selectedPurpose}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Branding / Logo:</span>
                    <strong className="text-brand-dark">{customisation.logoFileName || 'Provided on File'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Packaging:</span>
                    <strong className="text-brand-dark">{customisation.packagingName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Ribbon:</span>
                    <strong className="text-brand-dark">{customisation.ribbonColorName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Recipients:</span>
                    <strong className="text-brand-dark">{recipients.length} Recipient Addresses Loaded</strong>
                  </div>
                </div>
              </div>

              {/* Right Column: Cost Breakdown & Billing Details */}
              <div className="p-6 rounded-2xl bg-white border border-brand-dark/10 space-y-4">
                <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-gold-600 block">
                  Financial Breakdown
                </span>

                <div className="space-y-2.5 text-xs font-sans text-brand-medium pb-4 border-b border-brand-dark/10">
                  <div className="flex justify-between">
                    <span>Base Items ({quantity} × {selectedProduct.formattedPrice}):</span>
                    <span>₦{baseItemsTotal.toLocaleString()}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-700 font-semibold">
                      <span>Volume Discount ({Math.round(volumeDiscountRate * 100)}% off):</span>
                      <span>–₦{discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Custom Packaging:</span>
                    <span>₦{packagingTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Branding Foil Setup & Stamping:</span>
                    <span>₦{brandingFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Direct White-Glove Delivery:</span>
                    <span className="text-green-700 font-semibold">Complimentary</span>
                  </div>
                </div>

                <div className="flex justify-between items-baseline pt-2">
                  <span className="font-sans text-xs uppercase font-bold text-brand-dark">Grand Total</span>
                  <span className="font-serif text-2xl text-brand-dark font-bold">
                    ₦{grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Corporate Contact Information */}
            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10">
              <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-brand-dark block mb-3">
                Corporate Billing & Contact Details
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Contact Name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="px-3 py-2 bg-white rounded-lg border border-brand-dark/15 text-xs font-sans"
                />
                <input
                  type="email"
                  placeholder="Official Company Email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="px-3 py-2 bg-white rounded-lg border border-brand-dark/15 text-xs font-sans"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="px-3 py-2 bg-white rounded-lg border border-brand-dark/15 text-xs font-sans"
                />
                <input
                  type="text"
                  placeholder="Company Legal Name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="px-3 py-2 bg-white rounded-lg border border-brand-dark/15 text-xs font-sans"
                />
              </div>
            </div>

            {/* Stage 4 Dual Action: Pay Now vs Request Quote */}
            <div className="pt-4 border-t border-brand-dark/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setCurrentStage(3)}
                className="text-xs font-sans font-semibold uppercase text-brand-dark hover:text-gold-600 transition-colors cursor-pointer"
              >
                ← Back to Recipients
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleSubmitAction('quote')}
                  className="w-full sm:w-auto px-8 py-3.5 bg-white text-brand-dark hover:bg-gold-50 border border-brand-dark/20 font-sans text-xs font-semibold tracking-wider uppercase rounded-xl transition-all shadow-2xs cursor-pointer"
                >
                  {isProcessing && actionChoice === 'quote' ? 'Preserving...' : 'Request Official Quote'}
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleSubmitAction('pay')}
                  className="w-full sm:w-auto px-10 py-3.5 bg-brand-dark hover:bg-gold-600 text-white font-sans text-xs font-semibold tracking-widest uppercase rounded-xl transition-all shadow-md cursor-pointer"
                >
                  {isProcessing && actionChoice === 'pay' ? 'Processing...' : 'Pay Now & Authorize →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            STAGE 5: ORDER CONFIRMATION & LIVE STATUS TRACKING
            ========================================================= */}
        {currentStage === 5 && (
          <div className="space-y-8 animate-fade-in text-center sm:text-left">
            {/* Status Announcement */}
            <div className="p-6 rounded-2xl bg-white border border-brand-dark/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 font-sans text-xs font-semibold mb-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span>{actionChoice === 'quote' ? 'Official Quote Dispatched' : 'Corporate Order Confirmed'}</span>
                </div>
                <h4 className="font-serif text-2xl text-brand-dark font-normal">
                  Reference: #{generatedRefId}
                </h4>
                <p className="font-sans text-xs text-brand-medium mt-1">
                  Issued to <strong className="text-brand-dark">{companyName}</strong> ({contactEmail}).
                </p>
              </div>

              <div className="text-center sm:text-right">
                <span className="text-xs font-sans text-brand-light block">Total Value</span>
                <span className="font-serif text-2xl text-gold-700 font-bold">
                  ₦{grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* ── 4-Step Corporate Order Tracking ── */}
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-brand-dark/10">
              <div className="flex items-center justify-between mb-6">
                <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-600 block">
                  Corporate Order Fulfillment Status
                </span>
                <span className="text-xs font-sans text-green-700 font-semibold">
                  Status: In Production
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { id: 'production', label: '1. Production', desc: 'Debossing logo & curation', active: true, done: true },
                  { id: 'packaging', label: '2. Packaging', desc: 'Hand-tied ribbon & boxing', active: true, done: false },
                  { id: 'delivery', label: '3. Delivery', desc: 'Direct-to-recipient dispatch', active: false, done: false },
                  { id: 'delivered', label: '4. Delivered', desc: 'Fulfillment receipt signed', active: false, done: false },
                ].map((st) => (
                  <div key={st.id} className="p-4 rounded-xl border border-brand-dark/10 bg-[#FAF8F5] text-left">
                    <div className="flex items-center gap-2 mb-2">
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

            {/* Actions */}
            <div className="pt-4 border-t border-brand-dark/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="font-sans text-xs text-brand-medium">
                An executive account manager has been assigned to your order.
              </span>
              <button
                type="button"
                onClick={() => {
                  setCurrentStage(1);
                  if (onClose) onClose();
                }}
                className="w-full sm:w-auto px-8 py-3.5 bg-brand-dark text-white hover:bg-gold-600 font-sans text-xs font-semibold tracking-wider uppercase rounded-xl transition-all cursor-pointer"
              >
                Close & Return →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CorporateOrderBuilder;
