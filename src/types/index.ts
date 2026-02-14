export type ShippingType = 'free' | 'fixed' | 'calculated';
export type DiscountType = 'none' | 'priceCut';

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  discountType?: DiscountType;
  discountValue?: number;
  category: string;
  customTag?: string;
  customTagBgColor?: string;
  customTagTextColor?: string;
  imageUrl: string;
  images?: string[];
  inStock?: boolean;
  shippingType?: ShippingType;
  shippingFee?: number;
}

export interface CartItem extends Product {
  quantity: number;
  size?: string;
  color?: string;
}

export interface PaymentDetails {
  sandbox: boolean;
  merchant_id: string;
  return_url: string;
  cancel_url: string;
  notify_url?: string;
  order_id: string;
  items: string;
  amount: string;
  currency: string;
  hash?: string; // Server-generated hash for Checkout API
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
}

export interface CustomerInfo {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  notes?: string;
}

export interface PaymentNotification {
  merchant_id: string;
  order_id: string;
  payment_id: string;
  payhere_amount: string;
  payhere_currency: string;
  status_code: string;
  md5sig: string;
  status_message?: string;
  method?: string;
  card_holder_name?: string;
  card_no?: string;
  card_expiry?: string;
  custom_1?: string;
  custom_2?: string;
}

export interface SanityImageAsset {
  _id: string;
  url: string;
}

export interface SanityImage {
  asset: SanityImageAsset;
}