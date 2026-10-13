import { NextRequest, NextResponse } from 'next/server';
import { createPaymentSchema } from '@/lib/validations/order';
import { createAdminClient } from '@/lib/supabase/admin';
import { createRazorpayOrder } from '@/lib/razorpay';
import { ZodError } from 'zod';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/create
 * Creates a Razorpay order for a given order ID.
 * Returns the razorpay_order_id and client configuration for Razorpay Checkout.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Validate request body
    const parsed = createPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { order_id } = parsed.data;
    const supabase = createAdminClient();

    // 2. Fetch the order and restaurant details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        restaurant_id,
        table_id,
        total_amount,
        status,
        payment_status,
        razorpay_order_id,
        restaurants (
          name,
          currency,
          accepts_online_payment
        ),
        tables (
          table_number
        )
      `)
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    interface OrderWithRestaurant {
      id: string;
      restaurant_id: string;
      table_id: string;
      total_amount: number;
      status: string;
      payment_status: string;
      razorpay_order_id: string | null;
      restaurants: {
        name: string;
        currency: string;
        accepts_online_payment: boolean;
      } | {
        name: string;
        currency: string;
        accepts_online_payment: boolean;
      }[];
      tables: {
        table_number: string;
      } | {
        table_number: string;
      }[];
    }

    const currentOrder = order as unknown as OrderWithRestaurant;

    // 3. Verify order state
    if (currentOrder.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot initiate payment for a cancelled order' },
        { status: 400 }
      );
    }

    if (currentOrder.payment_status === 'paid') {
      return NextResponse.json(
        { error: 'Order has already been paid' },
        { status: 400 }
      );
    }

    const restaurant = Array.isArray(currentOrder.restaurants)
      ? currentOrder.restaurants[0]
      : currentOrder.restaurants;

    if (!restaurant?.accepts_online_payment) {
      return NextResponse.json(
        { error: 'This restaurant does not accept online payments' },
        { status: 400 }
      );
    }

    const currency = restaurant.currency || 'INR';

    // 4. Create Razorpay order
    const razorpayOrder = await createRazorpayOrder({
      amount: Number(currentOrder.total_amount),
      currency,
      receipt: `order_${currentOrder.id}`,
      notes: {
        order_id: currentOrder.id,
        restaurant_id: currentOrder.restaurant_id,
        restaurant_name: restaurant.name,
      },
    });

    // 5. Update order with Razorpay Order ID & mark payment method as online
    const { error: updateError } = await (supabase
      .from('orders') as any)
      .update({
        razorpay_order_id: razorpayOrder.id,
        payment_method: 'online',
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', currentOrder.id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to record Razorpay order id', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Razorpay order created successfully',
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount, // in paise
      currency: razorpayOrder.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
      order_id: currentOrder.id,
      total_amount: currentOrder.total_amount,
    });
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.format() }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
