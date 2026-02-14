import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { CartItem, DiscountType, ShippingType } from "../types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Shipping utilities
export const getShippingLabel = (shippingType?: ShippingType, shippingFee?: number): string => {
  if (!shippingType || shippingType === 'free') return 'Free Shipping';
  if (shippingType === 'fixed' && shippingFee !== undefined) {
    return shippingFee === 0 ? 'Free Shipping' : `LKR ${shippingFee.toLocaleString()}`;
  }
  if (shippingType === 'calculated') return 'Calculated at checkout';
  return 'Free Shipping';
};

export const getItemShippingFee = (item: CartItem): number => {
  if (!item.shippingType || item.shippingType === 'free') return 0;
  if (item.shippingType === 'fixed') return item.shippingFee ?? 0;
  return 0; // 'calculated' handled separately if needed
};

export const calculateShippingTotal = (cart: CartItem[]): number => {
  // Get unique products by base ID (without size/color variants)
  const uniqueProducts = new Map<string, CartItem>();
  
  for (const item of cart) {
    // Extract base product ID (remove size/color suffix)
    const baseId = item._id.split('-')[0];
    
    // Only count shipping once per unique product (not per variant)
    if (!uniqueProducts.has(baseId)) {
      uniqueProducts.set(baseId, item);
    }
  }
  
  // Calculate total shipping for unique products
  return Array.from(uniqueProducts.values()).reduce((total, item) => {
    return total + getItemShippingFee(item);
  }, 0);
};

export const hasAnyShippingFee = (cart: CartItem[]): boolean => {
  return cart.some(item => getItemShippingFee(item) > 0);
};

export const getDiscountedPrice = (
  price: number,
  discountType?: DiscountType,
  discountValue?: number
): number => {
  if (discountType !== 'priceCut') return price;
  const reduction = discountValue ?? 0;
  if (reduction <= 0) return price;
  return Math.max(price - reduction, 0);
};

export const isPriceCutDiscount = (discountType?: DiscountType, discountValue?: number): boolean => {
  return discountType === 'priceCut' && (discountValue ?? 0) > 0;
};

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
