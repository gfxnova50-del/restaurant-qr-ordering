import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * GET /api/orders/[id]
 * Fetch order details, snapshot items, and table info using the unguessable order UUID.
 */
export async function GET(
  _request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = context?.params?.id;

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        restaurant_id,
        table_id,
        customer_name,
        customer_phone,
        status,
        payment_status,
        payment_method,
        total_amount,
        notes,
        razorpay_order_id,
        created_at,
        updated_at,
        restaurants (
          name,
          slug,
          currency,
          phone,
          logo_url
        ),
        tables (
          table_number
        ),
        order_items (
          id,
          menu_item_id,
          name_snapshot,
          price_snapshot,
          quantity
        )
      `)
      .eq('id', id)
      .single();

    if (orderError || !order) {
      // Demo fallback for memory mock orders or offline testing
      const { findOrder } = await import('@/lib/mockData');
      const mockOrder = findOrder(id);
      if (mockOrder) {
        return NextResponse.json({ order: mockOrder });
      }
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
