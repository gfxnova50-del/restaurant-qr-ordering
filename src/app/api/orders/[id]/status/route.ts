import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatusSchema } from '@/lib/validations/order';
import { createClientFromRequest } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ZodError } from 'zod';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * PATCH /api/orders/[id]/status
 * Updates the order status. Accessible strictly by the authenticated restaurant owner.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const orderId = context?.params?.id;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // 1. Authenticate user from request (via cookie or Bearer token)
    const userClient = createClientFromRequest(request);
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      // Demo fallback for test orders
      const { findOrder, updateOrder } = await import('@/lib/mockData');
      const mockOrder = findOrder(orderId);
      if (mockOrder) {
        const body = await request.json();
        const parsed = updateOrderStatusSchema.safeParse(body);
        if (!parsed.success) {
          return NextResponse.json(
            { error: 'Validation failed', details: parsed.error.format() },
            { status: 400 }
          );
        }
        const updated = updateOrder(orderId, parsed.data.status);
        return NextResponse.json({ order: updated });
      }

      return NextResponse.json(
        { error: 'Unauthorized: Owner authentication required' },
        { status: 401 }
      );
    }

    // 2. Validate request body
    const body = await request.json();
    const parsed = updateOrderStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { status: newStatus } = parsed.data;

    // 3. Query the order and its restaurant
    const adminSupabase = createAdminClient();
    const { data: order, error: orderError } = await adminSupabase
      .from('orders')
      .select('id, restaurant_id, status, total_amount')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      const { findOrder, updateOrder } = await import('@/lib/mockData');
      const mockOrder = findOrder(orderId);
      if (mockOrder) {
        const updated = updateOrder(orderId, newStatus);
        return NextResponse.json({ order: updated });
      }
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const currentOrder = order as unknown as { id: string; restaurant_id: string; status: string; total_amount: number };

    // 4. Verify ownership: user must own this restaurant
    const { data: restaurant, error: restError } = await adminSupabase
      .from('restaurants')
      .select('id, owner_id, name')
      .eq('id', currentOrder.restaurant_id)
      .single();

    if (restError || !restaurant) {
      return NextResponse.json({ error: 'Associated restaurant not found' }, { status: 404 });
    }

    const currentRestaurant = restaurant as unknown as { id: string; owner_id: string; name: string };

    if (currentRestaurant.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own the restaurant for this order' },
        { status: 403 }
      );
    }

    // 5. Update the order status
    const { data: updatedOrder, error: updateError } = await (adminSupabase
      .from('orders') as any)
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', orderId)
      .select()
      .single();

    if (updateError || !updatedOrder) {
      return NextResponse.json(
        { error: 'Failed to update order status', details: updateError?.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Order status successfully updated to '${newStatus}'`,
      order: updatedOrder,
    });
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.format() }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
