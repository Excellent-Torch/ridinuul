import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';
import type { Product } from '../types';

const client = createClient({
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID,
  dataset: import.meta.env.VITE_SANITY_DATASET || 'production',
  useCdn: true,
  apiVersion: '2024-12-01', // Updated to a more recent API version
  perspective: 'published', // Explicitly use published content (free tier friendly)
});

const builder = imageUrlBuilder(client);

export const urlFor = (source: SanityImageSource) => builder.image(source);

export const getProducts = async (): Promise<Product[]> => {
  const query = `*[_type == "product"] | order(_createdAt desc) {
    _id,
    name,
    description,
    price,
    category,
    image,
    "imageUrl": image.asset->url,
    inStock
  }`;
  
  return await client.fetch<Product[]>(query);
};

export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  const query = `*[_type == "product" && category == $category] {
    _id,
    name,
    description,
    price,
    category,
    image,
    "imageUrl": image.asset->url,
    inStock
  }`;
  
  return await client.fetch<Product[]>(query, { category });
};

export const searchProducts = async (searchQuery: string): Promise<Product[]> => {
  const query = `*[_type == "product" && name match $searchTerm] {
    _id,
    name,
    description,
    price,
    category,
    image,
    "imageUrl": image.asset->url,
    inStock
  }`;
  
  return await client.fetch<Product[]>(query, { searchTerm: `${searchQuery}*` });
};

export default client;