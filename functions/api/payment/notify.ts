// Cloudflare Pages Function - PayHere Payment Notification Handler
// This receives IPN (Instant Payment Notification) from PayHere

interface Env {
  PAYHERE_MERCHANT_ID: string;
  PAYHERE_MERCHANT_SECRET: string;
  // Optional: Add KV namespace for order storage
  // ORDERS: KVNamespace;
}

interface PayHereNotification {
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

/**
 * MD5 hash implementation for Cloudflare Workers
 */
function md5(string: string): string {
  function rotateLeft(value: number, shift: number): number {
    return (value << shift) | (value >>> (32 - shift));
  }

  function addUnsigned(x: number, y: number): number {
    const x8 = x & 0x80000000;
    const y8 = y & 0x80000000;
    const x4 = x & 0x40000000;
    const y4 = y & 0x40000000;
    const result = (x & 0x3fffffff) + (y & 0x3fffffff);
    if (x4 & y4) return result ^ 0x80000000 ^ x8 ^ y8;
    if (x4 | y4) {
      if (result & 0x40000000) return result ^ 0xc0000000 ^ x8 ^ y8;
      return result ^ 0x40000000 ^ x8 ^ y8;
    }
    return result ^ x8 ^ y8;
  }

  function f(x: number, y: number, z: number): number {
    return (x & y) | (~x & z);
  }
  function g(x: number, y: number, z: number): number {
    return (x & z) | (y & ~z);
  }
  function h(x: number, y: number, z: number): number {
    return x ^ y ^ z;
  }
  function i(x: number, y: number, z: number): number {
    return y ^ (x | ~z);
  }

  function ff(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(f(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(g(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(h(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(i(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function convertToWordArray(str: string): number[] {
    let wordCount: number;
    const messageLength = str.length;
    const temp1 = messageLength + 8;
    const temp2 = (temp1 - (temp1 % 64)) / 64;
    const numberOfWords = (temp2 + 1) * 16;
    const wordArray: number[] = Array(numberOfWords - 1).fill(0);
    let bytePosition = 0;
    let byteCount = 0;
    while (byteCount < messageLength) {
      wordCount = (byteCount - (byteCount % 4)) / 4;
      bytePosition = (byteCount % 4) * 8;
      wordArray[wordCount] = wordArray[wordCount] | (str.charCodeAt(byteCount) << bytePosition);
      byteCount++;
    }
    wordCount = (byteCount - (byteCount % 4)) / 4;
    bytePosition = (byteCount % 4) * 8;
    wordArray[wordCount] = wordArray[wordCount] | (0x80 << bytePosition);
    wordArray[numberOfWords - 2] = messageLength << 3;
    wordArray[numberOfWords - 1] = messageLength >>> 29;
    return wordArray;
  }

  function wordToHex(value: number): string {
    let hex = '';
    for (let i = 0; i <= 3; i++) {
      const byte = (value >>> (i * 8)) & 255;
      const hexByte = '0' + byte.toString(16);
      hex += hexByte.substr(hexByte.length - 2, 2);
    }
    return hex;
  }

  const x = convertToWordArray(string);
  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;

  const S11 = 7, S12 = 12, S13 = 17, S14 = 22;
  const S21 = 5, S22 = 9, S23 = 14, S24 = 20;
  const S31 = 4, S32 = 11, S33 = 16, S34 = 23;
  const S41 = 6, S42 = 10, S43 = 15, S44 = 21;

  for (let k = 0; k < x.length; k += 16) {
    const AA = a, BB = b, CC = c, DD = d;
    a = ff(a, b, c, d, x[k], S11, 0xd76aa478);
    d = ff(d, a, b, c, x[k + 1], S12, 0xe8c7b756);
    c = ff(c, d, a, b, x[k + 2], S13, 0x242070db);
    b = ff(b, c, d, a, x[k + 3], S14, 0xc1bdceee);
    a = ff(a, b, c, d, x[k + 4], S11, 0xf57c0faf);
    d = ff(d, a, b, c, x[k + 5], S12, 0x4787c62a);
    c = ff(c, d, a, b, x[k + 6], S13, 0xa8304613);
    b = ff(b, c, d, a, x[k + 7], S14, 0xfd469501);
    a = ff(a, b, c, d, x[k + 8], S11, 0x698098d8);
    d = ff(d, a, b, c, x[k + 9], S12, 0x8b44f7af);
    c = ff(c, d, a, b, x[k + 10], S13, 0xffff5bb1);
    b = ff(b, c, d, a, x[k + 11], S14, 0x895cd7be);
    a = ff(a, b, c, d, x[k + 12], S11, 0x6b901122);
    d = ff(d, a, b, c, x[k + 13], S12, 0xfd987193);
    c = ff(c, d, a, b, x[k + 14], S13, 0xa679438e);
    b = ff(b, c, d, a, x[k + 15], S14, 0x49b40821);
    a = gg(a, b, c, d, x[k + 1], S21, 0xf61e2562);
    d = gg(d, a, b, c, x[k + 6], S22, 0xc040b340);
    c = gg(c, d, a, b, x[k + 11], S23, 0x265e5a51);
    b = gg(b, c, d, a, x[k], S24, 0xe9b6c7aa);
    a = gg(a, b, c, d, x[k + 5], S21, 0xd62f105d);
    d = gg(d, a, b, c, x[k + 10], S22, 0x2441453);
    c = gg(c, d, a, b, x[k + 15], S23, 0xd8a1e681);
    b = gg(b, c, d, a, x[k + 4], S24, 0xe7d3fbc8);
    a = gg(a, b, c, d, x[k + 9], S21, 0x21e1cde6);
    d = gg(d, a, b, c, x[k + 14], S22, 0xc33707d6);
    c = gg(c, d, a, b, x[k + 3], S23, 0xf4d50d87);
    b = gg(b, c, d, a, x[k + 8], S24, 0x455a14ed);
    a = gg(a, b, c, d, x[k + 13], S21, 0xa9e3e905);
    d = gg(d, a, b, c, x[k + 2], S22, 0xfcefa3f8);
    c = gg(c, d, a, b, x[k + 7], S23, 0x676f02d9);
    b = gg(b, c, d, a, x[k + 12], S24, 0x8d2a4c8a);
    a = hh(a, b, c, d, x[k + 5], S31, 0xfffa3942);
    d = hh(d, a, b, c, x[k + 8], S32, 0x8771f681);
    c = hh(c, d, a, b, x[k + 11], S33, 0x6d9d6122);
    b = hh(b, c, d, a, x[k + 14], S34, 0xfde5380c);
    a = hh(a, b, c, d, x[k + 1], S31, 0xa4beea44);
    d = hh(d, a, b, c, x[k + 4], S32, 0x4bdecfa9);
    c = hh(c, d, a, b, x[k + 7], S33, 0xf6bb4b60);
    b = hh(b, c, d, a, x[k + 10], S34, 0xbebfbc70);
    a = hh(a, b, c, d, x[k + 13], S31, 0x289b7ec6);
    d = hh(d, a, b, c, x[k], S32, 0xeaa127fa);
    c = hh(c, d, a, b, x[k + 3], S33, 0xd4ef3085);
    b = hh(b, c, d, a, x[k + 6], S34, 0x4881d05);
    a = hh(a, b, c, d, x[k + 9], S31, 0xd9d4d039);
    d = hh(d, a, b, c, x[k + 12], S32, 0xe6db99e5);
    c = hh(c, d, a, b, x[k + 15], S33, 0x1fa27cf8);
    b = hh(b, c, d, a, x[k + 2], S34, 0xc4ac5665);
    a = ii(a, b, c, d, x[k], S41, 0xf4292244);
    d = ii(d, a, b, c, x[k + 7], S42, 0x432aff97);
    c = ii(c, d, a, b, x[k + 14], S43, 0xab9423a7);
    b = ii(b, c, d, a, x[k + 5], S44, 0xfc93a039);
    a = ii(a, b, c, d, x[k + 12], S41, 0x655b59c3);
    d = ii(d, a, b, c, x[k + 3], S42, 0x8f0ccc92);
    c = ii(c, d, a, b, x[k + 10], S43, 0xffeff47d);
    b = ii(b, c, d, a, x[k + 1], S44, 0x85845dd1);
    a = ii(a, b, c, d, x[k + 8], S41, 0x6fa87e4f);
    d = ii(d, a, b, c, x[k + 15], S42, 0xfe2ce6e0);
    c = ii(c, d, a, b, x[k + 6], S43, 0xa3014314);
    b = ii(b, c, d, a, x[k + 13], S44, 0x4e0811a1);
    a = ii(a, b, c, d, x[k + 4], S41, 0xf7537e82);
    d = ii(d, a, b, c, x[k + 11], S42, 0xbd3af235);
    c = ii(c, d, a, b, x[k + 2], S43, 0x2ad7d2bb);
    b = ii(b, c, d, a, x[k + 9], S44, 0xeb86d391);
    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }

  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toUpperCase();
}

// Payment status codes from PayHere
const PAYMENT_STATUS = {
  SUCCESS: '2',
  PENDING: '0',
  CANCELED: '-1',
  FAILED: '-2',
  CHARGEDBACK: '-3',
} as const;

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const formData = await context.request.formData();

    // Extract notification data
    const notification: PayHereNotification = {
      merchant_id: formData.get('merchant_id') as string,
      order_id: formData.get('order_id') as string,
      payment_id: formData.get('payment_id') as string,
      payhere_amount: formData.get('payhere_amount') as string,
      payhere_currency: formData.get('payhere_currency') as string,
      status_code: formData.get('status_code') as string,
      md5sig: formData.get('md5sig') as string,
      status_message: (formData.get('status_message') as string) || undefined,
      method: (formData.get('method') as string) || undefined,
      card_holder_name: (formData.get('card_holder_name') as string) || undefined,
      card_no: (formData.get('card_no') as string) || undefined,
      card_expiry: (formData.get('card_expiry') as string) || undefined,
      custom_1: (formData.get('custom_1') as string) || undefined,
      custom_2: (formData.get('custom_2') as string) || undefined,
    };

    const merchant_secret = context.env.PAYHERE_MERCHANT_SECRET;
    const expected_merchant_id = context.env.PAYHERE_MERCHANT_ID;

    // Verify merchant ID matches
    if (notification.merchant_id !== expected_merchant_id) {
      console.error('Merchant ID mismatch');
      return new Response('Invalid merchant', { status: 400 });
    }

    // Verify the MD5 signature
    // md5sig = strtoupper(md5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + strtoupper(md5(merchant_secret))))
    const secretHash = md5(merchant_secret);
    const localSigString =
      notification.merchant_id +
      notification.order_id +
      notification.payhere_amount +
      notification.payhere_currency +
      notification.status_code +
      secretHash;
    const localMd5Sig = md5(localSigString);

    if (localMd5Sig !== notification.md5sig) {
      console.error('MD5 signature verification failed');
      console.error('Expected:', localMd5Sig);
      console.error('Received:', notification.md5sig);
      return new Response('Invalid signature', { status: 400 });
    }

    // Process based on status code
    const orderId = notification.order_id;
    const paymentId = notification.payment_id;
    const statusCode = notification.status_code;

    console.log(`Payment notification received for order ${orderId}`);
    console.log(`Payment ID: ${paymentId}`);
    console.log(`Status: ${statusCode} - ${notification.status_message || getStatusMessage(statusCode)}`);
    console.log(`Amount: ${notification.payhere_amount} ${notification.payhere_currency}`);

    switch (statusCode) {
      case PAYMENT_STATUS.SUCCESS:
        // Payment successful - fulfill the order
        console.log(`✅ Payment SUCCESS for order ${orderId}`);
        // TODO: Update order status in your database
        // TODO: Send confirmation email
        // TODO: Update inventory

        // Example: Store in KV (if configured)
        // await context.env.ORDERS?.put(orderId, JSON.stringify({
        //   status: 'paid',
        //   payment_id: paymentId,
        //   amount: notification.payhere_amount,
        //   currency: notification.payhere_currency,
        //   paid_at: new Date().toISOString(),
        // }));
        break;

      case PAYMENT_STATUS.PENDING:
        console.log(`⏳ Payment PENDING for order ${orderId}`);
        // Authorization successful, payment pending
        break;

      case PAYMENT_STATUS.CANCELED:
        console.log(`❌ Payment CANCELED for order ${orderId}`);
        // Customer canceled the payment
        break;

      case PAYMENT_STATUS.FAILED:
        console.log(`❌ Payment FAILED for order ${orderId}`);
        // Payment failed
        break;

      case PAYMENT_STATUS.CHARGEDBACK:
        console.log(`⚠️ Payment CHARGEDBACK for order ${orderId}`);
        // Customer disputed the payment
        break;

      default:
        console.log(`Unknown status code: ${statusCode}`);
    }

    // PayHere expects a 200 OK response
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Payment notification error:', error);
    return new Response('Error processing notification', { status: 500 });
  }
};

function getStatusMessage(statusCode: string): string {
  switch (statusCode) {
    case '2':
      return 'Success';
    case '0':
      return 'Pending';
    case '-1':
      return 'Canceled';
    case '-2':
      return 'Failed';
    case '-3':
      return 'Chargedback';
    default:
      return 'Unknown';
  }
}

// Handle preflight requests
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
