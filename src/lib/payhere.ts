import type { CartItem, PaymentDetails } from '../types';

interface PayHereWindow extends Window {
  payhere?: {
    startPayment: (payment: PaymentDetails) => void;
    onCompleted: (orderId: string) => void;
    onDismissed: () => void;
    onError: (error: string) => void;
  };
}

declare const window: PayHereWindow;

interface CustomerInfo {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
}

interface InitiatePaymentResponse {
  sandbox: boolean;
  merchant_id: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  order_id: string;
  items: string;
  amount: string;
  currency: string;
  hash: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
}

let payhereLoaded = false;

/**
 * Load the PayHere checkout script
 */
const loadPayHere = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (payhereLoaded && window.payhere) {
      resolve();
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="payhere"]');
    if (existingScript) {
      payhereLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.payhere.lk/lib/payhere.js';
    script.async = true;

    script.onload = () => {
      payhereLoaded = true;
      resolve();
    };

    script.onerror = () => {
      reject(new Error('Failed to load PayHere script'));
    };

    document.head.appendChild(script);
  });
};

/**
 * Generate a unique order ID
 */
const generateOrderId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD_${timestamp}_${random}`;
};

/**
 * Get the API base URL (for Cloudflare Pages Functions)
 */
const getApiBaseUrl = (): string => {
  // In production (Cloudflare Pages), use relative URLs
  // The functions are served from the same origin
  return '';
};

/**
 * Request payment details from server (includes secure hash generation)
 */
const getPaymentDetails = async (
  cart: CartItem[],
  total: number,
  customerInfo: CustomerInfo
): Promise<InitiatePaymentResponse> => {
  const orderId = generateOrderId();
  const items = cart.map((item) => `${item.name} x${item.quantity}`).join(', ');

  const response = await fetch(`${getApiBaseUrl()}/api/payment/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      order_id: orderId,
      amount: total.toString(),
      currency: 'LKR',
      items,
      first_name: customerInfo.first_name,
      last_name: customerInfo.last_name,
      email: customerInfo.email,
      phone: customerInfo.phone,
      address: customerInfo.address,
      city: customerInfo.city,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as { error?: string }).error || 'Failed to initiate payment'
    );
  }

  return response.json();
};

/**
 * Initiate payment with PayHere Checkout API
 * Uses server-side hash generation for security
 */
export const initiatePayment = async (
  cart: CartItem[],
  total: number,
  onSuccess: () => void,
  customerInfo?: CustomerInfo
): Promise<void> => {
  try {
    // Load PayHere script
    await loadPayHere();

    if (!window.payhere) {
      throw new Error('PayHere not loaded');
    }

    // Use provided customer info or defaults for testing
    const customer: CustomerInfo = customerInfo || {
      first_name: 'Customer',
      last_name: 'Name',
      email: 'customer@example.com',
      phone: '0771234567',
      address: 'No. 1, Example Street',
      city: 'Colombo',
    };

    // Get payment details with secure hash from server
    const paymentData = await getPaymentDetails(cart, total, customer);

    // Set up callbacks
    window.payhere.onCompleted = function (orderId: string) {
      console.log('Payment completed. OrderID:', orderId);
      onSuccess();
    };

    window.payhere.onDismissed = function () {
      console.log('Payment dismissed by user');
    };

    window.payhere.onError = function (error: string) {
      console.error('Payment error:', error);
      alert('Payment error occurred. Please try again.');
    };

    // Start payment with server-generated hash
    const payment: PaymentDetails = {
      sandbox: paymentData.sandbox,
      merchant_id: paymentData.merchant_id,
      return_url: paymentData.return_url,
      cancel_url: paymentData.cancel_url,
      notify_url: paymentData.notify_url,
      order_id: paymentData.order_id,
      items: paymentData.items,
      amount: paymentData.amount,
      currency: paymentData.currency,
      hash: paymentData.hash,
      first_name: paymentData.first_name,
      last_name: paymentData.last_name,
      email: paymentData.email,
      phone: paymentData.phone,
      address: paymentData.address,
      city: paymentData.city,
      country: paymentData.country,
    };

    window.payhere.startPayment(payment);
  } catch (error) {
    console.error('PayHere initialization failed:', error);
    throw error;
  }
};

/**
 * Check payment status (optional - for order tracking)
 */
export const checkPaymentStatus = async (orderId: string): Promise<unknown> => {
  const response = await fetch(
    `${getApiBaseUrl()}/api/payment/status?order_id=${encodeURIComponent(orderId)}`
  );

  if (!response.ok) {
    throw new Error('Failed to check payment status');
  }

  return response.json();
};