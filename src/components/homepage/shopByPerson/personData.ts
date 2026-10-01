import { PersonCategory } from './types';

// Direct asset imports for 100% reliable bundling and image optimization
import herImg from '../../../assets/section4/her.png';
import himImg from '../../../assets/section4/him.png';
import couplesImg from '../../../assets/section2/Frame 2.png';
import familyImg from '../../../assets/section2/Frame 5 (1).png';
import friendsImg from '../../../assets/section2/Frame 1.png';
import colleaguesImg from '../../../assets/section4/coperate.png';

export const personCategories: PersonCategory[] = [
  {
    id: 'for-her',
    title: 'For Her',
    tagline: 'Curated Luxuries & Gentle Rituals',
    description: 'Fine jewelry, delicate scents, botanical skincare, and crafted silk accents.',
    image: herImg,
    alt: 'Curated gift selection for her with elegant jewelry and scents',
    tag: 'Curated for Her',
    href: '/shop?recipient=her',
  },
  {
    id: 'for-him',
    title: 'For Him',
    tagline: 'Understated Elegance & Daily Essentials',
    description: 'Handcrafted leather accessories, classic timepieces, and desk accents.',
    image: himImg,
    alt: 'Refined gift collection for him with leather goods and timepieces',
    tag: 'Curated for Him',
    href: '/shop?recipient=him',
  },
  {
    id: 'for-couples',
    title: 'For Couples',
    tagline: 'Shared Moments & Home Comforts',
    description: 'Artisanal tableware, celebration sets, and thoughtful pieces for two.',
    image: couplesImg,
    alt: 'Thoughtful gift pairings and home dining sets for couples',
    tag: 'Pairs & Partnerships',
    href: '/shop?recipient=couples',
  },
  {
    id: 'for-family',
    title: 'For Family',
    tagline: 'Heartfelt Treasures & Warmth',
    description: 'Warm throws, heritage pieces, and celebratory gift bundles for home.',
    image: familyImg,
    alt: 'Heartwarming family gift packages and celebratory bundles',
    tag: 'Home & Hearth',
    href: '/shop?recipient=family',
  },
  {
    id: 'for-friends',
    title: 'For Friends',
    tagline: 'Joyful Gestures & Tokens of Care',
    description: 'Uplifting tokens, artisanal stationery, and celebratory keepsakes.',
    image: friendsImg,
    alt: 'Joyful curated tokens and stationery gifts for friends',
    tag: 'Thoughtful Tokens',
    href: '/shop?recipient=friends',
  },
  {
    id: 'for-colleagues',
    title: 'For Colleagues',
    tagline: 'Distinguished & Gracious Accents',
    description: 'Executive desk objects, fine notebooks, and polished appreciation gifts.',
    image: colleaguesImg,
    alt: 'Professional executive gifts and appreciation tokens for colleagues',
    tag: 'Appreciation & Work',
    href: '/shop?recipient=colleagues',
  },
];
