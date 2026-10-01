import React, { useState, useMemo, useRef } from 'react';
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

interface CorporateFlowContainerProps {
  className?: string;
  onComplete?: (orderRef: string) => void;
}

export const CorporateFlowContainer: React.FC<CorporateFlowContainerProps> = ({
  className = '',
  onComplete,
}) => {
  // Current active step (1 to 10 strictly in order)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // ── Step 1: Purpose ──
  const [selectedPurpose, setSelectedPurpose] = useState<CorporatePurpose>('client');

  // ── Step 2: Gift Type ──
  const [selectedGiftType, setSelectedGiftType] = useState<CorporateGiftType>('choose-gift');

  // ── Step 3: Budget ──
  const [selectedBudget, setSelectedBudget] = useState<CorporateBudgetTier>('25k-50k');

  // ── Step 4: Gift Selection ──
  const [selectedProduct, setSelectedProduct] = useState<CorporateGiftProduct>(CORPORATE_PRODUCTS[0]);

  // ── Step 5: Quantity ──
  const [quantity, setQuantity] = useState<number>(25);

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

  // Accordion state for Step 6 (Customise)
  const [openAccordion, setOpenAccordion] = useState<string>('logo');

  // ── Step 7: Add Recipients ──
  const [recipientsTab, setRecipientsTab] = useState<'individual' | 'bulk'>('individual');
  const [recipients, setRecipients] = useState<CorporateRecipient[]>(SAMPLE_CORPORATE_RECIPIENTS);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // ── Step 8 & 9: Corporate Billing / Contact ──
  const [contactName, setContactName] = useState('Olumide Sterling');
  const [contactEmail, setContactEmail] = useState('o.sterling@company.com');
  const [contactPhone, setContactPhone] = useState('+234 803 555 0192');
  const [companyName, setCompanyName] = useState('Sterling & Partners Capital');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // ── Step 9 & 10: Confirmation ──
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionType, setActionType] = useState<'pay' | 'quote'>('quote');
  const [generatedRefId, setGeneratedRefId] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to top of container when step changes
  const goToStep = (step: number) => {
    setCurrentStep(step);
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // ── Step 4 Filtered Gifts ──
  const filteredProducts = useMemo(() => {
    return CORPORATE_PRODUCTS.filter((prod) => {
      const matchPurpose = prod.purposes.includes(selectedPurpose);
      const matchBudget = prod.budgetTier === selectedBudget;
      return matchPurpose || matchBudget;
    });
  }, [selectedPurpose, selectedBudget]);

  const displayProducts = filteredProducts.length > 0 ? filteredProducts : CORPORATE_PRODUCTS;

  // ── Step 5 & 8 Financial Calculations ──
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
  const brandingFee = 25000; // Flat fee for corporate foil debossing setup
  const grandTotal = baseItemsTotal - discountAmount + packagingTotal + monogramTotal + brandingFee;

  // Step 7: Add individual recipient
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

  // Step 7: Mock CSV upload
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

  // Step 9: Action submit (Pay or Quote)
  const handleCompleteOrder = (type: 'pay' | 'quote') => {
    setActionType(type);
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const randomId = Math.floor(10000 + Math.random() * 90000);
      const ref = type === 'quote' ? `GTC-QUOTE-${randomId}` : `GTC-CORP-${randomId}`;
      setGeneratedRefId(ref);
      goToStep(10);
      if (onComplete) onComplete(ref);
    }, 850);
  };

  // Step meta definitions
  const stepTitles: Record<number, { title: string; subtitle: string }> = {
    1: { title: 'What Are You Gifting For?', subtitle: 'Select the primary recipient or corporate occasion' },
    2: { title: 'What Would You Like?', subtitle: 'Choose your desired gifting curation format' },
    3: { title: 'Choose Your Budget', subtitle: 'Select the anticipated investment per recipient' },
    4: { title: 'Choose Your Gift', subtitle: 'Curated corporate gifts tailored to your criteria' },
    5: { title: 'Choose Quantity', subtitle: 'Specify the number of gifts needed with volume pricing' },
    6: { title: 'Customise', subtitle: 'Personalise with corporate branding, packaging, and cards' },
    7: { title: 'Add Recipients', subtitle: 'Enter individual delivery details or upload a recipient list' },
    8: { title: 'Review & Approve', subtitle: 'Review all order specifications, branding, and cost breakdown' },
    9: { title: 'Pay or Request Quote', subtitle: 'Complete payment authorization or request an official quote' },
    10: { title: 'Order Confirmed', subtitle: 'Your corporate gifting order is registered and in production' },
  };

  return (
    <div
      ref={containerRef}
      className={`w-full max-w-4xl mx-auto bg-white rounded-3xl border border-brand-dark/10 shadow-xl overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* ── Top Header & Progress Bar ── */}
      <div className="bg-[#FAF8F5] border-b border-brand-dark/10 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-gold-600 animate-pulse" />
            <span className="font-sans text-[11px] font-semibold tracking-[0.24em] uppercase text-gold-600">
              Good Things Co. · Corporate Concierge
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-sans text-xs font-bold text-brand-dark">
              Step {currentStep} of 10
            </span>
            <span className="text-brand-light text-xs font-sans">
              ({Math.round((currentStep / 10) * 100)}%)
            </span>
          </div>
        </div>

        {/* Minimal Progress Bar */}
        <div className="w-full bg-brand-dark/10 h-1.5 rounded-full overflow-hidden mb-6">
          <div
            className="bg-brand-dark h-full transition-all duration-500 ease-out rounded-full"
            style={{ width: `${(currentStep / 10) * 100}%` }}
          />
        </div>

        {/* Current Step Heading */}
        <div className="text-left">
          <h2 className="font-serif text-2xl sm:text-3xl text-brand-dark font-normal tracking-tight">
            {stepTitles[currentStep]?.title}
          </h2>
          <p className="font-sans text-xs sm:text-sm text-brand-medium/80 mt-1">
            {stepTitles[currentStep]?.subtitle}
          </p>
        </div>
      </div>

      {/* ── Main Dynamic Flow Body: Only Active Step is Rendered ── */}
      <div className="p-6 sm:p-8 md:p-10 min-h-[380px] flex flex-col justify-between">
        {/* =========================================================
            STEP 1 — WHAT ARE YOU GIFTING FOR?
            ========================================================= */}
        {currentStep === 1 && (
          <div key="step-1" className="space-y-6 animate-fade-in">
            <p className="font-sans text-xs text-brand-medium">
              Select one option to help us tailor suitable curations for your recipients:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {CORPORATE_PURPOSES.map((purpose) => {
                const isSelected = selectedPurpose === purpose.id;
                return (
                  <button
                    key={purpose.id}
                    type="button"
                    onClick={() => setSelectedPurpose(purpose.id)}
                    className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-brand-dark text-brand-ivory border-brand-dark shadow-sm ring-1 ring-brand-dark'
                        : 'bg-[#FAF8F5] text-brand-dark border-brand-dark/10 hover:border-brand-dark/30 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-serif text-base font-medium">{purpose.label}</span>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs transition-colors ${
                          isSelected
                            ? 'border-gold-500 bg-gold-500 text-white'
                            : 'border-brand-dark/20 bg-white'
                        }`}
                      >
                        {isSelected ? '✓' : ''}
                      </div>
                    </div>
                    <span
                      className={`font-sans text-xs leading-relaxed ${
                        isSelected ? 'text-brand-ivory/80' : 'text-brand-medium/70'
                      }`}
                    >
                      {purpose.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 2 — WHAT WOULD YOU LIKE?
            ========================================================= */}
        {currentStep === 2 && (
          <div key="step-2" className="space-y-6 animate-fade-in">
            <p className="font-sans text-xs text-brand-medium">
              Choose the gifting structure that best fits your company's campaign:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {CORPORATE_GIFT_TYPES.map((type) => {
                const isSelected = selectedGiftType === type.id;
                return (
                  <div
                    key={type.id}
                    onClick={() => setSelectedGiftType(type.id)}
                    className={`p-6 rounded-2xl cursor-pointer border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-white border-brand-dark ring-2 ring-brand-dark shadow-md'
                        : 'bg-[#FAF8F5] border-brand-dark/10 hover:border-brand-dark/30 hover:bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xl">
                          {type.id === 'choose-gift' ? '🎁' : type.id === 'build-own' ? '✨' : '🖋️'}
                        </span>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${
                            isSelected
                              ? 'border-brand-dark bg-brand-dark text-white'
                              : 'border-brand-dark/20 bg-white'
                          }`}
                        >
                          {isSelected ? '✓' : ''}
                        </div>
                      </div>
                      <h3 className="font-serif text-lg font-medium text-brand-dark mb-2">
                        {type.label}
                      </h3>
                      <p className="font-sans text-xs text-brand-medium leading-relaxed">
                        {type.desc}
                      </p>
                    </div>

                    <div className="mt-6 pt-3 border-t border-brand-dark/10 text-[11px] font-sans font-semibold uppercase tracking-wider text-gold-600">
                      {isSelected ? 'Selected' : 'Select Option →'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 3 — CHOOSE YOUR BUDGET
            ========================================================= */}
        {currentStep === 3 && (
          <div key="step-3" className="space-y-6 animate-fade-in">
            <p className="font-sans text-xs text-brand-medium">
              Select your expected budget per recipient. All curations include presentation packaging:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CORPORATE_BUDGET_TIERS.map((tier) => {
                const isSelected = selectedBudget === tier.id;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setSelectedBudget(tier.id)}
                    className={`p-5 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-brand-dark text-brand-ivory border-brand-dark shadow-md ring-1 ring-brand-dark'
                        : 'bg-[#FAF8F5] text-brand-dark border-brand-dark/10 hover:border-brand-dark/30 hover:bg-white'
                    }`}
                  >
                    <div>
                      <span className="font-serif text-lg font-medium block mb-1">
                        {tier.label}
                      </span>
                      <span
                        className={`font-sans text-xs ${
                          isSelected ? 'text-brand-ivory/80' : 'text-brand-medium'
                        }`}
                      >
                        {tier.range}
                      </span>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs shrink-0 ${
                        isSelected
                          ? 'border-gold-500 bg-gold-500 text-white'
                          : 'border-brand-dark/20 bg-white'
                      }`}
                    >
                      {isSelected ? '✓' : ''}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 4 — CHOOSE YOUR GIFT
            ========================================================= */}
        {currentStep === 4 && (
          <div key="step-4" className="space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-brand-dark/10">
              <span className="font-sans text-xs font-semibold text-brand-dark">
                Showing gift curations matching: <strong className="text-gold-700 capitalize">{selectedPurpose}</strong> · <strong className="text-gold-700">{CORPORATE_BUDGET_TIERS.find(b => b.id === selectedBudget)?.label}</strong>
              </span>
              <span className="font-sans text-xs text-brand-medium">
                {displayProducts.length} options ready
              </span>
            </div>

            {/* Controlled internal scroll container */}
            <div className="max-h-[480px] overflow-y-auto pr-1 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {displayProducts.map((prod) => {
                  const isSelected = selectedProduct.id === prod.id;
                  return (
                    <div
                      key={prod.id}
                      onClick={() => setSelectedProduct(prod)}
                      className={`group rounded-2xl overflow-hidden cursor-pointer transition-all border flex flex-col justify-between ${
                        isSelected
                          ? 'bg-white border-brand-dark ring-2 ring-brand-dark shadow-md'
                          : 'bg-[#FAF8F5] border-brand-dark/10 hover:border-brand-dark/30 hover:bg-white'
                      }`}
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-brand-cream/80">
                        <img
                          src={prod.image}
                          alt={prod.alt}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        />
                        {prod.badge && (
                          <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-brand-dark text-white text-[9px] font-sans font-bold uppercase tracking-wider">
                            {prod.badge}
                          </span>
                        )}
                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-gold-600 text-white text-[10px] font-sans font-bold shadow-xs">
                            ✓ Selected
                          </div>
                        )}
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-sans font-semibold uppercase text-gold-600 block mb-0.5">
                            {prod.category}
                          </span>
                          <h4 className="font-serif text-base font-medium text-brand-dark mb-1">
                            {prod.name}
                          </h4>
                          <p className="font-sans text-xs text-brand-medium leading-relaxed mb-3 line-clamp-2">
                            {prod.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {prod.includedItems.slice(0, 3).map((item, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-brand-dark/5 rounded text-[10px] font-sans text-brand-dark/80"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-brand-dark/10 flex items-center justify-between">
                          <div>
                            <span className="font-serif text-base font-bold text-brand-dark">
                              {prod.formattedPrice}
                            </span>
                            <span className="text-[10px] font-sans text-brand-light block">
                              Min {prod.minQuantity} units
                            </span>
                          </div>
                          <button
                            type="button"
                            className={`px-3.5 py-1.5 rounded-lg font-sans text-xs font-semibold uppercase tracking-wider transition-colors ${
                              isSelected
                                ? 'bg-brand-dark text-white'
                                : 'bg-white border border-brand-dark/20 text-brand-dark group-hover:border-brand-dark'
                            }`}
                          >
                            {isSelected ? 'Selected' : 'Select'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 5 — CHOOSE QUANTITY
            ========================================================= */}
        {currentStep === 5 && (
          <div key="step-5" className="space-y-6 animate-fade-in">
            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10">
              <h3 className="font-serif text-xl text-brand-dark mb-1">
                How many gifts do you need?
              </h3>
              <p className="font-sans text-xs text-brand-medium mb-6">
                Specify your order volume. Corporate volume savings automatically apply above 25 units.
              </p>

              {/* Quantity Quick Presets */}
              <div className="flex flex-wrap gap-2.5 mb-6">
                {[10, 25, 50, 100, 250].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setQuantity(preset)}
                    className={`px-4 py-2.5 rounded-xl font-sans text-xs font-semibold transition-all border cursor-pointer ${
                      quantity === preset
                        ? 'bg-brand-dark text-brand-ivory border-brand-dark shadow-xs'
                        : 'bg-white text-brand-dark border-brand-dark/15 hover:border-brand-dark/30'
                    }`}
                  >
                    {preset} Gifts
                  </button>
                ))}
              </div>

              {/* Numeric Stepper Input */}
              <div className="flex items-center gap-4 mb-6">
                <span className="font-sans text-xs font-bold text-brand-dark uppercase tracking-wider">
                  Custom Quantity:
                </span>
                <div className="flex items-center border border-brand-dark/20 rounded-xl overflow-hidden bg-white shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(selectedProduct.minQuantity, prev - 5))}
                    className="px-4 py-2 text-base text-brand-dark hover:bg-black/5 transition-colors cursor-pointer"
                  >
                    –
                  </button>
                  <input
                    type="number"
                    min={selectedProduct.minQuantity}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(
                        Math.max(selectedProduct.minQuantity, parseInt(e.target.value) || selectedProduct.minQuantity)
                      )
                    }
                    className="w-20 text-center font-sans text-sm font-bold text-brand-dark outline-none py-2"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => prev + 5)}
                    className="px-4 py-2 text-base text-brand-dark hover:bg-black/5 transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs font-sans text-brand-light">
                  (Minimum order: {selectedProduct.minQuantity} units)
                </span>
              </div>

              {/* Volume Discount Callout */}
              <div className="p-4 rounded-xl bg-white border border-brand-dark/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className={`p-2 rounded-lg ${quantity >= 25 && quantity < 50 ? 'bg-gold-50 font-bold' : ''}`}>
                  <span className="font-sans text-xs text-brand-dark block">25+ Units</span>
                  <span className="font-sans text-xs text-gold-700 font-semibold">5% Savings</span>
                </div>
                <div className={`p-2 rounded-lg ${quantity >= 50 && quantity < 100 ? 'bg-gold-50 font-bold' : ''}`}>
                  <span className="font-sans text-xs text-brand-dark block">50+ Units</span>
                  <span className="font-sans text-xs text-gold-700 font-semibold">10% Savings</span>
                </div>
                <div className={`p-2 rounded-lg ${quantity >= 100 ? 'bg-gold-50 font-bold' : ''}`}>
                  <span className="font-sans text-xs text-brand-dark block">100+ Units</span>
                  <span className="font-sans text-xs text-gold-700 font-semibold">15% Savings</span>
                </div>
              </div>

              {/* Instant Calculation */}
              <div className="mt-6 pt-4 border-t border-brand-dark/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-sans text-brand-light block">Selected Item</span>
                  <span className="font-serif text-base text-brand-dark">
                    {selectedProduct.name} ({selectedProduct.formattedPrice} each)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-sans text-brand-light block">Items Subtotal</span>
                  <div className="flex items-baseline gap-2">
                    {discountAmount > 0 && (
                      <span className="text-xs text-green-700 font-sans font-semibold">
                        (–₦{discountAmount.toLocaleString()} saved)
                      </span>
                    )}
                    <span className="font-serif text-xl font-bold text-brand-dark">
                      ₦{(baseItemsTotal - discountAmount).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 6 — CUSTOMISE
            ========================================================= */}
        {currentStep === 6 && (
          <div key="step-6" className="space-y-4 animate-fade-in">
            <p className="font-sans text-xs text-brand-medium">
              Refine your corporate branding and unboxing details with clean progressive options:
            </p>

            {/* Accordion 1: Company Logo */}
            <div className="border border-brand-dark/10 rounded-2xl overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => setOpenAccordion(openAccordion === 'logo' ? '' : 'logo')}
                className="w-full p-4.5 bg-[#FAF8F5] flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-dark text-white text-xs flex items-center justify-center font-bold">
                    1
                  </span>
                  <div>
                    <h4 className="font-serif text-sm font-semibold text-brand-dark">Company Logo & Debossing</h4>
                    <span className="font-sans text-xs text-brand-medium">
                      {customisation.logoFileName ? `Attached: ${customisation.logoFileName}` : 'Upload vector logo for deboss plate'}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-sans text-brand-dark">{openAccordion === 'logo' ? '▲' : '▼'}</span>
              </button>

              {openAccordion === 'logo' && (
                <div className="p-5 border-t border-brand-dark/10 space-y-4 bg-white">
                  <div className="p-5 rounded-xl border-2 border-dashed border-brand-dark/20 text-center bg-[#FAF8F5]">
                    <input
                      type="file"
                      id="corp-flow-logo"
                      accept="image/*,.svg,.pdf,.eps"
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
                      className="hidden"
                    />
                    <label
                      htmlFor="corp-flow-logo"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-dark text-white font-sans text-xs font-semibold tracking-wider uppercase cursor-pointer hover:bg-gold-600 transition-colors"
                    >
                      <span>Attach Logo File</span>
                    </label>
                    <p className="font-sans text-xs text-brand-medium mt-2">
                      Attached: <strong>{customisation.logoFileName || 'company_vector_logo.svg'}</strong> (High-Res Vector or PNG)
                    </p>
                  </div>

                  {/* Deboss Foil Finish Selector */}
                  <div>
                    <label className="font-sans text-xs font-bold uppercase tracking-wider text-brand-dark block mb-2">
                      Debossing Finish
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'gold', label: 'Metallic Gold Foil' },
                        { id: 'silver', label: 'Metallic Silver Foil' },
                        { id: 'blind', label: 'Blind Letterpress Deboss' },
                      ].map((finish) => (
                        <button
                          key={finish.id}
                          type="button"
                          onClick={() => setLogoFinishOption(finish.id as any)}
                          className={`px-3.5 py-1.5 rounded-lg font-sans text-xs transition-all border ${
                            logoFinishOption === finish.id
                              ? 'bg-brand-dark text-white border-brand-dark font-semibold'
                              : 'bg-[#FAF8F5] text-brand-dark border-brand-dark/15 hover:border-brand-dark/30'
                          }`}
                        >
                          {finish.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 2: Choose Packaging */}
            <div className="border border-brand-dark/10 rounded-2xl overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => setOpenAccordion(openAccordion === 'packaging' ? '' : 'packaging')}
                className="w-full p-4.5 bg-[#FAF8F5] flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-dark text-white text-xs flex items-center justify-center font-bold">
                    2
                  </span>
                  <div>
                    <h4 className="font-serif text-sm font-semibold text-brand-dark">Packaging Finish</h4>
                    <span className="font-sans text-xs text-brand-medium">{customisation.packagingName}</span>
                  </div>
                </div>
                <span className="text-xs font-sans text-brand-dark">{openAccordion === 'packaging' ? '▲' : '▼'}</span>
              </button>

              {openAccordion === 'packaging' && (
                <div className="p-5 border-t border-brand-dark/10 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white">
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
                        className={`p-4 rounded-xl cursor-pointer border transition-all ${
                          isSelected
                            ? 'bg-white border-gold-600 ring-1 ring-gold-600 shadow-2xs'
                            : 'bg-[#FAF8F5] border-brand-dark/10 hover:border-brand-dark/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-serif text-xs font-bold text-brand-dark">{pkg.name}</span>
                          <span className="font-sans text-xs text-gold-700 font-semibold">+₦{pkg.cost.toLocaleString()}</span>
                        </div>
                        <p className="font-sans text-[11px] text-brand-medium/80 leading-snug">{pkg.desc}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Accordion 3: Ribbon Colour */}
            <div className="border border-brand-dark/10 rounded-2xl overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => setOpenAccordion(openAccordion === 'ribbon' ? '' : 'ribbon')}
                className="w-full p-4.5 bg-[#FAF8F5] flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-dark text-white text-xs flex items-center justify-center font-bold">
                    3
                  </span>
                  <div>
                    <h4 className="font-serif text-sm font-semibold text-brand-dark">Silk Ribbon Colour</h4>
                    <span className="font-sans text-xs text-brand-medium">{customisation.ribbonColorName}</span>
                  </div>
                </div>
                <span className="text-xs font-sans text-brand-dark">{openAccordion === 'ribbon' ? '▲' : '▼'}</span>
              </button>

              {openAccordion === 'ribbon' && (
                <div className="p-5 border-t border-brand-dark/10 flex flex-wrap gap-2.5 bg-white">
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
              )}
            </div>

            {/* Accordion 4: Company Message */}
            <div className="border border-brand-dark/10 rounded-2xl overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => setOpenAccordion(openAccordion === 'message' ? '' : 'message')}
                className="w-full p-4.5 bg-[#FAF8F5] flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-dark text-white text-xs flex items-center justify-center font-bold">
                    4
                  </span>
                  <div>
                    <h4 className="font-serif text-sm font-semibold text-brand-dark">Company Message Card</h4>
                    <span className="font-sans text-xs text-brand-medium">Calligraphed inside every individual gift</span>
                  </div>
                </div>
                <span className="text-xs font-sans text-brand-dark">{openAccordion === 'message' ? '▲' : '▼'}</span>
              </button>

              {openAccordion === 'message' && (
                <div className="p-5 border-t border-brand-dark/10 bg-white">
                  <textarea
                    rows={3}
                    value={customisation.companyMessage}
                    onChange={(e) => setCustomisation((prev) => ({ ...prev, companyMessage: e.target.value }))}
                    placeholder="Enter your custom company message..."
                    className="w-full p-3.5 rounded-xl border border-brand-dark/15 text-xs font-sans focus:outline-none focus:border-brand-dark"
                  />
                  <span className="text-[11px] font-sans text-brand-light block mt-1">
                    Will be printed on heavy archival cotton letterpress paper.
                  </span>
                </div>
              )}
            </div>

            {/* Accordion 5: Personalisation */}
            <div className="border border-brand-dark/10 rounded-2xl overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => setOpenAccordion(openAccordion === 'personalisation' ? '' : 'personalisation')}
                className="w-full p-4.5 bg-[#FAF8F5] flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-dark text-white text-xs flex items-center justify-center font-bold">
                    5
                  </span>
                  <div>
                    <h4 className="font-serif text-sm font-semibold text-brand-dark">Individual Personalisation</h4>
                    <span className="font-sans text-xs text-brand-medium">
                      {customisation.hasIndividualMonogram ? 'Enabled (+₦2,500/unit)' : 'Optional name laser engraving'}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-sans text-brand-dark">{openAccordion === 'personalisation' ? '▲' : '▼'}</span>
              </button>

              {openAccordion === 'personalisation' && (
                <div className="p-5 border-t border-brand-dark/10 bg-white flex items-center justify-between">
                  <div>
                    <h5 className="font-sans text-xs font-bold text-brand-dark">
                      Engrave Each Recipient's Full Name (+₦2,500 / gift)
                    </h5>
                    <p className="font-sans text-xs text-brand-medium">
                      Laser-engrave individual recipient initials or full names directly onto each item.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={customisation.hasIndividualMonogram}
                    onChange={(e) => setCustomisation((prev) => ({ ...prev, hasIndividualMonogram: e.target.checked }))}
                    className="w-5 h-5 rounded accent-brand-dark cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 7 — ADD RECIPIENTS
            ========================================================= */}
        {currentStep === 7 && (
          <div key="step-7" className="space-y-6 animate-fade-in">
            {/* Dual Tabs */}
            <div className="flex border-b border-brand-dark/10">
              <button
                type="button"
                onClick={() => setRecipientsTab('individual')}
                className={`py-3 px-5 font-sans text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  recipientsTab === 'individual'
                    ? 'border-brand-dark text-brand-dark'
                    : 'border-transparent text-brand-light hover:text-brand-dark'
                }`}
              >
                1. Individual Entry ({recipients.length})
              </button>
              <button
                type="button"
                onClick={() => setRecipientsTab('bulk')}
                className={`py-3 px-5 font-sans text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  recipientsTab === 'bulk'
                    ? 'border-brand-dark text-brand-dark'
                    : 'border-transparent text-brand-light hover:text-brand-dark'
                }`}
              >
                2. Bulk CSV / Excel Upload
              </button>
            </div>

            {recipientsTab === 'individual' ? (
              <div className="space-y-5">
                {/* Single Entry Form */}
                <form
                  onSubmit={handleAddRecipient}
                  className="p-5 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 grid grid-cols-1 sm:grid-cols-4 gap-3"
                >
                  <div>
                    <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-brand-dark block mb-1">
                      Recipient Name
                    </label>
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
                    <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-brand-dark block mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+234..."
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-brand-dark/15 text-xs font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-brand-dark block mb-1">
                      Delivery Address
                    </label>
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
                      + Add
                    </button>
                  </div>
                </form>

                {/* Recipient Table with controlled internal scroll */}
                <div className="max-h-[300px] overflow-y-auto border border-brand-dark/10 rounded-2xl">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-[#FAF8F5] border-b border-brand-dark/10 text-brand-light font-bold uppercase tracking-wider text-[10px] sticky top-0">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Name</th>
                        <th className="p-3">Phone</th>
                        <th className="p-3">Delivery Address</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-dark/5">
                      {recipients.map((rec, i) => (
                        <tr key={rec.id} className="hover:bg-brand-cream/30">
                          <td className="p-3 text-brand-light font-mono">{i + 1}</td>
                          <td className="p-3 font-semibold text-brand-dark">{rec.name}</td>
                          <td className="p-3 text-brand-medium">{rec.phone}</td>
                          <td className="p-3 text-brand-medium">{rec.address}</td>
                          <td className="p-3 text-right">
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
                <span className="text-3xl">📋</span>
                <h4 className="font-serif text-lg text-brand-dark">Upload Recipient Spreadsheet</h4>
                <p className="font-sans text-xs text-brand-medium max-w-md mx-auto leading-relaxed">
                  Support for CSV or Excel files formatted with columns: <strong>Name, Phone, Address</strong>.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <input
                    type="file"
                    id="flow-bulk-csv"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleCsvUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="flow-bulk-csv"
                    className="px-6 py-2.5 rounded-xl bg-brand-dark text-white hover:bg-gold-600 font-sans text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors shadow-2xs"
                  >
                    Select CSV / Excel File
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('Sample recipient template downloading...')}
                    className="px-4 py-2.5 rounded-xl bg-white border border-brand-dark/20 hover:border-brand-dark font-sans text-xs text-brand-dark font-medium transition-colors cursor-pointer"
                  >
                    Download Template
                  </button>
                </div>
                {uploadedFileName && (
                  <p className="text-xs font-sans text-green-700 font-semibold mt-2">
                    ✓ Uploaded & Parsed: {uploadedFileName} ({recipients.length} recipients active)
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            STEP 8 — REVIEW & APPROVE
            ========================================================= */}
        {currentStep === 8 && (
          <div key="step-8" className="space-y-6 animate-fade-in">
            <p className="font-sans text-xs text-brand-medium">
              Review your complete corporate order specifications. You can edit any parameter before proceeding:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Specifications Summary */}
              <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 space-y-4">
                <div className="flex items-center justify-between border-b border-brand-dark/10 pb-3">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-gold-600">
                    Gifting Specifications
                  </span>
                  <button
                    type="button"
                    onClick={() => goToStep(4)}
                    className="text-[11px] font-sans text-brand-dark underline font-semibold cursor-pointer"
                  >
                    Change Gift
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.alt}
                    className="w-16 h-16 object-cover rounded-xl border border-brand-dark/10 bg-white"
                  />
                  <div>
                    <h4 className="font-serif text-base text-brand-dark font-normal">{selectedProduct.name}</h4>
                    <span className="text-xs font-sans text-brand-medium">
                      {quantity} Units · {selectedProduct.formattedPrice} / unit
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-sans text-brand-medium pt-2">
                  <div className="flex justify-between">
                    <span>Purpose:</span>
                    <strong className="text-brand-dark uppercase">{selectedPurpose}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Branding / Logo:</span>
                    <strong className="text-brand-dark">{customisation.logoFileName || 'On file'} ({logoFinishOption} foil)</strong>
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
                  <div className="flex justify-between">
                    <span>Delivery:</span>
                    <strong className="text-green-700">White-Glove Doorstep Delivery</strong>
                  </div>
                </div>
              </div>

              {/* Right Column: Financial Breakdown */}
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
                    <span>Custom Packaging ({quantity} × ₦{customisation.packagingCost.toLocaleString()}):</span>
                    <span>₦{packagingTotal.toLocaleString()}</span>
                  </div>
                  {monogramTotal > 0 && (
                    <div className="flex justify-between">
                      <span>Laser Engraving ({quantity} units):</span>
                      <span>₦{monogramTotal.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Foil Branding Setup & Plate:</span>
                    <span>₦{brandingFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Doorstep Delivery:</span>
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
          </div>
        )}

        {/* =========================================================
            STEP 9 — PAY OR REQUEST QUOTE
            ========================================================= */}
        {currentStep === 9 && (
          <div key="step-9" className="space-y-6 animate-fade-in">
            <p className="font-sans text-xs text-brand-medium">
              Please enter your corporate contact details. You can authorize payment immediately or request an official preserved quote:
            </p>

            {/* Corporate Contact Fields */}
            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 space-y-4">
              <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-brand-dark block">
                Official Company Contact
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-brand-dark block mb-1">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-brand-dark/15 text-xs font-sans"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-brand-dark block mb-1">
                    Official Work Email
                  </label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-brand-dark/15 text-xs font-sans"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-brand-dark block mb-1">
                    Official Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-brand-dark/15 text-xs font-sans"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-brand-dark block mb-1">
                    Company Registered Legal Name
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-brand-dark/15 text-xs font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-brand-dark block mb-1">
                  Delivery Notes / PO Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. PO-2026-994, Deliver via security gate 2"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white rounded-xl border border-brand-dark/15 text-xs font-sans"
                />
              </div>
            </div>

            {/* Preserved Order Note */}
            <div className="p-4 rounded-xl bg-white border border-brand-dark/10 flex items-center justify-between text-xs font-sans text-brand-medium">
              <span>Order Configuration: <strong>{quantity} × {selectedProduct.name}</strong></span>
              <span className="font-serif font-bold text-brand-dark text-base">₦{grandTotal.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 10 — ORDER CONFIRMED
            ========================================================= */}
        {currentStep === 10 && (
          <div key="step-10" className="space-y-8 animate-fade-in text-left">
            {/* Status Announcement Card */}
            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 font-sans text-xs font-semibold mb-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span>{actionType === 'quote' ? 'Official Pro-Forma Quote Issued' : 'Corporate Order Confirmed & Paid'}</span>
                </div>
                <h3 className="font-serif text-2xl text-brand-dark font-normal">
                  Reference: #{generatedRefId}
                </h3>
                <p className="font-sans text-xs text-brand-medium mt-1">
                  Issued to <strong className="text-brand-dark">{companyName}</strong> ({contactEmail}). All selections are preserved.
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-sans text-brand-light block">Order Value</span>
                <span className="font-serif text-2xl text-gold-700 font-bold">
                  ₦{grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* ── 4-Stage Fulfillment Order Progress ── */}
            <div className="p-6 rounded-2xl bg-white border border-brand-dark/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-600 block">
                  Fulfillment Status Tracker
                </span>
                <span className="text-xs font-sans text-green-700 font-semibold">
                  Status: In Production
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'prod', label: '1. Production', desc: 'Debossing logo & curation', active: true, done: true },
                  { id: 'pack', label: '2. Packaging', desc: 'Hand-tied ribbon & boxing', active: true, done: false },
                  { id: 'deliv', label: '3. Delivery', desc: 'Direct-to-recipient dispatch', active: false, done: false },
                  { id: 'done', label: '4. Delivered', desc: 'Fulfillment receipt signed', active: false, done: false },
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

            {/* Actions for Step 10 */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-brand-dark/10">
              <button
                type="button"
                onClick={() => {
                  alert(`Downloading summary for reference #${generatedRefId}...`);
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-brand-dark/20 text-brand-dark hover:border-brand-dark font-sans text-xs font-semibold tracking-wider uppercase transition-colors"
              >
                📥 Download Summary Document
              </button>

              <button
                type="button"
                onClick={() => goToStep(1)}
                className="w-full sm:w-auto px-8 py-3.5 bg-brand-dark text-white hover:bg-gold-600 font-sans text-xs font-semibold tracking-wider uppercase rounded-xl transition-all shadow-md cursor-pointer"
              >
                Start Another Corporate Order →
              </button>
            </div>
          </div>
        )}

        {/* ── Persistent Bottom Navigation Controls (Steps 1 to 9) ── */}
        {currentStep < 10 && (
          <div className="pt-6 mt-6 border-t border-brand-dark/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Back Button */}
            <div>
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => goToStep(currentStep - 1)}
                  className="font-sans text-xs font-semibold uppercase tracking-wider text-brand-dark hover:text-gold-600 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>← Back</span>
                </button>
              ) : (
                <span className="text-xs font-sans text-brand-light italic">
                  Step 1 of 10
                </span>
              )}
            </div>

            {/* Step 9 Dual Action Buttons vs Regular Continue Button */}
            {currentStep === 9 ? (
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleCompleteOrder('quote')}
                  className="w-full sm:w-auto px-7 py-3.5 bg-white text-brand-dark hover:bg-gold-50 border border-brand-dark/20 font-sans text-xs font-semibold tracking-wider uppercase rounded-xl transition-all shadow-2xs cursor-pointer"
                >
                  {isProcessing && actionType === 'quote' ? 'Preserving...' : 'Request Official Quote'}
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleCompleteOrder('pay')}
                  className="w-full sm:w-auto px-8 py-3.5 bg-brand-dark hover:bg-gold-600 text-white font-sans text-xs font-semibold tracking-widest uppercase rounded-xl transition-all shadow-md cursor-pointer"
                >
                  {isProcessing && actionType === 'pay' ? 'Authorizing...' : 'Pay Now & Authorize →'}
                </button>
              </div>
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

export default CorporateFlowContainer;
