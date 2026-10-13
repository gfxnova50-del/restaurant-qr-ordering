-- ==============================================================================
-- MULTI-TENANT QR MENU AND ORDERING SAAS
-- Supabase Postgres Migration: Row Level Security (RLS) & Realtime
-- ==============================================================================

-- 1. Enable Row Level Security (RLS) on all tables
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 2. RESTAURANTS POLICIES
-- ==============================================================================
-- Public users (anonymous & authenticated) can view restaurant details (by slug/id)
CREATE POLICY "Public can view restaurants"
  ON restaurants FOR SELECT
  TO anon, authenticated
  USING (true);

-- Authenticated restaurant owners can insert their restaurant
CREATE POLICY "Owners can insert restaurant"
  ON restaurants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Restaurant owners can update only their own restaurant
CREATE POLICY "Owners can update restaurant"
  ON restaurants FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Restaurant owners can delete their restaurant
CREATE POLICY "Owners can delete restaurant"
  ON restaurants FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- ==============================================================================
-- 3. TABLES POLICIES
-- ==============================================================================
-- Public can view tables (for table validation during ordering and QR lookup)
CREATE POLICY "Public can view tables"
  ON tables FOR SELECT
  TO anon, authenticated
  USING (true);

-- Restaurant owners can create, update, delete tables for their restaurant
CREATE POLICY "Owners can manage tables"
  ON tables FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants r
      WHERE r.id = tables.restaurant_id
      AND r.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants r
      WHERE r.id = tables.restaurant_id
      AND r.owner_id = auth.uid()
    )
  );

-- ==============================================================================
-- 4. CATEGORIES POLICIES
-- ==============================================================================
-- Public can view categories for browsing menus
CREATE POLICY "Public can view categories"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (true);

-- Restaurant owners can manage categories for their restaurant
CREATE POLICY "Owners can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants r
      WHERE r.id = categories.restaurant_id
      AND r.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants r
      WHERE r.id = categories.restaurant_id
      AND r.owner_id = auth.uid()
    )
  );

-- ==============================================================================
-- 5. MENU ITEMS POLICIES
-- ==============================================================================
-- Public can view menu items
CREATE POLICY "Public can view menu items"
  ON menu_items FOR SELECT
  TO anon, authenticated
  USING (true);

-- Restaurant owners can manage menu items for their restaurant
CREATE POLICY "Owners can manage menu items"
  ON menu_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants r
      WHERE r.id = menu_items.restaurant_id
      AND r.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants r
      WHERE r.id = menu_items.restaurant_id
      AND r.owner_id = auth.uid()
    )
  );

-- ==============================================================================
-- 6. ORDERS POLICIES
-- ==============================================================================
-- Public can read order by id (unguessable UUID capability security),
-- and owners can read all orders for their restaurant.
CREATE POLICY "Public and owners can read order by id"
  ON orders FOR SELECT
  TO anon, authenticated
  USING (true);

-- Public can insert orders ONLY for valid restaurant and table
CREATE POLICY "Public can insert orders with valid restaurant and table"
  ON orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tables t
      WHERE t.id = orders.table_id
      AND t.restaurant_id = orders.restaurant_id
    )
  );

-- Only restaurant owners can update order status
CREATE POLICY "Owners can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants r
      WHERE r.id = orders.restaurant_id
      AND r.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants r
      WHERE r.id = orders.restaurant_id
      AND r.owner_id = auth.uid()
    )
  );

-- ==============================================================================
-- 7. ORDER ITEMS POLICIES
-- ==============================================================================
-- Public can view order items
CREATE POLICY "Public can view order items"
  ON order_items FOR SELECT
  TO anon, authenticated
  USING (true);

-- Public can insert order items ONLY for an existing order and valid menu item belonging to the restaurant
CREATE POLICY "Public can insert order items for valid order and menu item"
  ON order_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN menu_items m ON m.id = order_items.menu_item_id
      WHERE o.id = order_items.order_id
      AND m.restaurant_id = o.restaurant_id
    )
  );

-- Owners can manage order items
CREATE POLICY "Owners can manage order items"
  ON order_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN restaurants r ON r.id = o.restaurant_id
      WHERE o.id = order_items.order_id
      AND r.owner_id = auth.uid()
    )
  );

-- ==============================================================================
-- 8. REALTIME CONFIGURATION
-- ==============================================================================
-- Enable Realtime replication for orders and order_items
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE orders;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Set replica identity to full so update/delete events include full record data
ALTER TABLE orders REPLICA IDENTITY FULL;
ALTER TABLE order_items REPLICA IDENTITY FULL;

-- ==============================================================================
-- 9. SUPABASE STORAGE (BUCKET & POLICIES)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurant-assets', 'restaurant-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage public read policy
DO $$ BEGIN
  CREATE POLICY "Public can view restaurant assets"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'restaurant-assets');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Storage authenticated owner upload policy
DO $$ BEGIN
  CREATE POLICY "Authenticated users can upload restaurant assets"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'restaurant-assets');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
