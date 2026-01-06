// Type definitions for Cloudflare Pages Functions

interface Env {
  PAYHERE_MERCHANT_ID: string;
  PAYHERE_MERCHANT_SECRET: string;
  // Add more environment variables as needed
  // ORDERS?: KVNamespace; // Uncomment if using KV for order storage
}

// Extend the PagesFunction type
declare global {
  type PagesFunction<E = Env> = (
    context: EventContext<E, string, Record<string, unknown>>
  ) => Response | Promise<Response>;
}

export {};
