import { DiscoveryGroup, DiscoveryItem } from './types';

// Direct PNG asset imports for universal browser support & 100% reliable bundling
import birthdayImg from '../../../assets/section4/birthday.png';
import appreciationImg from '../../../assets/section4/appreciation.png';
import celebrationImg from '../../../assets/section4/celebration.png';
import herImg from '../../../assets/section4/her.png';
import himImg from '../../../assets/section4/him.png';
import corporateImg from '../../../assets/section4/coperate.png';

/**
 * Section 4 — Gift Discovery Data
 *
 * Organized across 3 intuitive shopping lenses:
 * 1. Who It’s For (Recipient)
 * 2. By Occasion
 * 3. By Feeling
 */
export const discoveryItems: DiscoveryItem[] = [
  // ── 1. Who It’s For ──
  {
    id: 'for-her',
    groupId: 'recipient',
    groupName: 'Who It’s For',
    label: 'For Her',
    title: 'Gifts for Her',
    subtitle: 'Refined heirlooms, jewelry & delicate living objects',
    description:
      'An inspired selection of fine jewelry, sensory fragrances, artisanal accessories, and thoughtful objects tailored for her.',
    image: herImg,
    href: '/gifts/for-her',
    ctaText: 'Explore Gifts for Her',
  },
  {
    id: 'for-him',
    groupId: 'recipient',
    groupName: 'Who It’s For',
    label: 'For Him',
    title: 'Gifts for Him',
    subtitle: 'Classic timepieces, leathercraft & understated goods',
    description:
      'Timeless leather goods, handcrafted pens, precision watches, and everyday essentials designed with enduring craft and utility.',
    image: himImg,
    href: '/gifts/for-him',
    ctaText: 'Explore Gifts for Him',
  },
  {
    id: 'corporate-gifts',
    groupId: 'recipient',
    groupName: 'Who It’s For',
    label: 'Corporate & Teams',
    title: 'Corporate & Bespoke Gifting',
    subtitle: 'Elevated client appreciation & team recognition',
    description:
      'Bespoke corporate gifting suites with custom branding, elegant unboxing, and premium curated objects that leave a lasting impression.',
    image: corporateImg,
    href: '/gifts/corporate',
    ctaText: 'Explore Corporate Gifting',
  },

  // ── 2. By Occasion ──
  {
    id: 'birthday',
    groupId: 'occasion',
    groupName: 'By Occasion',
    label: 'Birthday',
    title: 'Birthday Celebrations',
    subtitle: 'Mark another year with something cherished',
    description:
      'Carefully curated birthday keepsakes, artisan home pieces, and delightful gift sets designed to make their milestone feel truly special.',
    image: birthdayImg,
    href: '/gifts/birthday',
    ctaText: 'Explore Birthday Gifts',
  },
  {
    id: 'appreciation',
    groupId: 'occasion',
    groupName: 'By Occasion',
    label: 'Appreciation',
    title: 'Gifts of Appreciation',
    subtitle: 'Gratitude expressed with considered beauty',
    description:
      'Meaningful tokens of thanks, calming botanicals, and handcrafted everyday pieces that convey genuine gratitude in every detail.',
    image: appreciationImg,
    href: '/gifts/appreciation',
    ctaText: 'Explore Appreciation Gifts',
  },
  {
    id: 'celebration',
    groupId: 'occasion',
    groupName: 'By Occasion',
    label: 'Celebrations & Weddings',
    title: 'Milestones & Celebrations',
    subtitle: 'Festive pieces for life’s grand moments',
    description:
      'From weddings to anniversaries and housewarmings, discover elevated pieces crafted to commemorate life’s happiest gatherings.',
    image: celebrationImg,
    href: '/gifts/celebrations',
    ctaText: 'Explore Celebration Gifts',
  },

  // ── 3. By Feeling ──
  {
    id: 'calm-restorative',
    groupId: 'feeling',
    groupName: 'By Feeling',
    label: 'Calm & Restorative',
    title: 'Calm & Restorative Gestures',
    subtitle: 'Sensory botanicals, natural candles & slow living',
    description:
      'Gentle aromatherapy, handcrafted ceramic tea sets, and calming linen textures designed to bring stillness and ease into daily life.',
    image: herImg,
    href: '/gifts/calm',
    ctaText: 'Explore Restorative Gifts',
  },
  {
    id: 'quiet-luxury',
    groupId: 'feeling',
    groupName: 'By Feeling',
    label: 'Quiet Luxury',
    title: 'Quiet Luxury & Timeless Craft',
    subtitle: 'Understated elegance in materials and form',
    description:
      'Hand-stitched leather goods, bespoke brass stationery, and minimalist decor pieces that speak with quiet confidence.',
    image: himImg,
    href: '/gifts/luxury',
    ctaText: 'Explore Quiet Luxury',
  },
  {
    id: 'warm-celebratory',
    groupId: 'feeling',
    groupName: 'By Feeling',
    label: 'Warm & Celebratory',
    title: 'Warm & Uplifting Surprises',
    subtitle: 'Vibrant tokens for shared joy and cheer',
    description:
      'Gourmet artisanal sweets, celebratory glassware, and festive unboxing experiences that spark immediate smiles.',
    image: celebrationImg,
    href: '/gifts/celebratory',
    ctaText: 'Explore Celebratory Gifts',
  },
];

export const discoveryGroups: DiscoveryGroup[] = [
  {
    id: 'recipient',
    name: 'Who It’s For',
    items: discoveryItems.filter((item) => item.groupId === 'recipient'),
  },
  {
    id: 'occasion',
    name: 'By Occasion',
    items: discoveryItems.filter((item) => item.groupId === 'occasion'),
  },
  {
    id: 'feeling',
    name: 'By Feeling',
    items: discoveryItems.filter((item) => item.groupId === 'feeling'),
  },
];
