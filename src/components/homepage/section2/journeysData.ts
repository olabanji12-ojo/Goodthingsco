import { JourneyData } from './types';

// Direct asset imports for 100% reliable bundling & path resolution
import frame1Img from '../../../assets/section2/Frame 1.png';
import frame2Img from '../../../assets/section2/Frame 2.png';
import frame3Img from '../../../assets/section2/Frame 3 (1).png';
import frame4Img from '../../../assets/section2/Frame 4.png';
import frame5Img from '../../../assets/section2/Frame 5 (1).png';
import frame6Img from '../../../assets/section2/Frame 6.png';
import frame7Img from '../../../assets/section2/Frame 7.png';
import frame8Img from '../../../assets/section2/Frame 8.png';
import frame9Img from '../../../assets/section2/Frame 9.png';

/**
 * Journeys Data for Section 2
 */
export const journeysData: JourneyData[] = [
  {
    id: 'shop',
    number: '01',
    title: 'Shop',
    subtitle: 'Find something for yourself.',
    description:
      'Thoughtful objects and beautiful everyday pieces designed to make ordinary moments feel more considered.',
    ctaText: 'Explore Shop',
    ctaHref: '/shop',
    side: 'right', // Text left, Cards right
    cards: [
      {
        id: 'shop-card-1',
        src: frame1Img,
        alt: 'Ceramic tea cup on saucer with linen napkin',
        title: 'Morning Rituals',
      },
      {
        id: 'shop-card-2',
        src: frame2Img,
        alt: 'Reading a book outdoors in foggy mountain landscape',
        title: 'Quiet Moments',
      },
      {
        id: 'shop-card-3',
        src: frame3Img,
        alt: 'Artisanal patterned woven scarf textile',
        title: 'Woven Comforts',
      },
    ],
  },
  {
    id: 'gifts',
    number: '02',
    title: 'Gifts',
    subtitle: 'Find something thoughtful.',
    description:
      'Beautiful gifts for birthdays, celebrations, appreciation, meaningful moments, and everything in between.',
    ctaText: 'Explore Gifts',
    ctaHref: '/gifts',
    side: 'left', // Cards left, Text right
    cards: [
      {
        id: 'gifts-card-1',
        src: frame4Img,
        alt: 'Bespoke wrapped paper gift bag',
        title: 'Thoughtful Packaging',
      },
      {
        id: 'gifts-card-2',
        src: frame5Img,
        alt: 'Person carrying stacked wrapped gift boxes',
        title: 'Celebration Bundles',
      },
      {
        id: 'gifts-card-3',
        src: frame6Img,
        alt: 'Artisanal seasonal floral bouquet in rustic clay vase',
        title: 'Botanical Keepsakes',
      },
    ],
  },
  {
    id: 'create',
    number: '03',
    title: 'Create',
    subtitle: 'Make something uniquely yours.',
    description:
      'Custom gifts, bespoke packaging, souvenirs, corporate orders, and special details created for meaningful occasions.',
    ctaText: 'Start Creating',
    ctaHref: '/create',
    side: 'right', // Text left, Cards right
    cards: [
      {
        id: 'create-card-1',
        src: frame7Img,
        alt: 'Aesthetic creative workspace and bespoke studio setup',
        title: 'Studio Design',
      },
      {
        id: 'create-card-2',
        src: frame8Img,
        alt: 'Freshly poured artisan espresso with latte art',
        title: 'Crafted Details',
      },
      {
        id: 'create-card-3',
        src: frame9Img,
        alt: 'Bespoke wrapped gifts with dried botanical florals and ribbon',
        title: 'Custom Packaging',
      },
    ],
  },
];
