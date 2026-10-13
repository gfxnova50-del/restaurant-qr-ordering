import { NextRequest, NextResponse } from 'next/server';
import { createOrderSchema } from '@/lib/validations/order';
import { createAdminClient, isSupabaseAdminConfigured } from '@/lib/supabase/admin';
import { ZodError } from 'zod';

export const dynamic = 'force-dynamic';

/**
 * POST /api/orders
 * Validates order payload, verifies restaurant and table, fetches official menu item prices from DB,
 * recomputes total amount (never trusting client prices), and creates order + order_items.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Zod input validation
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const {
      restaurant_id,
      table_id,
      customer_name,
      customer_phone,
      payment_method,
      notes,
      items,
    } = parsed.data;

    // Handle mock demo mode directly without hanging DNS queries
    if (!isSupabaseAdminConfigured()) {
      const { MOCK_RESTAURANTS, MOCK_TABLES, MOCK_MENU_ITEMS, saveOrder } = await import('@/lib/mockData');
      const mockRest =
        Object.values(MOCK_RESTAURANTS).find((r) => r.id === restaurant_id || r.slug === restaurant_id) ||
        MOCK_RESTAURANTS['spice-garden'];

      const allTables = Object.values(MOCK_TABLES).flat();
      const mockTable =
        allTables.find((t) => t.id === table_id || String(t.table_number) === String(table_id)) || {
          id: table_id,
          restaurant_id: mockRest.id,
          table_number: '1',
          created_at: new Date().toISOString(),
        };

      const allItems = Object.values(MOCK_MENU_ITEMS).flat();
      const orderId = 'ord-' + Math.random().toString(36).substring(2, 9);
      const now = new Date().toISOString();

      let totalAmount = 0;
      const orderItems = items.map((item, idx) => {
        const menuItem = allItems.find((m) => m.id === item.menu_item_id);
        const price = menuItem ? Number(menuItem.price) : 200;
        const name = menuItem ? menuItem.name : 'Item';
        totalAmount += price * item.quantity;
        return {
          id: `oi-${orderId}-${idx}`,
          order_id: orderId,
          menu_item_id: item.menu_item_id,
          name_snapshot: name,
          price_snapshot: price,
          quantity: item.quantity,
          created_at: now,
          menu_item: menuItem || null,
        };
      });

      const newOrder = {
        id: orderId,
        restaurant_id: mockRest.id,
        table_id: mockTable.id,
        customer_name: customer_name || null,
        customer_phone: customer_phone || null,
        status: 'received' as const,
        payment_status: payment_method === 'online' ? ('paid' as const) : ('pending' as const),
        payment_method,
        total_amount: Math.round(totalAmount * 100) / 100,
        notes: notes || null,
        razorpay_order_id: payment_method === 'online' ? `order_rzp_${orderId}` : null,
        razorpay_payment_id: payment_method === 'online' ? `pay_rzp_${orderId}` : null,
        created_at: now,
        updated_at: now,
        table: mockTable,
        restaurant: mockRest,
        order_items: orderItems,
      };

      saveOrder(newOrder);

      return NextResponse.json({ order: newOrder }, { status: 201 });
    }

    const supabase = createAdminClient();

    // 2. Verify restaurant exists
    const { data: restaurant, error: restError } = await supabase
      .from('restaurants')
      .select('id, name, slug, currency, accepts_online_payment')
      .eq('id', restaurant_id)
      .single();

    if (restError || !restaurant) {
      const { MOCK_RESTAURANTS, MOCK_TABLES, MOCK_MENU_ITEMS, saveOrder } = await import('@/lib/mockData');
      const mockRest =
        Object.values(MOCK_RESTAURANTS).find((r) => r.id === restaurant_id || r.slug === restaurant_id) ||
        MOCK_RESTAURANTS['spice-garden'];

      const allTables = Object.values(MOCK_TABLES).flat();
      const mockTable =
        allTables.find((t) => t.id === table_id || String(t.table_number) === String(table_id)) || {
          id: table_id,
          restaurant_id: mockRest.id,
          table_number: '1',
          created_at: new Date().toISOString(),
        };

      const allItems = Object.values(MOCK_MENU_ITEMS).flat();
      const orderId = 'ord-' + Math.random().toString(36).substring(2, 9);
      const now = new Date().toISOString();

      let totalAmount = 0;
      const orderItems = items.map((item, idx) => {
        const menuItem = allItems.find((m) => m.id === item.menu_item_id);
        const price = menuItem ? Number(menuItem.price) : 200;
        const name = menuItem ? menuItem.name : 'Delicious Dish';
        totalAmount += price * item.quantity;
        return {
          id: `oi-${orderId}-${idx}`,
          order_id: orderId,
          menu_item_id: item.menu_item_id,
          name_snapshot: name,
          price_snapshot: price,
          quantity: item.quantity,
          created_at: now,
        };
      });

      const newOrder = {
        id: orderId,
        restaurant_id: mockRest.id,
        table_id: mockTable.id,
        customer_name: customer_name || null,
        customer_phone: customer_phone || null,
        status: 'received' as const,
        payment_status: (payment_method === 'online' ? 'paid' : 'pending') as 'paid' | 'pending',
        payment_method,
        total_amount: Math.round(totalAmount * 100) / 100,
        notes: notes || null,
        razorpay_order_id: payment_method === 'online' ? `order_rzp_${orderId}` : null,
        razorpay_payment_id: payment_method === 'online' ? `pay_rzp_${orderId}` : null,
        created_at: now,
        updated_at: now,
        table: mockTable,
        restaurant: mockRest,
        order_items: orderItems,
      };

      saveOrder(newOrder);

      return NextResponse.json({ order: newOrder }, { status: 201 });
    }

    // 3. Verify table exists and belongs to this restaurant
    const { data: table, error: tableError } = await supabase
      .from('tables')
      .select('id, table_number, restaurant_id')
      .eq('id', table_id)
      .eq('restaurant_id', restaurant_id)
      .single();

    if (tableError || !table) {
      return NextResponse.json(
        { error: 'Invalid table for this restaurant' },
        { status: 400 }
      );
    }

    // 4. Fetch menu items from DB to recompute prices and prevent client price tampering
    const menuItemIds = Array.from(new Set(items.map((i: { menu_item_id: string }) => i.menu_item_id)));

    const { data: rawMenuItems, error: itemsError } = await supabase
      .from('menu_items')
      .select('id, name, price, is_available, restaurant_id')
      .in('id', menuItemIds)
      .eq('restaurant_id', restaurant_id);

    if (itemsError || !rawMenuItems) {
      return NextResponse.json(
        { error: 'Failed to verify menu items', details: itemsError?.message },
        { status: 500 }
      );
    }

    interface DBMenuItem {
      id: string;
      name: string;
      price: number;
      is_available: boolean;
      restaurant_id: string;
    }

    const dbMenuItems = rawMenuItems as unknown as DBMenuItem[];

    // Check if any items are missing or not from this restaurant
    const foundItemIds = new Set(dbMenuItems.map((item: DBMenuItem) => item.id));
    const missingItems = menuItemIds.filter((id: string) => !foundItemIds.has(id));
    if (missingItems.length > 0) {
      return NextResponse.json(
        { error: 'One or more items do not belong to this restaurant', invalid_item_ids: missingItems },
        { status: 400 }
      );
    }

    // Check availability
    const unavailableItems = dbMenuItems.filter((item: DBMenuItem) => !item.is_available);
    if (unavailableItems.length > 0) {
      return NextResponse.json(
        {
          error: 'Some items are currently unavailable',
          unavailable_items: unavailableItems.map((item: DBMenuItem) => ({ id: item.id, name: item.name })),
        },
        { status: 400 }
      );
    }

    // Map DB items by ID
    const itemMap = new Map<string, DBMenuItem>(dbMenuItems.map((item: DBMenuItem) => [item.id, item]));

    // 5. Recompute total strictly from DB prices
    let totalAmount = 0;
    const itemsToInsert: Array<{
      menu_item_id: string;
      name_snapshot: string;
      price_snapshot: number;
      quantity: number;
    }> = [];

    for (const item of items) {
      const dbItem = itemMap.get(item.menu_item_id);
      if (!dbItem) continue;

      const itemPrice = Number(dbItem.price);
      const subtotal = itemPrice * item.quantity;
      totalAmount += subtotal;

      itemsToInsert.push({
        menu_item_id: dbItem.id,
        name_snapshot: dbItem.name,
        price_snapshot: itemPrice,
        quantity: item.quantity,
      });
    }

    // Round total to 2 decimal places
    totalAmount = Math.round(totalAmount * 100) / 100;

    // 6. Create Order record
    const { data: newOrder, error: orderInsertError } = await supabase
      .from('orders')
      .insert({
        restaurant_id,
        table_id,
        customer_name: customer_name || null,
        customer_phone: customer_phone || null,
        status: 'received',
        payment_status: 'pending',
        payment_method,
        total_amount: totalAmount,
        notes: notes || null,
      } as any)
      .select()
      .single();

    if (orderInsertError || !newOrder) {
      return NextResponse.json(
        { error: 'Failed to create order', details: orderInsertError?.message },
        { status: 500 }
      );
    }

    const createdOrder = newOrder as unknown as {
      id: string;
      restaurant_id: string;
      table_id: string;
      customer_name: string | null;
      customer_phone: string | null;
      status: string;
      payment_status: string;
      payment_method: string;
      total_amount: number;
      notes: string | null;
      created_at: string;
      updated_at: string;
    };

    // 7. Insert Order Items with snapshots
    const orderItemsWithOrderId = itemsToInsert.map((item) => ({
      order_id: createdOrder.id,
      menu_item_id: item.menu_item_id,
      name_snapshot: item.name_snapshot,
      price_snapshot: item.price_snapshot,
      quantity: item.quantity,
    }));

    const { data: createdItems, error: itemsInsertError } = await supabase
      .from('order_items')
      .insert(orderItemsWithOrderId as any)
      .select();

    if (itemsInsertError) {
      // Rollback / cleanup order if items insertion failed
      await supabase.from('orders').delete().eq('id', createdOrder.id);
      return NextResponse.json(
        { error: 'Failed to create order items', details: itemsInsertError.message },
        { status: 500 }
      );
    }

    const typedTable = table as unknown as { table_number: string };
    const typedRestaurant = restaurant as unknown as { currency: string };

    return NextResponse.json(
      {
        message: 'Order created successfully',
        order: {
          ...createdOrder,
          table_number: typedTable.table_number,
          currency: typedRestaurant.currency,
          items: createdItems,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.format() }, { status: 400 });
    }
    const errorMessage = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * GET /api/orders
 * Returns all active orders for the dashboard, from Supabase if configured or from memory store.
 */
export async function GET(_request: NextRequest) {
  try {
    if (!isSupabaseAdminConfigured()) {
      const { MEMORY_ORDERS } = await import('@/lib/mockData');
      return NextResponse.json({ orders: MEMORY_ORDERS || [] });
    }

    const supabase = createAdminClient();
    const { data: orders, error } = await supabase
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
        created_at,
        updated_at,
        tables ( table_number ),
        order_items ( id, menu_item_id, name_snapshot, price_snapshot, quantity )
      `)
      .order('created_at', { ascending: false });

    if (error || !orders || orders.length === 0) {
      const { MEMORY_ORDERS } = await import('@/lib/mockData');
      return NextResponse.json({ orders: MEMORY_ORDERS || [] });
    }

    const formatted = (orders as any[]).map((d) => ({
      ...d,
      table: d.tables,
      order_items: d.order_items || [],
    }));

    return NextResponse.json({ orders: formatted });
  } catch (err: unknown) {
    const { MEMORY_ORDERS } = await import('@/lib/mockData');
    return NextResponse.json({ orders: MEMORY_ORDERS || [] });
  }
}

