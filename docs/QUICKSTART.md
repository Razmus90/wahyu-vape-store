# Quick Start Guide - Wahyu Vape Store

Get the store running in 5 minutes.

## 1. Install

```bash
npm install
```

## 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ADMIN_PASSWORD=admin123
JWT_SECRET=change-this-secret-key
```

## 3. Run

```bash
npm run dev
```

Visit http://localhost:3000

## 4. Test the Store

### Browse & Shop
1. Go to `/products` - browse catalog
2. Click a product - view details
3. Click "Add to Cart" - add items
4. Go to `/cart` - review cart
5. Click "Checkout" - fill form and submit
6. Click "Simulate Payment Success" - mark order as PAID

### Try AI Chat
1. Click the orange chat button (bottom-right)
2. Ask: "What devices do you have?"
3. Ask: "What's the price of the starter kit?"
4. Ask: "Do you have stock?"

### Admin Panel
1. Go to `/admin/login`
2. Password: `admin123`
3. View dashboard, orders, products, chats, logs

## 5. Build for Production

```bash
npm run build
npm run start
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full production setup.

## Key URLs

| URL | Page |
|-----|------|
| `/` | Homepage |
| `/products` | Product catalog |
| `/products/[id]` | Product detail |
| `/cart` | Shopping cart |
| `/checkout` | Checkout |
| `/admin/login` | Admin login |
| `/admin` | Dashboard |
| `/admin/orders` | Orders |
| `/admin/products` | Products |
| `/admin/chats` | Chat history |
| `/admin/logs` | System logs |

## Troubleshooting

**Chat not working?** Check Supabase connection in `.env.local`

**Admin login fails?** Clear browser cache, check `ADMIN_PASSWORD` in `.env.local`

**Build errors?** Run `rm -rf .next && npm install && npm run build`
