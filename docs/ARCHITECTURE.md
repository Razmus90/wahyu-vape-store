# Architecture - Wahyu Vape Store

## System Architecture

```
                +----------------+
                |   Customer     |
                +-------+--------+
                        |
        +---------------v---------------+
        |      Website (Next.js)        |
        |  - UI (React)                 |
        |  - Chat Widget                |
        |  - Checkout                   |
        +---------------+---------------+
                        |
        +---------------v---------------+
        |       Backend API             |
        |  - Products API               |
        |  - Orders API                 |
        |  - Chat Handler               |
        |  - Payment Handler            |
        +------+-------+-------+-------+
               |       |       |
       +-------v---+ +-v-----+ +v----------+
       | Olsera API | |Midtrans| |OpenRouter |
       | (Mock)     | |(Mock) | |(Future)  |
       +------------+ +--------+ +----------+
               |
       +-------v--------+
       | Supabase DB    |
       | (PostgreSQL)   |
       +----------------+
```

## Data Flow

### Product Flow
```
Olsera (Mock) -> Sync Service -> products_cache -> Website
```

### Order Flow
```
User Checkout -> Create Order (PENDING_PAYMENT)
  -> Midtrans Payment (Mock) -> Webhook
  -> Status = PAID
```

### Chat Flow
```
User Message -> Chat API -> AI Service (rule-based)
  -> Query products_cache -> Response
```

## File Structure

```
app/
  api/                          # API Routes (19 endpoints)
    products/route.ts           # GET products
    products/[id]/route.ts     # GET product detail
    products/sync/route.ts     # POST sync
    orders/route.ts             # GET/POST orders
    orders/[id]/route.ts       # GET order detail
    chat/route.ts               # POST chat
    payment/create/route.ts    # POST payment
    webhooks/payment/route.ts  # POST webhook
    admin/login/route.ts       # POST auth
    admin/stats/route.ts       # GET stats
    admin/chats/route.ts       # GET chats
    admin/logs/route.ts        # GET logs

  admin/                        # Admin Dashboard
    layout.tsx                  # Admin layout with sidebar
    page.tsx                    # Dashboard
    orders/page.tsx             # Orders
    products/page.tsx           # Products
    chats/page.tsx              # Chat history
    logs/page.tsx               # System logs
    login/page.tsx              # Admin login

  products/                     # Public Store
    page.tsx                    # Product catalog
    [id]/page.tsx              # Product detail

  cart/page.tsx                 # Cart
  checkout/page.tsx             # Checkout
  layout.tsx                    # Root layout
  page.tsx                      # Homepage
  error.tsx                     # Error boundary
  not-found.tsx                 # 404

components/
  Navbar.tsx                    # Navigation bar
  ProductCard.tsx               # Product card
  ChatWidget.tsx                # AI chat widget
  CartDrawer.tsx                # Cart sidebar
  PublicLayout.tsx              # Public wrapper
  AdminSidebar.tsx              # Admin navigation

lib/
  supabase.ts                   # Supabase client + types
  cartContext.tsx                # Cart state (localStorage)
  adminContext.tsx               # Admin auth context
  auth.ts                       # JWT utilities
  midtrans.ts                   # Payment utilities
  rateLimit.ts                  # Rate limiting
  utils.ts                      # Helper functions
  services/
    productService.ts           # Product logic
    orderService.ts             # Order logic
    chatService.ts              # Chat logic
    logService.ts               # Logging logic

middleware.ts                   # Admin route protection
```

## Service Layer

### productService
- `getAll(category?)` - Get all products with optional filter
- `getById(id)` - Get single product
- `syncFromOlsera()` - Sync from mock Olsera API
- `search(query)` - Search products by name

### orderService
- `create(input)` - Create order with items
- `getById(id)` - Get order with items
- `getAll(status?)` - List orders with filter
- `updateStatus(id, status)` - Update order status
- `updatePaymentToken(id, token, url)` - Store payment info
- `getStats()` - Get dashboard statistics

### chatService
- `getOrCreateSession(token?)` - Get or create chat session
- `saveMessage(sessionId, role, content)` - Save message
- `getSessionMessages(sessionId)` - Get session messages
- `generateResponse(userMessage, sessionId)` - AI response
- `getAllSessions()` - Get all sessions (admin)

### logService
- `create(level, action, message, metadata)` - Create log entry
- `getAll(limit)` - Get all logs
- `getByLevel(level, limit)` - Get logs by level

## Security Architecture

### Authentication
- JWT tokens for admin access
- Cookie-based session (httpOnly ready)
- Middleware checks on `/admin/*` routes
- Token expiry: 24 hours

### Rate Limiting
- In-memory rate limiter
- Chat: 50 requests/minute
- Orders: 20 requests/minute
- Keyed by IP address

### Database Security
- RLS enabled on all tables
- Anon access for public reads
- Authenticated access for writes
- No `USING (true)` policies

### API Security
- Input validation on all endpoints
- Error handling with try/catch
- No sensitive data in responses
- CORS headers on edge functions

## Database Schema

### products_cache
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| olsera_product_id | text | Olsera ID (unique) |
| name | text | Product name |
| description | text | Product description |
| price | numeric(12,2) | Price in IDR |
| stock | integer | Available stock |
| category | text | Category name |
| image_url | text | Product image URL |
| last_synced_at | timestamptz | Last sync time |
| created_at | timestamptz | Creation time |

### orders
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| customer_name | text | Customer name |
| customer_email | text | Customer email |
| customer_phone | text | Phone number |
| customer_address | text | Delivery address |
| status | text | PENDING_PAYMENT/PAID/FAILED/CANCELLED |
| total_price | numeric(12,2) | Order total |
| payment_token | text | Midtrans token |
| payment_url | text | Payment URL |
| notes | text | Order notes |
| created_at | timestamptz | Creation time |
| updated_at | timestamptz | Last update |

### order_items
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| order_id | uuid | FK to orders |
| product_id | uuid | FK to products_cache |
| product_name | text | Product name (snapshot) |
| quantity | integer | Item quantity |
| unit_price | numeric(12,2) | Price per unit |
| subtotal | numeric(12,2) | Line total |
| created_at | timestamptz | Creation time |

### chat_sessions
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| session_token | text | Session token (unique) |
| customer_name | text | Customer name |
| customer_email | text | Customer email |
| started_at | timestamptz | Session start |
| last_active_at | timestamptz | Last activity |

### chat_messages
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| session_id | uuid | FK to chat_sessions |
| role | text | user/assistant |
| content | text | Message content |
| created_at | timestamptz | Creation time |

### logs
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| level | text | INFO/WARN/ERROR/DEBUG |
| action | text | Action name |
| message | text | Log message |
| metadata | jsonb | Additional data |
| created_at | timestamptz | Creation time |
