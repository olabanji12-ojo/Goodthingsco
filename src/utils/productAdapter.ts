/**
 * Good Things Co. — Product Adapter
 *
 * Adapts Firestore Product documents into the frontend GiftItem interface.
 * Connects live Cloudinary images, pricing, and gifting taxonomy to the Shop flow.
 */

import { Product } from '../types/product';
import { GiftItem, OccasionId, RecipientGroupId } from '../data/giftsData';
import { getProductImageUrl } from '../services/cloudinaryService';

export function adaptProductToGiftItem(product: Product): GiftItem {
  const imageUrl =
    product.images && product.images.length > 0
      ? getProductImageUrl(product.images[0])
      : 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80';

  // Map canonical budgetRange to UI budgetTier
  let budgetTier: 'under-25k' | '25k-50k' | '50k-100k' | 'premium' = '25k-50k';
  if (product.budgetRange === 'under-25000') budgetTier = 'under-25k';
  else if (product.budgetRange === '25000-50000') budgetTier = '25k-50k';
  else if (product.budgetRange === '50000-100000') budgetTier = '50k-100k';
  else if (product.budgetRange === '100000-plus') budgetTier = 'premium';

  // Occasions array
  const occasions = (product.occasions || []) as OccasionId[];

  // Determine primary recipient
  const firstRec = product.recipients?.[0]?.toLowerCase() || 'her';
  let primaryRecipient: RecipientGroupId = 'her';
  if (['her', 'him', 'family', 'friend', 'business', 'self'].includes(firstRec)) {
    primaryRecipient = firstRec as RecipientGroupId;
  } else if (
    [
      'mum',
      'dad',
      'husband',
      'wife',
      'sister',
      'brother',
      'daughter',
      'son',
      'grandparent',
      'aunt',
      'uncle',
      'cousin',
    ].includes(firstRec)
  ) {
    primaryRecipient = 'family';
  } else if (
    ['colleague', 'boss', 'client', 'employee', 'team', 'business-partner'].includes(firstRec)
  ) {
    primaryRecipient = 'business';
  }

  return {
    id: product.id || product.slug,
    title: product.name,
    subtitle: product.category || 'Atelier Curation',
    price: product.price,
    formattedPrice: `₦${product.price.toLocaleString()}`,
    image: imageUrl,
    alt: product.name,
    occasions,
    primaryRecipient,
    subRecipients: product.recipients || [],
    budgetTier,
    description: product.description,
    included:
      product.packagingOptions && product.packagingOptions.length > 0
        ? product.packagingOptions
        : ['Signature Gift Box', 'Handwritten Card', 'Artisanal Keepsake'],
    badge: product.featured ? 'Featured' : undefined,
    slug: product.slug,
    rawProduct: product,
  };
}
