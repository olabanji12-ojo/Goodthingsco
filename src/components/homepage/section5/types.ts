/**
 * Types for Section 5 — Create Something Special (Bespoke Story)
 */

export interface CreateStoryStep {
  id: string;
  stepNumber: string;
  label: string; // '01 — Before' | '02 — Crafted' | '03 — Finished'
  title: string;
  image: string;
  alt: string;
  caption: string;
  aspectClass: string;
  sizeClass: string;
}

export interface BespokeCategoryTag {
  id: string;
  label: string;
  href: string;
}

export interface BespokePillar {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  tag: string;
  href: string;
}

