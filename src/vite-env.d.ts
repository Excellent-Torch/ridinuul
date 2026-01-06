/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SANITY_PROJECT_ID: string;
  readonly VITE_SANITY_DATASET: string;
  readonly VITE_PAYHERE_MERCHANT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}