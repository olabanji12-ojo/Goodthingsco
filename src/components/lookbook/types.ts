export type RoomId = 'welcome' | 'shop' | 'gifts' | 'souvenirs' | 'create' | 'finale';

export interface RoomMeta {
  index: number;
  id: RoomId;
  number: string;
  name: string;
  subtitle: string;
}

export const LOOKBOOK_ROOMS: RoomMeta[] = [
  { index: 0, id: 'welcome', number: '01', name: 'Welcome', subtitle: 'Thoughtful Living' },
  { index: 1, id: 'shop', number: '02', name: 'Shop', subtitle: 'For Me' },
  { index: 2, id: 'gifts', number: '03', name: 'Gifts', subtitle: 'For Someone' },
  { index: 3, id: 'souvenirs', number: '04', name: 'Souvenirs', subtitle: 'For Events' },
  { index: 4, id: 'create', number: '05', name: 'Create', subtitle: 'Something Custom' },
  { index: 5, id: 'finale', number: '06', name: 'Finale', subtitle: 'Closing CTA' },
];

export interface TeaserProduct {
  id: string;
  name: string;
  category: string;
  price: string;
  badge?: string;
  image: string;
  description: string;
}

export interface ShopCategory {
  id: string;
  name: string;
  description: string;
  itemCount: string;
}

export interface ShopProduct {
  id: string;
  categoryId: string;
  name: string;
  subtitle: string;
  price: string;
  image: string;
  tag?: string;
}

export interface GiftFilterItem {
  id: string;
  lens: 'occasion' | 'recipient' | 'corporate';
  label: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  priceRange: string;
  items: string[];
}

export interface SouvenirPackage {
  id: string;
  event: 'weddings' | 'birthdays' | 'funerals' | 'celebrations';
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  startingPrice: string;
  image: string;
}

export interface CreateService {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  turnaround: string;
}
