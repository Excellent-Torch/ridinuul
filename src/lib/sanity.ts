import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';
import type { Product } from '../types';

const client = createClient({
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID,
  dataset: import.meta.env.VITE_SANITY_DATASET || 'production',
  useCdn: true, // CDN for faster, cached responses
  apiVersion: '2024-12-01',
  perspective: 'published',
  stega: { enabled: false }, // Disable stega for smaller payloads
});

const builder = imageUrlBuilder(client);

export const urlFor = (source: SanityImageSource) => builder.image(source);

// Simple in-memory cache with TTL
const cache = new Map<string, { data: Product[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const pendingRequests = new Map<string, Promise<Product[]>>();

const getCached = <T extends Product[]>(key: string): T | null => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  return null;
};

const setCache = (key: string, data: Product[]) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// Deduplicate concurrent requests
const fetchWithCache = async (key: string, fetcher: () => Promise<Product[]>): Promise<Product[]> => {
  // Return cached data if valid
  const cached = getCached(key);
  if (cached) return cached;

  // Dedupe: return existing pending request
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!;
  }

  // Create new request
  const request = fetcher().then(data => {
    setCache(key, data);
    pendingRequests.delete(key);
    return data;
  }).catch(err => {
    pendingRequests.delete(key);
    throw err;
  });

  pendingRequests.set(key, request);
  return request;
};

// Shared projection for consistency and smaller payloads
const productProjection = `{
  _id,
  name,
  description,
  price,
  category,
  "imageUrl": image.asset->url,
  "images": images[].asset->url,
  inStock,
  shippingType,
  shippingFee
}`;

export const getProducts = (): Promise<Product[]> => {
  return fetchWithCache('all-products', () =>
    client.fetch<Product[]>(`*[_type == "product"] | order(_createdAt desc) ${productProjection}`)
  );
};

export const getProductsByCategory = (category: string): Promise<Product[]> => {
  return fetchWithCache(`category-${category}`, () =>
    client.fetch<Product[]>(`*[_type == "product" && category == $category] ${productProjection}`, { category })
  );
};

export const searchProducts = (searchQuery: string): Promise<Product[]> => {
  // Don't cache search results (too variable), but still dedupe
  const key = `search-${searchQuery}`;
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!;
  }

  const request = client.fetch<Product[]>(
    `*[_type == "product" && name match $searchTerm] ${productProjection}`,
    { searchTerm: `${searchQuery}*` }
  ).finally(() => pendingRequests.delete(key));

  pendingRequests.set(key, request);
  return request;
};

// Clear cache (useful for manual refresh)
export const clearProductCache = () => cache.clear();

export default client;