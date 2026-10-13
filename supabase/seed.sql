-- ==============================================================================
-- MULTI-TENANT QR MENU AND ORDERING SAAS
-- Supabase SQL Seed Script
-- 1 Demo Restaurant, 5 Tables, 3 Categories, 10 Menu Items
-- ==============================================================================

-- 1. Ensure a demo owner user exists in auth.users
-- Note: In Supabase, auth.users holds authentication credentials.
DO $$
DECLARE
  demo_user_id UUID := 'a0000000-0000-0000-0000-000000000001';
  restaurant_uuid UUID := 'b0000000-0000-0000-0000-000000000001';
  cat_starters UUID := 'c1000000-0000-0000-0000-000000000001';
  cat_mains UUID := 'c2000000-0000-0000-0000-000000000002';
  cat_beverages UUID := 'c3000000-0000-0000-0000-000000000003';
BEGIN
  -- Insert demo owner into auth.users if not already present
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = demo_user_id) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      demo_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'owner@spicegarden.demo',
      crypt('demo123456', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Rajesh Sharma"}'::jsonb,
      now(),
      now()
    );
  END IF;

  -- 2. Insert Demo Restaurant
  INSERT INTO restaurants (
    id,
    owner_id,
    name,
    slug,
    logo_url,
    phone,
    currency,
    accepts_online_payment
  ) VALUES (
    restaurant_uuid,
    demo_user_id,
    'Spice Garden Bistro',
    'spice-garden',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&auto=format&fit=crop&q=80',
    '+91 98765 43210',
    'INR',
    true
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    currency = EXCLUDED.currency,
    accepts_online_payment = EXCLUDED.accepts_online_payment;

  -- 3. Insert 5 Tables
  INSERT INTO tables (id, restaurant_id, table_number) VALUES
    ('t1000000-0000-0000-0000-000000000001', restaurant_uuid, 'Table 1'),
    ('t2000000-0000-0000-0000-000000000002', restaurant_uuid, 'Table 2'),
    ('t3000000-0000-0000-0000-000000000003', restaurant_uuid, 'Table 3'),
    ('t4000000-0000-0000-0000-000000000004', restaurant_uuid, 'Table 4'),
    ('t5000000-0000-0000-0000-000000000005', restaurant_uuid, 'Table 5')
  ON CONFLICT (restaurant_id, table_number) DO NOTHING;

  -- 4. Insert 3 Categories
  INSERT INTO categories (id, restaurant_id, name, sort_order) VALUES
    (cat_starters, restaurant_uuid, 'Starters & Appetizers', 1),
    (cat_mains, restaurant_uuid, 'Main Course', 2),
    (cat_beverages, restaurant_uuid, 'Beverages & Desserts', 3)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order;

  -- 5. Insert 10 Menu Items
  INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, image_url, is_veg, is_available, sort_order) VALUES
    (
      'm0100000-0000-0000-0000-000000000001',
      restaurant_uuid,
      cat_starters,
      'Paneer Tikka',
      'Cottage cheese cubes marinated in tandoori spices and grilled to perfection with bell peppers and onions.',
      280.00,
      'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=80',
      true,
      true,
      1
    ),
    (
      'm0200000-0000-0000-0000-000000000002',
      restaurant_uuid,
      cat_starters,
      'Crispy Chilli Baby Corn',
      'Crisp-fried golden baby corn tossed in a spicy, tangy Indo-Chinese garlic sauce.',
      220.00,
      'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&auto=format&fit=crop&q=80',
      true,
      true,
      2
    ),
    (
      'm0300000-0000-0000-0000-000000000003',
      restaurant_uuid,
      cat_starters,
      'Murgh Malai Kebab',
      'Succulent boneless chicken morsels steeped in cheese, cream, and mild aromatic cardamom.',
      340.00,
      'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=80',
      false,
      true,
      3
    ),
    (
      'm0400000-0000-0000-0000-000000000004',
      restaurant_uuid,
      cat_mains,
      'Dal Makhani Royal',
      'Slow-cooked black lentils overnight with fresh cream, butter, and rich whole spices.',
      260.00,
      'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=80',
      true,
      true,
      1
    ),
    (
      'm0500000-0000-0000-0000-000000000005',
      restaurant_uuid,
      cat_mains,
      'Butter Chicken Delhi Style',
      'Smoked tandoori chicken cooked in a rich, buttery tomato gravy scented with fenugreek.',
      380.00,
      'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=500&auto=format&fit=crop&q=80',
      false,
      true,
      2
    ),
    (
      'm0600000-0000-0000-0000-000000000006',
      restaurant_uuid,
      cat_mains,
      'Paneer Butter Masala',
      'Fresh cottage cheese simmered in a mildly sweet, velvety tomato-cashew gravy.',
      310.00,
      'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=80',
      true,
      true,
      3
    ),
    (
      'm0700000-0000-0000-0000-000000000007',
      restaurant_uuid,
      cat_mains,
      'Butter Garlic Naan',
      'Clay oven baked leavened bread layered with roasted garlic and creamy melted butter.',
      70.00,
      'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80',
      true,
      true,
      4
    ),
    (
      'm0800000-0000-0000-0000-000000000008',
      restaurant_uuid,
      cat_beverages,
      'Alphonso Mango Lassi',
      'Creamy churned yogurt blended with sweet Ratnagiri Alphonso mango pulp and saffron.',
      140.00,
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80',
      true,
      true,
      1
    ),
    (
      'm0900000-0000-0000-0000-000000000009',
      restaurant_uuid,
      cat_beverages,
      'Kulfi & Gulab Jamun Sundae',
      'Warm khoya dumplings soaked in rose syrup served alongside traditional malai kulfi.',
      160.00,
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80',
      true,
      true,
      2
    ),
    (
      'm1000000-0000-0000-0000-000000000010',
      restaurant_uuid,
      cat_beverages,
      'Masala Cutting Chai',
      'Brewed Assam CTC tea leaves infused with crushed ginger, green cardamom, and lemongrass.',
      60.00,
      'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80',
      true,
      true,
      3
    )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    image_url = EXCLUDED.image_url,
    is_veg = EXCLUDED.is_veg,
    is_available = EXCLUDED.is_available,
    sort_order = EXCLUDED.sort_order;

END $$;
