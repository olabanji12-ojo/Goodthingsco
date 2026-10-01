import { CreationTypeOption } from './types';

export const CREATION_TYPE_OPTIONS: CreationTypeOption[] = [
  {
    id: 'custom-apparel',
    title: 'Custom Apparel',
    tagline: 'Tailored textiles & luxury wearables',
    description: 'High-thread organic cotton tees, linen shirts, cashmere sweaters, embroidered caps & tailored workwear.',
    examples: 'Heavyweight tees, embroidered caps, linen shirts, silk scarves',
    icon: '👕',
  },
  {
    id: 'custom-gift',
    title: 'Custom Gift',
    tagline: 'Artisanal gift sets tailored for an occasion',
    description: 'Curated objects blended into bespoke combinations with handwritten calligraphy and ribbon unboxing.',
    examples: 'VIP celebration boxes, milestone hampers, speaker delegate gifts',
    icon: '🎁',
  },
  {
    id: 'custom-packaging',
    title: 'Custom Packaging',
    tagline: 'Debossed rigid boxes, crates & linen totes',
    description: 'Bespoke presentation packaging constructed to your exact dimensions, finished with metallic foil and custom trays.',
    examples: 'Rigid sliding boxes, solid cedar crates, screenprinted tote bags',
    icon: '📦',
  },
  {
    id: 'custom-product',
    title: 'Custom Product',
    tagline: 'Original objects manufactured for your brand',
    description: 'Ceramic cups, leather stationery, desk accessories, thermal bottles and homeware made to custom specifications.',
    examples: 'Leather portfolios, double-walled drinkware, cast brass accents',
    icon: '✨',
  },
  {
    id: 'custom-merchandise',
    title: 'Custom Merchandise',
    tagline: 'Premium functional branded items',
    description: 'Refined branded merchandise that recipients cherish daily rather than discard.',
    examples: 'Weighted rollerball pens, archival notebooks, enamel pins, tech folios',
    icon: '🖋️',
  },
];

export const BUDGET_RANGES = [
  { id: 'under-50k', label: 'Under ₦50,000 / unit', desc: 'Ideal for team tokens & delegate favors' },
  { id: '50k-100k', label: '₦50,000 – ₦100,000 / unit', desc: 'Signature executive gifts & bespoke sets' },
  { id: '100k-250k', label: '₦100,000 – ₦250,000 / unit', desc: 'Luxury leather goods & flagship curations' },
  { id: '250k-plus', label: '₦250,000+ / unit', desc: 'Prestige artisan commissions & collector pieces' },
];

export const COMMON_PURPOSES = [
  'Corporate Milestone',
  'VIP Client Gift',
  'Brand Launch / PR Drop',
  'Executive Summit / Retreat',
  'Employee Recognition',
  'Private Celebration',
  'Retail Merchandise',
];

export const MATERIAL_PRESETS: Record<string, string[]> = {
  'custom-apparel': ['100% Organic Heavyweight Cotton (240 GSM)', 'Pure French Linen', 'Brushed Fleece Cotton', 'Fine Merino Wool / Cashmere', 'Silk Twill'],
  'custom-packaging': ['Rigid Matte Bookbinder Board (1200 GSM)', 'Solid Cedar / Walnut Hardwood', 'Natural Linen Canvas', 'Heavy Cotton Velvet', 'Recycled Kraft Stock'],
  'custom-gift': ['Full-Grain Pull-Up Leather & Ceramics', 'Hand-Blown Crystal & Solid Brass', 'Aromatic Botanicals & Linen', 'Artisan Hardwood & Metals'],
  'custom-product': ['Vegetable-Tanned Italian Leather', 'Cast Solid Brass', 'Double-Walled Borosilicate Glass', 'Glazed Stoneware Ceramic', 'Matte Anodized Aluminum'],
  'custom-merchandise': ['Weighted Anodized Aluminum', 'Vegan Saffiano Leather', 'Organic Twill Cotton', 'Enamel & Gilded Brass', 'Archival Smyth-Sewn Paper'],
};

export const BRANDING_OPTIONS = [
  'Metallic Gold Foil Stamping',
  'Metallic Silver Foil Stamping',
  'Blind Letterpress Deboss (Tone-on-tone)',
  'High-Precision Laser Engraving',
  'Silk-Screen Pigment Printing',
  'Woven Damask Label / Embroidered',
];
