import {
  CorporatePurpose,
  CorporateIndustry,
  CorporateGiftType,
  CorporateBudgetTier,
  CorporateGiftProduct,
} from './types';

// Direct asset imports for 100% reliable bundling
import coperateImg from '../../assets/section4/coperate.png';
import watchImg from '../../assets/section3/wristwatch.png';
import penImg from '../../assets/section3/pen.png';
import bagImg from '../../assets/section3/bag.png';
import celebrationImg from '../../assets/section4/celebration.png';
import frame5Img from '../../assets/section2/Frame 5 (1).png';
import frame4Img from '../../assets/section2/Frame 4.png';
import bottleImg from '../../assets/section3/bottle1.png';

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
export const CORPORATE_PRODUCTS: CorporateGiftProduct[] = [
  {
    id: 'corp-prod-01',
    name: 'The Executive Leather Folio & Cardholder',
    category: 'Leather & Desk',
    unitPrice: 38000,
    formattedPrice: '₦38,000',
    image: coperateImg,
    alt: 'Executive leather folio and business accessories',
    purposes: ['client', 'executive', 'employee', 'appreciation'],
    giftTypes: ['choose-gift', 'branded-merch'],
    budgetTier: '25k-50k',
    description: 'Pull-up genuine leather document portfolio and matching business card holder, finished with subtle metallic foil stamping.',
    includedItems: ['A4 Leather Document Folio', 'Matching Slim Cardholder', 'Solid Brass Rollerball Pen', 'Presentation Box'],
    minQuantity: 5,
    badge: 'Popular for Clients',
  },
  {
    id: 'corp-prod-02',
    name: 'The Day-One Welcome & Onboarding Kit',
    category: 'Onboarding Suite',
    unitPrice: 24000,
    formattedPrice: '₦24,000',
    image: penImg,
    alt: 'Onboarding notebook, brass pen, and thermal bottle',
    purposes: ['new-employee', 'employee', 'event'],
    giftTypes: ['choose-gift', 'branded-merch'],
    budgetTier: 'under-25k',
    description: 'An inspiring first day experience with an archival Smyth-sewn journal, weighted pen, and branded welcome card from leadership.',
    includedItems: ['Linen Hardcover Journal', 'Weighted Metal Ballpoint Pen', 'Welcome Letter Envelope', 'Organic Canvas Bag'],
    minQuantity: 10,
    badge: 'Top Onboarding Kit',
  },
  {
    id: 'corp-prod-03',
    name: 'The Conference & Summit Delegate Token',
    category: 'Event Favors',
    unitPrice: 22000,
    formattedPrice: '₦22,000',
    image: frame4Img,
    alt: 'Summit attendee gift bag with notebook and artisan snacks',
    purposes: ['event', 'appreciation'],
    giftTypes: ['choose-gift', 'branded-merch'],
    budgetTier: 'under-25k',
    description: 'A compact and elevated event package designed for keynote guests, VIP speakers, and conference delegates.',
    includedItems: ['A5 Softcover Conference Journal', 'Artisan Chocolate Tin', 'Custom Lapel Pin Badge', 'Heavyweight Paper Tote'],
    minQuantity: 15,
  },
  {
    id: 'corp-prod-04',
    name: 'The Team Milestone Feast & Treat Hamper',
    category: 'Gourmet Celebrations',
    unitPrice: 48000,
    formattedPrice: '₦48,000',
    image: frame5Img,
    alt: 'Celebratory food and drink hamper for corporate teams',
    purposes: ['employee', 'appreciation', 'custom'],
    giftTypes: ['choose-gift', 'build-own'],
    budgetTier: '25k-50k',
    description: 'Celebratory feast hamper brimming with artisanal shortbread biscuits, wildflower honeycomb, and single-origin dark chocolates.',
    includedItems: ['Artisanal Biscuit Box', 'Raw Honey with Dipper', 'Dark Chocolate Truffle Box', 'Celebration Sparklers'],
    minQuantity: 5,
    badge: 'Team Favorite',
  },
  {
    id: 'corp-prod-05',
    name: 'The Executive Chronometer Precision Crate',
    category: 'VIP Timepiece',
    unitPrice: 85000,
    formattedPrice: '₦85,000',
    image: watchImg,
    alt: 'Luxury minimalist wristwatch in wooden case',
    purposes: ['executive', 'client', 'employee'],
    giftTypes: ['choose-gift', 'branded-merch'],
    budgetTier: '50k-100k',
    description: 'Ultra-slim stainless steel dress timepiece featuring sapphire crystal and custom caseback company logo engraving.',
    includedItems: ['Sapphire Glass Watch', 'Vegetable-Tanned Leather Strap', 'Hardwood Presentation Case', 'Custom Caseback Inscription'],
    minQuantity: 3,
    badge: 'Executive Prestige',
  },
  {
    id: 'corp-prod-06',
    name: 'The Grand Bespoke Trunk for Partners',
    category: 'Prestige Curation',
    unitPrice: 145000,
    formattedPrice: '₦145,000',
    image: celebrationImg,
    alt: 'Master wooden corporate trunk with leather goods and crystal',
    purposes: ['executive', 'client', 'custom'],
    giftTypes: ['choose-gift', 'build-own'],
    budgetTier: 'premium',
    description: 'Our most commanding corporate gift: a laser-engraved cedar chest packed with fine crystal drinkware, leather goods, and celebration treats.',
    includedItems: ['Laser-Branded Cedar Chest', 'Hand-Blown Crystal Glasses', 'Full-Grain Leather Folio', 'Belgian Confectionery Box'],
    minQuantity: 2,
    badge: 'Flagship Luxury',
  },
  {
    id: 'corp-prod-07',
    name: 'The Artisan Leather Weekender Tote',
    category: 'Luggage & Carry',
    unitPrice: 115000,
    formattedPrice: '₦115,000',
    image: bagImg,
    alt: 'Full grain leather travel tote bag with debossed luggage tag',
    purposes: ['executive', 'client'],
    giftTypes: ['choose-gift', 'branded-merch'],
    budgetTier: 'premium',
    description: 'Full-grain pull-up leather weekender tote bag with custom debossed company luggage tag and interior monogram.',
    includedItems: ['Leather Weekender Bag', 'Custom Debossed Luggage Tag', 'Protective Dust Bag', 'Leather Balm Kit'],
    minQuantity: 2,
  },
  {
    id: 'corp-prod-08',
    name: 'The Mindful Wellness & Desk Elixir Set',
    category: 'Wellness & Living',
    unitPrice: 32000,
    formattedPrice: '₦32,000',
    image: bottleImg,
    alt: 'Desk wellness diffuser, herbal mist, and amber tumbler',
    purposes: ['employee', 'new-employee', 'appreciation'],
    giftTypes: ['choose-gift', 'build-own'],
    budgetTier: '25k-50k',
    description: 'A calming workplace wellness collection with an aromatic room mist, double-walled glass water tumbler, and grounding herbal tea.',
    includedItems: ['Double-Walled Glass Tumbler', 'Botanical Desk Mist (100ml)', 'Loose-Leaf Herbal Tea Tin', 'Bamboo Coaster'],
    minQuantity: 8,
  },
];

// Sample Initial Corporate Recipients
export const SAMPLE_CORPORATE_RECIPIENTS = [
  { id: 'cr-1', name: 'Dr. Olabanji Balogun', phone: '+234 803 123 4567', address: '14 Victoria Island Blvd, Lagos' },
  { id: 'cr-2', name: 'Amara Adeyemi', phone: '+234 802 987 6543', address: 'Plot 28 Admiralty Way, Lekki Phase 1, Lagos' },
  { id: 'cr-3', name: 'Chukwuma Eze', phone: '+234 818 333 4455', address: '5 Maitama Crescent, Abuja' },
];
