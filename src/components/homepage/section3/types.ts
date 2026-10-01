/**
 * Types for Section 3 — Shop the Collection Showcase
 */

export interface CategoryItem {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  href: string;
  itemCount?: string;
}

export interface CollectionRowProps {
  id: string;
  categories: CategoryItem[];
  rowNumber: 1 | 2;
  offsetClass?: string;
}
