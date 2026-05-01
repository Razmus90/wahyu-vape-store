# Chat AI & Embeddings - Summary of Work

## Overview
Implemented AI-powered chat (Sasa) for Wahyu Vape Store with multi-provider support, product-aware responses, and vector embeddings for semantic search.

---

## 1. Chat Settings Admin Page
**File:** `app/admin/chat-settings/page.tsx`

### Features
- **Provider selector**: OpenAI, Anthropic Claude, OpenRouter (dropdown)
- **Model**: Text input (supports any model name, e.g., `gpt-4o`, `openai/gpt-4o`)
- **Temperature slider** (0-1), **Max Tokens** input
- **System Prompt** textarea (persona configuration)
- **Guardrails**:
  - Blocked words (tag input)
  - Blocked topics (tag input)
  - Max response length
  - Profanity filter toggle
- **API Keys (Sealed)**:
  - Input per provider (OpenAI, Anthropic, OpenRouter)
  - Masked display (`••••••••`) after save
  - "Update" button to change existing key
  - Encrypted via AES-GCM (`lib/crypto.ts`) before DB storage
- **Test Chat**: Verify connection to provider

### API Integration
**File:** `app/api/admin/chat-settings/route.ts`
- `GET`: Fetch settings (masks API keys before sending to client)
- `POST`: Save settings (encrypts API keys)
- `PUT`: Test connection (fetches DB keys if client sends masked)

---

## 2. Customer Chat Widget
**Files:**
- `components/ChatWidget.tsx` - UI component
- `app/api/chat/route.ts` - API endpoint
- `lib/services/chatService.ts` - Session + message handling
- `lib/services/aiService.ts` - AI integration

### Flow
1. User types message in `ChatWidget`
2. `POST /api/chat` with `{ message, sessionToken }`
3. Rate limit check (50 req/min)
4. Get/Create session in `chat_sessions` table
5. Save user message to `chat_messages`
6. Generate response:
   - **Try AI first** (`aiService.generateResponse()`)
   - Fetch `products_cache` (limit 10)
   - Inject product list into system prompt + user message
   - Call provider (OpenAI/Anthropic/OpenRouter)
   - **Fallback to rule-based** if AI fails
7. Save assistant reply to `chat_messages`
8. Return `{ reply, sessionToken }` to widget

### AI Prompt Engineering
- **Strict system prompt**: Forces AI to ONLY use products from `products_cache`
- **Few-shot examples**: Teaches correct response format
- **Product context injection**: Both system prompt AND user message get product list
- **Instruction**: "Jangan gunakan pengetahuan luar/training data"

---

## 3. Database Tables

### `chat_settings`
```sql
ALTER TABLE chat_settings ADD COLUMN IF NOT EXISTS encrypted_api_keys JSONB DEFAULT '{}';
ALTER TABLE chat_settings ADD COLUMN IF NOT EXISTS embedding_api_key TEXT;
ALTER TABLE chat_settings ADD COLUMN IF NOT EXISTS embedding_model TEXT DEFAULT 'openai/text-embedding-ada-002';
```

### `chat_sessions`
```sql
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  customer_name TEXT DEFAULT 'Guest',
  customer_email TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `chat_messages`
```sql
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `products_cache` (Embeddings)
```sql
ALTER TABLE products_cache ADD COLUMN IF NOT EXISTS embedding vector(1536);
CREATE INDEX IF NOT EXISTS products_embedding_idx 
ON products_cache USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);
```

---

## 4. Embeddings System
**Files:**
- `app/admin/products/page.tsx` - Embedding subtab UI
- `app/api/admin/embedding-settings/route.ts` - Save/load settings
- `app/api/admin/embedding-settings/generate/route.ts` - Generate embeddings
- `lib/services/aiService.ts` - `generateEmbedding()` method

### Features
- **Provider**: Fixed to OpenRouter (in UI)
- **Model dropdown**: `text-embedding-ada-002`, `text-embedding-3-small`, `text-embedding-3-large`
- **API Key**: Stored encrypted in `chat_settings.embedding_api_key`
- **Auto-generate**: During product sync (not separate button)

### Embedding Generation
1. Sync products from Olsera API
2. Upsert into `products_cache` (based on `olsera_product_id`)
3. Delete products NOT in incoming data (cleanup)
4. For products with `embedding IS NULL`:
   - Call OpenRouter API: `POST https://openrouter.ai/api/v1/embeddings`
   - Model: `openai/text-embedding-ada-002`
   - Input: `product.name`
   - Save 1536-dimension vector to `products_cache.embedding`

---

## 5. Product Sync Logic
**File:** `lib/services/productService.ts`

### Changes Made
**Before (broken):**
- Delete ALL rows → Insert fresh (destroys embeddings)

**After (fixed):**
1. Fetch all products from Olsera API
2. **Upsert** each product (insert or update based on `olsera_product_id`)
3. **Delete** products NOT in incoming data (cleanup old products)
4. **Auto-generate embeddings** for products where `embedding IS NULL`

### Sync API Response
```json
{
  "success": true,
  "message": "Synced: X, Deleted: Y, Embeddings: Z, Errors: W",
  "data": { "synced": X, "deleted": Y, "embeddings": Z, "errors": W }
}
```

---

## 6. Key Fixes Applied

| Issue | Fix |
|-------|-----|
| Table name mismatch (`product_cache` vs `products_cache`) | Fixed all references to `products_cache` |
| API keys sent raw to client | Mask keys before sending (`••••••••`) |
| Test connection ignores DB keys | Fetch DB keys if client sends masked |
| Supabase errors not caught | Fixed error handling (non-Error objects) |
| AI uses training data not DB | Inject product list into system prompt + user message with strict instructions |
| Embeddings use wrong API | `generateEmbedding()` now calls OpenRouter API directly |
| Sync deletes embeddings | Rewrote to upsert + cleanup + auto-embeddings |
| No progress indicator | Added `syncProgress` state showing: `Syncing...` → `Done! Synced: X, Deleted: Y...` |

---

## 7. Environment Variables Needed
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Encryption
JWT_SECRET=your-secret-key

# Fallback API Keys (only if not in DB)
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
OPENROUTER_API_KEY=...

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 8. SQL Files Created
1. **`supabase/chat-tables.sql`** - Creates `chat_sessions`, `chat_messages`, RLS policies
2. **`supabase/add-embedding-column.sql`** - Adds `embedding vector(1536)` column
3. **`supabase/add-embedding-settings.sql`** - Adds `embedding_api_key`, `embedding_model` to `chat_settings`

---

## 9. Packages Installed
```bash
npm install openai @anthropic-ai/sdk
```

---

## 10. How to Test

### Admin Setup
1. Run SQL files in Supabase SQL Editor
2. Go to `http://localhost:3000/admin/chat-settings`
3. Enter API keys for desired providers (sealed)
4. Configure persona, guardrails
5. Click "Test" to verify connection
6. Click "Save Settings"

### Embeddings
1. Go to `http://localhost:3000/admin/products`
2. Enter OpenRouter API key in "Embedding" tab
3. Click "Save Settings"
4. Click "Sync Products" (auto-generates embeddings)

### Customer Chat
1. Go to `http://localhost:3000`
2. Click chat bubble (bottom-right)
3. Type: "apa saja pod yang tersedia?"
4. Sasa should reply with actual products from DB (not training data)

---

## 11. Current Architecture

```
[CUSTOMER] → [ChatWidget.tsx] → [POST /api/chat]
                                    ↓
                            [chatService.ts]
                                    ↓
                    ┌───────────────────┬───────────────────┐
                    ↓                   ↓                   ↓
            [aiService.ts]    [products_cache]    [chat_sessions]
                    ↓                   (fetch 10)          ↓
            [OpenAI/Anthropic    (product list)    [chat_messages]
             /OpenRouter]          ↓
                    ↓            [system prompt +
            [AI Response]       user message]
                                       ↓
                                [Sasa reply with DB products only]
```

---

## 12. Future Enhancement (Ready)
- **Semantic search**: Use `embedding` column with cosine similarity (`<=>` operator)
- Replace random 10 products with top-5 most relevant via vector search
- Cost: ~$0.0001 per embedding (one-time per product)

---

**Status:** ✅ Build passes, chat works with DB products, embeddings auto-generated during sync.
