import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/webhook
 * Receives Razorpay webhook events, verifies HMAC signature,
 * and updates order payment_status to 'paid'.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET is not configured');
      return NextResponse.json(
        { error: 'Webhook secret is not configured on server' },
        { status: 500 }
      );
    }

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing x-razorpay-signature header' },
        { status: 400 }
      );
    }

    // 1. Verify Razorpay HMAC signature
    const isValid = verifyRazorpayWebhookSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      console.warn('Invalid Razorpay webhook signature detected');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    // 2. Parse payload
    const event = JSON.parse(rawBody);
    const eventType: string = event.event;

    console.log(`[Razorpay Webhook] Received event: ${eventType}`);

    // We handle 'payment.captured' and 'order.paid' events
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = event.payload?.payment?.entity;
      const orderEntity = event.payload?.order?.entity;

      const razorpayOrderId: string | undefined =
        orderEntity?.id || paymentEntity?.order_id;
      const razorpayPaymentId: string | undefined =
        paymentEntity?.id;
      const appOrderId: string | undefined =
        orderEntity?.notes?.order_id || paymentEntity?.notes?.order_id;

      const supabase = createAdminClient();

      // Find order either by razorpay_order_id or internal order_id in notes
      let query = supabase.from('orders').select('id, payment_status, total_amount');

      if (razorpayOrderId) {
        query = query.eq('razorpay_order_id', razorpayOrderId);
      } else if (appOrderId) {
        query = query.eq('id', appOrderId);
      } else {
        console.warn('[Razorpay Webhook] Neither razorpay_order_id nor notes.order_id found in event');
        return NextResponse.json({ received: true, warning: 'Unmatched order identifier' });
      }

      const { data: order, error: findError } = await query.maybeSingle();

      if (findError || !order) {
        console.warn(`[Razorpay Webhook] Order not found for Razorpay order: ${razorpayOrderId}`);
        return NextResponse.json({ received: true, warning: 'Order not found' });
      }

      const matchedOrder = order as unknown as { id: string; payment_status: string; total_amount: number };

      // Mark payment_status as paid
      const { error: updateError } = await (supabase
        .from('orders') as any)
        .update({
          payment_status: 'paid',
          payment_method: 'online',
          razorpay_payment_id: razorpayPaymentId || null,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', matchedOrder.id);

      if (updateError) {
        console.error(`[Razorpay Webhook] Error updating payment status for order ${matchedOrder.id}:`, updateError);
        return NextResponse.json(
          { error: 'Database update failed', details: updateError.message },
          { status: 500 }
        );
      }

      console.log(`[Razorpay Webhook] Successfully marked order ${matchedOrder.id} as paid!`);
    }

    return NextResponse.json({ status: 'success', received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('[Razorpay Webhook] Unexpected exception:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
