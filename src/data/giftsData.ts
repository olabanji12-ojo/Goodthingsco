/**
 * Gifts Data & Taxonomy — Good Things Co.
 *
 * Core catalog supporting the 3-Stage Shopping Journey:
 * Stage 1: Occasion -> Recipient (with progressive disclosure) -> Budget Filter
 * Stage 2: Product Selection & Personalisation (Packaging, Ribbon, Message, Monogram)
 * Stage 3: Delivery Details & Order Confirmation / Tracking
 */

// Asset imports from existing sections
import birthdayImg from '../assets/section4/birthday.png';
import celebrationImg from '../assets/section4/celebration.png';
import appreciationImg from '../assets/section4/appreciation.png';
import coperateImg from '../assets/section4/coperate.png';
import herImg from '../assets/section4/her.png';
import himImg from '../assets/section4/him.png';
import bagImg from '../assets/section3/bag.png';
import watchImg from '../assets/section3/wristwatch.png';
import necklaceImg from '../assets/section3/necklace.png';
import bottleImg from '../assets/section3/bottle1.png';
import penImg from '../assets/section3/pen.png';
import ringImg from '../assets/section3/ring.png';
import frame1Img from '../assets/section2/Frame 1.png';
import frame2Img from '../assets/section2/Frame 2.png';
import frame3Img from '../assets/section2/Frame 3 (1).png';
import frame4Img from '../assets/section2/Frame 4.png';
import frame5Img from '../assets/section2/Frame 5 (1).png';
import frame6Img from '../assets/section2/Frame 6.png';
import frame9Img from '../assets/section2/Frame 9.png';

export type OccasionId =
  | 'birthday'
  | 'thank-you'
  | 'congratulations'
  | 'just-because'
  | 'christmas'
  | 'valentines'
  | 'easter'
  | 'mothers-day'
  | 'fathers-day'
  | 'new-year';

export type RecipientGroupId = 'her' | 'him' | 'family' | 'friend' | 'business' | 'self';

export interface GiftItem {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  formattedPrice: string;
  image: string;
  alt: string;
  occasions: OccasionId[];
  primaryRecipient: RecipientGroupId;
  subRecipients: string[];
  budgetTier: 'under-25k' | '25k-50k' | '50k-100k' | 'premium';
  description: string;
  included: string[];
  badge?: string;
}

export interface OccasionOption {
  id: OccasionId;
  label: string;
  tagline: string;
  category?: 'everyday' | 'seasonal';
}

export interface RecipientGroup {
  id: RecipientGroupId;
  label: string;
  hasSuboptions: boolean;
  suboptions?: { id: string; label: string }[];
}

export interface BudgetOption {
  id: 'under-25k' | '25k-50k' | '50k-100k' | 'premium';
  label: string;
  maxPrice: number;
  minPrice: number;
}

export interface PackagingOption {
  id: string;
  name: string;
  description: string;
  price: number;
  badge?: string;
}

export interface RibbonColorOption {
  id: string;
  name: string;
  hex: string;
}

// ── 1. Occasions ──
export const OCCASIONS: OccasionOption[] = [
  // Everyday Milestones
  { id: 'birthday', label: 'Birthday', tagline: 'Celebratory keepsakes & joyful sets', category: 'everyday' },
  { id: 'thank-you', label: 'Thank You', tagline: 'Heartfelt gestures of genuine gratitude', category: 'everyday' },
  { id: 'congratulations', label: 'Congratulations', tagline: 'Honoring proud achievements & milestones', category: 'everyday' },
  { id: 'just-because', label: 'Just Because', tagline: 'Spontaneous tokens of care & love', category: 'everyday' },

  // Seasonal Celebrations (Client Specification)
  { id: 'christmas', label: 'Christmas', tagline: 'Festive hampers, seasonal botanicals & holiday warmth', category: 'seasonal' },
  { id: 'valentines', label: "Valentine's", tagline: 'Romantic keepsakes & tokens of timeless affection', category: 'seasonal' },
  { id: 'easter', label: 'Easter', tagline: 'Springtime confections, renewal & joyful gathering', category: 'seasonal' },
  { id: 'mothers-day', label: "Mother's Day", tagline: 'Heartfelt gratitude & bespoke pampering for mums', category: 'seasonal' },
  { id: 'fathers-day', label: "Father's Day", tagline: 'Refined accessories & thoughtful tokens for dads', category: 'seasonal' },
  { id: 'new-year', label: 'New Year', tagline: 'Fresh starts, celebratory toasts & inspiring horizons', category: 'seasonal' },
];

// ── 2. Recipients with Progressive Disclosure ──
export const RECIPIENTS: RecipientGroup[] = [
  { id: 'her', label: 'Her', hasSuboptions: false },
  { id: 'him', label: 'Him', hasSuboptions: false },
  {
    id: 'family',
    label: 'Family',
    hasSuboptions: true,
    suboptions: [
      { id: 'mum', label: 'Mum' },
      { id: 'dad', label: 'Dad' },
      { id: 'wife', label: 'Wife' },
      { id: 'husband', label: 'Husband' },
      { id: 'sister', label: 'Sister' },
      { id: 'brother', label: 'Brother' },
      { id: 'daughter', label: 'Daughter' },
      { id: 'son', label: 'Son' },
      { id: 'grandparent', label: 'Grandparent' },
      { id: 'aunt', label: 'Aunt' },
      { id: 'uncle', label: 'Uncle' },
      { id: 'cousin', label: 'Cousin' },
    ],
  },
  { id: 'friend', label: 'Friend', hasSuboptions: false },
  {
    id: 'business',
    label: 'Business',
    hasSuboptions: true,
    suboptions: [
      { id: 'colleague', label: 'Colleague' },
      { id: 'boss', label: 'Boss' },
      { id: 'client', label: 'Client' },
      { id: 'partner', label: 'Business Partner' },
      { id: 'employee', label: 'Employee' },
      { id: 'team', label: 'Team' },
    ],
  },
  { id: 'self', label: 'Shopping for Self', hasSuboptions: false },
];

// ── 3. Budget Tiers ──
export const BUDGET_TIERS: BudgetOption[] = [
  { id: 'under-25k', label: 'Under ₦25,000', minPrice: 0, maxPrice: 25000 },
  { id: '25k-50k', label: '₦25,000 – ₦50,000', minPrice: 25000, maxPrice: 50000 },
  { id: '50k-100k', label: '₦50,000 – ₦100,000', minPrice: 50000, maxPrice: 100000 },
  { id: 'premium', label: '₦100,000+', minPrice: 100000, maxPrice: 9999999 },
];

// ── 4. Packaging Types ──
export const PACKAGING_OPTIONS: PackagingOption[] = [
  {
    id: 'gift-box',
    name: 'Signature Gift Box',
    description: 'Sturdy debossed ivory box with golden interior lining',
    price: 3500,
    badge: 'Most Popular',
  },
  {
    id: 'gift-bag',
    name: 'Textured Linen Bag',
    description: 'Heavy natural cotton linen bag with hand-tied twill handles',
    price: 2500,
  },
  {
    id: 'wooden-box',
    name: 'Artisan Wooden Crate',
    description: 'Handcrafted solid cedar keepsake box with sliding lid',
    price: 7500,
    badge: 'Luxury',
  },
  {
    id: 'pouch',
    name: 'Silk Keepsake Pouch',
    description: 'Soft drawstring satin pouch for jewelry & daily objects',
    price: 1500,
  },
];

// ── 5. Ribbon Colors ──
export const RIBBON_COLORS: RibbonColorOption[] = [
  { id: 'gold', name: 'Champagne Gold', hex: '#C89D5C' },
  { id: 'ivory', name: 'Warm Ivory', hex: '#F5F0E8' },
  { id: 'olive', name: 'Forest Olive', hex: '#3F4634' },
  { id: 'navy', name: 'Midnight Navy', hex: '#1C2638' },
  { id: 'terracotta', name: 'Earthy Terracotta', hex: '#B86548' },
];

// ── 6. Curated Gift Catalog ──
export const GIFTS_CATALOG: GiftItem[] = [
  {
    id: 'gtc-01',
    title: 'The Solstice Botanical & Tea Set',
    subtitle: 'Ceramic Ritual Bundle',
    price: 22500,
    formattedPrice: '₦22,500',
    image: frame1Img,
    alt: 'Handcrafted ceramic tea cup and artisanal herbal blend',
    occasions: ['birthday', 'thank-you', 'just-because', 'mothers-day', 'christmas', 'easter'],
    primaryRecipient: 'her',
    subRecipients: ['mum', 'sister', 'wife', 'aunt', 'friend', 'self'],
    budgetTier: 'under-25k',
    description: 'A comforting morning ritual set featuring a stoneware tea cup, matching saucer, and wild mountain herbal tea.',
    included: ['Stoneware Cup & Saucer', 'Loose Leaf Tea Tin (80g)', 'Brass Tea Spoon', 'Botanical Note'],
    badge: 'Bestseller',
  },
  {
    id: 'gtc-02',
    title: 'Heritage Writing & Leather Journal',
    subtitle: 'Executive Desk Essential',
    price: 24000,
    formattedPrice: '₦24,000',
    image: penImg,
    alt: 'Linen covered notebook and solid brass pen',
    occasions: ['congratulations', 'thank-you', 'birthday', 'fathers-day', 'new-year'],
    primaryRecipient: 'him',
    subRecipients: ['dad', 'brother', 'husband', 'colleague', 'boss', 'self'],
    budgetTier: 'under-25k',
    description: 'Fine Smyth-sewn archival notebook bound in raw linen, paired with a weighted brass rollerball pen.',
    included: ['A5 Linen Journal', 'Solid Brass Rollerball Pen', 'Leather Bookmark Tag', 'Ink Cartridge Refills'],
  },
  {
    id: 'gtc-03',
    title: 'Warm Hearth Scented Tin Duo',
    subtitle: 'Hand-Poured Soy Candles',
    price: 18500,
    formattedPrice: '₦18,500',
    image: frame4Img,
    alt: 'Pair of artisanal travel candles with amber jars',
    occasions: ['thank-you', 'just-because', 'birthday', 'christmas', 'valentines', 'new-year'],
    primaryRecipient: 'friend',
    subRecipients: ['sister', 'colleague', 'mum', 'cousin', 'self'],
    budgetTier: 'under-25k',
    description: 'Two pure soy wax travel candles fragranced with cedarwood, amber smoke, and sweet bergamot.',
    included: ['120g Amber Cedar Candle', '120g Bergamot Fig Candle', 'Matchbox in Linen Pouch'],
  },
  {
    id: 'gtc-04',
    title: 'The Artisanal Morning Ceramic Suite',
    subtitle: 'Tableware for Two',
    price: 38000,
    formattedPrice: '₦38,000',
    image: frame2Img,
    alt: 'Paired ceramic mugs and serving tray',
    occasions: ['congratulations', 'birthday', 'thank-you', 'easter', 'mothers-day', 'new-year'],
    primaryRecipient: 'family',
    subRecipients: ['mum', 'dad', 'wife', 'husband', 'daughter', 'son', 'self'],
    budgetTier: '25k-50k',
    description: 'Hand-thrown stoneware breakfast mugs with speckled clay glaze, accompanied by an organic linen tray cloth.',
    included: ['2 Stoneware Coffee Mugs', 'Organic Belgian Linen Runner', 'Artisan Espresso Bean Tin'],
    badge: 'Curator Pick',
  },
  {
    id: 'gtc-05',
    title: 'Botanical Fragrance & Silk Scarf',
    subtitle: 'Personal Luxury Pair',
    price: 45000,
    formattedPrice: '₦45,000',
    image: herImg,
    alt: 'Silk scarf with delicate perfume bottle',
    occasions: ['birthday', 'thank-you', 'congratulations', 'valentines', 'mothers-day'],
    primaryRecipient: 'her',
    subRecipients: ['wife', 'mum', 'sister', 'daughter', 'friend', 'self'],
    budgetTier: '25k-50k',
    description: 'A 100% pure Mulberry silk square scarf featuring an original botanical watercolor print and French blossom fragrance.',
    included: ['Mulberry Silk Scarf (70x70cm)', '50ml Eau de Parfum Bottle', 'Embossed Keepsake Box'],
  },
  {
    id: 'gtc-06',
    title: 'Executive Distilled Leather Folio',
    subtitle: 'Business & Office Suite',
    price: 48000,
    formattedPrice: '₦48,000',
    image: coperateImg,
    alt: 'Full grain leather document folio with brass snap',
    occasions: ['congratulations', 'thank-you', 'birthday', 'fathers-day', 'new-year'],
    primaryRecipient: 'business',
    subRecipients: ['client', 'boss', 'colleague', 'partner', 'employee', 'self'],
    budgetTier: '25k-50k',
    description: 'Full-grain pull-up leather portfolio designed to carry an iPad, stationery pad, and business cards.',
    included: ['A4 Leather Document Folio', 'Brass Pen Holder', 'Refillable Note Pad', 'Personalized Tag'],
  },
  {
    id: 'gtc-07',
    title: 'Solid Silver Signature Pendant',
    subtitle: 'Heirloom Keepsake',
    price: 72000,
    formattedPrice: '₦72,000',
    image: necklaceImg,
    alt: 'Delicate solid sterling silver necklace pendant',
    occasions: ['birthday', 'congratulations', 'just-because', 'valentines', 'mothers-day'],
    primaryRecipient: 'her',
    subRecipients: ['wife', 'daughter', 'sister', 'mum', 'self'],
    budgetTier: '50k-100k',
    description: 'Recycled 925 sterling silver chain with a hammered medallion pendant that can be custom engraved.',
    included: ['925 Sterling Silver Necklace', 'Velvet Storage Pouch', 'Jewelry Polishing Cloth', 'Certificate'],
    badge: 'Heirloom',
  },
  {
    id: 'gtc-08',
    title: 'Chronograph Precision Timepiece',
    subtitle: 'Classic Dress Watch',
    price: 85000,
    formattedPrice: '₦85,000',
    image: watchImg,
    alt: 'Minimalist dress watch with genuine leather strap',
    occasions: ['birthday', 'congratulations', 'fathers-day', 'valentines', 'new-year'],
    primaryRecipient: 'him',
    subRecipients: ['husband', 'dad', 'brother', 'son', 'partner', 'boss', 'self'],
    budgetTier: '50k-100k',
    description: 'Ultra-slim stainless steel case with sapphire crystal glass and interchangeable vegetable-tanned Italian leather strap.',
    included: ['Precision Quartz Watch', 'Genuine Leather Strap', 'Hardwood Case', '2-Year Warranty Card'],
  },
  {
    id: 'gtc-09',
    title: 'The Celebration Feast Hamper',
    subtitle: 'Gourmet Gathering Box',
    price: 68000,
    formattedPrice: '₦68,000',
    image: frame5Img,
    alt: 'Stacked gift hamper with fine artisan gourmet foods',
    occasions: ['congratulations', 'birthday', 'thank-you', 'christmas', 'easter', 'new-year'],
    primaryRecipient: 'family',
    subRecipients: ['mum', 'dad', 'grandparent', 'team', 'client', 'partner'],
    budgetTier: '50k-100k',
    description: 'A lavish family feast bundle packed with artisanal biscuits, raw honey with honeycomb, fine truffles, and festive preserves.',
    included: ['Artisanal Biscuit Box', 'Raw Wildflower Honeycomb Jar', 'Belgian Chocolate Truffles', 'Sparkling Botanical Elixir'],
  },
  {
    id: 'gtc-10',
    title: 'The Grand Bespoke Trunk',
    subtitle: 'Prestige Curator Hamper',
    price: 145000,
    formattedPrice: '₦145,000',
    image: celebrationImg,
    alt: 'Luxury wooden trunk filled with premium gifts',
    occasions: ['congratulations', 'birthday', 'thank-you', 'christmas', 'new-year'],
    primaryRecipient: 'business',
    subRecipients: ['client', 'boss', 'partner', 'team', 'husband', 'wife', 'self'],
    budgetTier: 'premium',
    description: 'A commanding handcrafted wooden trunk filled with top-tier leather pieces, fine tableware, and a celebration bottle.',
    included: ['Custom Stamped Wooden Trunk', 'Full-Grain Leather Pouch', 'Two Hand-Blown Crystal Glasses', 'Artisan Chocolate Box', 'Bespoke Monogram'],
    badge: 'Prestige',
  },
  {
    id: 'gtc-11',
    title: 'The Atelier Signature Leather Tote',
    subtitle: 'Crafted Vegetable Leather',
    price: 115000,
    formattedPrice: '₦115,000',
    image: bagImg,
    alt: 'Structured luxury leather shoulder bag',
    occasions: ['birthday', 'congratulations', 'mothers-day', 'valentines'],
    primaryRecipient: 'her',
    subRecipients: ['wife', 'mum', 'daughter', 'sister', 'self'],
    budgetTier: 'premium',
    description: 'Spacious everyday tote handcrafted from supple vegetable-tanned leather that develops a rich, unique patina over time.',
    included: ['Leather Carry Tote', 'Matching Zipper Pouch', 'Dust Bag', 'Leather Care Balm'],
  },
  {
    id: 'gtc-12',
    title: 'The Master Gentleman Collector Set',
    subtitle: 'Timepiece & Desk Suite',
    price: 135000,
    formattedPrice: '₦135,000',
    image: himImg,
    alt: 'Timepiece, leather cardholder and brass accessories',
    occasions: ['birthday', 'congratulations', 'fathers-day', 'new-year'],
    primaryRecipient: 'him',
    subRecipients: ['husband', 'dad', 'boss', 'partner', 'self'],
    budgetTier: 'premium',
    description: 'An executive suite including a timepiece, card case, fountain pen, and full-grain leather desk blotter.',
    included: ['Sapphire Glass Watch', 'Leather Cardholder', 'German Nib Fountain Pen', 'Handcrafted Cedar Box'],
  },
  {
    id: 'gtc-13',
    title: 'The Birthday Joy & Confection Hamper',
    subtitle: 'Celebration Bundle',
    price: 32000,
    formattedPrice: '₦32,000',
    image: birthdayImg,
    alt: 'Birthday celebration gift box with fine treats',
    occasions: ['birthday', 'easter', 'christmas'],
    primaryRecipient: 'friend',
    subRecipients: ['sister', 'brother', 'daughter', 'son', 'mum', 'dad', 'friend', 'self'],
    budgetTier: '25k-50k',
    description: 'A cheerful celebration package brimming with single-origin chocolates, scented votive, and celebration confetti.',
    included: ['Artisan Chocolate Box', 'Celebration Sparkler', 'Gold Foil Birthday Card', 'Scented Candle'],
    badge: 'Celebration',
  },
  {
    id: 'gtc-14',
    title: 'The Gracious Thanks & Tea Keepsake',
    subtitle: 'Appreciation Set',
    price: 28000,
    formattedPrice: '₦28,000',
    image: appreciationImg,
    alt: 'Thank you gift box with botanical tea and ceramic dish',
    occasions: ['thank-you', 'just-because', 'mothers-day', 'easter'],
    primaryRecipient: 'business',
    subRecipients: ['colleague', 'client', 'employee', 'team', 'boss', 'friend'],
    budgetTier: '25k-50k',
    description: 'An elegant expression of gratitude including organic herbal tea, raw clover honey, and a hand-carved honey dipper.',
    included: ['Artisanal Honey Jar', 'Ceramic Spoon Rest', 'Chamomile Tea Tin', 'Gratitude Note Card'],
  },
  {
    id: 'gtc-15',
    title: 'Botanical Sanctuary Bath & Scent Ritual',
    subtitle: 'Self-Care Fragrance Elixir',
    price: 36000,
    formattedPrice: '₦36,000',
    image: bottleImg,
    alt: 'Luxury botanical fragrance and bath oil bottle',
    occasions: ['just-because', 'birthday', 'thank-you', 'mothers-day', 'valentines'],
    primaryRecipient: 'her',
    subRecipients: ['wife', 'mum', 'sister', 'daughter', 'self'],
    budgetTier: '25k-50k',
    description: 'An indulgent bath and body ritual with botanical bath salts, cold-pressed almond oil, and cedarwood mist.',
    included: ['100ml Botanical Body Oil', 'Dead Sea Mineral Bath Salts', 'Linen Washcloth', 'Glass Dropper'],
  },
  {
    id: 'gtc-16',
    title: 'Hand-Hammered Silver Keepsake Ring',
    subtitle: 'Artisanal Band',
    price: 58000,
    formattedPrice: '₦58,000',
    image: ringImg,
    alt: 'Sterling silver band in velvet presentation box',
    occasions: ['birthday', 'congratulations', 'valentines', 'mothers-day'],
    primaryRecipient: 'her',
    subRecipients: ['wife', 'sister', 'daughter', 'mum', 'self'],
    budgetTier: '50k-100k',
    description: 'Subtle textured sterling silver ring crafted by hand, presented in a debossed velvet jewelry box.',
    included: ['925 Sterling Silver Ring', 'Velvet Ring Box', 'Polishing Cloth', 'Sizing Card'],
  },
  {
    id: 'gtc-17',
    title: 'Heirloom Woven Wool Blanket',
    subtitle: 'Family Hearth Comfort',
    price: 64000,
    formattedPrice: '₦64,000',
    image: frame3Img,
    alt: 'Textured woven wool throw blanket',
    occasions: ['congratulations', 'birthday', 'thank-you', 'christmas', 'new-year'],
    primaryRecipient: 'family',
    subRecipients: ['mum', 'dad', 'grandparent', 'sister', 'brother', 'self'],
    budgetTier: '50k-100k',
    description: 'Heavyweight merino wool throw blanket in natural cream and oat tones, finished with fringed edges.',
    included: ['Merino Wool Throw (130x180cm)', 'Cedar Moth Wardrobe Block', 'Storage Linen Bag'],
  },
  {
    id: 'gtc-18',
    title: 'Botanical Floral Keepsake Arrangement',
    subtitle: 'Dried Flower Ceramic Centerpiece',
    price: 42000,
    formattedPrice: '₦42,000',
    image: frame6Img,
    alt: 'Ceramic vase with everlasting dried floral bouquet',
    occasions: ['congratulations', 'thank-you', 'birthday', 'easter', 'mothers-day'],
    primaryRecipient: 'friend',
    subRecipients: ['colleague', 'mum', 'sister', 'wife', 'self'],
    budgetTier: '25k-50k',
    description: 'Everlasting dried wild floral bouquet hand-tied and arranged in a rustic sculptural stoneware vase.',
    included: ['Everlasting Botanical Bouquet', 'Hand-Crafted Clay Vase', 'Floral Care Card'],
  },
  {
    id: 'gtc-19',
    title: 'Bespoke Celebration Champagne & Flutes',
    subtitle: 'Milestone Couple Set',
    price: 125000,
    formattedPrice: '₦125,000',
    image: frame9Img,
    alt: 'Celebration gift box with mouth-blown flutes and accessories',
    occasions: ['congratulations', 'birthday', 'valentines', 'new-year', 'christmas'],
    primaryRecipient: 'family',
    subRecipients: ['wife', 'husband', 'partner', 'client', 'boss', 'self'],
    budgetTier: 'premium',
    description: 'Two mouth-blown crystal champagne flutes paired with artisan truffles and gold-plated bottle stopper in a presentation box.',
    included: ['2 Crystal Flutes', 'Gold Plated Stopper', 'Artisan Dark Truffle Box', 'Custom Keepsake Packaging'],
    badge: 'Luxury Milestone',
  },
];
