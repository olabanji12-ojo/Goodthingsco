import { SouvenirItem } from './types';

// Direct PNG asset imports
import weddingImg from '../../../assets/section2/Frame 9.png';
import celebrationImg from '../../../assets/section2/Frame 5 (1).png';
import corporateImg from '../../../assets/section4/coperate.png';

export const souvenirItems: SouvenirItem[] = [
  {
    id: 'wedding-favors',
    title: 'Wedding & Bridal Favors',
    subtitle: 'Sacred Vows & Shared Joy',
    description: 'Artisanal miniature keepsakes, bespoke wax-sealed packaging, silk ribbon tying, and botanical accents designed for your guests.',
    tag: 'Weddings',
    image: weddingImg,
    alt: 'Bespoke wedding favors and custom-tied celebration boxes',
    href: '/create?type=wedding-favors',
  },
  {
    id: 'celebration-favors',
    title: 'Milestone Celebrations',
    subtitle: 'Birthdays, Anniversaries & Galas',
    description: 'Commemorative gift tokens, personalized celebration boxes, and curated mementos that honor significant moments in time.',
    tag: 'Milestones',
    image: celebrationImg,
    alt: 'Celebratory milestone gift bundles and guest keepsakes',
    href: '/create?type=milestones',
  },
  {
    id: 'corporate-events',
    title: 'Corporate Events & Retreats',
    subtitle: 'VIP Delegates & Brand Milestones',
    description: 'Distinguished luxury delegate hampers, executive retreat survival sets, and high-end branded commemorative gifts.',
    tag: 'Corporate Gatherings',
    image: corporateImg,
    alt: 'Corporate retreat gift packages and executive delegate tokens',
    href: '/create?type=corporate-events',
  },
];
