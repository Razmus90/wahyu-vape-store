# Wahyu Vape Store - Full Documentation

Complete e-commerce system built with Next.js 14, Supabase, and AI-powered chat.

## Quick Links

| Document | Description |
|----------|-------------|
| [PRD.md](./PRD.md) | Product Requirements Document |
| [QUICKSTART.md](./QUICKSTART.md) | 5-minute quick start guide |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Production deployment guide |
| [BUILD_SUMMARY.md](./BUILD_SUMMARY.md) | Complete build overview |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture details |
| [API_REFERENCE.md](./API_REFERENCE.md) | API endpoint documentation |

---

## Features

### Customer Store
- Product catalog with search and category filters
- Product detail pages
- Shopping cart with persistent state
- Checkout with order creation
- Mock Midtrans payment integration
- AI chat widget (floating bottom-right)

### Admin Dashboard
- Dashboard with real-time stats
- Order management with status filtering
- Product cache viewer with Olsera sync
- Chat history monitor
- System logs with level filtering
- JWT-protected admin login

### Backend
- 19 RESTful API endpoints
- Supabase PostgreSQL with RLS
- JWT authentication
- Rate limiting
- Webhook signature validation
- Comprehensive error logging

---

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL) with RLS
- **Auth**: Custom JWT implementation
- **UI**: shadcn/ui + Lucide React icons

---

## Quick Start

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
npm run dev
```

Visit http://localhost:3000

**Admin**: http://localhost:3000/admin/login (password: `admin123`)

---

## Project Structure

```
app/
  api/                    # 19 API routes
  admin/                  # Admin dashboard (6 pages)
  products/               # Product pages
  cart/                   # Cart page
  checkout/               # Checkout flow
  layout.tsx              # Root layout
  page.tsx                # Homepage
  error.tsx               # Error boundary
  not-found.tsx           # 404 page

components/
  Navbar.tsx              # Navigation
  ProductCard.tsx         # Product card
  ChatWidget.tsx          # AI chat widget
  CartDrawer.tsx          # Cart sidebar
  PublicLayout.tsx        # Public wrapper
  AdminSidebar.tsx        # Admin navigation

lib/
  supabase.ts             # Supabase client + types
  cartContext.tsx          # Cart state
  adminContext.tsx         # Admin auth context
  auth.ts                 # JWT utilities
  midtrans.ts             # Payment utilities
  rateLimit.ts            # Rate limiting
  services/               # Business logic
    productService.ts
    orderService.ts
    chatService.ts
    logService.ts

middleware.ts             # Admin route protection
```

---

## Database Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| products_cache | Product inventory | Yes |
| orders | Customer orders | Yes |
| order_items | Order line items | Yes |
| chat_sessions | AI chat sessions | Yes |
| chat_messages | Chat messages | Yes |
| logs | System activity | Yes |

---

## Security

- JWT authentication for admin routes
- Rate limiting (50 req/min chat, 20 req/min orders)
- Middleware route protection
- Midtrans webhook signature validation
- RLS policies on all tables
- Input validation on all APIs
- Error boundaries
- No hardcoded secrets

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| NEXT_PUBLIC_SUPABASE_URL | Yes | Supabase project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Yes | Supabase public key |
| ADMIN_PASSWORD | Yes | Admin login password |
| JWT_SECRET | Yes | Token signing secret |
| MIDTRANS_SERVER_KEY | No | Midtrans payment key |
| OPENROUTER_API_KEY | No | AI API key |
| OLSERA_API_KEY | No | Product sync key |

---

## License

Private project for Wahyu Vape Store.
