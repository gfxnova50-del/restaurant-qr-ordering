# 🍽️ Multi-Tenant QR Menu & Ordering SaaS Backend

A scalable, production-grade backend for a multi-tenant QR code digital menu and table ordering SaaS designed for restaurants. Built with **Next.js (App Router, TypeScript)**, **Supabase (PostgreSQL + Auth + Realtime + Storage)**, **Razorpay**, and **Zod**.

---

## 🌟 Architecture & Highlights

- **Multi-Tenant Database Isolation**: Each restaurant operates under its own tenant space. Owner user accounts in Supabase Auth manage restaurant settings, tables, categories, menu items, and incoming orders.
- **Row Level Security (RLS)**:
  - Restaurant owners can strictly read and write only their own restaurant's data.
  - Public anonymous users can read menus and categories by slug.
  - Public order insertion is restricted strictly to valid restaurants and existing tables.
  - Customers can access their orders only via cryptographically unguessable UUIDs.
  - Only owners (or privileged backend webhooks) can alter order statuses.
- **Server Price Integrity (Anti-Tampering)**: The server **never trusts client-side prices**. All line item prices and total amounts are recomputed from database menu prices before order creation.
- **Realtime Kitchen & Order Display**: Supabase Realtime is enabled on `orders` and `order_items` for live updates in kitchen display systems (KDS) and owner dashboards.
- **Razorpay Payments**: Automated order generation and webhook signature verification (`x-razorpay-signature` with HMAC SHA-256) to mark orders as `paid`.
- **Dynamic Table QR Generation**: Instant PNG and bulk ZIP generation for all tables using the standard format:
  `{SITE_URL}/r/{slug}?table={table_number}`.
- **Supabase Storage**: Pre-configured public asset bucket (`restaurant-assets`) for restaurant logos and dish images with upload policies.

---

## 🗄️ Database Schema

The database consists of 6 core tables and 3 custom ENUMs:

### ENUMs
- `order_status`: `'received'`, `'preparing'`, `'ready'`, `'served'`, `'cancelled'`
- `payment_status`: `'pending'`, `'paid'`
- `payment_method`: `'counter'`, `'online'`

### Tables
1. **`restaurants`**:
   - `id`: UUID (PK)
   - `owner_id`: UUID (FK to `auth.users`)
   - `name`: TEXT
   - `slug`: TEXT (Unique)
   - `logo_url`: TEXT (Nullable)
   - `phone`: TEXT (Nullable)
   - `currency`: TEXT (Default `'INR'`)
   - `accepts_online_payment`: BOOLEAN (Default `true`)
   - `created_at`: TIMESTAMPTZ
   - `updated_at`: TIMESTAMPTZ

2. **`tables`**:
   - `id`: UUID (PK)
   - `restaurant_id`: UUID (FK to `restaurants`)
   - `table_number`: TEXT (e.g. `'Table 1'`, `'T-02'`)
   - `created_at`: TIMESTAMPTZ
   - *Constraint*: `UNIQUE (restaurant_id, table_number)`

3. **`categories`**:
   - `id`: UUID (PK)
   - `restaurant_id`: UUID (FK to `restaurants`)
   - `name`: TEXT (e.g. `'Starters & Appetizers'`)
   - `sort_order`: INT (Default `0`)
   - `created_at`: TIMESTAMPTZ

4. **`menu_items`**:
   - `id`: UUID (PK)
   - `restaurant_id`: UUID (FK to `restaurants`)
   - `category_id`: UUID (FK to `categories`)
   - `name`: TEXT
   - `description`: TEXT (Nullable)
   - `price`: NUMERIC(10, 2)
   - `image_url`: TEXT (Nullable)
   - `is_veg`: BOOLEAN (Default `true`)
   - `is_available`: BOOLEAN (Default `true`)
   - `sort_order`: INT (Default `0`)
   - `created_at`: TIMESTAMPTZ
   - `updated_at`: TIMESTAMPTZ

5. **`orders`**:
   - `id`: UUID (PK, unguessable UUID)
   - `restaurant_id`: UUID (FK to `restaurants`)
   - `table_id`: UUID (FK to `tables`)
   - `customer_name`: TEXT (Nullable)
   - `customer_phone`: TEXT (Nullable)
   - `status`: `order_status` (Default `'received'`)
   - `payment_status`: `payment_status` (Default `'pending'`)
   - `payment_method`: `payment_method` (Default `'counter'`)
   - `total_amount`: NUMERIC(10, 2)
   - `notes`: TEXT (Nullable)
   - `razorpay_order_id`: TEXT (Nullable)
   - `razorpay_payment_id`: TEXT (Nullable)
   - `created_at`: TIMESTAMPTZ
   - `updated_at`: TIMESTAMPTZ

6. **`order_items`**:
   - `id`: UUID (PK)
   - `order_id`: UUID (FK to `orders`)
   - `menu_item_id`: UUID (FK to `menu_items`)
   - `name_snapshot`: TEXT
   - `price_snapshot`: NUMERIC(10, 2)
   - `quantity`: INT (Check `quantity > 0`)
   - `created_at`: TIMESTAMPTZ

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ (tested on Node.js 24)
- A Supabase Project (cloud or local)
- A Razorpay Account (Test Mode API Keys)

### 2. Environment Setup
Copy `.env.example` to `.env.local` or `.env`:
```bash
cp .env.example .env.local
```

Fill in the required variables:
```ini
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Razorpay Credentials
RAZORPAY_KEY_ID="rzp_test_xxxxxx"
RAZORPAY_KEY_SECRET="your_razorpay_secret"
RAZORPAY_WEBHOOK_SECRET="your_razorpay_webhook_secret"

# Site URL for QR code generation
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Demo Owner Credentials (for seeding)
DEMO_OWNER_EMAIL="owner@spicegarden.demo"
DEMO_OWNER_PASSWORD="demo123456"
```

### 3. Database Migration
Run the SQL migrations in your Supabase SQL Editor:
1. `supabase/migrations/20240101000000_init_schema.sql` (Tables, Enums, Indexes, and Triggers)
2. `supabase/migrations/20240101000001_rls_and_realtime.sql` (RLS Policies, Realtime Publication, and Storage Bucket)

Alternatively, if using the Supabase CLI:
```bash
supabase db push
```

### 4. Seed Demo Data
You can seed the database with 1 demo restaurant (`spice-garden`), 5 tables, 3 categories, and 10 menu items using either:

#### Option A: TypeScript Seed Script (Recommended)
```bash
npm run seed
```

#### Option B: SQL Seed
Run the contents of `supabase/seed.sql` directly inside the Supabase SQL Editor.

### 5. Run Development Server
```bash
npm run dev
```
The development server binds to `0.0.0.0` (accessible to any device on the same local network). On startup, it automatically detects your laptop's Wi-Fi / LAN IP, prints clear links for the customer menu and admin panel, and displays an instant ASCII QR code right in your terminal for your phone's camera!

---

## 📱 Open on Phone & Mobile Testing

This application is designed to be mobile-first and fully accessible from physical phones during development and in production.

### A. Same Wi-Fi Network Access (Zero Config)
1. Ensure your phone and development computer are connected to the **same Wi-Fi network**.
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Look at your terminal output:
   - **Customer Menu**: `http://<LAN_IP>:3000/?table=1` (Auto-redirects to Spice Garden Table 1)
   - **Admin Dashboard**: `http://<LAN_IP>:3000/admin` (Auto-redirects to Live Kitchen & Order Management)
   - **Terminal QR Code**: Scan the ASCII QR code printed directly in your terminal with your phone's camera!
4. **Visual QR Portal**:
   - Open `http://<LAN_IP>:3000/dev/connect` on your computer or phone to see large high-contrast QR codes for each table (Table 1 through 5) and the Admin panel, with one-tap link copy buttons.

#### ⚠️ Windows Firewall & Wi-Fi Troubleshooting:
- **Windows Defender Firewall Prompt**: When running Node for the first time, Windows will ask whether to allow Node.js through the firewall. Ensure you check **Private networks** and click **Allow access**.
- **Can't connect?**
  1. Verify your network profile is set to **Private** in Windows Settings -> Network & Internet -> Wi-Fi -> Properties.
  2. Find your IP manually in PowerShell:
     ```powershell
     ipconfig
     ```
     Look for `IPv4 Address` under your active Wi-Fi adapter (e.g. `192.168.0.101`).
  3. Ensure your Wi-Fi router does not have **AP Isolation / Client Isolation** enabled (some guest networks prevent devices from communicating with each other).

---

### B. Dev Access Over Mobile Data (Cloudflare Quick Tunnel)
Test on your phone over 4G/5G mobile data without being on the same Wi-Fi and without deploying to production:

1. **Install `cloudflared` (Cloudflare Tunnel CLI)**:
   - **Windows** (via winget or choco):
     ```powershell
     winget install --id Cloudflare.cloudflared
     # OR
     choco install cloudflared
     ```
   - **macOS** (via Homebrew):
     ```bash
     brew install cloudflare/cloudflare/cloudflared
     ```
   - **Linux**: Download package from [Cloudflare Releases](https://github.com/cloudflare/cloudflared/releases).

2. **Start the tunnel**:
   ```bash
   npm run share
   ```
   This starts a secure Cloudflare quick tunnel to your local server on port 3000, displays your temporary public HTTPS URL (`https://*.trycloudflare.com`), and renders a scannable QR code in your terminal.
3. Realtime SSE streams and owner authentication cookies are fully supported over HTTPS through the tunnel!

---

### C. Progressive Web App (PWA) & Kitchen Tablet Features
Staff and kitchen managers can install the admin panel like a native app on iPads, Android tablets, or phones:
- **Add to Home Screen**:
  - **Android (Chrome)**: Tap the menu `⋮` and select **"Install App"** (or click the in-app "Install App" button).
  - **iOS (Safari)**: Tap the Share button `⎋` and choose **"Add to Home Screen"**.
- **Keep Screen On (Wake Lock API)**:
  - Inside the Admin Order Dashboard, toggle the **"Keep Screen On"** switch. This prevents the tablet screen from dimming or sleeping during busy restaurant shifts.
- **Audible Order Chimes**:
  - Web browsers block audio playback until user interaction. Tap the **"Enable Sound"** button on the dashboard to activate instant audio chimes for new incoming orders.
- **Network Resilience & Auto-Reconnect**:
  - If Wi-Fi drops, an amber pulsing **"Reconnecting..."** banner warns staff and customers, and automatically resubscribes to live order updates once connectivity is restored.

---

### D. Production Deployment & Trust Proxy
- Set `NEXT_PUBLIC_SITE_URL="https://yourdomain.com"` in `.env.production`.
- The QR generator automatically generates table codes pointing to your production domain.
- **Uptime Health Check**: Ping `GET /health` to receive `{ "status": "ok", "uptime": 120, "env": "production" }` for monitoring services (e.g. Better Uptime, Datadog).
- **Reverse Proxy / CDN**: The server automatically inspects standard proxy headers (`x-forwarded-for`, `x-forwarded-proto`, `cf-connecting-ip`) for accurate client IP tracking and secure cookies behind Cloudflare or Caddy/Nginx.

---

## 📡 API Reference

### 1. Create Order
**`POST /api/orders`**
- Validates the table and restaurant.
- Recomputes all prices from the database (client cannot tamper with totals).
- Creates the order and line item snapshots.

**Request Body:**
```json
{
  "restaurant_id": "b0000000-0000-0000-0000-000000000001",
  "table_id": "t1000000-0000-0000-0000-000000000001",
  "customer_name": "Aarav Gupta",
  "customer_phone": "+919876543210",
  "payment_method": "counter",
  "notes": "Less spicy please",
  "items": [
    {
      "menu_item_id": "m0100000-0000-0000-0000-000000000001",
      "quantity": 2
    },
    {
      "menu_item_id": "m0700000-0000-0000-0000-000000000007",
      "quantity": 3
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "message": "Order created successfully",
  "order": {
    "id": "27885b1d-ef23-4560-93a9-e2b2bb20d6ab",
    "restaurant_id": "b0000000-0000-0000-0000-000000000001",
    "table_id": "t1000000-0000-0000-0000-000000000001",
    "customer_name": "Aarav Gupta",
    "customer_phone": "+919876543210",
    "status": "received",
    "payment_status": "pending",
    "payment_method": "counter",
    "total_amount": 770.00,
    "table_number": "Table 1",
    "currency": "INR",
    "items": [
      {
        "id": "...",
        "name_snapshot": "Paneer Tikka",
        "price_snapshot": 280.00,
        "quantity": 2
      },
      {
        "id": "...",
        "name_snapshot": "Butter Garlic Naan",
        "price_snapshot": 70.00,
        "quantity": 3
      }
    ]
  }
}
```

---

### 2. View Order by Unguessable UUID
**`GET /api/orders/[id]`**
- Public endpoint allowing customers to track their order status using their secret UUID.

---

### 3. Update Order Status (Owner Only)
**`PATCH /api/orders/[id]/status`**
- Restricted to the authenticated owner of the restaurant.
- Authenticate via Supabase cookie session or `Authorization: Bearer <token>` header.

**Request Body:**
```json
{
  "status": "preparing"
}
```
*Allowed statuses:* `'received'`, `'preparing'`, `'ready'`, `'served'`, `'cancelled'`

---

### 4. Create Razorpay Payment Order
**`POST /api/payments/create`**
- Creates a Razorpay order in the restaurant's currency.
- Associates the `razorpay_order_id` with the internal order.

**Request Body:**
```json
{
  "order_id": "27885b1d-ef23-4560-93a9-e2b2bb20d6ab"
}
```

**Response (200 OK):**
```json
{
  "message": "Razorpay order created successfully",
  "razorpay_order_id": "order_NX81jhs671s",
  "amount": 77000,
  "currency": "INR",
  "key_id": "rzp_test_xxxxxx",
  "order_id": "27885b1d-ef23-4560-93a9-e2b2bb20d6ab",
  "total_amount": 770.00
}
```

---

### 5. Razorpay Webhook
**`POST /api/payments/webhook`**
- Validates the `x-razorpay-signature` header using `RAZORPAY_WEBHOOK_SECRET`.
- On `payment.captured` or `order.paid`, automatically updates `payment_status` to `'paid'` and records the `razorpay_payment_id`.

---

### 6. Generate Table QR Codes
**`GET /api/qr/[restaurantSlug]`**
- Uses the `qrcode` and `jszip` libraries.
- Generates QR codes directing to: `{SITE_URL}/r/{slug}?table={table_number}`

**Query Parameters:**
| Parameter | Description |
|-----------|-------------|
| `table` | (Optional) Specific table name (e.g. `?table=Table 1`). Returns a PNG image directly. |
| `format=zip` | (Default when multiple tables) Returns a `.zip` archive containing PNG images for all tables. |
| `format=png` | Returns a PNG image. |
| `format=json` | Returns JSON listing all table URLs, target links, and download endpoints. |

**Examples:**
- `GET /api/qr/spice-garden?format=zip` -> Downloads `spice-garden-tables-qr.zip`
- `GET /api/qr/spice-garden?table=Table 1` -> Downloads `spice-garden-table-Table_1.png`
- `GET /api/qr/spice-garden?format=json` -> JSON table directory

---

### 7. Public Menu Endpoint
**`GET /api/menu/[slug]`**
- Returns restaurant details, tables, categories, and available menu items grouped by category.

---

## ⚡ Supabase Realtime Subscription Guide

Frontend clients (kitchen display or customer tracker) can subscribe to order changes using the Supabase client:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Listen to new and updated orders for a restaurant:
const ordersChannel = supabase
  .channel('restaurant-orders')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'orders',
      filter: `restaurant_id=eq.${restaurantId}`,
    },
    (payload) => {
      console.log('Order update received:', payload);
    }
  )
  .subscribe();
```

---

## 🛡️ Security & Row Level Security (RLS) Summary

| Table | Public Access | Owner Access |
|---|---|---|
| `restaurants` | Read by slug/id | Full CRUD (insert, update, delete own restaurant) |
| `tables` | Read tables | Full CRUD for own restaurant tables |
| `categories` | Read categories | Full CRUD for own restaurant categories |
| `menu_items` | Read available items | Full CRUD for own restaurant menu items |
| `orders` | Insert for valid table/restaurant, Read by secret UUID | Read all restaurant orders, Update status |
| `order_items` | Insert for valid order/items, Read by secret UUID | Full CRUD for own restaurant order items |

---

## 🧪 Testing with cURL

### 1. Fetch Menu
```bash
curl http://localhost:3000/api/menu/spice-garden
```

### 2. Place Order
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "restaurant_id": "b0000000-0000-0000-0000-000000000001",
    "table_id": "t1000000-0000-0000-0000-000000000001",
    "customer_name": "Rohan",
    "items": [
      { "menu_item_id": "m0100000-0000-0000-0000-000000000001", "quantity": 1 }
    ]
  }'
```

### 3. Generate Table QR
```bash
curl -O http://localhost:3000/api/qr/spice-garden?format=zip
```
