import {
  TeaserProduct,
  ShopCategory,
  ShopProduct,
  GiftFilterItem,
  SouvenirPackage,
  CreateService,
} from './types';

// Asset imports from existing project assets
import bagImg from '../../assets/section3/bag.png';
import wristwatchImg from '../../assets/section3/wristwatch.png';
import eyeglassesImg from '../../assets/section3/eyeglasses.png';
import necklaceImg from '../../assets/section3/necklace.png';
import bottleImg from '../../assets/section3/bottle1.png';
import footwareImg from '../../assets/section3/footware.png';
import penImg from '../../assets/section3/pen.png';
import ringImg from '../../assets/section3/ring.png';
import trouserImg from '../../assets/section3/Trouser.png';
import hatImg from '../../assets/section3/hat.png';

import birthdayImg from '../../assets/section4/birthday.png';
import appreciationImg from '../../assets/section4/appreciation.png';
import celebrationImg from '../../assets/section4/celebration.png';
import herImg from '../../assets/section4/her.png';
import himImg from '../../assets/section4/him.png';
import corporateImg from '../../assets/section4/coperate.png';

import beforeImg from '../../assets/section5/packaging-before.png';
import processImg from '../../assets/section5/process.png';
import afterImg from '../../assets/section5/after.png';

/**
 * Sneak-Peek Teaser Products shown right in Room 01 (Hero Bottom Fold)
 */
export const TEASER_PRODUCTS: TeaserProduct[] = [
  {
    id: 'teaser-1',
    name: 'Precision Timepiece',
    category: 'Accessories',
    price: '£145',
    badge: 'Bestseller',
    image: wristwatchImg,
    description: 'Subtle minimal dial with vegetable-tanned Italian leather band.',
  },
  {
    id: 'teaser-2',
    name: 'Handcrafted Fountain Pen',
    category: 'Stationery',
    price: '£68',
    badge: 'Artisan',
    image: penImg,
    description: 'Turned solid brass barrel designed for lifetime journaling.',
  },
  {
    id: 'teaser-3',
    name: 'Heirloom Botanical Pendant',
    category: 'Gifts',
    price: '£88',
    badge: 'Curated',
    image: necklaceImg,
    description: 'Cast recycled gold vermeil with subtle organic texture.',
  },
  {
    id: 'teaser-4',
    name: 'Artisanal Botanical Fragrance',
    category: 'Treats',
    price: '£54',
    badge: 'New',
    image: bottleImg,
    description: 'Cedarwood, dried fig, and sun-warmed bergamot notes.',
  },
];

/**
 * Room 02: SHOP — "For Me" (All 7 Categories)
 */
export const SHOP_CATEGORIES: ShopCategory[] = [
  { id: 'gifts', name: 'Gifts', description: 'Curated luxury tokens & celebration sets', itemCount: '24 items' },
  { id: 'souvenirs', name: 'Souvenirs', description: 'Artisanal keepsakes & memorable tokens', itemCount: '18 items' },
  { id: 'home', name: 'Home', description: 'Sensory living, ceramic vessels & comfort', itemCount: '32 items' },
  { id: 'fashion', name: 'Fashion', description: 'Tailored everyday linens & wearable craft', itemCount: '20 items' },
  { id: 'stationery', name: 'Stationery', description: 'Fine pens, bound journals & desk heirlooms', itemCount: '16 items' },
  { id: 'accessories', name: 'Accessories', description: 'Fine jewelry, eyewear & precision timepieces', itemCount: '28 items' },
  { id: 'treats', name: 'Treats', description: 'Artisan botanicals, tea blends & confectionery', itemCount: '15 items' },
];

export const SHOP_PRODUCTS: ShopProduct[] = [
  // Gifts
  { id: 'prod-g1', categoryId: 'gifts', name: 'Signature Vermeil Pendant', subtitle: 'Jewelry & Pendants', price: '£88', image: necklaceImg, tag: 'Bestseller' },
  { id: 'prod-g2', categoryId: 'gifts', name: 'Sculptural Ring Band', subtitle: 'Rings & Bands', price: '£72', image: ringImg },
  { id: 'prod-g3', categoryId: 'gifts', name: 'Curated Milestone Box', subtitle: 'Everyday Keepsakes', price: '£110', image: celebrationImg, tag: 'Signature' },

  // Souvenirs
  { id: 'prod-sv1', categoryId: 'souvenirs', name: 'Commemorative Brass Pen', subtitle: 'Keepsake Edition', price: '£58', image: penImg },
  { id: 'prod-sv2', categoryId: 'souvenirs', name: 'Botanical Memorial Vial', subtitle: 'Sensory Living', price: '£42', image: bottleImg },
  { id: 'prod-sv3', categoryId: 'souvenirs', name: 'Monogrammed Leather Sleeve', subtitle: 'Bespoke Keepsake', price: '£48', image: bagImg },

  // Home
  { id: 'prod-h1', categoryId: 'home', name: 'Cedarwood Atmosphere Mist', subtitle: 'Botanical Living', price: '£38', image: bottleImg, tag: 'Handmade' },
  { id: 'prod-h2', categoryId: 'home', name: 'Handcrafted Desk Vessel', subtitle: 'Ceramics & Brass', price: '£52', image: appreciationImg },
  { id: 'prod-h3', categoryId: 'home', name: 'Linen Throw Blanket', subtitle: 'Natural Fibers', price: '£95', image: trouserImg },

  // Fashion
  { id: 'prod-f1', categoryId: 'fashion', name: 'Tailored Everyday Linens', subtitle: 'Garments', price: '£130', image: trouserImg, tag: 'Organic' },
  { id: 'prod-f2', categoryId: 'fashion', name: 'Artisan Handcrafted Footwear', subtitle: 'Crafted Steps', price: '£185', image: footwareImg },
  { id: 'prod-f3', categoryId: 'fashion', name: 'Structured Linen Hat', subtitle: 'Headwear', price: '£64', image: hatImg },

  // Stationery
  { id: 'prod-s1', categoryId: 'stationery', name: 'Solid Brass Rollerball Pen', subtitle: 'Writing Tools', price: '£68', image: penImg, tag: 'Lifetime Craft' },
  { id: 'prod-s2', categoryId: 'stationery', name: 'Vegetable-Tanned Journal Sleeve', subtitle: 'Leathercraft', price: '£56', image: bagImg },
  { id: 'prod-s3', categoryId: 'stationery', name: 'Architectural Paperweight', subtitle: 'Studio Objects', price: '£34', image: ringImg },

  // Accessories
  { id: 'prod-a1', categoryId: 'accessories', name: 'Minimal Field Timepiece', subtitle: 'Precision Watches', price: '£165', image: wristwatchImg, tag: 'Limited' },
  { id: 'prod-a2', categoryId: 'accessories', name: 'Acetate Keyhole Eyewear', subtitle: 'Optics & Frames', price: '£140', image: eyeglassesImg },
  { id: 'prod-a3', categoryId: 'accessories', name: 'Everyday Leather Saddle Bag', subtitle: 'Carry Essentials', price: '£195', image: bagImg },

  // Treats
  { id: 'prod-t1', categoryId: 'treats', name: 'Botanical Amber Perfume Extract', subtitle: 'Sensory Elixir', price: '£62', image: bottleImg, tag: 'Pure Extract' },
  { id: 'prod-t2', categoryId: 'treats', name: 'Organic Single-Estate Tea Tin', subtitle: 'Slow Living', price: '£26', image: birthdayImg },
  { id: 'prod-t3', categoryId: 'treats', name: 'Artisan Hazelnut Pralines', subtitle: 'Handmade Treats', price: '£24', image: appreciationImg },
];

/**
 * Room 03: GIFTS — "For Someone"
 * 3 Lenses: Occasion, Recipient, Corporate
 */
export const GIFT_FILTERS: GiftFilterItem[] = [
  // Occasion
  {
    id: 'occ-birthday',
    lens: 'occasion',
    label: 'Birthday',
    title: 'Birthday Celebrations',
    subtitle: 'Mark another year with something cherished',
    description: 'Thoughtful birthday keepsakes, bespoke unwrapping, and elevated everyday luxury.',
    image: birthdayImg,
    priceRange: 'From £45',
    items: ['Hand-poured candle', 'Signature timepiece', 'Monogram card'],
  },
  {
    id: 'occ-congrats',
    lens: 'occasion',
    label: 'Congratulations',
    title: 'Milestones & Achievements',
    subtitle: 'Celebrating great leaps with enduring elegance',
    description: 'Commemorative pen collections, celebratory vessels, and timeless desktop tokens.',
    image: celebrationImg,
    priceRange: 'From £60',
    items: ['Solid brass pen', 'Celebration tea set', 'Custom embossed box'],
  },
  {
    id: 'occ-appreciation',
    lens: 'occasion',
    label: 'Appreciation',
    title: 'Gifts of Gratitude',
    subtitle: 'Warm thankfulness expressed with considered beauty',
    description: 'Calming sensory botanicals, linen accents, and tokens that say "thank you" deeply.',
    image: appreciationImg,
    priceRange: 'From £38',
    items: ['Sensory room mist', 'Artisan honey set', 'Hand-stitched pouch'],
  },
  {
    id: 'occ-celebrations',
    lens: 'occasion',
    label: 'Celebrations',
    title: 'Gatherings & Joy',
    subtitle: 'Festive tokens for life’s grand moments',
    description: 'Heirloom jewelry and handcrafted tabletop accessories made for shared memories.',
    image: celebrationImg,
    priceRange: 'From £75',
    items: ['Vermeil pendant', 'Linens set', 'Gold ribbon wrapping'],
  },
  {
    id: 'occ-just-because',
    lens: 'occasion',
    label: 'Just Because',
    title: 'Spontaneous Delights',
    subtitle: 'No milestone needed to brighten someone’s week',
    description: 'Little reminders of warmth, artisan treats, and tactile daily comforts.',
    image: bottleImg,
    priceRange: 'From £28',
    items: ['Botanical vial', 'Mini sketchbook', 'Artisan chocolate bar'],
  },

  // Recipient
  {
    id: 'rec-her',
    lens: 'recipient',
    label: 'For Her',
    title: 'Gifts for Her',
    subtitle: 'Refined heirlooms, jewelry & delicate living objects',
    description: 'Fine jewelry, organic botanicals, and bespoke living pieces tailored with grace.',
    image: herImg,
    priceRange: 'From £48',
    items: ['Organic pendant necklace', 'Cashmere-blend wrap', 'Bergamot perfume oil'],
  },
  {
    id: 'rec-him',
    lens: 'recipient',
    label: 'For Him',
    title: 'Gifts for Him',
    subtitle: 'Classic timepieces, leathercraft & understated utility',
    description: 'Understated leather accessories, precision pens, and minimalist daily objects.',
    image: himImg,
    priceRange: 'From £55',
    items: ['Field watch', 'Horween leather wallet', 'Turned brass pen'],
  },
  {
    id: 'rec-family',
    lens: 'recipient',
    label: 'Family',
    title: 'For the Whole Home',
    subtitle: 'Warm additions to shared hearth and living spaces',
    description: 'Ceramic tea sets, natural linen throws, and timeless pantry provisions.',
    image: appreciationImg,
    priceRange: 'From £65',
    items: ['Artisan ceramics', 'Heritage game set', 'Gourmet provisions'],
  },
  {
    id: 'rec-friends',
    lens: 'recipient',
    label: 'Friends',
    title: 'Tokens of Friendship',
    subtitle: 'Playful, thoughtful pieces full of character',
    description: 'Curated stationery bundles, celebratory treats, and meaningful shared keepsakes.',
    image: celebrationImg,
    priceRange: 'From £35',
    items: ['Curated treats tin', 'Journaling kit', 'Scented candle'],
  },
  {
    id: 'rec-colleagues',
    lens: 'recipient',
    label: 'Colleagues',
    title: 'Thoughtful Professional Tokens',
    subtitle: 'Polished gratitude for team members & mentors',
    description: 'Refined stationery, executive carry cases, and desktop craftsmanship.',
    image: penImg,
    priceRange: 'From £40',
    items: ['Brass desk ruler', 'Leather mouse mat', 'Coffee dripper'],
  },
  {
    id: 'rec-clients',
    lens: 'recipient',
    label: 'Clients',
    title: 'Executive Client Appreciation',
    subtitle: 'Discreet luxury that cements lasting relationships',
    description: 'Custom packaging with subtle monogramming and ultra-premium goods.',
    image: corporateImg,
    priceRange: 'From £85',
    items: ['Custom boxed hamper', 'Bespoke time object', 'Wax-sealed note'],
  },

  // Corporate
  {
    id: 'corp-gifts',
    lens: 'corporate',
    label: 'Corporate Gifts',
    title: 'Bespoke Corporate Suites',
    subtitle: 'Company milestone gifts that reflect true prestige',
    description: 'Complete unboxing suites customized with your brand identity and heirloom goods.',
    image: corporateImg,
    priceRange: 'Bespoke Tiers',
    items: ['Branded keepsake box', 'Artisan treats', 'Personalized card'],
  },
  {
    id: 'corp-client',
    lens: 'corporate',
    label: 'Client Gifts',
    title: 'VIP Client Care',
    subtitle: 'End-of-year and celebratory packages for valued partners',
    description: 'Curated assortments delivered with white-glove presentation and handwritten notes.',
    image: corporateImg,
    priceRange: 'Custom Volume',
    items: ['Hand-turned pen', 'Artisan leather folio', 'Fine fragrance'],
  },
  {
    id: 'corp-staff',
    lens: 'corporate',
    label: 'Staff Gifts',
    title: 'Employee Recognition & Onboarding',
    subtitle: 'Welcoming talent and rewarding exceptional dedication',
    description: 'Care packages that employees genuinely cherish and use everyday.',
    image: appreciationImg,
    priceRange: 'From £45/unit',
    items: ['Everyday carry bag', 'Insulated vessel', 'Wellness botanicals'],
  },
  {
    id: 'corp-events',
    lens: 'corporate',
    label: 'Events & Summits',
    title: 'Conference & Retreat Keepsakes',
    subtitle: 'Unforgettable gifts for retreats, summits, and symposiums',
    description: 'High-volume production with handcrafted elegance and punctual global delivery.',
    image: celebrationImg,
    priceRange: 'Tiered Pricing',
    items: ['Custom luggage tag', 'Retreat workbook', 'Aromatherapy balm'],
  },
];

/**
 * Room 04: SOUVENIRS — "For an Occasion/Event"
 * 4 Pillars: Weddings, Birthdays, Funerals, Celebrations/Events
 */
export const SOUVENIR_PACKAGES: SouvenirPackage[] = [
  {
    id: 'souv-weddings',
    event: 'weddings',
    title: 'Wedding Keepsakes & Guest Favors',
    subtitle: 'Heirlooms to commemorate eternal vows',
    description:
      'Delicate personalized ceramic dishes, monogrammed linen sachets, and etched botanical vials that guests will treasure for years.',
    features: ['Custom couple monogram', 'Choice of 12 silk ribbons', 'Eco-conscious packaging', 'Minimum 25 units'],
    startingPrice: 'From £8.50 / guest',
    image: celebrationImg,
  },
  {
    id: 'souv-birthdays',
    event: 'birthdays',
    title: 'Milestone Birthday Favors',
    subtitle: 'Marking 30th, 50th, or 80th years in signature style',
    description:
      'Customized keepsake boxes, pocket artisan spirits, bespoke confectionery, and embossed leather keyrings.',
    features: ['Custom year stamp', 'Artisanal sweet options', 'Personalized message card', 'Flexible minimums'],
    startingPrice: 'From £12.00 / guest',
    image: birthdayImg,
  },
  {
    id: 'souv-funerals',
    event: 'funerals',
    title: 'Memorial Keepsakes & Tribute Favors',
    subtitle: 'A gentle, reverent token of remembrance and gratitude',
    description:
      'Seed paper cards that bloom into wildflowers, comforting botanical balms, and handcrafted pocket comfort stones.',
    features: ['Wildflower seed paper', 'Reverent neutral palette', 'Prompt express delivery', 'Sensitive consultation'],
    startingPrice: 'From £6.50 / token',
    image: appreciationImg,
  },
  {
    id: 'souv-celebrations',
    event: 'celebrations',
    title: 'Gala & Milestone Event Favors',
    subtitle: 'Commemorating anniversaries, grand launches & reunions',
    description:
      'Substantial, memorable gifts that elevate your gathering and leave attendees with an enduring tangible souvenir.',
    features: ['Full brand integration', 'Custom rigid gift boxes', 'Volume tiered discounts', 'Global split-shipping'],
    startingPrice: 'From £14.00 / guest',
    image: corporateImg,
  },
];

/**
 * Room 05: CREATE — "Something Custom"
 * 5 Pillars: Custom Gifts, Custom Souvenirs, Custom Packaging, Corporate Orders, Event Orders
 */
export const CREATE_SERVICES: CreateService[] = [
  {
    id: 'srv-custom-gifts',
    title: 'Custom Gifts',
    subtitle: 'One-of-a-kind bespoke curations for individuals',
    description: 'Select custom objects, engraved details, and bespoke gift notes tailored for an unforgettable reveal.',
    badge: 'Individual & Small Batch',
    turnaround: '3–5 business days',
  },
  {
    id: 'srv-custom-souvenirs',
    title: 'Custom Souvenirs',
    subtitle: 'Event favors crafted to your precise motif',
    description: 'Collaborate with our studio to design keepsake items, custom color palettes, and artisan packaging.',
    badge: 'Events & Parties',
    turnaround: '2–3 weeks',
  },
  {
    id: 'srv-custom-packaging',
    title: 'Custom Packaging',
    subtitle: 'Bespoke rigid boxes, ribboning & wax seals',
    description: 'From tactile FSC-certified paper stock to custom hot-foil stamping and signature botanical sprigs.',
    badge: 'Packaging Studio',
    turnaround: '1–2 weeks',
  },
  {
    id: 'srv-corporate',
    title: 'Corporate Orders',
    subtitle: 'Scale gifting with executive luxury fidelity',
    description: 'Dedicated account manager, customized branded suites, batch addressing, and international logistics.',
    badge: 'B2B Enterprise',
    turnaround: 'Flexible timelines',
  },
  {
    id: 'srv-event-orders',
    title: 'Event Orders',
    subtitle: 'Weddings, retreats & private anniversary galas',
    description: 'Comprehensive gifting coordination from initial mood board through final venue doorstep delivery.',
    badge: 'Full Coordination',
    turnaround: '3–4 weeks prior',
  },
];

export const CREATE_ATELIER_STEPS = [
  {
    step: '01',
    name: 'The Starting Canvas',
    desc: 'Select raw materials, base forms, and signature box styles.',
    image: beforeImg,
  },
  {
    step: '02',
    name: 'Handcrafted Assembly',
    desc: 'Delicate monogramming, silk ribbon tying, and botanical accents.',
    image: processImg,
  },
  {
    step: '03',
    name: 'The Presentation Payoff',
    desc: 'Unboxing perfection ready to inspire moments of joy.',
    image: afterImg,
  },
];
