import { createAdminClient, isSupabaseAdminConfigured } from '@/lib/supabase/admin';
import { MenuItem, Restaurant, Table } from '@/types/database';
import { MOCK_CATEGORIES, MOCK_MENU_ITEMS, MOCK_RESTAURANTS, MOCK_TABLES } from '@/lib/mockData';

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

/**
 * Direct data service to fetch restaurant menu without internal HTTP self-fetch deadlocks.
 */
export async function getRestaurantMenuData(slug: string): Promise<MenuResponse> {
  const normalizedSlug = slug ? slug.trim().toLowerCase() : 'spice-garden';

  if (isSupabaseAdminConfigured()) {
    try {
      const supabase = createAdminClient();

      // 1. Fetch restaurant
      const { data: restaurant, error: restError } = await supabase
        .from('restaurants')
        .select('id, name, slug, logo_url, phone, currency, accepts_online_payment')
        .eq('slug', normalizedSlug)
        .single();

      if (!restError && restaurant) {
        const currentRestaurant = restaurant as unknown as Restaurant;

        // 2. Fetch tables
        const { data: tables } = await supabase
          .from('tables')
          .select('id, restaurant_id, table_number, created_at')
          .eq('restaurant_id', currentRestaurant.id)
          .order('table_number');

        // 3. Fetch categories
        const { data: categories } = await supabase
          .from('categories')
          .select('id, restaurant_id, name, sort_order')
          .eq('restaurant_id', currentRestaurant.id)
          .order('sort_order', { ascending: true });

        // 4. Fetch menu items
        const { data: menuItems } = await supabase
          .from('menu_items')
          .select('id, restaurant_id, category_id, name, description, price, image_url, is_veg, is_available, sort_order')
          .eq('restaurant_id', currentRestaurant.id)
          .order('sort_order', { ascending: true });

        const typedCategories = (categories || []) as Array<{ id: string; name: string; sort_order: number }>;
        const typedMenuItems = (menuItems || []) as MenuItem[];

        const categoriesWithItems = typedCategories.map((cat) => ({
          ...cat,
          items: typedMenuItems.filter((item) => item.category_id === cat.id),
        }));

        return {
          restaurant: currentRestaurant,
          tables: (tables || []) as Table[],
          categories: categoriesWithItems,
        };
      }
    } catch (e) {
      console.warn('Supabase menu fetch error, falling back to mock data:', e);
    }
  }

  // Instant fallback to mock data (0ms, no network timeout)
  const restaurant = MOCK_RESTAURANTS[normalizedSlug] || MOCK_RESTAURANTS['spice-garden'];
  const tables = MOCK_TABLES[restaurant.id] || MOCK_TABLES['b0000000-0000-0000-0000-000000000001'];
  const categories = MOCK_CATEGORIES[restaurant.id] || MOCK_CATEGORIES['b0000000-0000-0000-0000-000000000001'];
  const menuItems = MOCK_MENU_ITEMS[restaurant.id] || MOCK_MENU_ITEMS['b0000000-0000-0000-0000-000000000001'];

  const categoriesWithItems = categories.map((cat) => ({
    ...cat,
    items: menuItems.filter((i) => i.category_id === cat.id),
  }));

  return {
    restaurant,
    tables,
    categories: categoriesWithItems,
  };
}
