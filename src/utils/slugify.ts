/**
 * Good Things Co. — Slug Generator Utility
 *
 * Converts product titles to URL-friendly, clean slugs:
 * - Converts text to lowercase
 * - Strips accent marks / diacritics
 * - Removes non-alphanumeric characters (except hyphens)
 * - Collapses whitespace and underscores into single hyphens
 * - Removes duplicate hyphens
 * - Trims leading and trailing hyphens
 */

export function slugify(text: string): string {
  if (!text || typeof text !== 'string') return '';

  return text
    .normalize('NFKD') // Normalize accented characters (e.g. é -> e)
    .replace(/[\u0300-\u036f]/g, '') // Strip diacritic marks
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-_]/g, '') // Remove characters that aren't alphanumeric, space, hyphen, underscore
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/-+/g, '-') // Prevent repeated hyphens
    .replace(/^-+|-+$/g, ''); // Trim leading and trailing hyphens
}

/**
 * Validates if a string conforms to slug standards
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
