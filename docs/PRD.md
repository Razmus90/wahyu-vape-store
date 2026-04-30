# PRODUCT REQUIREMENT DOCUMENT (PRD)

## Wahyu Vape Store - AI Commerce System

---

# 1. EXECUTIVE SUMMARY

## 1.1 Tujuan

Membangun sistem e-commerce berbasis AI untuk Wahyu Vape Store yang:

* Terintegrasi penuh dengan Olsera POS
* Mendukung multi-channel chat (Web & WhatsApp)
* Menggunakan AI sebagai sales assistant
* Mendukung pembayaran online via Midtrans
* Dapat di-deploy di VPS sendiri

---

## 1.2 Prinsip Utama

* **Olsera = Source of Truth**
* **Website = Channel penjualan**
* **AI = Sales assistant**
* **Database lokal = cache & operational**

---

# 2. SYSTEM ARCHITECTURE

## 2.1 High-Level Diagram

```
                +----------------+
                |   Customer     |
                +-------+--------+
                        |
        +---------------v---------------+
        |      Website (Next.js)        |
        |  - UI                         |
        |  - Chat Widget                |
        |  - Checkout                   |
        +---------------+---------------+
                        |
        +---------------v---------------+
        |       Backend API             |
        |  - Orders                     |
        |  - Chat Handler               |
        |  - Payment Handler            |
        +------+-------+-------+-------+
               |       |       |
       +-------v---+ +-v-----+ +v----------+
       | Olsera API | |Midtrans| |OpenRouter |
       | Products   | |Payment | |AI Model  |
       +------------+ +--------+ +----------+
               |
       +-------v--------+
       | PostgreSQL DB  |
       +----------------+

       +--------------------+
       | WhatsApp Agent     |
       | (Baileys)          |
       +----+---------------+
            |
       +----v------+
       |  AI Core  |
       +-----------+
```

---

# 3. DATA FLOW

## 3.1 Product Flow

```
Olsera -> Sync Service -> products_cache -> Website
```

## 3.2 Order Flow

```
User Checkout
    |
Create Order (PENDING)
    |
Midtrans Payment
    |
Webhook Received
    |
Status = PAID
    |
Send to Olsera
    |
Status = POSTED
```

## 3.3 AI Chat Flow

```
User Message
    |
AI Core
    |
Call Tools:
  - product search
  - stock check
    |
Response
```

---

# 4. DATABASE DESIGN

## 4.1 Tables

### products_cache
* id
* olsera_product_id
* name
* price
* stock
* image_url
* last_synced_at

### orders
* id
* status
* total_price
* customer_id
* created_at

### order_items
* order_id
* product_id
* qty
* price

### payments
* order_id
* midtrans_id
* status
* payment_type

### customers
* id
* name
* phone
* email

### chat_sessions
* id
* user_id
* channel (web/wa)

### chat_messages
* session_id
* role
* content

### logs
* type
* payload
* status

---

# 5. API DESIGN

## 5.1 Products
GET /api/products
POST /api/products/sync

## 5.2 Orders
POST /api/orders
GET /api/orders/:id

## 5.3 Payment
POST /api/payment/create
POST /api/webhooks/midtrans

## 5.4 AI Chat
POST /api/chat

## 5.5 WhatsApp
POST /api/wa/incoming

---

# 6. FRONTEND DESIGN

## 6.1 Customer UI
Pages: Home, Products, Product Detail, Cart, Checkout, Order Status
Components: Navbar, Chat Widget, Product Card, Cart Drawer, Payment Modal

## 6.2 Admin Dashboard
Routes: /admin, /admin/orders, /admin/products, /admin/chats, /admin/payments, /admin/logs

---

# 7. ADMIN FEATURES

## 7.1 Overview
* omzet, pending order, error sync

## 7.2 Orders
* detail order, retry sync, cancel

## 7.3 Products
* sync status, manual sync

## 7.4 AI Chat
* monitor percakapan, takeover manual

## 7.5 Logs
* API logs, webhook logs, error logs

---

# 8. AI SYSTEM DESIGN

## 8.1 AI Core
Tools: get_products(), get_stock(), create_order(), get_order_status()
Rules: tidak boleh halusinasi stok, semua data via API

## 8.2 Prompt Structure
```
System: Anda adalah sales Wahyu Vape Store
Rules: hanya bahas vape, gunakan data dari API, arahkan ke checkout
Tools: product_search, stock_check
```

---

# 9. SECURITY
* JWT Auth untuk admin
* Rate limit API
* Validate Midtrans signature
* Input sanitization
* Logging semua request penting

---

# 10. DEPLOYMENT

## 10.1 VPS Setup
Node.js, PostgreSQL, PM2, Nginx

## 10.2 Env Variables
DATABASE_URL, MIDTRANS_SERVER_KEY, MIDTRANS_CLIENT_KEY, OPENROUTER_API_KEY, OLSERA_API_KEY

---

# 11. ROADMAP

Phase 1: MVP web + AI chat + payment
Phase 2: WhatsApp integration
Phase 3: AI recommendation
Phase 4: Mobile app

---

# 12. SUCCESS METRICS
* conversion rate
* chat engagement
* order success rate
* sync error rate

---

END OF PRD
