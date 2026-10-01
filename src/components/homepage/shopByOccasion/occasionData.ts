import { OccasionCategory } from './types';

// Direct PNG asset imports for guaranteed bundling
import birthdayImg from '../../../assets/section4/birthday.png';
import celebrationImg from '../../../assets/section4/celebration.png';
import weddingImg from '../../../assets/section2/Frame 9.png';
import appreciationImg from '../../../assets/section4/appreciation.png';
import congratsImg from '../../../assets/section2/Frame 6.png';
import newBabyImg from '../../../assets/section2/Frame 3 (1).png';
import corporateImg from '../../../assets/section4/coperate.png';
import justBecauseImg from '../../../assets/section2/Frame 4.png';
import herImg from '../../../assets/section4/her.png';
import himImg from '../../../assets/section4/him.png';
import frame5Img from '../../../assets/section2/Frame 5 (1).png';
import frame1Img from '../../../assets/section2/Frame 1.png';

export const occasionCategories: OccasionCategory[] = [
  {
    id: 'christmas',
    title: 'Christmas',
    tagline: 'Festive Hampers & Holiday Cheer',
    description: 'Sumptuous holiday hampers, warming botanicals, and handcrafted celebratory gifts.',
    image: frame5Img,
    alt: 'Christmas holiday luxury gift hampers and festive packages',
    tag: 'Christmas',
    href: '/shop?occasion=christmas',
  },
  {
    id: 'valentines',
    title: "Valentine's",
    tagline: 'Romantic Keepsakes & Timeless Affection',
    description: 'Precious jewelry, pairing ceramics, and silk-wrapped expressions of deep romance.',
    image: celebrationImg,
    alt: "Valentine's day romantic keepsakes and luxury couples gifts",
    tag: "Valentine's",
    href: '/shop?occasion=valentines',
  },
  {
    id: 'mothers-day',
    title: "Mother's Day",
    tagline: 'Bespoke Pampering & Gratitude for Mums',
    description: 'Mulberry silk scarves, relaxing bath sanctuaries, and heirloom keepsakes for mother.',
    image: herImg,
    alt: "Mother's Day luxury pampering gifts and botanical sets",
    tag: "Mother's Day",
    href: '/shop?occasion=mothers-day',
  },
  {
    id: 'fathers-day',
    title: "Father's Day",
    tagline: 'Distinguished Leather & Watch Suites',
    description: 'Precision timepieces, leather portfolios, and weighted brass pens honoring dads.',
    image: himImg,
    alt: "Father's Day leather and executive accessories for fathers",
    tag: "Father's Day",
    href: '/shop?occasion=fathers-day',
  },
  {
    id: 'easter',
    title: 'Easter',
    tagline: 'Spring Renewal & Confection Hampers',
    description: 'Artisanal sweet confections, fresh tea sets, and bright springtime family packages.',
    image: frame1Img,
    alt: 'Easter spring confectionery gift baskets and celebration sets',
    tag: 'Easter',
    href: '/shop?occasion=easter',
  },
  {
    id: 'new-year',
    title: 'New Year',
    tagline: 'Fresh Horizons & Celebratory Toasts',
    description: 'Crystal champagne flutes, executive journals, and inspiring gifts for a fresh start.',
    image: congratsImg,
    alt: 'New Year celebration gifts and champagne keepsakes',
    tag: 'New Year',
    href: '/shop?occasion=new-year',
  },
  {
    id: 'birthday',
    title: 'Birthday',
    tagline: 'Joyful Celebrations & Milestones',
    description: 'Festive curated packages, celebratory keepsakes, and personalized treats.',
    image: birthdayImg,
    alt: 'Birthday celebratory gift packages and luxury presents',
    tag: 'Birthdays',
    href: '/shop?occasion=birthday',
  },
  {
    id: 'anniversary',
    title: 'Anniversary',
    tagline: 'Enduring Love & Timeless Tokens',
    description: 'Fine jewelry, paired ceramics, and heirloom keepsakes celebrating years together.',
    image: celebrationImg,
    alt: 'Anniversary gifts and romantic keepsakes for couples',
    tag: 'Anniversaries',
    href: '/shop?occasion=anniversary',
  },
  {
    id: 'wedding',
    title: 'Wedding & Engagement',
    tagline: 'New Chapters & Sacred Bonds',
    description: 'Bespoke gift boxes, artisanal home dining, and elegant blessings for newlyweds.',
    image: weddingImg,
    alt: 'Wedding gift packages and celebratory bridal hampers',
    tag: 'Weddings',
    href: '/shop?occasion=wedding',
  },
  {
    id: 'thank-you',
    title: 'Thank You & Gratitude',
    tagline: 'Gracious Gestures & Appreciation',
    description: 'Heartfelt gift selections that express sincere appreciation and thanks.',
    image: appreciationImg,
    alt: 'Thank you gifts expressing heartfelt gratitude and warmth',
    tag: 'Gratitude',
    href: '/shop?occasion=thank-you',
  },
  {
    id: 'congratulations',
    title: 'Congratulations',
    tagline: 'New Homes, Promotions & Honors',
    description: 'Distinguished pieces and celebratory gifts honoring momentous achievements.',
    image: congratsImg,
    alt: 'Congratulations gifts celebrating milestones and achievements',
    tag: 'Milestones',
    href: '/shop?occasion=congratulations',
  },
  {
    id: 'new-baby',
    title: 'New Baby & Family',
    tagline: 'Welcoming Little Wonders',
    description: 'Soft organic textiles, tender keepsakes, and caring gifts for new parents.',
    image: newBabyImg,
    alt: 'New baby gift sets and newborn family treasures',
    tag: 'New Life',
    href: '/shop?occasion=baby',
  },
  {
    id: 'corporate',
    title: 'Corporate & Executive',
    tagline: 'Distinguished Client & Team Gifts',
    description: 'Executive hampers, bespoke leather goods, and refined corporate packages.',
    image: corporateImg,
    alt: 'Executive corporate gift packages and distinguished client gifts',
    tag: 'Corporate',
    href: '/shop?occasion=corporate',
  },
  {
    id: 'just-because',
    title: 'Just Because',
    tagline: 'Spontaneous Gestures of Care',
    description: 'Unprompted surprises, gentle comfort pieces, and quiet everyday delights.',
    image: justBecauseImg,
    alt: 'Spontaneous care gifts and thoughtful daily surprises',
    tag: 'Everyday Care',
    href: '/shop?occasion=just-because',
  },
];
