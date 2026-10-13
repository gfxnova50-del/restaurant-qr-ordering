import Razorpay from 'razorpay';
import crypto from 'crypto';

/**
 * Returns a singleton or new Razorpay client instance.
 */
export function getRazorpayClient() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error('Razorpay credentials (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are missing');
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
}

/**
 * Verifies Razorpay Webhook Signature using HMAC SHA-256
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
  webhookSecret: string
): boolean {
  if (!rawBody || !signature || !webhookSecret) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  // Use timingSafeEqual to avoid timing attacks
  const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');
  const actualBuffer = Buffer.from(signature, 'utf-8');

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

/**
 * Helper to create a Razorpay order for an application order
 */
export async function createRazorpayOrder({
  amount,
  currency = 'INR',
  receipt,
  notes,
}: {
  amount: number; // in standard currency units, e.g. 280.00
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}) {
  const razorpay = getRazorpayClient();

  // Razorpay amounts are represented in the smallest currency sub-unit (e.g. 1 INR = 100 paise)
  const amountInSubunits = Math.round(amount * 100);

  const order = await razorpay.orders.create({
    amount: amountInSubunits,
    currency,
    receipt: receipt.substring(0, 40), // Razorpay limits receipt to 40 characters
    notes: notes || {},
  });

  return order;
}
