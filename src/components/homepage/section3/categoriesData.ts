import { CategoryItem } from './types';

// Direct PNG asset imports for universal browser support & reliable bundling
import bagImg from '../../../assets/section3/bag.png';
import wristwatchImg from '../../../assets/section3/wristwatch.png';
import eyeglassesImg from '../../../assets/section3/eyeglasses.png';
import necklaceImg from '../../../assets/section3/necklace.png';
import bottleImg from '../../../assets/section3/bottle1.png';
import footwareImg from '../../../assets/section3/footware.png';
import penImg from '../../../assets/section3/pen.png';
import ringImg from '../../../assets/section3/ring.png';
import trouserImg from '../../../assets/section3/Trouser.png';
import hatImg from '../../../assets/section3/hat.png';

/**
 * Section 3 — Category Showcase Data
 */
export const row1Categories: CategoryItem[] = [
  {
    id: 'bags',
    title: 'Bags & Leather',
    subtitle: 'Everyday Carry',
    image: bagImg,
    href: '/shop/bags',
    itemCount: '18 pieces',
  },
  {
    id: 'timepieces',
    title: 'Timepieces',
    subtitle: 'Classic Precision',
    image: wristwatchImg,
    href: '/shop/timepieces',
    itemCount: '12 pieces',
  },
  {
    id: 'eyewear',
    title: 'Eyewear & Optics',
    subtitle: 'Hand-Finished Frames',
    image: eyeglassesImg,
    href: '/shop/eyewear',
    itemCount: '15 pieces',
  },
  {
    id: 'jewelry',
    title: 'Jewelry & Pendants',
    subtitle: 'Subtle Heirlooms',
    image: necklaceImg,
    href: '/shop/jewelry',
    itemCount: '24 pieces',
  },
  {
    id: 'fragrance',
    title: 'Fragrance & Botanical',
    subtitle: 'Sensory Living',
    image: bottleImg,
    href: '/shop/fragrance',
    itemCount: '14 pieces',
  },
];

export const row2Categories: CategoryItem[] = [
  {
    id: 'footwear',
    title: 'Artisan Footwear',
    subtitle: 'Crafted Steps',
    image: footwareImg,
    href: '/shop/footwear',
    itemCount: '16 pieces',
  },
  {
    id: 'stationery',
    title: 'Fine Writing',
    subtitle: 'Pens & Journals',
    image: penImg,
    href: '/shop/stationery',
    itemCount: '20 pieces',
  },
  {
    id: 'rings',
    title: 'Rings & Bands',
    subtitle: 'Precious Keepsakes',
    image: ringImg,
    href: '/shop/rings',
    itemCount: '22 pieces',
  },
  {
    id: 'apparel',
    title: 'Tailored Garments',
    subtitle: 'Everyday Linens',
    image: trouserImg,
    href: '/shop/apparel',
    itemCount: '19 pieces',
  },
  {
    id: 'headwear',
    title: 'Headwear & Caps',
    subtitle: 'Structured Forms',
    image: hatImg,
    href: '/shop/headwear',
    itemCount: '11 pieces',
  },
];
