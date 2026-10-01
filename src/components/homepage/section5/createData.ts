import { BespokeCategoryTag, CreateStoryStep } from './types';

// Direct PNG asset imports for universal browser support & reliable bundling
import beforeImg from '../../../assets/section5/packaging-before.png';
import processImg from '../../../assets/section5/process.png';
import afterImg from '../../../assets/section5/after.png';

/**
 * Section 5 — Create Something Special Data
 */
export const createStorySteps: [CreateStoryStep, CreateStoryStep, CreateStoryStep] = [
  {
    id: 'before',
    stepNumber: '01',
    label: '01 — Before',
    title: 'The Starting Canvas',
    image: beforeImg,
    alt: 'Clean, minimal starting packaging base and unadorned materials',
    caption: 'Selected raw materials & custom box foundations',
    aspectClass: 'aspect-[3/3.9]',
    sizeClass: 'w-[190px] sm:w-[220px] md:w-[240px] lg:w-[260px]',
  },
  {
    id: 'crafted',
    stepNumber: '02',
    label: '02 — Crafted',
    title: 'Handcrafted Detail',
    image: processImg,
    alt: 'Hands delicately tying silk ribbon and affixing personalized tag',
    caption: 'Personalized monogramming, ribbons & botanical sprigs',
    aspectClass: 'aspect-[3/4.4]',
    sizeClass: 'w-[210px] sm:w-[245px] md:w-[270px] lg:w-[295px]',
  },
  {
    id: 'finished',
    stepNumber: '03',
    label: '03 — Finished',
    title: 'The Presentation Payoff',
    image: afterImg,
    alt: 'Fully finished, beautifully styled bespoke gift box arrangement',
    caption: 'Presentation-ready bespoke gifts for meaningful occasions',
    aspectClass: 'aspect-[3/4.1]',
    sizeClass: 'w-[235px] sm:w-[275px] md:w-[310px] lg:w-[340px]',
  },
];

export const bespokeCategoryTags: BespokeCategoryTag[] = [
  { id: 'custom-gifts', label: 'Custom Gifts', href: '/create?type=custom' },
  { id: 'corporate', label: 'Corporate Gifting', href: '/create?type=corporate' },
  { id: 'events', label: 'Event Gifting', href: '/create?type=events' },
  { id: 'souvenirs', label: 'Souvenirs', href: '/create?type=souvenirs' },
  { id: 'packaging', label: 'Bespoke Packaging', href: '/create?type=packaging' },
];

export const bespokePillars = [
  {
    id: 'personal-gifts',
    title: 'Personal Gifts',
    subtitle: 'Tailored for Loved Ones',
    description: 'Personalized monogramming, curated gift box curations, handwritten message cards, and bespoke presentation details.',
    tag: 'Individual',
    href: '/create?type=personal',
  },
  {
    id: 'bespoke-custom',
    title: 'Bespoke & Custom',
    subtitle: 'One-of-a-Kind Curations',
    description: 'Collaborate with our atelier to design bespoke objects, custom color palettes, artisanal pairings, and luxury keepsakes.',
    tag: 'Custom',
    href: '/create?type=bespoke',
  },
  {
    id: 'corporate-gifting',
    title: 'Corporate Gifting',
    subtitle: 'Distinguished Client & Team Sets',
    description: 'Executive hampers, refined client appreciation gifts, branded luxury onboarding kits, and year-end celebrations.',
    tag: 'Corporate',
    href: '/create?type=corporate',
  },
  {
    id: 'event-gifting',
    title: 'Event & Wedding Gifting',
    subtitle: 'Memorable Favors & Souvenirs',
    description: 'Curated favors and commemorative gifts for weddings, milestone birthdays, anniversaries, and VIP gatherings.',
    tag: 'Events',
    href: '/create?type=events',
  },
];

