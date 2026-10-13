import { MenuItem, Order, OrderWithDetails, Restaurant, Table } from '@/types/database';
import { MOCK_CATEGORIES, MOCK_MENU_ITEMS, MOCK_RESTAURANTS, MOCK_TABLES, INITIAL_MOCK_ORDERS, findOrder, saveOrder, updateOrder } from '@/lib/mockData';

// Shared in-memory and localStorage orders for demo mode
let localOrdersCache: OrderWithDetails[] = [...INITIAL_MOCK_ORDERS];

export interface MenuResponse {
  restaurant: Restaurant & { brand_color?: string };
  tables: Table[];
  categories: Array<{
    id: string;
    name: string;
    sort_order: number;
    items: MenuItem[];
  }>;
}

function getBaseUrl() {
  if (typeof window !== 'undefined') return '';
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

import { getRestaurantMenuData } from '@/lib/menuService';

export async function fetchRestaurantMenu(slug: string): Promise<MenuResponse> {
  // On the server, fetch data directly from DB/service without HTTP self-fetch deadlock
  if (typeof window === 'undefined') {
    return getRestaurantMenuData(slug);
  }

  try {
    const res = await fetch(`/api/menu/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (e) {
    console.warn('API fetch failed, falling back to local data:', e);
  }

  return getRestaurantMenuData(slug);
}

export async function createOrder(payload: {
  restaurant_id: string;
  table_id: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  payment_method: 'counter' | 'online';
  notes?: string | null;
  items: Array<{ menu_item_id: string; quantity: number }>;
}): Promise<{ order: OrderWithDetails }> {
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (e) {
    console.warn('POST /api/orders failed, using mock order fallback:', e);
  }

  // Local fallback creation
  const orderId = 'ord-' + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();

  // Find table
  const allTables = Object.values(MOCK_TABLES).flat();
  const table = allTables.find((t) => t.id === payload.table_id) || {
    id: payload.table_id,
    restaurant_id: payload.restaurant_id,
    table_number: '1',
    created_at: now,
  };

  // Find restaurant
  const rest = Object.values(MOCK_RESTAURANTS).find((r) => r.id === payload.restaurant_id) || MOCK_RESTAURANTS['spice-garden'];

  // Resolve items
  const allItems = Object.values(MOCK_MENU_ITEMS).flat();
  let totalAmount = 0;
  const orderItems = payload.items.map((item, idx) => {
    const menuItem = allItems.find((m) => m.id === item.menu_item_id);
    const price = menuItem ? Number(menuItem.price) : 200;
    const name = menuItem ? menuItem.name : 'Custom Item';
    totalAmount += price * item.quantity;
    return {
      id: `oi-${orderId}-${idx}`,
      order_id: orderId,
      menu_item_id: item.menu_item_id,
      name_snapshot: name,
      price_snapshot: price,
      quantity: item.quantity,
      menu_item: menuItem || null,
      created_at: now,
    };
  });

  const newOrder: OrderWithDetails = {
    id: orderId,
    restaurant_id: payload.restaurant_id,
    table_id: payload.table_id,
    customer_name: payload.customer_name || null,
    customer_phone: payload.customer_phone || null,
    status: 'received',
    payment_status: payload.payment_method === 'online' ? 'paid' : 'pending',
    payment_method: payload.payment_method,
    total_amount: Math.round(totalAmount * 100) / 100,
    notes: payload.notes || null,
    razorpay_order_id: payload.payment_method === 'online' ? `order_rzp_${orderId}` : null,
    razorpay_payment_id: payload.payment_method === 'online' ? `pay_rzp_${orderId}` : null,
    created_at: now,
    updated_at: now,
    table,
    restaurant: rest,
    order_items: orderItems,
  };

  localOrdersCache.unshift(newOrder);
  saveOrder(newOrder);

  // Trigger custom event so any active dashboard or tracker updates in real time
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('qrmenu_order_created', { detail: newOrder }));
    try {
      localStorage.setItem('qrmenu_mock_orders', JSON.stringify(localOrdersCache));
    } catch {}
  }

  return { order: newOrder };
}

export async function fetchOrderById(id: string): Promise<{ order: OrderWithDetails }> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/orders/${id}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (e) {
    console.warn(`Fetch order ${id} failed, checking local store:`, e);
  }

  // Check stored in localStorage or cache
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('qrmenu_mock_orders');
      if (stored) {
        const parsed = JSON.parse(stored);
        const match = parsed.find((o: OrderWithDetails) => o.id === id);
        if (match) return { order: match };
      }
    } catch {}
  }

  const match = findOrder(id) || localOrdersCache.find((o) => o.id === id) || INITIAL_MOCK_ORDERS[0];
  return { order: match };
}

export async function updateOrderStatus(id: string, status: Order['status']): Promise<{ order: OrderWithDetails }> {
  try {
    const res = await fetch(`/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (e) {
    console.warn('Update order status via API failed, updating local cache:', e);
  }

  // Update in local cache and server memory
  updateOrder(id, status);
  localOrdersCache = localOrdersCache.map((ord) => {
    if (ord.id === id) {
      return { ...ord, status, updated_at: new Date().toISOString() };
    }
    return ord;
  });

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('qrmenu_mock_orders', JSON.stringify(localOrdersCache));
      window.dispatchEvent(new CustomEvent('qrmenu_order_status_updated', { detail: { id, status } }));
    } catch {}
  }

  const updated = localOrdersCache.find((o) => o.id === id)!;
  return { order: updated };
}

export function getLocalOrders(): OrderWithDetails[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('qrmenu_mock_orders');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
  }
  return localOrdersCache;
}
