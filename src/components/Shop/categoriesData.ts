/**
 * Category Configuration Data — Good Things Co. Shop
 *
 * Full 7-category taxonomy requested for the Shop destination:
 * 1. Gifts
 * 2. Souvenirs
 * 3. Home & Living
 * 4. Fashion
 * 5. Stationery
 * 6. Accessories
 * 7. Treats
 */

export interface CategoryDefinition {
  id: string;
  title: string;
  searchQuery: string;
  description: string;
  link: string;
  fallbackImageUrl: string;
  fallbackAlt: string;
  fallbackPhotographer: {
    name: string;
    url: string;
  };
}

export const SHOP_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'gifts',
    title: 'Gifts',
    searchQuery: 'luxury wrapped gift aesthetic',
    description: 'Thoughtfully curated gift boxes and bundles for meaningful celebrations.',
    link: '/shop/gifts',
    fallbackImageUrl:
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=900&auto=format&fit=crop&q=82',
    fallbackAlt: 'Artisanal gift box with silk ribbon and dried botanicals',
    fallbackPhotographer: {
      name: 'Joanna Kosinska',
      url: 'https://unsplash.com/@joannakosinska?utm_source=good_things_co&utm_medium=referral',
    },
  },
  {
    id: 'souvenirs',
    title: 'Souvenirs',
    searchQuery: 'artisanal souvenir handcrafted object',
    description: 'Memorable city tokens, handcrafted curios, and timeless keepsakes.',
    link: '/shop/souvenirs',
    fallbackImageUrl:
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=900&auto=format&fit=crop&q=82',
    fallbackAlt: 'Handcrafted artisan ceramic curio in warm architectural setting',
    fallbackPhotographer: {
      name: 'Mathilde Langevin',
      url: 'https://unsplash.com/@mathildelangevin?utm_source=good_things_co&utm_medium=referral',
    },
  },
  {
    id: 'home-living',
    title: 'Home',
    searchQuery: 'sunlit neutral home interior',
    description: 'Textiles, ceramics, and timeless accents for serene living spaces.',
    link: '/shop/home',
    fallbackImageUrl:
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=900&auto=format&fit=crop&q=82',
    fallbackAlt: 'Sunlit neutral minimalist living room with sculpted ceramic decor',
    fallbackPhotographer: {
      name: 'Spacejoy',
      url: 'https://unsplash.com/@spacejoy?utm_source=good_things_co&utm_medium=referral',
    },
  },
  {
    id: 'fashion',
    title: 'Fashion',
    searchQuery: 'minimal luxury linen clothing editorial',
    description: 'Understated linen loungewear, artisanal scarves, and everyday staples.',
    link: '/shop/fashion',
    fallbackImageUrl:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&auto=format&fit=crop&q=82',
    fallbackAlt: 'Editorial minimalist fashion apparel in natural light',
    fallbackPhotographer: {
      name: 'Dom Hill',
      url: 'https://unsplash.com/@domhill?utm_source=good_things_co&utm_medium=referral',
    },
  },
  {
    id: 'stationery',
    title: 'Stationery',
    searchQuery: 'journal notebook editorial desk',
    description: 'Fine linen-bound notebooks, brass implements, and desk essentials.',
    link: '/shop/stationery',
    fallbackImageUrl:
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=900&auto=format&fit=crop&q=82',
    fallbackAlt: 'Editorial desk arrangement with linen notebook and brass pen',
    fallbackPhotographer: {
      name: 'Green Chameleon',
      url: 'https://unsplash.com/@craftedbygc?utm_source=good_things_co&utm_medium=referral',
    },
  },
  {
    id: 'accessories',
    title: 'Accessories',
    searchQuery: 'minimal luxury jewelry accessories editorial',
    description: 'Everyday carry, understated jewelry, and refined leather details.',
    link: '/shop/accessories',
    fallbackImageUrl:
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=900&auto=format&fit=crop&q=82',
    fallbackAlt: 'Minimalist fine jewelry and lifestyle accessories on warm neutral surface',
    fallbackPhotographer: {
      name: 'Maddi Bazzocco',
      url: 'https://unsplash.com/@maddibazzocco?utm_source=good_things_co&utm_medium=referral',
    },
  },
  {
    id: 'treats',
    title: 'Treats',
    searchQuery: 'artisan chocolate confectionery gourmet tea',
    description: 'Single-origin artisan chocolates, loose-leaf teas, and gourmet delicacies.',
    link: '/shop/treats',
    fallbackImageUrl:
      'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=900&auto=format&fit=crop&q=82',
    fallbackAlt: 'Handcrafted artisan chocolates and gourmet confectionery',
    fallbackPhotographer: {
      name: 'Jessica Loaiza',
      url: 'https://unsplash.com/@jessicaloaiza?utm_source=good_things_co&utm_medium=referral',
    },
  },
];
