# API Reference - Wahyu Vape Store

Complete API documentation for all endpoints.

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

---

## Products

### GET /api/products

Get all products with optional filtering.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category (devices, liquids, accessories, disposables) |
| search | string | Search by product name |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "olsera_product_id": "OLS-001",
      "name": "Vape Pod System Starter Kit",
      "description": "Complete starter kit...",
      "price": 450000,
      "stock": 25,
      "category": "devices",
      "image_url": "https://...",
      "last_synced_at": "2026-04-28T...",
      "created_at": "2026-04-28T..."
    }
  ]
}
```

### GET /api/products/[id]

Get a single product by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Product Name",
    "price": 450000,
    "stock": 25,
    ...
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Product not found"
}
```

### POST /api/products/sync

Sync products from Olsera (mock).

**Request Body:** None required

**Response:**
```json
{
  "success": true,
  "message": "Synced 12 products",
  "data": {
    "synced": 12,
    "errors": 0
  }
}
```

---

## Orders

### POST /api/orders

Create a new order.

**Request Body:**
```json
{
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "customer_phone": "08123456789",
  "customer_address": "Jl. Example No. 1, Jakarta",
  "notes": "Please deliver before 5 PM",
  "items": [
    {
      "product_id": "uuid",
      "product_name": "Vape Pod System Starter Kit",
      "quantity": 1,
      "unit_price": 450000
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "customer_name": "John Doe",
    "status": "PENDING_PAYMENT",
    "total_price": 450000,
    "created_at": "2026-04-28T..."
  }
}
```

### GET /api/orders

List all orders with optional status filter.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status (PENDING_PAYMENT, PAID, FAILED, CANCELLED) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "customer_name": "John Doe",
      "status": "PENDING_PAYMENT",
      "total_price": 450000,
      "order_items": [...],
      "created_at": "2026-04-28T..."
    }
  ]
}
```

### GET /api/orders/[id]

Get order details with items.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "status": "PAID",
    "total_price": 450000,
    "order_items": [
      {
        "id": "uuid",
        "product_name": "Vape Pod System Starter Kit",
        "quantity": 1,
        "unit_price": 450000,
        "subtotal": 450000
      }
    ],
    "created_at": "2026-04-28T..."
  }
}
```

---

## Chat

### POST /api/chat

Send a message to the AI assistant.

**Rate Limit:** 50 requests/minute

**Request Body:**
```json
{
  "message": "What devices do you have?",
  "sessionToken": "optional-existing-token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reply": "Koleksi device kami:\n- Vape Pod System Starter Kit - Rp 450.000\n...",
    "sessionToken": "abc123..."
  }
}
```

---

## Payment

### POST /api/payment/create

Create a mock Midtrans payment token.

**Request Body:**
```json
{
  "orderId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "MOCK-PAY-...",
    "redirect_url": "http://localhost:3000/payment/mock?token=...",
    "order_id": "uuid",
    "gross_amount": 450000
  }
}
```

### POST /api/webhooks/payment

Handle payment status updates (Midtrans webhook).

**Request Body:**
```json
{
  "order_id": "uuid",
  "transaction_status": "settlement",
  "payment_type": "bank_transfer",
  "gross_amount": "450000",
  "signature_key": "optional-hex-signature"
}
```

**Status Mapping:**

| transaction_status | Order Status |
|--------------------|-------------|
| settlement, capture, success | PAID |
| deny, expire | FAILED |
| cancel | CANCELLED |

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed"
}
```

---

## Admin

### POST /api/admin/login

Authenticate admin user.

**Request Body:**
```json
{
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "Invalid password"
}
```

### GET /api/admin/stats

Get dashboard statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 10,
    "totalRevenue": 4500000,
    "pendingOrders": 3,
    "paidOrders": 7,
    "totalProducts": 12,
    "lowStockProducts": 2
  }
}
```

### GET /api/admin/chats

Get all chat sessions with messages.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "session_token": "abc123",
      "customer_name": "Guest",
      "started_at": "2026-04-28T...",
      "last_active_at": "2026-04-28T...",
      "chat_messages": [
        {
          "id": "uuid",
          "role": "user",
          "content": "Hello",
          "created_at": "2026-04-28T..."
        }
      ]
    }
  ]
}
```

### GET /api/admin/logs

Get system logs with optional level filter.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| level | string | Filter by level (INFO, WARN, ERROR, DEBUG) |
| limit | number | Max entries (default: 100) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "level": "INFO",
      "action": "ORDER_CREATED",
      "message": "Order uuid created for John Doe",
      "metadata": { "order_id": "uuid", "total_price": 450000 },
      "created_at": "2026-04-28T..."
    }
  ]
}
```

---

## Error Responses

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (missing/invalid input) |
| 401 | Unauthorized (invalid credentials) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /api/chat | 50 requests | 1 minute |
| POST /api/orders | 20 requests | 1 minute |
| Other endpoints | No limit | - |

Rate limit is keyed by IP address. When exceeded, returns 429 status.
