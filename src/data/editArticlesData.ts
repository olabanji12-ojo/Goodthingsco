/**
 * The Edit — Editorial Journal Data & Content
 * Good Things Co.
 *
 * Content categories:
 * - Gift Guides (Helpful guides for choosing gifts for people, occasions and moments)
 * - Gifting Ideas (Curated gift inspiration and recommendations)
 * - Thoughtful Living (Editorial content around meaningful everyday living and thoughtful gestures)
 * - Behind the Scenes (Stories showing how products, packaging, campaigns and collections come together)
 * - Our Process (Explain how Good Things Co. develops, curates, customises and delivers gifting experiences)
 * - Sourcing & Making (Content about materials, sourcing, production, craftsmanship and makers)
 * - GoodThings Stories (Brand stories, customer stories, collection stories, collaborations and meaningful moments)
 */

// Local high-resolution assets
import heroLivingImg from '../assets/section6/section6.png';
import giftHeroImg from '../assets/gift-hero.png';
import processAtelierImg from '../assets/section5/process.png';
import packagingBeforeImg from '../assets/section5/packaging-before.png';
import afterBespokeImg from '../assets/section5/after.png';
import corporateSuiteImg from '../assets/section4/coperate.png';
import frame1Img from '../assets/section2/Frame 1.png';
import frame2Img from '../assets/section2/Frame 2.png';
import frame3Img from '../assets/section2/Frame 3 (1).png';
import frame4Img from '../assets/section2/Frame 4.png';
import frame5Img from '../assets/section2/Frame 5 (1).png';
import frame6Img from '../assets/section2/Frame 6.png';
import frame7Img from '../assets/section2/Frame 7.png';
import frame9Img from '../assets/section2/Frame 9.png';

export type EditCategorySlug =
  | 'gift-guides'
  | 'gifting-ideas'
  | 'thoughtful-living'
  | 'behind-the-scenes'
  | 'our-process'
  | 'sourcing-making'
  | 'goodthings-stories';

export interface EditCategoryMeta {
  slug: EditCategorySlug;
  label: string;
  tagline: string;
  description: string;
}

export const EDIT_CATEGORIES: EditCategoryMeta[] = [
  {
    slug: 'gift-guides',
    label: 'Gift Guides',
    tagline: 'Occasions & Milestones',
    description: 'Helpful guides for choosing gifts for people, occasions and moments.',
  },
  {
    slug: 'gifting-ideas',
    label: 'Gifting Ideas',
    tagline: 'Inspiration & Curations',
    description: 'Curated gift inspiration, intentional combinations and recommendations.',
  },
  {
    slug: 'thoughtful-living',
    label: 'Thoughtful Living',
    tagline: 'Rituals & Gestures',
    description: 'Editorial content around meaningful everyday living and thoughtful gestures.',
  },
  {
    slug: 'behind-the-scenes',
    label: 'Behind the Scenes',
    tagline: 'Inside the Studio',
    description: 'Stories showing how products, packaging, campaigns and collections come together.',
  },
  {
    slug: 'our-process',
    label: 'Our Process',
    tagline: 'Concierge & Craft',
    description: 'Explain how Good Things Co. develops, curates, customises and delivers gifting experiences.',
  },
  {
    slug: 'sourcing-making',
    label: 'Sourcing & Making',
    tagline: 'Artisans & Materials',
    description: 'Content about materials, sourcing, production, craftsmanship and makers.',
  },
  {
    slug: 'goodthings-stories',
    label: 'GoodThings Stories',
    tagline: 'Moments & Milestones',
    description: 'Brand stories, customer stories, collection stories, collaborations and meaningful moments.',
  },
];

export interface ContentBlock {
  type: 'paragraph' | 'heading' | 'quote' | 'image' | 'callout' | 'list';
  text?: string;
  level?: 2 | 3;
  attribution?: string;
  imageUrl?: string;
  imageCaption?: string;
  items?: string[];
}

export interface EditArticle {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: EditCategorySlug;
  categoryLabel: string;
  featuredImage: string;
  featuredImageAlt: string;
  publishedDate: string;
  readTime: string;
  isFeatured?: boolean;
  author: {
    name: string;
    role: string;
  };
  excerpt: string;
  leadParagraph: string;
  content: ContentBlock[];
  relatedSlugs: string[];
}

export const EDIT_ARTICLES: EditArticle[] = [
  // ── 1. FEATURED ARTICLE: Thoughtful Living ──
  {
    id: 'art-considered-gift',
    slug: 'the-art-of-the-considered-gift',
    title: 'The Art of the Considered Gift: Why Less, But Better, Transforms Every Ritual',
    subtitle: 'Moving beyond obligatory excess toward gifting that honours memory and quiet attention.',
    category: 'thoughtful-living',
    categoryLabel: 'Thoughtful Living',
    featuredImage: heroLivingImg,
    featuredImageAlt: 'Thoughtful living morning tea and linen journal editorial setting',
    publishedDate: 'October 2026',
    readTime: '6 min read',
    isFeatured: true,
    author: {
      name: 'Adanna Vance',
      role: 'Creative Director & Founder',
    },
    excerpt:
      'In a culture defined by rapid abundance, the truly memorable gift is rarely the largest. It is the one chosen with quiet discernment, wrapped with patience, and offered without haste.',
    leadParagraph:
      'Gifting has too often drifted into transactional speed. We order in minutes, rely on generic algorithms, and outsource our care to cardboard mailers with printed receipts. Yet when we ask people about the gifts that permanently altered their relationship to an occasion, they never mention convenience. They describe weight, texture, unexpected precision, and the unmistakable feeling that another human being paused long enough to perceive who they truly are.',
    content: [
      {
        type: 'heading',
        level: 2,
        text: 'The Architecture of Discernment',
      },
      {
        type: 'paragraph',
        text: 'To give well is an act of editing. It begins by stripping away the ambient noise of consumerism. A considered gift does not attempt to solve every need or announce its own cost. Instead, it isolates a single, exquisite moment: the quiet first hour of a Sunday morning, the tactile pleasure of signing a journal with a weighted brass pen, or the comforting scent of crushed fig leaf and cedarwood lingering in an entryway.',
      },
      {
        type: 'quote',
        text: 'A gift becomes unforgettable not through its scale, but through the unmistakable presence of someone else’s undivided attention.',
        attribution: 'Adanna Vance, Good Things Co.',
      },
      {
        type: 'paragraph',
        text: 'At Good Things Co., our foundational principle is simple: every object must earn its place. We reject items that simply take up shelf space. Whether we are selecting heavy Belgian linen napkins, stone-milled chocolate, or custom-turned brass paperweights, each piece is tested for permanence and sensory resonance.',
      },
      {
        type: 'image',
        imageUrl: packagingBeforeImg,
        imageCaption: 'Archival paper stock, natural ribbon weights, and bespoke gift box prototyping at the atelier.',
      },
      {
        type: 'heading',
        level: 2,
        text: 'The Sensory Value of the Unboxing',
      },
      {
        type: 'paragraph',
        text: 'The moment of receipt is theatre. The crisp tension of a double-faced satin ribbon sliding open; the scent of cedarwood shavings beneath archival tissue; the deliberate weight of a rigid keepsake box that will stay on someone’s dresser for decades. When the packaging is treated with the same reverence as the gift inside, the recipient understands immediately that they are part of a private ceremony.',
      },
      {
        type: 'callout',
        text: 'Three Questions Before Gifting: Does this elevate an existing ritual? Will it improve with age and use? Does it communicate love without requiring words?',
      },
      {
        type: 'paragraph',
        text: 'When we give from this posture, gifting ceases to be an obligation on a calendar. It becomes what it was always intended to be: an enduring expression of human gratitude.',
      },
    ],
    relatedSlugs: [
      'the-discerning-host-hospitality-guide',
      'inside-the-atelier-hand-tied-ribbons',
      'ten-micro-rituals-elevate-mornings',
    ],
  },

  // ── 2. Gift Guides ──
  {
    id: 'discerning-host',
    slug: 'the-discerning-host-hospitality-guide',
    title: 'The Discerning Host: A Curated Guide to Milestone Hospitality & Table Gratitude',
    subtitle: 'From hand-thrown ceramic tableware to small-batch botanicals: what to offer those who open their homes.',
    category: 'gift-guides',
    categoryLabel: 'Gift Guides',
    featuredImage: frame1Img,
    featuredImageAlt: 'Curated artisanal tableware and host gifts arranged with natural botanicals',
    publishedDate: 'September 2026',
    readTime: '4 min read',
    isFeatured: false,
    author: {
      name: 'Tomiwa Oke',
      role: 'Head of Curation',
    },
    excerpt:
      'Arriving with a generic bouquet is polite; presenting a gift that enriches the evening’s table or soothes the morning after is an act of deep hospitality.',
    leadParagraph:
      'Hosting is an act of generous vulnerability. The host spends days orchestrating seating charts, music selections, and culinary pacing so their guests feel sheltered and celebrated. A thoughtful guest recognizes this invisible labour and brings a gift that speaks directly to that effort.',
    content: [
      {
        type: 'heading',
        level: 2,
        text: 'What Makes an Exceptional Host Gift?',
      },
      {
        type: 'paragraph',
        text: 'Avoid items that require immediate work from the host during the event. Flowers that require trimming and finding a vase in the middle of greeting arrivals inadvertently add stress. Instead, choose items that either seamlessly join the evening or offer quiet rejuvenation once the last guest departs.',
      },
      {
        type: 'list',
        items: [
          'Small-batch aged botanical vinegars or cold-pressed olive oils in dark UV glass bottles.',
          'Double-wick mineral wax candles infused with wild fig, bergamot, and smoked vetiver.',
          'Hand-woven cotton tea towels pre-washed for softness and tailored with hanging loops.',
          'Artisan confectioneries or single-origin cocoa bars curated for midnight coffee.',
        ],
      },
      {
        type: 'quote',
        text: 'The best host gift is one that lingers softly the following morning, when the house is still and the coffee is fresh.',
        attribution: 'Good Things Co. Host Almanac',
      },
      {
        type: 'image',
        imageUrl: frame4Img,
        imageCaption: 'Handcrafted tabletop pieces curated for intimate dinner parties.',
      },
      {
        type: 'paragraph',
        text: 'Wrap the offering in muted neutral linen paper tied with raw cotton twine. Include a brief, handwritten card thanking the host for the sanctuary of their table.',
      },
    ],
    relatedSlugs: [
      'the-art-of-the-considered-gift',
      'ten-micro-rituals-elevate-mornings',
      'linen-brass-vegetable-tanned-hide-artisans',
    ],
  },

  // ── 3. Gifting Ideas ──
  {
    id: 'ten-micro-rituals',
    slug: 'ten-micro-rituals-elevate-mornings',
    title: 'Beyond the Generic Hamper: Ten Micro-Rituals That Elevate Everyday Mornings',
    subtitle: 'How pairing intentional objects with daily routines creates gifts of lasting calm.',
    category: 'gifting-ideas',
    categoryLabel: 'Gifting Ideas',
    featuredImage: frame3Img,
    featuredImageAlt: 'Brass pen, linen journal, and pour-over coffee carafe on dark wood desk',
    publishedDate: 'September 2026',
    readTime: '5 min read',
    isFeatured: false,
    author: {
      name: 'Adanna Vance',
      role: 'Creative Director & Founder',
    },
    excerpt:
      'How the simple combination of single-origin beans, a weighted brass rollerball, and unlined cotton paper can re-anchor a busy mind before the day begins.',
    leadParagraph:
      'We often think of gifts as static items that rest on a shelf. But the gifts that build deep emotional attachments are ritualistic. They invite the recipient into an everyday practice that slows down time and restores mental clarity.',
    content: [
      {
        type: 'heading',
        level: 2,
        text: 'Gifting as a Habit of Stillness',
      },
      {
        type: 'paragraph',
        text: 'Consider the morning routine of a creative director, an entrepreneur, or a new parent. It is often rushed and screen-dominated. By curating a gift set around a tactile 15-minute pause, you are not merely giving objects—you are protecting their peace of mind.',
      },
      {
        type: 'list',
        items: [
          'The Silent Writing Hour: A debossed linen journal paired with a solid brass rollerball pen that develops a natural patina with every entry.',
          'The Mindful Pour: A double-walled borosilicate tumbler and single-origin herbal tea infused with dried chamomile flowers and lemongrass.',
          'The Clean Slate Desk: A vegetable-tanned leather desk blotter that grounds the workspace in warmth and natural grain.',
          'The Ambient Transition: A soothing botanical room spray designed to signal the shift from rest into focused creative work.',
        ],
      },
      {
        type: 'image',
        imageUrl: frame7Img,
        imageCaption: 'The Morning Stillness Suite: brass, linen, and ceramic stoneware in natural morning light.',
      },
      {
        type: 'paragraph',
        text: 'When curating a gift around micro-rituals, always consider the complete sensory sequence: touch, aroma, visual proportion, and ease of maintenance.',
      },
    ],
    relatedSlugs: [
      'the-art-of-the-considered-gift',
      'the-discerning-host-hospitality-guide',
      'inside-the-atelier-hand-tied-ribbons',
    ],
  },

  // ── 4. Behind the Scenes ──
  {
    id: 'inside-the-atelier',
    slug: 'inside-the-atelier-hand-tied-ribbons',
    title: 'Inside the Atelier: The Geometry of Hand-Tied Double-Satin Ribbons',
    subtitle: 'A rare look into our studio, where every presentation box is finished with millimetric precision.',
    category: 'behind-the-scenes',
    categoryLabel: 'Behind the Scenes',
    featuredImage: processAtelierImg,
    featuredImageAlt: 'Artisan hand-assembling bespoke rigid presentation box in atelier studio',
    publishedDate: 'August 2026',
    readTime: '4 min read',
    isFeatured: false,
    author: {
      name: 'Ngozi Bello',
      role: 'Studio Production Lead',
    },
    excerpt:
      'A rare look into our Lagos studio, where every presentation box is measured by millimeter tension, archival tissue folds, and custom wax seals.',
    leadParagraph:
      'In our packaging studio, there is no assembly line. There are no automated taping machines or pre-formed bows with peel-and-stick adhesive. Every single gift that leaves our doors is dressed by hand by an artisan who has trained for weeks in our specific ribbon tension geometry.',
    content: [
      {
        type: 'heading',
        level: 2,
        text: 'The 45-Degree Mitered Ribbon Wrap',
      },
      {
        type: 'paragraph',
        text: 'We use double-faced French and Japanese satin ribbons with woven selvage edges. Because both sides are lustrous, there is no "wrong side" to hide. Our artisans measure the diagonal pull across the box so the knot sits exactly two-fifths from the upper-right corner—a classical Golden Ratio composition that invites the hand to pull without hesitation.',
      },
      {
        type: 'quote',
        text: 'When a ribbon is tied with proper tension, untying it produces an audible whisper. That sound is where the unboxing ceremony truly begins.',
        attribution: 'Ngozi Bello, Good Things Co. Studio',
      },
      {
        type: 'image',
        imageUrl: afterBespokeImg,
        imageCaption: 'The finished presentation: gold foil debossed lid, forest green satin tie, and archival vellum note.',
      },
      {
        type: 'paragraph',
        text: 'Before sealing the outer shipping slipcover, each box is inspected under full-spectrum daylight lamps for alignment, scent purity, and corner crispness. We sign the internal packaging card with the packer’s initials—a mark of personal responsibility.',
      },
    ],
    relatedSlugs: [
      'from-brief-to-unboxing-corporate-expressions',
      'linen-brass-vegetable-tanned-hide-artisans',
      'the-art-of-the-considered-gift',
    ],
  },

  // ── 5. Our Process ──
  {
    id: 'from-brief-to-unboxing',
    slug: 'from-brief-to-unboxing-corporate-expressions',
    title: 'From Brief to Unboxing: How We Engineer Bespoke Corporate Expressions',
    subtitle: 'Inside the white-glove corporate concierge that turns enterprise milestones into lasting sentiment.',
    category: 'our-process',
    categoryLabel: 'Our Process',
    featuredImage: corporateSuiteImg,
    featuredImageAlt: 'Corporate executive gifting suite with metallic debossing and leather accessories',
    publishedDate: 'August 2026',
    readTime: '5 min read',
    isFeatured: false,
    author: {
      name: 'Adanna Vance',
      role: 'Creative Director & Founder',
    },
    excerpt:
      'How our multi-stage concierge coordinates executive gifting from initial identity debossing through temperature-controlled dispatch.',
    leadParagraph:
      'Corporate gifting has suffered a chronic reputational crisis. For decades, companies have handed out plastic pens, branded flash drives, and cheap synthetic backpacks that inevitably land in wastebaskets. Forward-thinking organisations understand that client and employee gifting is a direct reflection of corporate culture.',
    content: [
      {
        type: 'heading',
        level: 2,
        text: 'Stage 1: Intentional Curation over Logo Slapping',
      },
      {
        type: 'paragraph',
        text: 'When an executive team approaches Good Things Co., our first task is to ask: "What feeling should this individual experience when they open the chest?" If a law firm is thanking its top 50 partners, a loud logo on an umbrella is an insult. But a full-grain Italian leather document folio with discreet blind debossing on the interior pocket speaks of enduring respect.',
      },
      {
        type: 'heading',
        level: 2,
        text: 'Stage 2: Digital Proofing & Physical Prototype Delivery',
      },
      {
        type: 'paragraph',
        text: 'Within 48 hours of initial consultation, we generate interactive 3D mockups illustrating logo placement, packaging finishes, and tissue arrangements. For campaigns exceeding 100 recipients, we dispatch a physical white-glove pre-production sample box directly to the project sponsor for tangible signoff.',
      },
      {
        type: 'image',
        imageUrl: frame2Img,
        imageCaption: 'Debossed leather goods and presentation chests ready for executive milestone distribution.',
      },
      {
        type: 'paragraph',
        text: 'Stage 3 covers individualized address verification, temperature-controlled transit, and real-time delivery notifications for corporate coordinators. Gifting at scale should feel effortless to the client and bespoke to the recipient.',
      },
    ],
    relatedSlugs: [
      'a-decade-of-milestones-keepsakes-foundation',
      'executive-welcome-curating-first-day',
      'inside-the-atelier-hand-tied-ribbons',
    ],
  },

  // ── 6. Sourcing & Making ──
  {
    id: 'sourcing-artisans',
    slug: 'linen-brass-vegetable-tanned-hide-artisans',
    title: 'Linen, Brass, & Vegetable-Tanned Hide: Meeting Our Discerning Artisans',
    subtitle: 'Why we collaborate with independent leatherworkers and metal turners across Nigeria and the diaspora.',
    category: 'sourcing-making',
    categoryLabel: 'Sourcing & Making',
    featuredImage: frame5Img,
    featuredImageAlt: 'Artisan workshop table showing hand tools, vegetable-tanned leather, and raw brass hardware',
    publishedDate: 'July 2026',
    readTime: '6 min read',
    isFeatured: false,
    author: {
      name: 'Tomiwa Oke',
      role: 'Head of Curation',
    },
    excerpt:
      'Why we collaborate with independent leatherworkers and metal turners across Nigeria and the diaspora to produce lasting keepsakes.',
    leadParagraph:
      'The modern supply chain is obsessed with synthetic speed. When you touch a Good Things Co. keepsake, however, the nervous system recognizes authenticity instantly. There is no imitation polyurethane masquerading as hide; there is no hollow gold-tone plastic pretending to be solid turned brass.',
    content: [
      {
        type: 'heading',
        level: 2,
        text: 'The Integrity of Natural Materials',
      },
      {
        type: 'paragraph',
        text: 'We select vegetable-tanned leather from historic tanneries that treat hides using natural tree barks, mimosa extract, and chestnut tannins over 60 days. Unlike chrome-tanned leather which peels and cracks, vegetable-tanned leather absorbs the oils of your hands, darkening into a rich, caramel glow that chronicles years of personal use.',
      },
      {
        type: 'quote',
        text: 'A great material does not fear age. It invites wear because time only increases its beauty.',
        attribution: 'Artisan Workshop Motto, Oyo State',
      },
      {
        type: 'paragraph',
        text: 'Our brass hardware is machined from solid bar stock by precision metalworkers. There is a satisfying, dense gravity when holding our rollerball pens or monogrammed paperweights. We leave the metal unlacquered so each owner develops an entirely unique fingerprint patina.',
      },
      {
        type: 'image',
        imageUrl: frame9Img,
        imageCaption: 'Raw materials: unbleached organic linen, vegetable-tanned leather swatches, and hand-cast solid brass.',
      },
    ],
    relatedSlugs: [
      'inside-the-atelier-hand-tied-ribbons',
      'the-art-of-the-considered-gift',
      'from-brief-to-unboxing-corporate-expressions',
    ],
  },

  // ── 7. GoodThings Stories ──
  {
    id: 'foundation-milestones',
    slug: 'a-decade-of-milestones-keepsakes-foundation',
    title: 'A Decade of Milestones: Inside the Keepsakes for the Aig-Imoukhuede Foundation',
    subtitle: 'Honoring ten years of public sector leadership with gold foil monograms and bespoke archive chests.',
    category: 'goodthings-stories',
    categoryLabel: 'GoodThings Stories',
    featuredImage: frame6Img,
    featuredImageAlt: 'Commemorative presentation boxes and custom debossed leather cases for milestone celebration',
    publishedDate: 'July 2026',
    readTime: '4 min read',
    isFeatured: false,
    author: {
      name: 'Adanna Vance',
      role: 'Creative Director & Founder',
    },
    excerpt:
      'Honoring ten years of public sector leadership with individual gold foil monogramming and bespoke linen archive chests.',
    leadParagraph:
      'When an institution reaches a milestone that has reshaped public sector leadership and educational governance across Africa, a standard corporate gift simply will not suffice. For the Aig-Imoukhuede Foundation’s landmark decade, Good Things Co. was commissioned to conceive an archival keepsake that would live in private study libraries for generations.',
    content: [
      {
        type: 'heading',
        level: 2,
        text: 'The Archival Keepsake Chest',
      },
      {
        type: 'paragraph',
        text: 'Rather than producing an ephemeral plaque, we designed an heirloom presentation chest wrapped in custom midnight-navy bookbinding cloth. Inside, each honoree discovered a numbered commemorative volume, a custom-turned solid brass bookmark engraved with their year of induction, and a letter handwritten on heavyweight 350gsm cotton deckle-edge rag.',
      },
      {
        type: 'quote',
        text: 'Good Things Co. transformed what could have been a ceremonial formality into an emotional homecoming for our fellows.',
        attribution: 'Executive Director, Aig-Imoukhuede Foundation',
      },
      {
        type: 'image',
        imageUrl: giftHeroImg,
        imageCaption: 'The finished celebration suite presented to dignitaries and foundation alumni.',
      },
      {
        type: 'paragraph',
        text: 'Every chest was individualised with the recipient’s initials hot-stamped in satin champagne gold foil. The response from honorees reminded us why this work matters: people cherish physical evidence of their life’s contributions.',
      },
    ],
    relatedSlugs: [
      'from-brief-to-unboxing-corporate-expressions',
      'executive-welcome-curating-first-day',
      'the-art-of-the-considered-gift',
    ],
  },

  // ── 8. Gift Guides: Executive Welcome ──
  {
    id: 'executive-welcome',
    slug: 'executive-welcome-curating-first-day',
    title: 'The Executive Welcome: Curating a Meaningful First Day for Senior Leaders',
    subtitle: 'Transforming corporate onboarding into an unmistakable gesture of sincere belonging and mutual ambition.',
    category: 'gift-guides',
    categoryLabel: 'Gift Guides',
    featuredImage: frame2Img,
    featuredImageAlt: 'Executive onboarding suite with linen journal, brass desk instruments, and welcome envelope',
    publishedDate: 'June 2026',
    readTime: '5 min read',
    isFeatured: false,
    author: {
      name: 'Tomiwa Oke',
      role: 'Head of Curation',
    },
    excerpt:
      'Transforming corporate onboarding into a gesture of sincere belonging with curated leather folios and handwritten welcome notes.',
    leadParagraph:
      'The first 48 hours in a senior leadership role are fraught with anticipation. The executive is arriving to steer strategy, build trust, and set cultural tone. Yet all too often, their first physical interaction with the company is an awkward IT checklist and a plastic lanyard on a bare desk.',
    content: [
      {
        type: 'heading',
        level: 2,
        text: 'Setting the Cultural Tone on Day One',
      },
      {
        type: 'paragraph',
        text: 'Imagine, instead, entering an office to find a bespoke linen presentation box awaiting you. Inside: a personal welcome letter from the board of directors, a hardbound company monograph, an Italian leather tech folio tailored to your laptop dimensions, and an invitation to an intimate welcome dinner.',
      },
      {
        type: 'list',
        items: [
          'The Heritage Folio: Full-grain leather with tailored slots for business cards and pen.',
          'The Founder’s Pen: Solid brass rollerball weighted for comfortable, deliberate signature writing.',
          'The Hand-Poured Candle: Designed to ground their new office in warm, focused ambient cedar and amber.',
          'The Curated Reading List: Three seminal texts that shaped the organization’s foundational ethos.',
        ],
      },
      {
        type: 'paragraph',
        text: 'This level of preparation signals intentionality. It informs the executive before a single meeting begins: "We value precision, we respect your craft, and we are thrilled you are here."',
      },
    ],
    relatedSlugs: [
      'from-brief-to-unboxing-corporate-expressions',
      'a-decade-of-milestones-keepsakes-foundation',
      'the-art-of-the-considered-gift',
    ],
  },
];

/**
 * Helper to fetch all articles
 */
export function getAllArticles(): EditArticle[] {
  return EDIT_ARTICLES;
}

/**
 * Helper to fetch the single featured article
 */
export function getFeaturedArticle(): EditArticle {
  return EDIT_ARTICLES.find((a) => a.isFeatured) || EDIT_ARTICLES[0];
}

/**
 * Helper to fetch articles by category
 */
export function getArticlesByCategory(categorySlug: string): EditArticle[] {
  if (!categorySlug || categorySlug === 'all') {
    return EDIT_ARTICLES;
  }
  return EDIT_ARTICLES.filter((a) => a.category === categorySlug);
}

/**
 * Helper to find article by slug
 */
export function getArticleBySlug(slug: string): EditArticle | undefined {
  return EDIT_ARTICLES.find((a) => a.slug === slug);
}

/**
 * Helper to find related articles for a given article
 */
export function getRelatedArticles(article: EditArticle, count = 3): EditArticle[] {
  if (article.relatedSlugs && article.relatedSlugs.length > 0) {
    const related = article.relatedSlugs
      .map((slug) => getArticleBySlug(slug))
      .filter((a): a is EditArticle => !!a);
    if (related.length >= count) {
      return related.slice(0, count);
    }
  }

  // Fallback to same category or other articles
  return EDIT_ARTICLES.filter((a) => a.id !== article.id)
    .sort((a) => (a.category === article.category ? -1 : 1))
    .slice(0, count);
}
