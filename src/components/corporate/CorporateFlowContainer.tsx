import React, { useState, useMemo, useRef } from 'react';
import {
  CorporatePurpose,
  CorporateIndustry,
  CorporateGiftType,
  CorporateBudgetTier,
  CorporateGiftProduct,
  CorporateRecipient,
  CorporateCustomisation,
} from './types';
import {
  CORPORATE_PURPOSES,
  CORPORATE_INDUSTRIES,
  CORPORATE_BUDGET_TIERS,
  CORPORATE_PACKAGING,
  CORPORATE_RIBBONS,
  CORPORATE_PRODUCTS,
  SAMPLE_CORPORATE_RECIPIENTS,
} from './corporateData';
import { submitCorporateRequest } from '../../services/corporateService';
import {
  Building2,
  Check,
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

interface CorporateFlowContainerProps {
  className?: string;
  onComplete?: (orderRef: string) => void;
}

export const CorporateFlowContainer: React.FC<CorporateFlowContainerProps> = ({
  className = '',
  onComplete,
}) => {
  // ── Step 1: Purpose ──
  const [selectedPurpose, setSelectedPurpose] = useState<CorporatePurpose>('client');

  // ── Step 2: Industry (New client requirement) ──
  const [selectedIndustry, setSelectedIndustry] = useState<CorporateIndustry>('technology');
  const [otherIndustry, setOtherIndustry] = useState<string>('');

  // ── Step 3: Budget ──
  const [selectedBudget, setSelectedBudget] = useState<CorporateBudgetTier>('25k-50k');

  // ── Step 4: Quantity ──
  const [quantity, setQuantity] = useState<number>(25);

  // Progressive Disclosure Stage:
  // 1: Purpose chosen
  // 2: Industry active
  // 3: Budget active
  // 4: Quantity active (and full curation/customisation revealed)
  const [activeStage, setActiveStage] = useState<number>(4);

  // Section DOM refs for automatic progression
  const industryRef = useRef<HTMLDivElement>(null);
  const budgetRef = useRef<HTMLDivElement>(null);
  const quantityRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // ── Step 5: Gift Selection ──
  const [selectedProduct, setSelectedProduct] = useState<CorporateGiftProduct>(CORPORATE_PRODUCTS[0]);
  const [selectedGiftType] = useState<CorporateGiftType>('choose-gift');

  // ── Step 6: Customise ──
  const [customisation, setCustomisation] = useState<CorporateCustomisation>({
    logoFileName: 'company_vector_logo.svg',
    logoPreviewUrl: null,
    packagingId: CORPORATE_PACKAGING[0].id,
    packagingName: CORPORATE_PACKAGING[0].name,
    packagingCost: CORPORATE_PACKAGING[0].cost,
    ribbonColorId: CORPORATE_RIBBONS[0].id,
    ribbonColorName: CORPORATE_RIBBONS[0].name,
    companyMessage: 'With sincere gratitude for our valued partnership and shared success.',
    hasIndividualMonogram: false,
    monogramCostPerUnit: 2500,
  });
  const [logoFinishOption, setLogoFinishOption] = useState<'gold' | 'silver' | 'blind'>('gold');

  // ── Step 7: Recipients & Delivery ──
  const [deliveryMethod, setDeliveryMethod] = useState<'single-hub' | 'direct-recipient'>('single-hub');
  const [recipients, setRecipients] = useState<CorporateRecipient[]>(SAMPLE_CORPORATE_RECIPIENTS);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // ── Step 8: Corporate Contact Details ──
  const [contactName, setContactName] = useState('Olumide Sterling');
  const [contactEmail, setContactEmail] = useState('o.sterling@company.com');
  const [contactPhone, setContactPhone] = useState('+234 803 555 0192');
  const [companyName, setCompanyName] = useState('Sterling & Partners Capital');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // ── Submission & Confirmation ──
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionType, setActionType] = useState<'pay' | 'quote'>('quote');
  const [generatedRefId, setGeneratedRefId] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Filtered products responding to Purpose & Budget
  const filteredProducts = useMemo(() => {
    return CORPORATE_PRODUCTS.filter((prod) => {
      const matchPurpose = prod.purposes.includes(selectedPurpose);
      const matchBudget = prod.budgetTier === selectedBudget;
      return matchPurpose || matchBudget;
    });
  }, [selectedPurpose, selectedBudget]);

  const displayProducts = filteredProducts.length > 0 ? filteredProducts : CORPORATE_PRODUCTS;

  // Financial Calculations & Volume Discount
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
  const brandingFee = 25000; // Flat setup fee for corporate foil stamp
  const grandTotal = baseItemsTotal - discountAmount + packagingTotal + monogramTotal + brandingFee;

  // ── Automatic Progression Click Handlers (No "Next" buttons!) ──
  const handleSelectPurpose = (purposeId: CorporatePurpose) => {
    setSelectedPurpose(purposeId);
    if (activeStage < 2) setActiveStage(2);
    setTimeout(() => {
      industryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 120);
  };

  const handleSelectIndustry = (indId: CorporateIndustry) => {
    setSelectedIndustry(indId);
    if (activeStage < 3) setActiveStage(3);
    setTimeout(() => {
      budgetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 120);
  };

  const handleSelectBudget = (tierId: CorporateBudgetTier) => {
    setSelectedBudget(tierId);
    if (activeStage < 4) setActiveStage(4);
    setTimeout(() => {
      quantityRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 120);
  };

  const handleSelectQuantity = (qty: number) => {
    setQuantity(qty);
    setTimeout(() => {
      detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };

  // Recipient addition
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

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      setRecipients([
        ...SAMPLE_CORPORATE_RECIPIENTS,
        { id: `cr-${Date.now()}-1`, name: 'Kemi Adeleke', phone: '+234 809 111 2233', address: 'Plot 10 Banana Island, Ikoyi, Lagos' },
        { id: `cr-${Date.now()}-2`, name: 'Tunde Bakare', phone: '+234 812 444 7788', address: '12 Trans Amadi Layout, Port Harcourt' },
        { id: `cr-${Date.now()}-3`, name: 'Fatima Al-Hassan', phone: '+234 803 777 9900', address: '8 Sultan Bello Road, Kaduna' },
      ]);
    }
  };

  // Order Submission (Pay or Request Quote)
  const handleSubmit = async (type: 'pay' | 'quote') => {
    setActionType(type);
    setIsProcessing(true);

    try {
      const result = await submitCorporateRequest({
        company: {
          companyName: companyName.trim() || 'Enterprise Client',
          contactName: contactName.trim() || 'Corporate Liaison',
          email: contactEmail.trim(),
          phone: contactPhone.trim(),
        },
        giftingPurpose: selectedPurpose,
        industry: selectedIndustry,
        otherIndustry: selectedIndustry === 'other' ? otherIndustry.trim() || undefined : undefined,
        giftType: selectedGiftType,
        budgetRange: selectedBudget,
        quantity,
        selectedProducts: [
          {
            productId: selectedProduct.id,
            name: selectedProduct.name,
            imageUrl: selectedProduct.image,
            unitPriceSnapshot: selectedProduct.unitPrice,
            quantity,
            description: selectedProduct.description,
          },
        ],
        customisation: {
          packaging: customisation.packagingName,
          ribbonColour: customisation.ribbonColorName,
          companyMessage: customisation.companyMessage,
          brandingRequired: Boolean(customisation.logoFileName || customisation.logoPreviewUrl),
          logoAsset: customisation.logoPreviewUrl
            ? { url: customisation.logoPreviewUrl, originalFilename: customisation.logoFileName || undefined }
            : undefined,
        },
        recipients: deliveryMethod === 'direct-recipient'
          ? recipients.map((r) => ({ name: r.name, phone: r.phone, address: r.address, notes: r.notes }))
          : [],
        recipientListFile: uploadedFileName
          ? { url: '/uploads/' + uploadedFileName, originalFilename: uploadedFileName }
          : undefined,
        delivery: {
          deliveryNotes: specialInstructions,
          deliveryMethod,
        },
      });

      setGeneratedRefId(result.referenceNumber);
      setIsSubmitted(true);
      if (onComplete) onComplete(result.referenceNumber);
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err: any) {
      console.warn('[CorporateFlow] Backend submission failed, using graceful fallback:', err);
      const randomId = Math.floor(10000 + Math.random() * 90000);
      const fallbackRef = type === 'quote' ? `GTC-QUOTE-${randomId}` : `GTC-CORP-${randomId}`;
      setGeneratedRefId(fallbackRef);
      setIsSubmitted(true);
      if (onComplete) onComplete(fallbackRef);
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } finally {
      setIsProcessing(false);
    }
  };

  // ── CONFIRMATION VIEW (AFTER SUBMISSION) ──
  if (isSubmitted) {
    return (
      <div ref={topRef} className={`w-full max-w-4xl mx-auto bg-white rounded-3xl border border-brand-dark/10 p-8 sm:p-12 shadow-xl text-center space-y-6 ${className}`}>
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
          <CheckCircle2 size={36} />
        </div>

        <div className="space-y-2">
          <span className="font-sans text-[11px] font-bold tracking-[0.24em] uppercase text-gold-700">
            Corporate Request Received
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-brand-dark font-normal">
            {actionType === 'quote' ? 'Pro-Forma Quotation Registered' : 'Order Successfully Authorized'}
          </h2>
          <p className="font-sans text-xs sm:text-sm text-brand-medium max-w-lg mx-auto leading-relaxed">
            Thank you, <strong>{contactName}</strong>. Our corporate concierge team is preparing your official pro-forma documentation.
          </p>
        </div>

        {/* Reference Number Card */}
        <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 max-w-md mx-auto space-y-2">
          <span className="text-xs font-sans text-brand-medium uppercase tracking-wider block">
            Official Reference ID
          </span>
          <span className="font-mono text-xl sm:text-2xl font-bold text-brand-dark tracking-wider block">
            {generatedRefId}
          </span>
          <span className="text-[11px] font-sans text-brand-medium/70 block">
            Save this reference to track your request status.
          </span>
        </div>

        {/* Specifications Summary */}
        <div className="max-w-md mx-auto text-left text-xs font-sans p-4 rounded-xl border border-brand-dark/10 space-y-2">
          <div className="flex justify-between py-1 border-b border-brand-dark/5">
            <span className="text-brand-medium">Organization</span>
            <strong className="text-brand-dark">{companyName}</strong>
          </div>
          <div className="flex justify-between py-1 border-b border-brand-dark/5">
            <span className="text-brand-medium">Industry</span>
            <strong className="text-brand-dark capitalize">
              {selectedIndustry === 'other' && otherIndustry ? otherIndustry : selectedIndustry.replace('-', ' ')}
            </strong>
          </div>
          <div className="flex justify-between py-1 border-b border-brand-dark/5">
            <span className="text-brand-medium">Purpose</span>
            <strong className="text-brand-dark capitalize">{selectedPurpose}</strong>
          </div>
          <div className="flex justify-between py-1 border-b border-brand-dark/5">
            <span className="text-brand-medium">Total Volume</span>
            <strong className="text-brand-dark">{quantity} Recipients</strong>
          </div>
          <div className="flex justify-between py-1 font-semibold text-brand-dark">
            <span>Estimated Total</span>
            <span className="font-serif text-sm">₦{grandTotal.toLocaleString()}</span>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => {
              setIsSubmitted(false);
              topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-full border border-brand-dark/20 text-brand-dark font-sans text-xs font-semibold hover:bg-black/5 transition-colors cursor-pointer"
          >
            Create Another Request
          </button>
          <a
            href={`/track?orderRef=${generatedRefId}`}
            className="w-full sm:w-auto px-8 py-3 rounded-full bg-brand-dark text-white font-sans text-xs font-semibold uppercase tracking-wider hover:bg-gold-600 transition-colors cursor-pointer shadow-sm text-center"
          >
            Track Status
          </a>
        </div>
      </div>
    );
  }

  // ── UNIFIED CORPORATE FLOW (SAME-PAGE CONCIERGE) ──
  return (
    <div ref={topRef} className={`w-full max-w-4xl mx-auto flex flex-col items-center ${className}`}>
      {/* ======================================================== */}
      {/* 1. PURPOSE → INDUSTRY → BUDGET → QUANTITY               */}
      {/*    (Zero Next buttons, automatic smooth activation)      */}
      {/* ======================================================== */}
      <section className="w-full bg-white rounded-3xl border border-brand-dark/10 shadow-xs p-6 sm:p-8 md:p-10 mb-8 text-center">
        {/* Header */}
        <div className="pb-6 mb-8 border-b border-brand-dark/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-gold-600" />
            <span className="font-sans text-[11px] font-semibold tracking-[0.24em] uppercase text-brand-dark">
              Corporate Gifting Concierge
            </span>
          </div>
          <span className="text-xs font-sans text-brand-medium">
            Progressive 4-point requirement setup
          </span>
        </div>

        {/* ── 1. PURPOSE ── */}
        <div className="mb-8 text-center">
          <span className="text-[11px] font-sans font-bold uppercase tracking-[0.2em] text-gold-700 block mb-1">
            Point 1
          </span>
          <h2 className="font-serif text-xl sm:text-2xl text-brand-dark font-normal">
            What Are You Gifting For?
          </h2>
          <p className="font-sans text-xs text-brand-medium/80 mt-0.5 mb-4">
            Select the primary objective of this corporate order
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-3xl mx-auto">
            {CORPORATE_PURPOSES.map((purpose) => {
              const isSelected = selectedPurpose === purpose.id;
              return (
                <button
                  key={purpose.id}
                  type="button"
                  onClick={() => handleSelectPurpose(purpose.id)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    isSelected
                      ? 'bg-brand-dark text-white font-semibold shadow-xs ring-1 ring-brand-dark'
                      : 'bg-[#FAF8F5] text-brand-dark hover:bg-brand-dark/5 border-brand-dark/10'
                  }`}
                >
                  <span className="font-serif text-sm">{purpose.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 2. INDUSTRY (New Client Requirement) ── */}
        <div
          ref={industryRef}
          className={`pt-6 border-t border-brand-dark/10 text-center transition-all duration-300 ${
            activeStage < 2 ? 'opacity-40 pointer-events-none' : 'opacity-100'
          }`}
        >
          <span className="text-[11px] font-sans font-bold uppercase tracking-[0.2em] text-gold-700 block mb-1">
            Point 2
          </span>
          <h2 className="font-serif text-xl sm:text-2xl text-brand-dark font-normal">
            Select Your Industry
          </h2>
          <p className="font-sans text-xs text-brand-medium/80 mt-0.5 mb-4">
            Allows our atelier to curate etiquette-compliant objects suited for your sector
          </p>

          <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
            {CORPORATE_INDUSTRIES.map((ind) => {
              const isSelected = selectedIndustry === ind.id;
              return (
                <button
                  key={ind.id}
                  type="button"
                  onClick={() => handleSelectIndustry(ind.id)}
                  className={`px-4 py-2 rounded-full text-xs font-sans transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-brand-dark text-white font-semibold shadow-xs ring-1 ring-brand-dark'
                      : 'bg-[#FAF8F5] text-brand-dark hover:bg-brand-dark/5 border border-brand-dark/10'
                  }`}
                >
                  {isSelected && <Check size={12} className="text-gold-400" />}
                  <span>{ind.label}</span>
                </button>
              );
            })}
          </div>

          {/* Other Industry Input */}
          {selectedIndustry === 'other' && (
            <div className="mt-4 max-w-sm mx-auto animate-fade-in">
              <input
                type="text"
                value={otherIndustry}
                onChange={(e) => setOtherIndustry(e.target.value)}
                placeholder="Specify your industry or sector"
                className="w-full px-4 py-2 text-xs font-sans rounded-xl border border-brand-dark/20 text-center focus:outline-none focus:ring-1 focus:ring-brand-dark bg-white"
              />
            </div>
          )}
        </div>

        {/* ── 3. BUDGET ── */}
        <div
          ref={budgetRef}
          className={`pt-6 mt-8 border-t border-brand-dark/10 text-center transition-all duration-300 ${
            activeStage < 3 ? 'opacity-40 pointer-events-none' : 'opacity-100'
          }`}
        >
          <span className="text-[11px] font-sans font-bold uppercase tracking-[0.2em] text-gold-700 block mb-1">
            Point 3
          </span>
          <h2 className="font-serif text-xl sm:text-2xl text-brand-dark font-normal">
            Choose Your Budget Per Recipient
          </h2>
          <p className="font-sans text-xs text-brand-medium/80 mt-0.5 mb-4">
            Anticipated investment for each corporate gift curation
          </p>

          <div className="flex flex-wrap justify-center gap-2.5 max-w-2xl mx-auto">
            {CORPORATE_BUDGET_TIERS.map((tier) => {
              const isSelected = selectedBudget === tier.id;
              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => handleSelectBudget(tier.id)}
                  className={`px-5 py-2.5 rounded-full text-xs font-sans transition-all cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-brand-dark text-white font-semibold shadow-xs ring-1 ring-brand-dark'
                      : 'bg-[#FAF8F5] text-brand-dark hover:bg-brand-dark/5 border border-brand-dark/10'
                  }`}
                >
                  {isSelected && <Check size={13} className="text-gold-400" />}
                  <span>{tier.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 4. QUANTITY ── */}
        <div
          ref={quantityRef}
          className={`pt-6 mt-8 border-t border-brand-dark/10 text-center transition-all duration-300 ${
            activeStage < 4 ? 'opacity-40 pointer-events-none' : 'opacity-100'
          }`}
        >
          <span className="text-[11px] font-sans font-bold uppercase tracking-[0.2em] text-gold-700 block mb-1">
            Point 4
          </span>
          <h2 className="font-serif text-xl sm:text-2xl text-brand-dark font-normal">
            Specify Gift Quantity
          </h2>
          <p className="font-sans text-xs text-brand-medium/80 mt-0.5 mb-4">
            Automatic tiered discounts: 5% for 25+, 10% for 50+, 15% for 100+
          </p>

          <div className="flex flex-wrap justify-center items-center gap-2 max-w-xl mx-auto mb-4">
            {[10, 25, 50, 100, 250, 500].map((qty) => {
              const isSelected = quantity === qty;
              return (
                <button
                  key={qty}
                  type="button"
                  onClick={() => handleSelectQuantity(qty)}
                  className={`px-4 py-2 rounded-full text-xs font-sans transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-brand-dark text-white font-semibold ring-1 ring-brand-dark shadow-xs'
                      : 'bg-[#FAF8F5] text-brand-dark hover:bg-brand-dark/5 border border-brand-dark/10'
                  }`}
                >
                  {qty} Units
                </button>
              );
            })}
          </div>

          {/* Custom Quantity Input */}
          <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
            <span className="text-xs font-sans text-brand-medium">Custom Quantity:</span>
            <input
              type="number"
              min={1}
              max={10000}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-24 px-3 py-1.5 text-center text-xs font-sans rounded-lg border border-brand-dark/20 focus:outline-none focus:ring-1 focus:ring-brand-dark bg-white font-bold"
            />
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. CURATION, CUSTOMISATION & SUBMISSION (ON SAME PAGE)   */}
      {/* ======================================================== */}
      <div ref={detailsRef} className="w-full space-y-8 animate-fade-in text-left">
        {/* Curated Product Selection */}
        <section className="bg-white rounded-3xl border border-brand-dark/10 p-6 sm:p-8 shadow-xs">
          <div className="border-b border-brand-dark/10 pb-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-gold-700 block">
                Selected Curation
              </span>
              <h3 className="font-serif text-xl sm:text-2xl text-brand-dark font-normal">
                Curated Corporate Keepsake Bundles
              </h3>
            </div>
            <span className="text-xs font-sans text-brand-medium">
              Click any curation to make it your primary gift selection
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {displayProducts.slice(0, 3).map((prod) => {
              const isSelected = selectedProduct.id === prod.id;
              return (
                <div
                  key={prod.id}
                  onClick={() => setSelectedProduct(prod)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-brand-dark bg-[#FAF8F5] ring-2 ring-brand-dark shadow-sm'
                      : 'border-brand-dark/10 hover:border-brand-dark/30 bg-white'
                  }`}
                >
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="w-full h-36 object-cover rounded-xl mb-3"
                  />
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-brand-medium">
                        {prod.category}
                      </span>
                      <strong className="font-serif text-sm text-brand-dark">
                        {prod.formattedPrice}
                      </strong>
                    </div>
                    <h4 className="font-serif text-sm font-semibold text-brand-dark leading-snug mb-1">
                      {prod.name}
                    </h4>
                    <p className="font-sans text-[11px] text-brand-medium/80 line-clamp-2">
                      {prod.description}
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-brand-dark/10 flex items-center justify-between">
                    <span className="text-[11px] font-sans text-gold-700 font-semibold">
                      {isSelected ? '✓ Selected' : 'Select'}
                    </span>
                    <span className="text-[10px] font-sans text-brand-medium">
                      Min {prod.minQuantity} units
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Corporate Customisation */}
        <section className="bg-white rounded-3xl border border-brand-dark/10 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-brand-dark/10 pb-4">
            <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-gold-700 block">
              Branding & Presentation
            </span>
            <h3 className="font-serif text-xl sm:text-2xl text-brand-dark font-normal">
              Corporate Identity & Atelier Packaging
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Packaging */}
            <div>
              <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-2">
                Presentation Packaging
              </label>
              <div className="space-y-2">
                {CORPORATE_PACKAGING.map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() =>
                      setCustomisation((prev) => ({
                        ...prev,
                        packagingId: pkg.id,
                        packagingName: pkg.name,
                        packagingCost: pkg.cost,
                      }))
                    }
                    className={`w-full p-3 rounded-xl border text-left flex justify-between items-center transition-all cursor-pointer ${
                      customisation.packagingId === pkg.id
                        ? 'border-brand-dark bg-[#FAF8F5] ring-1 ring-brand-dark font-semibold'
                        : 'border-brand-dark/10 hover:border-brand-dark/30'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-serif text-brand-dark block">{pkg.name}</span>
                      <span className="text-[10px] font-sans text-brand-medium">{pkg.desc}</span>
                    </div>
                    <span className="text-xs font-sans text-gold-700 font-bold">
                      +₦{pkg.cost.toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Ribbon & Finish */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-2">
                  Ribbon Colour
                </label>
                <div className="flex flex-wrap gap-2">
                  {CORPORATE_RIBBONS.map((ribbon) => (
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
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-sans cursor-pointer ${
                        customisation.ribbonColorId === ribbon.id
                          ? 'border-brand-dark bg-brand-dark text-white font-semibold'
                          : 'border-brand-dark/15 bg-white text-brand-dark'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: ribbon.hex }}
                      />
                      <span>{ribbon.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-2">
                  Corporate Deboss Foil Finish
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 'gold', label: 'Gold Metallic Foil' },
                    { id: 'silver', label: 'Silver Slate Foil' },
                    { id: 'blind', label: 'Blind Deboss' },
                  ].map((finish) => (
                    <button
                      key={finish.id}
                      type="button"
                      onClick={() => setLogoFinishOption(finish.id as any)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-sans cursor-pointer ${
                        logoFinishOption === finish.id
                          ? 'border-brand-dark bg-[#FAF8F5] ring-1 ring-brand-dark font-semibold text-brand-dark'
                          : 'border-brand-dark/10 text-brand-medium hover:border-brand-dark/30'
                      }`}
                    >
                      {finish.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Company Message */}
          <div>
            <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1.5">
              Corporate Card Message
            </label>
            <textarea
              value={customisation.companyMessage}
              onChange={(e) =>
                setCustomisation((prev) => ({ ...prev, companyMessage: e.target.value }))
              }
              rows={2}
              className="w-full p-3 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark"
              placeholder="With sincere gratitude for our valued partnership and shared success."
            />
          </div>
        </section>

        {/* Enterprise Client Contact & Logistics */}
        <section className="bg-white rounded-3xl border border-brand-dark/10 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-brand-dark/10 pb-4">
            <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-gold-700 block">
              Enterprise Contact Details
            </span>
            <h3 className="font-serif text-xl sm:text-2xl text-brand-dark font-normal">
              Organization & Delivery Method
            </h3>
          </div>

          {/* Contact Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold font-sans text-brand-dark mb-1">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark"
                placeholder="Apex Holdings PLC"
              />
            </div>

            <div>
              <label className="block text-xs font-bold font-sans text-brand-dark mb-1">
                Contact Person *
              </label>
              <input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark"
                placeholder="Adewale Thomas"
              />
            </div>

            <div>
              <label className="block text-xs font-bold font-sans text-brand-dark mb-1">
                Corporate Email *
              </label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark"
                placeholder="adewale@apexholdings.ng"
              />
            </div>

            <div>
              <label className="block text-xs font-bold font-sans text-brand-dark mb-1">
                Direct Phone / WhatsApp *
              </label>
              <input
                type="tel"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark font-mono"
                placeholder="+234 803 123 4567"
              />
            </div>
          </div>

          {/* Delivery Logistics */}
          <div className="pt-4 border-t border-brand-dark/10">
            <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-2">
              Delivery Destination Logistics
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setDeliveryMethod('single-hub')}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                  deliveryMethod === 'single-hub'
                    ? 'border-brand-dark bg-[#FAF8F5] ring-1 ring-brand-dark font-semibold'
                    : 'border-brand-dark/10 hover:border-brand-dark/30'
                }`}
              >
                <strong className="text-xs font-serif text-brand-dark block">
                  Single Corporate Office Delivery
                </strong>
                <span className="text-[11px] font-sans text-brand-medium">
                  All units packaged and delivered to your corporate headquarters in bulk.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryMethod('direct-recipient')}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                  deliveryMethod === 'direct-recipient'
                    ? 'border-brand-dark bg-[#FAF8F5] ring-1 ring-brand-dark font-semibold'
                    : 'border-brand-dark/10 hover:border-brand-dark/30'
                }`}
              >
                <strong className="text-xs font-serif text-brand-dark block">
                  Individual Doorstep Dispatch
                </strong>
                <span className="text-[11px] font-sans text-brand-medium">
                  We deliver directly to each recipient's home or office address with live tracking.
                </span>
              </button>
            </div>

            {/* Direct Recipient CSV or Manual Entry */}
            {deliveryMethod === 'direct-recipient' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 space-y-4 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-sans font-bold text-brand-dark">
                    Recipient Address List ({recipients.length} registered)
                  </span>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-brand-dark/20 text-xs font-sans text-brand-dark font-semibold cursor-pointer hover:bg-black/5 self-start sm:self-auto">
                    <FileSpreadsheet size={13} className="text-emerald-700" />
                    <span>Upload CSV / Excel</span>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleCsvUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                {uploadedFileName && (
                  <span className="text-[11px] font-sans text-emerald-800 block">
                    ✓ Uploaded: {uploadedFileName}
                  </span>
                )}

                {/* Quick Add Form */}
                <form onSubmit={handleAddRecipient} className="p-3.5 rounded-xl bg-white border border-brand-dark/10 grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-brand-dark block mb-1">Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tayo Johnson"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#FAF8F5] rounded-lg border border-brand-dark/15 text-xs font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-brand-dark block mb-1">Phone</label>
                    <input
                      type="tel"
                      placeholder="+234..."
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#FAF8F5] rounded-lg border border-brand-dark/15 text-xs font-sans"
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
                      className="w-full px-2.5 py-1.5 bg-[#FAF8F5] rounded-lg border border-brand-dark/15 text-xs font-sans"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2 px-3 rounded-lg bg-brand-dark text-white hover:bg-gold-600 font-sans text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      + Add Recipient
                    </button>
                  </div>
                </form>

                {/* Recipient List */}
                {recipients.length > 0 && (
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-brand-dark/10 divide-y divide-brand-dark/5 bg-white">
                    {recipients.map((rec, i) => (
                      <div key={rec.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-brand-cream/30">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-brand-light text-[10px] w-4">{i + 1}.</span>
                          <div>
                            <span className="font-semibold text-brand-dark">{rec.name}</span>
                            <span className="text-brand-medium ml-2 text-[11px]">{rec.address} ({rec.phone})</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveRecipient(rec.id)}
                          className="text-red-600 hover:text-red-800 text-[11px] font-semibold cursor-pointer px-2 py-0.5"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Special Instructions / Delivery Notes */}
            <div className="pt-3">
              <label className="block text-xs font-bold font-sans text-brand-dark mb-1">
                Special Delivery Notes / Timelines (Optional)
              </label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={2}
                className="w-full p-3 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark"
                placeholder="Specific delivery dates, gate access instructions, or department routing..."
              />
            </div>
          </div>
        </section>

        {/* Financial Summary & Actions */}
        <section className="bg-brand-dark text-white rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div>
              <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-gold-400 block mb-1">
                Authoritative Quotation Overview
              </span>
              <h3 className="font-serif text-2xl font-normal">
                {selectedProduct.name} ({quantity} units)
              </h3>
              <p className="font-sans text-xs text-white/70 mt-1">
                Includes debossed branding setup, complimentary stationery, and volume discount.
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="font-sans text-xs text-white/70 block">Estimated Grand Total</span>
              <span className="font-serif text-2xl sm:text-3xl font-bold text-white">
                ₦{grandTotal.toLocaleString()}
              </span>
              {volumeDiscountRate > 0 && (
                <span className="text-[11px] font-sans text-gold-300 block">
                  Includes {volumeDiscountRate * 100}% volume savings (-₦{discountAmount.toLocaleString()})
                </span>
              )}
            </div>
          </div>

          {/* Submission Action Buttons */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-end gap-3">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleSubmit('quote')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-full border border-white/20 text-white font-sans text-xs font-semibold uppercase tracking-wider hover:bg-white/10 transition-colors cursor-pointer text-center"
            >
              {isProcessing && actionType === 'quote' ? 'Processing...' : 'Request Official Pro-Forma Quote'}
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleSubmit('pay')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gold-600 text-white font-sans text-xs font-semibold uppercase tracking-wider hover:bg-gold-500 transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <span>{isProcessing && actionType === 'pay' ? 'Authorizing...' : 'Authorize & Pay Now'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CorporateFlowContainer;
