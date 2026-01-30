import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type CategorizeMethod = 'price' | 'availability' | 'category' | 'none';

export function categorizeProducts<T extends { price?: number; inStock?: boolean; category?: string }>(
  products: T[],
  method: CategorizeMethod = 'price'
): Record<string, T[]> {
  if (!products || products.length === 0) return {};

  if (method === 'availability') {
    return products.reduce<Record<string, T[]>>((acc, p) => {
      const key = p.inStock === false ? 'Out of Stock' : 'In Stock';
      (acc[key] ||= []).push(p);
      return acc;
    }, {});
  }

  if (method === 'category') {
    return products.reduce<Record<string, T[]>>((acc, p) => {
      const key = (p.category && String(p.category)) || 'Uncategorized';
      (acc[key] ||= []).push(p);
      return acc;
    }, {});
  }

  // price buckets
  const buckets: { label: string; test: (p: T) => boolean }[] = [
    { label: 'Under 2,000', test: (p) => (p.price ?? 0) < 2000 },
    { label: '2,000 - 4,999', test: (p) => (p.price ?? 0) >= 2000 && (p.price ?? 0) < 5000 },
    { label: '5,000 - 9,999', test: (p) => (p.price ?? 0) >= 5000 && (p.price ?? 0) < 10000 },
    { label: '10,000+', test: (p) => (p.price ?? 0) >= 10000 },
  ];

  const result: Record<string, T[]> = {};
  for (const p of products) {
    const bucket = buckets.find(b => b.test(p));
    const key = bucket ? bucket.label : 'Unpriced';
    (result[key] ||= []).push(p);
  }
  return result;
}
