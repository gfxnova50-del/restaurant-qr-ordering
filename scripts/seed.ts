import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local first, fallback to .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const DEMO_OWNER_EMAIL = process.env.DEMO_OWNER_EMAIL || 'owner@spicegarden.demo';
const DEMO_OWNER_PASSWORD = process.env.DEMO_OWNER_PASSWORD || 'demo123456';

async function seed() {
  console.log('🚀 Starting QR Menu SaaS backend database seed...');

  // 1. Ensure demo owner user exists in Supabase Auth
  console.log(`👤 Checking auth user for ${DEMO_OWNER_EMAIL}...`);
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Failed to list users:', listError.message);
  }

  let ownerId: string;
  const existingUser = usersData?.users.find((u) => u.email === DEMO_OWNER_EMAIL);

  if (existingUser) {
    ownerId = existingUser.id;
    console.log(`✅ Found existing owner user: ${ownerId}`);
  } else {
    console.log(`Creating demo user: ${DEMO_OWNER_EMAIL}...`);
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: DEMO_OWNER_EMAIL,
      password: DEMO_OWNER_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: 'Rajesh Sharma',
        role: 'restaurant_owner',
      },
    });

    if (createError || !newUser.user) {
      console.error('Failed to create demo owner in auth.users:', createError?.message);
      throw createError;
    }

    ownerId = newUser.user.id;
    console.log(`✅ Created demo owner user: ${ownerId}`);
  }

  // 2. Insert or update Demo Restaurant
  console.log('🍽️ Seeding demo restaurant: Spice Garden Bistro...');
  const { data: existingRestaurant } = await supabase
    .from('restaurants')
    .select('id, slug')
    .eq('slug', 'spice-garden')
    .maybeSingle();

  let restaurantId: string;

  if (existingRestaurant) {
    restaurantId = existingRestaurant.id;
    await supabase
      .from('restaurants')
      .update({
        name: 'Spice Garden Bistro',
        owner_id: ownerId,
        logo_url:
          'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&auto=format&fit=crop&q=80',
        phone: '+91 98765 43210',
        currency: 'INR',
        accepts_online_payment: true,
      })
      .eq('id', restaurantId);
    console.log(`✅ Updated existing restaurant: ${restaurantId}`);
  } else {
    const { data: newRest, error: restError } = await supabase
      .from('restaurants')
      .insert({
        owner_id: ownerId,
        name: 'Spice Garden Bistro',
        slug: 'spice-garden',
        logo_url:
          'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&auto=format&fit=crop&q=80',
        phone: '+91 98765 43210',
        currency: 'INR',
        accepts_online_payment: true,
      })
      .select('id')
      .single();

    if (restError || !newRest) {
      console.error('Failed to insert restaurant:', restError);
      throw restError;
    }
    restaurantId = newRest.id;
    console.log(`✅ Inserted restaurant: ${restaurantId}`);
  }

  // 3. Seed 5 Tables
  console.log('🪑 Seeding 5 tables...');
  const tableNumbers = ['Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5'];

  for (const tableNum of tableNumbers) {
    const { data: existingTable } = await supabase
      .from('tables')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .eq('table_number', tableNum)
      .maybeSingle();

    if (!existingTable) {
      await supabase.from('tables').insert({
        restaurant_id: restaurantId,
        table_number: tableNum,
      });
    }
  }
  console.log('✅ 5 tables ready');

  // 4. Seed 3 Categories
  console.log('📂 Seeding 3 categories...');
  const categoriesDef = [
    { name: 'Starters & Appetizers', sort_order: 1 },
    { name: 'Main Course', sort_order: 2 },
    { name: 'Beverages & Desserts', sort_order: 3 },
  ];

  const categoryMap = new Map<string, string>();

  for (const cat of categoriesDef) {
    const { data: existingCat } = await supabase
      .from('categories')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .eq('name', cat.name)
      .maybeSingle();

    if (existingCat) {
      categoryMap.set(cat.name, existingCat.id);
    } else {
      const { data: newCat, error: catError } = await supabase
        .from('categories')
        .insert({
          restaurant_id: restaurantId,
          name: cat.name,
          sort_order: cat.sort_order,
        })
        .select('id')
        .single();

      if (catError || !newCat) {
        throw catError;
      }
      categoryMap.set(cat.name, newCat.id);
    }
  }
  console.log('✅ 3 categories ready');

  // 5. Seed 10 Menu Items
  console.log('🍲 Seeding 10 menu items...');
  const menuItemsDef = [
    {
      category: 'Starters & Appetizers',
      name: 'Paneer Tikka',
      description: 'Cottage cheese cubes marinated in tandoori spices and grilled with bell peppers and onions.',
      price: 280.0,
      image_url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=80',
      is_veg: true,
      is_available: true,
      sort_order: 1,
    },
    {
      category: 'Starters & Appetizers',
      name: 'Crispy Chilli Baby Corn',
      description: 'Crisp-fried golden baby corn tossed in a spicy, tangy Indo-Chinese garlic sauce.',
      price: 220.0,
      image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&auto=format&fit=crop&q=80',
      is_veg: true,
      is_available: true,
      sort_order: 2,
    },
    {
      category: 'Starters & Appetizers',
      name: 'Murgh Malai Kebab',
      description: 'Succulent boneless chicken morsels steeped in cheese, cream, and mild aromatic cardamom.',
      price: 340.0,
      image_url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=80',
      is_veg: false,
      is_available: true,
      sort_order: 3,
    },
    {
      category: 'Main Course',
      name: 'Dal Makhani Royal',
      description: 'Slow-cooked black lentils overnight with fresh cream, butter, and rich whole spices.',
      price: 260.0,
      image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=80',
      is_veg: true,
      is_available: true,
      sort_order: 1,
    },
    {
      category: 'Main Course',
      name: 'Butter Chicken Delhi Style',
      description: 'Smoked tandoori chicken cooked in a rich, velvety tomato gravy scented with fenugreek.',
      price: 380.0,
      image_url: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=500&auto=format&fit=crop&q=80',
      is_veg: false,
      is_available: true,
      sort_order: 2,
    },
    {
      category: 'Main Course',
      name: 'Paneer Butter Masala',
      description: 'Fresh cottage cheese simmered in a mildly sweet, velvety tomato-cashew gravy.',
      price: 310.0,
      image_url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=80',
      is_veg: true,
      is_available: true,
      sort_order: 3,
    },
    {
      category: 'Main Course',
      name: 'Butter Garlic Naan',
      description: 'Clay oven baked leavened bread layered with roasted garlic and creamy melted butter.',
      price: 70.0,
      image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80',
      is_veg: true,
      is_available: true,
      sort_order: 4,
    },
    {
      category: 'Beverages & Desserts',
      name: 'Alphonso Mango Lassi',
      description: 'Creamy churned yogurt blended with sweet Ratnagiri Alphonso mango pulp and saffron.',
      price: 140.0,
      image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80',
      is_veg: true,
      is_available: true,
      sort_order: 1,
    },
    {
      category: 'Beverages & Desserts',
      name: 'Kulfi & Gulab Jamun Sundae',
      description: 'Warm khoya dumplings soaked in rose syrup served alongside traditional malai kulfi.',
      price: 160.0,
      image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80',
      is_veg: true,
      is_available: true,
      sort_order: 2,
    },
    {
      category: 'Beverages & Desserts',
      name: 'Masala Cutting Chai',
      description: 'Brewed Assam CTC tea leaves infused with crushed ginger, green cardamom, and lemongrass.',
      price: 60.0,
      image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80',
      is_veg: true,
      is_available: true,
      sort_order: 3,
    },
  ];

  for (const item of menuItemsDef) {
    const categoryId = categoryMap.get(item.category);
    if (!categoryId) continue;

    const { data: existingItem } = await supabase
      .from('menu_items')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .eq('name', item.name)
      .maybeSingle();

    if (existingItem) {
      await supabase
        .from('menu_items')
        .update({
          category_id: categoryId,
          description: item.description,
          price: item.price,
          image_url: item.image_url,
          is_veg: item.is_veg,
          is_available: item.is_available,
          sort_order: item.sort_order,
        })
        .eq('id', existingItem.id);
    } else {
      await supabase.from('menu_items').insert({
        restaurant_id: restaurantId,
        category_id: categoryId,
        name: item.name,
        description: item.description,
        price: item.price,
        image_url: item.image_url,
        is_veg: item.is_veg,
        is_available: item.is_available,
        sort_order: item.sort_order,
      });
    }
  }

  console.log('✅ 10 menu items ready');
  console.log('\n🎉 Seed finished successfully!');
  console.log(`Demo Restaurant: Spice Garden Bistro (slug: spice-garden)`);
  console.log(`Owner Login: ${DEMO_OWNER_EMAIL} / ${DEMO_OWNER_PASSWORD}`);
  console.log(`Restaurant ID: ${restaurantId}`);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
