import { Category, MenuItem, Order, OrderWithDetails, Restaurant, Table } from '@/types/database';

export const MOCK_RESTAURANTS: Record<string, Restaurant & { brand_color: string }> = {
  'spice-garden': {
    id: 'b0000000-0000-0000-0000-000000000001',
    owner_id: 'a0000000-0000-0000-0000-000000000001',
    name: 'Spice Garden Bistro',
    slug: 'spice-garden',
    logo_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&auto=format&fit=crop&q=80',
    phone: '+91 98765 43210',
    currency: 'INR',
    accepts_online_payment: true,
    brand_color: '#E23744', // Classic brand red
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'craves': {
    id: 'b0000000-0000-0000-0000-000000000002',
    owner_id: 'a0000000-0000-0000-0000-000000000001',
    name: 'Craves Kitchen & Cafe',
    slug: 'craves',
    logo_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=80',
    phone: '+91 98111 22334',
    currency: 'INR',
    accepts_online_payment: true,
    brand_color: '#e11d48', // Vibrant Craves rose
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

export const MOCK_TABLES: Record<string, Table[]> = {
  'b0000000-0000-0000-0000-000000000001': [
    { id: 't1000000-0000-0000-0000-000000000001', restaurant_id: 'b0000000-0000-0000-0000-000000000001', table_number: '1', created_at: new Date().toISOString() },
    { id: 't2000000-0000-0000-0000-000000000002', restaurant_id: 'b0000000-0000-0000-0000-000000000001', table_number: '2', created_at: new Date().toISOString() },
    { id: 't3000000-0000-0000-0000-000000000003', restaurant_id: 'b0000000-0000-0000-0000-000000000001', table_number: '3', created_at: new Date().toISOString() },
    { id: 't4000000-0000-0000-0000-000000000004', restaurant_id: 'b0000000-0000-0000-0000-000000000001', table_number: '4', created_at: new Date().toISOString() },
    { id: 't5000000-0000-0000-0000-000000000005', restaurant_id: 'b0000000-0000-0000-0000-000000000001', table_number: '5', created_at: new Date().toISOString() },
    { id: 't6000000-0000-0000-0000-000000000006', restaurant_id: 'b0000000-0000-0000-0000-000000000001', table_number: '6', created_at: new Date().toISOString() },
  ],
  'b0000000-0000-0000-0000-000000000002': [
    { id: 't1000000-0000-0000-0000-000000000011', restaurant_id: 'b0000000-0000-0000-0000-000000000002', table_number: '1', created_at: new Date().toISOString() },
    { id: 't2000000-0000-0000-0000-000000000012', restaurant_id: 'b0000000-0000-0000-0000-000000000002', table_number: '2', created_at: new Date().toISOString() },
    { id: 't3000000-0000-0000-0000-000000000013', restaurant_id: 'b0000000-0000-0000-0000-000000000002', table_number: '3', created_at: new Date().toISOString() },
    { id: 't4000000-0000-0000-0000-000000000014', restaurant_id: 'b0000000-0000-0000-0000-000000000002', table_number: '4', created_at: new Date().toISOString() },
  ],
};

export const MOCK_CATEGORIES: Record<string, Category[]> = {
  'b0000000-0000-0000-0000-000000000001': [
    { id: 'c1000000-0000-0000-0000-000000000001', restaurant_id: 'b0000000-0000-0000-0000-000000000001', name: 'Starters & Tandoor', sort_order: 1, created_at: new Date().toISOString() },
    { id: 'c2000000-0000-0000-0000-000000000002', restaurant_id: 'b0000000-0000-0000-0000-000000000001', name: 'Main Course & Gravies', sort_order: 2, created_at: new Date().toISOString() },
    { id: 'c3000000-0000-0000-0000-000000000003', restaurant_id: 'b0000000-0000-0000-0000-000000000001', name: 'Breads & Rice', sort_order: 3, created_at: new Date().toISOString() },
    { id: 'c4000000-0000-0000-0000-000000000004', restaurant_id: 'b0000000-0000-0000-0000-000000000001', name: 'Beverages & Desserts', sort_order: 4, created_at: new Date().toISOString() },
  ],
  'b0000000-0000-0000-0000-000000000002': [
    { id: 'c1000000-0000-0000-0000-000000000021', restaurant_id: 'b0000000-0000-0000-0000-000000000002', name: 'Gourmet Burgers', sort_order: 1, created_at: new Date().toISOString() },
    { id: 'c2000000-0000-0000-0000-000000000022', restaurant_id: 'b0000000-0000-0000-0000-000000000002', name: 'Woodfired Pizzas', sort_order: 2, created_at: new Date().toISOString() },
    { id: 'c3000000-0000-0000-0000-000000000023', restaurant_id: 'b0000000-0000-0000-0000-000000000002', name: 'Shakes & Coolers', sort_order: 3, created_at: new Date().toISOString() },
  ],
};

export const MOCK_MENU_ITEMS: Record<string, MenuItem[]> = {
  'b0000000-0000-0000-0000-000000000001': [
    {
      id: 'm0100000-0000-0000-0000-000000000001',
      restaurant_id: 'b0000000-0000-0000-0000-000000000001',
      category_id: 'c1000000-0000-0000-0000-000000000001',
      name: 'Paneer Tikka Angara',
      description: 'Charcoal-grilled cottage cheese cubes marinated in Kashmiri red chilli and whole tandoori spices with roasted peppers.',
      price: 280,
      image_url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=80',
      is_veg: true,
      is_available: true,
      sort_order: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'm0200000-0000-0000-0000-000000000002',
      restaurant_id: 'b0000000-0000-0000-0000-000000000001',
      category_id: 'c1000000-0000-0000-0000-000000000001',
      name: 'Crispy Honey Chilli Lotus Stem',
      description: 'Thinly sliced crisp lotus stem tossed with Sichuan peppers, spring scallions, and toasted sesame honey glaze.',
      price: 240,
      image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&auto=format&fit=crop&q=80',
      is_veg: true,
      is_available: true,
      sort_order: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'm0300000-0000-0000-0000-000000000003',
      restaurant_id: 'b0000000-0000-0000-0000-000000000001',
      category_id: 'c1000000-0000-0000-0000-000000000001',
      name: 'Murgh Malai Kebab',
      description: 'Melt-in-mouth chicken pieces steeped in cream, hung curd, green cardamom, and smoked cheese.',
      price: 340,
      image_url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=80',
      is_veg: false,
      is_available: true,
      sort_order: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'm0400000-0000-0000-0000-000000000004',
      restaurant_id: 'b0000000-0000-0000-0000-000000000001',
      category_id: 'c1000000-0000-0000-0000-000000000001',
      name: 'Tandoori Prawns Zaffrani',
      description: 'Jumbo prawns marinated in saffron, yellow mustard oil, and carom seeds, skewered in clay oven.',
      price: 490,
      image_url: 'https://images.unsplash.com/photo-1559742811-822873691df8?w=500&auto=format&fit=crop&q=80',
      is_veg: false,
      is_available: false, // SOLD OUT DEMO
      sort_order: 4,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'm0500000-0000-0000-0000-000000000005',
      restaurant_id: 'b0000000-0000-0000-0000-000000000001',
      category_id: 'c2000000-0000-0000-0000-000000000002',
      name: 'Dal Makhani Bukhara',
      description: 'Classic slow-cooked black lentils simmered for 18 hours with cultured butter, plum tomatoes, and cream.',
      price: 260,
      image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=80',
      is_veg: true,
      is_available: true,
      sort_order: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'm0600000-0000-0000-0000-000000000006',
      restaurant_id: 'b0000000-0000-0000-0000-000000000001',
      category_id: 'c2000000-0000-0000-0000-000000000002',
      name: 'Butter Chicken Purani Dilli',
      description: 'Roasted tandoori chicken cooked in a velvety, buttery tomato gravy infused with kasoori methi.',
      price: 380,
      image_url: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=500&auto=format&fit=crop&q=80',
      is_veg: false,
      is_available: true,
      sort_order: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'm0700000-0000-0000-0000-000000000007',
      restaurant_id: 'b0000000-0000-0000-0000-000000000001',
      category_id: 'c2000000-0000-0000-0000-000000000002',
      name: 'Paneer Lababdar',
      description: 'Succulent cubes of cottage cheese folded in spiced onion-tomato masala topped with fresh grated paneer.',
      price: 320,
      image_url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=80',
      is_veg: true,
      is_available: true,
      sort_order: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'm0800000-0000-0000-0000-000000000008',
      restaurant_id: 'b0000000-0000-0000-0000-000000000001',
      category_id: 'c3000000-0000-0000-0000-000000000003',
      name: 'Garlic Butter Chur Chur Naan',
      description: 'Crisp layered tandoori bread slathered with toasted garlic butter and fresh coriander herbs.',
      price: 85,
      image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80',
      is_veg: true,
      is_available: true,
      sort_order: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'm0900000-0000-0000-0000-000000000009',
      restaurant_id: 'b0000000-0000-0000-0000-000000000001',
      category_id: 'c3000000-0000-0000-0000-000000000003',
      name: 'Dum Biryani Awadhi (Veg)',
      description: 'Aromatic aged basmati rice cooked on slow dum with seasonal garden vegetables, rose water, and saffron milk.',
      price: 290,
      image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80',
      is_veg: true,
      is_available: true,
      sort_order: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'm1000000-0000-0000-0000-000000000010',
      restaurant_id: 'b0000000-0000-0000-0000-000000000001',
      category_id: 'c4000000-0000-0000-0000-000000000004',
      name: 'Ratnagiri Mango Lassi',
      description: 'Fresh farm churned yogurt blended with ripe Alphonso mango purée and green cardamom.',
      price: 140,
      image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80',
      is_veg: true,
      is_available: true,
      sort_order: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'm1100000-0000-0000-0000-000000000011',
      restaurant_id: 'b0000000-0000-0000-0000-000000000001',
      category_id: 'c4000000-0000-0000-0000-000000000004',
      name: 'Gulab Jamun with Rabri',
      description: 'Hot melt-in-mouth milk dumplings served soaked in saffron syrup over chilled layered rabri.',
      price: 160,
      image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80',
      is_veg: true,
      is_available: true,
      sort_order: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  'b0000000-0000-0000-0000-000000000002': [
    {
      id: 'm0100000-0000-0000-0000-000000000021',
      restaurant_id: 'b0000000-0000-0000-0000-000000000002',
      category_id: 'c1000000-0000-0000-0000-000000000021',
      name: 'The Craves Monster Smash Burger',
      description: 'Double smashed crispy beef/lamb patties, melted cheddar, caramelized onions, house truffle crave sauce on brioche.',
      price: 360,
      image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80',
      is_veg: false,
      is_available: true,
      sort_order: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'm0200000-0000-0000-0000-000000000022',
      restaurant_id: 'b0000000-0000-0000-0000-000000000002',
      category_id: 'c1000000-0000-0000-0000-000000000021',
      name: 'Crispy Paneer Volcano Burger',
      description: 'Herb crumbed golden paneer slab, chipotle slaw, pickled gherkins, and melting mozzarella cheese.',
      price: 270,
      image_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&auto=format&fit=crop&q=80',
      is_veg: true,
      is_available: true,
      sort_order: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'm0300000-0000-0000-0000-000000000023',
      restaurant_id: 'b0000000-0000-0000-0000-000000000022',
      category_id: 'c2000000-0000-0000-0000-000000000022',
      name: 'Margherita Burrata Pizza',
      description: 'Neapolitan sourdough crust, San Marzano tomato sauce, fresh creamy burrata, and basil leaves.',
      price: 450,
      image_url: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&auto=format&fit=crop&q=80',
      is_veg: true,
      is_available: true,
      sort_order: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'm0400000-0000-0000-0000-000000000024',
      restaurant_id: 'b0000000-0000-0000-0000-000000000002',
      category_id: 'c3000000-0000-0000-0000-000000000023',
      name: 'Lotus Biscoff Thick Shake',
      description: 'Heavy dairy shake blended with Belgian Biscoff spread, caramel swirl, and crunchy biscuit crumbs.',
      price: 220,
      image_url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80',
      is_veg: true,
      is_available: true,
      sort_order: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
};

// Initial sample orders for Live Orders screen & History
export const INITIAL_MOCK_ORDERS: OrderWithDetails[] = [
  {
    id: 'ord-101-demo-new',
    restaurant_id: 'b0000000-0000-0000-0000-000000000001',
    table_id: 't2000000-0000-0000-0000-000000000002',
    customer_name: 'Aarav Patel',
    customer_phone: '+91 98765 11223',
    status: 'received',
    payment_status: 'pending',
    payment_method: 'counter',
    total_amount: 620,
    notes: 'Please make paneer tikka extra spicy, less butter on naan.',
    razorpay_order_id: null,
    razorpay_payment_id: null,
    created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 mins ago
    updated_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    table: {
      id: 't2000000-0000-0000-0000-000000000002',
      restaurant_id: 'b0000000-0000-0000-0000-000000000001',
      table_number: '2',
      created_at: new Date().toISOString(),
    },
    order_items: [
      {
        id: 'oi-1',
        order_id: 'ord-101-demo-new',
        menu_item_id: 'm0100000-0000-0000-0000-000000000001',
        name_snapshot: 'Paneer Tikka Angara',
        price_snapshot: 280,
        quantity: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 'oi-2',
        order_id: 'ord-101-demo-new',
        menu_item_id: 'm0500000-0000-0000-0000-000000000005',
        name_snapshot: 'Dal Makhani Bukhara',
        price_snapshot: 260,
        quantity: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 'oi-3',
        order_id: 'ord-101-demo-new',
        menu_item_id: 'm0800000-0000-0000-0000-000000000008',
        name_snapshot: 'Garlic Butter Chur Chur Naan',
        price_snapshot: 85,
        quantity: 1,
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'ord-102-demo-prep',
    restaurant_id: 'b0000000-0000-0000-0000-000000000001',
    table_id: 't4000000-0000-0000-0000-000000000004',
    customer_name: 'Pooja Verma',
    customer_phone: '+91 98220 33445',
    status: 'preparing',
    payment_status: 'paid',
    payment_method: 'online',
    total_amount: 860,
    notes: 'No ice in the mango lassi.',
    razorpay_order_id: 'order_rzp_mock_102',
    razorpay_payment_id: 'pay_rzp_mock_102',
    created_at: new Date(Date.now() - 11 * 60 * 1000).toISOString(), // 11 mins ago
    updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    table: {
      id: 't4000000-0000-0000-0000-000000000004',
      restaurant_id: 'b0000000-0000-0000-0000-000000000001',
      table_number: '4',
      created_at: new Date().toISOString(),
    },
    order_items: [
      {
        id: 'oi-4',
        order_id: 'ord-102-demo-prep',
        menu_item_id: 'm0600000-0000-0000-0000-000000000006',
        name_snapshot: 'Butter Chicken Purani Dilli',
        price_snapshot: 380,
        quantity: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 'oi-5',
        order_id: 'ord-102-demo-prep',
        menu_item_id: 'm0300000-0000-0000-0000-000000000003',
        name_snapshot: 'Murgh Malai Kebab',
        price_snapshot: 340,
        quantity: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 'oi-6',
        order_id: 'ord-102-demo-prep',
        menu_item_id: 'm1000000-0000-0000-0000-000000000010',
        name_snapshot: 'Ratnagiri Mango Lassi',
        price_snapshot: 140,
        quantity: 1,
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'ord-103-demo-ready',
    restaurant_id: 'b0000000-0000-0000-0000-000000000001',
    table_id: 't1000000-0000-0000-0000-000000000001',
    customer_name: 'Vikram Mehta',
    customer_phone: null,
    status: 'ready',
    payment_status: 'pending',
    payment_method: 'counter',
    total_amount: 450,
    notes: null,
    razorpay_order_id: null,
    razorpay_payment_id: null,
    created_at: new Date(Date.now() - 19 * 60 * 1000).toISOString(), // 19 mins ago
    updated_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    table: {
      id: 't1000000-0000-0000-0000-000000000001',
      restaurant_id: 'b0000000-0000-0000-0000-000000000001',
      table_number: '1',
      created_at: new Date().toISOString(),
    },
    order_items: [
      {
        id: 'oi-7',
        order_id: 'ord-103-demo-ready',
        menu_item_id: 'm0900000-0000-0000-0000-000000000009',
        name_snapshot: 'Dum Biryani Awadhi (Veg)',
        price_snapshot: 290,
        quantity: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 'oi-8',
        order_id: 'ord-103-demo-ready',
        menu_item_id: 'm1100000-0000-0000-0000-000000000011',
        name_snapshot: 'Gulab Jamun with Rabri',
        price_snapshot: 160,
        quantity: 1,
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'ord-104-demo-served',
    restaurant_id: 'b0000000-0000-0000-0000-000000000001',
    table_id: 't3000000-0000-0000-0000-000000000003',
    customer_name: 'Ananya Roy',
    customer_phone: '+91 99887 66554',
    status: 'served',
    payment_status: 'paid',
    payment_method: 'online',
    total_amount: 1120,
    notes: 'Quick service appreciated!',
    razorpay_order_id: 'order_rzp_mock_104',
    razorpay_payment_id: 'pay_rzp_mock_104',
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    table: {
      id: 't3000000-0000-0000-0000-000000000003',
      restaurant_id: 'b0000000-0000-0000-0000-000000000001',
      table_number: '3',
      created_at: new Date().toISOString(),
    },
    order_items: [
      {
        id: 'oi-9',
        order_id: 'ord-104-demo-served',
        menu_item_id: 'm0700000-0000-0000-0000-000000000007',
        name_snapshot: 'Paneer Lababdar',
        price_snapshot: 320,
        quantity: 2,
        created_at: new Date().toISOString(),
      },
      {
        id: 'oi-10',
        order_id: 'ord-104-demo-served',
        menu_item_id: 'm0800000-0000-0000-0000-000000000008',
        name_snapshot: 'Garlic Butter Chur Chur Naan',
        price_snapshot: 85,
        quantity: 4,
        created_at: new Date().toISOString(),
      },
      {
        id: 'oi-11',
        order_id: 'ord-104-demo-served',
        menu_item_id: 'm1000000-0000-0000-0000-000000000010',
        name_snapshot: 'Ratnagiri Mango Lassi',
        price_snapshot: 140,
        quantity: 1,
        created_at: new Date().toISOString(),
      },
    ],
  },
];

// In-memory store for orders across API routes in demo/fallback mode (persisted on globalThis)
const globalForOrders = globalThis as unknown as {
  mockOrders: OrderWithDetails[];
};

if (!globalForOrders.mockOrders) {
  globalForOrders.mockOrders = [...INITIAL_MOCK_ORDERS];
}

export const MEMORY_ORDERS: OrderWithDetails[] = globalForOrders.mockOrders;

export function findOrder(id: string): OrderWithDetails | undefined {
  const list = globalForOrders.mockOrders || MEMORY_ORDERS;
  return list.find((o) => o.id === id);
}

export function saveOrder(order: OrderWithDetails): void {
  if (!globalForOrders.mockOrders) {
    globalForOrders.mockOrders = [...INITIAL_MOCK_ORDERS];
  }
  // Avoid duplicate order entries
  const existingIdx = globalForOrders.mockOrders.findIndex((o) => o.id === order.id);
  if (existingIdx >= 0) {
    globalForOrders.mockOrders[existingIdx] = order;
  } else {
    globalForOrders.mockOrders.unshift(order);
  }
}

export function updateOrder(id: string, status: Order['status']): OrderWithDetails | undefined {
  const list = globalForOrders.mockOrders || MEMORY_ORDERS;
  const match = list.find((o) => o.id === id);
  if (match) {
    match.status = status;
    match.updated_at = new Date().toISOString();
  }
  return match;
}

