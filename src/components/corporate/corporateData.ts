import {
  CorporatePurpose,
  CorporateIndustry,
  CorporateGiftType,
  CorporateBudgetTier,
  CorporateGiftProduct,
} from './types';

// ── 1. Purposes ──
export const CORPORATE_PURPOSES: { id: CorporatePurpose; label: string; desc: string }[] = [
  { id: 'employee', label: 'Employee', desc: 'Performance milestones & tenure honors' },
  { id: 'client', label: 'Client', desc: 'Distinguished appreciation & relationship gifts' },
  { id: 'executive', label: 'Executive', desc: 'Board, C-Suite & VIP luxury keepsakes' },
  { id: 'event', label: 'Event / Conference', desc: 'Delegates, summits & retreat welcome sets' },
  { id: 'new-employee', label: 'New Employee', desc: 'Warm luxury onboarding packages' },
  { id: 'appreciation', label: 'Appreciation', desc: 'End-of-year & spontaneous gratitude' },
  { id: 'custom', label: 'Custom', desc: 'Tailored solutions designed with our atelier' },
];

// ── 1b. Industries ──
export const CORPORATE_INDUSTRIES: { id: CorporateIndustry; label: string; desc: string }[] = [
  { id: 'finance', label: 'Finance', desc: 'Banking, investments, insurance & fintech' },
  { id: 'technology', label: 'Technology', desc: 'Software, telecommunications & digital infrastructure' },
  { id: 'healthcare', label: 'Healthcare', desc: 'Medical practices, pharmaceuticals & wellness' },
  { id: 'legal', label: 'Legal', desc: 'Law firms, chambers & corporate counsel' },
  { id: 'consulting', label: 'Consulting', desc: 'Management, strategy, advisory & audit' },
  { id: 'education', label: 'Education', desc: 'Universities, academies & learning institutions' },
  { id: 'real-estate-building', label: 'Real Estate & Building', desc: 'Development, construction & architecture' },
  { id: 'hospitality', label: 'Hospitality', desc: 'Hotels, luxury resorts, dining & travel' },
  { id: 'government', label: 'Government', desc: 'Public sector, agencies & diplomatic missions' },
  { id: 'agriculture', label: 'Agriculture', desc: 'Agribusiness, processing & export' },
  { id: 'media-creative', label: 'Media & Creative', desc: 'Advertising, entertainment, design & PR' },
  { id: 'other', label: 'Other', desc: 'Specialized enterprise or bespoke sector' },
];

// ── 2. Gift Types ──
export const CORPORATE_GIFT_TYPES: { id: CorporateGiftType; label: string; desc: string }[] = [
  { id: 'choose-gift', label: 'Choose a Gift', desc: 'Pre-curated luxury bundles ready for your logo' },
  { id: 'build-own', label: 'Build Your Own Gift', desc: 'Select individual objects to build custom boxes' },
  { id: 'branded-merch', label: 'Branded Merchandise', desc: 'High-end functional objects debossed with your brand' },
];

// ── 3. Budget Tiers ──
export const CORPORATE_BUDGET_TIERS: { id: CorporateBudgetTier; label: string; range: string }[] = [
  { id: 'under-25k', label: 'Under ₦25,000', range: '₦18,000 – ₦25,000 per recipient' },
  { id: '25k-50k', label: '₦25,000 – ₦50,000', range: '₦25,000 – ₦50,000 per recipient' },
  { id: '50k-100k', label: '₦50,000 – ₦100,000', range: '₦50,000 – ₦100,000 per recipient' },
  { id: 'premium', label: '₦100,000+', range: '₦100,000+ luxury executive curations' },
];

// ── 4. Packaging Options ──
export const CORPORATE_PACKAGING = [
  {
    id: 'corp-box',
    name: 'Executive Debossed Box',
    desc: 'Heavyweight rigid matte box with custom gold/silver metallic foil logo',
    cost: 3500,
  },
  {
    id: 'wood-crate',
    name: 'Artisan Solid Cedar Crate',
    desc: 'Laser-engraved wooden keepsake box with slide lid and velvet bed',
    cost: 7500,
  },
  {
    id: 'eco-tote',
    name: 'Textured Linen & Canvas Tote',
    desc: 'Screen-printed 100% natural cotton canvas bag with twill handles',
    cost: 2500,
  },
];

// ── 5. Ribbon Colors ──
export const CORPORATE_RIBBONS = [
  { id: 'gold', name: 'Champagne Gold', hex: '#C89D5C' },
  { id: 'navy', name: 'Corporate Navy', hex: '#1C2638' },
  { id: 'olive', name: 'Forest Olive', hex: '#3F4634' },
  { id: 'silver', name: 'Silver Slate', hex: '#8C92AC' },
  { id: 'crimson', name: 'Deep Crimson', hex: '#87232B' },
];

// ── 6. Products Catalog ──
export const CORPORATE_PRODUCTS: CorporateGiftProduct[] = [];

// Sample Initial Corporate Recipients
export const SAMPLE_CORPORATE_RECIPIENTS = [
  { id: 'cr-1', name: 'Dr. Olabanji Balogun', phone: '+234 803 123 4567', address: '14 Victoria Island Blvd, Lagos' },
  { id: 'cr-2', name: 'Amara Adeyemi', phone: '+234 802 987 6543', address: 'Plot 28 Admiralty Way, Lekki Phase 1, Lagos' },
  { id: 'cr-3', name: 'Chukwuma Eze', phone: '+234 818 333 4455', address: '5 Maitama Crescent, Abuja' },
];
