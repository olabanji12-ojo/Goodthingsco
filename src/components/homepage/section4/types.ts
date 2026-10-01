/**
 * Types for Section 4 — Gift Discovery
 */

export type DiscoveryGroupId = 'occasion' | 'recipient' | 'feeling' | 'corporate';

export interface DiscoveryItem {
  id: string;
  groupId: DiscoveryGroupId;
  groupName: string;
  label: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  href: string;
  ctaText?: string;
}

export interface DiscoveryGroup {
  id: DiscoveryGroupId;
  name: string;
  items: DiscoveryItem[];
}

