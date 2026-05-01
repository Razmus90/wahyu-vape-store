# Midtrans Payment E-Wallet Reference

Source: https://docs.midtrans.com/reference/payment-e-wallet

---

## Overview

Accept e-wallet payments in your website/app to facilitate your customers to make payments via e-money and QRIS supported banks. Midtrans will send real time notification when the payment is completed.

Midtrans has integrated with _E-Wallet_ payment methods given below.

---

## E-Wallet Payment Methods

### 1. QRIS

QRIS is the QR code payment standard established by Bank Indonesia and developed in collaboration with the Asosiasi Sistem Pembayaran Indonesia (ASPI). With QRIS, your customers will be able to pay using any e-wallet and banks that supports paying by scanning QR codes.

Acquirer denotes the e-wallet provider that issues and processes the transaction. Note that some features are only available in certain acquirers (such as the ability to auto debit via Tokenization mode in GoPay), or can only be supported if users are paying using the same issuer as the acquirer (e.g. GoPay cashbacks will only be available is users are scanning GoPay-issued QRIS using GoPay scanner).

> 📘 By integrating to GoPay or Shopeepay payment method in Midtrans, you will also get QRIS issued by respective acquirers as a bundle.

---

### 2. GoPay (Deeplink and Tokenization)

Accept payments through GoPay e-money and e-wallet. GoPay offers two integration methods:
- **Deeplink**: one-time payment made through the Gojek app
- **Tokenization**: customers can link their GoPay account to your website or app, allowing for payments to be made directly on your site after linking. Recurring or subscription payments are also supported.

#### GoPay Payment Flow

**On Web Browser (Desktop/Laptop):**
1. Users see a QR code on their Web Browser
2. Users open the Gojek app on their phone
3. Users tap the **Pay** function on the Gojek app
4. Users point their camera to the QR Code
5. Users check their payment details on the Gojek app and then tap Pay
6. The transaction is complete and the users' GoPay balance is deducted

Midtrans will **mark the payment_type of the transaction as** `qris`.

**On SmartPhone:**
1. Users are automatically redirected to the Gojek app when making purchases on their SmartPhone
2. Users finish the payment on the Gojek app
3. The transaction is complete and their GoPay balance is deducted

Midtrans will **mark the payment_type of the transaction as** `gopay`.

#### Sample JSON Request Body (GoPay)

```json
{
  "transaction_details": {
    "order_id": "ORDER-101",
    "gross_amount": 10000
  },
  "item_details": [{
    "id": "ITEM1",
    "price": 10000,
    "quantity": 1,
    "name": "Midtrans Bear",
    "brand": "Midtrans",
    "category": "Toys",
    "merchant_name": "Midtrans"
  }],
  "customer_details": {
    "first_name": "TEST",
    "last_name": "MIDTRANSER",
    "email": "test@midtrans.com",
    "phone": "+628123456"
  },
  "enabled_payments": ["gopay"],
  "gopay": {
    "enable_callback": true,
    "callback_url": "http://gopay.com"
  }
}
```

#### GoPay Request Parameters

| Parameter | Description |
|-----------|-------------|
| transaction_details<br>*Transaction Details Object (required)* | Unique transaction ID |
| item_details<br>*Item Details Object (optional)* | Item details will be paid by customer |
| customer_details<br>*Customer Details Object (optional)* | Details of the customer |
| enabled_payments<br>*Array (optional)* | Set what payment method to show in Snap's payment list. Value: `gopay` |
| gopay<br>*GoPay Object (optional)* | GoPay payment options |

#### GoPay Deeplink Callback

Query Parameters:
| Query Parameter | Description | Type |
|-----------------|-------------|------|
| order_id | Order ID sent on the API Request. | String |
| result | Result of the transaction. Possible values: `success` or `failure`. | String |

Steps to integrate:
1. Set `enable_callback` parameter in the api request to `true`.
2. Set `callback_url` with the deeplink URL redirecting to E-commerce apps via API request or configure it in Dashboard > Snap Preferences.
3. Handle redirection with above parameters.

> ⚠️ It is highly recommended to avoid using value passed on `result` to update status on backend. Use [HTTP notification](/reference/handle-notifications) for this use case.

#### UI Mode
- Default: `auto` (wide screen gets QRIS, small screen gets deeplink)
- Can be specified using `options.uiMode` in [Snap JS](/reference/snap-js)
- Transaction expiry: 15 minutes (min 20s, max 7 days)

---

### 3. ShopeePay (Jumpapp)

Accept payments via Shopeepay, where customers can make one time payment in Shopeepay app.

#### ShopeePay Payment Flow

**On Web Browser (Desktop/Laptop):**
1. Users see a QR code on their Web Browser
2. Users open the Shopee app on their phone
3. Users tap the **Scan** function on the Shopee app
4. Users point their camera to the QR Code
5. Users check their payment details on the Shopee app and then tap **Lanjutkan**. Then **Bayar Sekarang**
6. Waiting until the transaction is complete and the users' ShopeePay balance is deducted

Midtrans will **mark the payment_type of the transaction as** `qris`.

**On SmartPhone:**
1. Users are automatically redirected to the Shopee app when making purchases on their SmartPhone
2. Users finish the payment on the Shopee app
3. The transaction is complete and their ShopeePay balance is deducted

Midtrans will **mark the payment_type of the transaction as** `shopeepay`.

#### Sample JSON Request Body (ShopeePay)

```json
{
  "transaction_details": {
    "order_id": "ORDER-101",
    "gross_amount": 10000
  },
  "item_details": [{
    "id": "ITEM1",
    "price": 10000,
    "quantity": 1,
    "name": "Midtrans Bear",
    "brand": "Midtrans",
    "category": "Toys",
    "merchant_name": "Midtrans"
  }],
  "customer_details": {
    "first_name": "TEST",
    "last_name": "MIDTRANSER",
    "email": "test@midtrans.com",
    "phone": "+628123456"
  },
  "enabled_payments": ["shopeepay"],
  "shopeepay": {
    "callback_url": "http://shopeepay.com?order_id=ORDER-101"
  }
}
```

#### ShopeePay Request Parameters

| Parameter | Description |
|-----------|-------------|
| transaction_details<br>*Transaction Details Object (required)* | Unique transaction ID |
| item_details<br>*Item Details Object (optional)* | Item details will be paid by customer |
| customer_details<br>*Customer Details Object (optional)* | Details of the customer |
| enabled_payments<br>*Array (optional)* | Set what payment method to show in Snap's payment list. Value: `shopeepay` |
| shopeepay<br>*ShopeePay Object (optional)* | ShopeePay payment options |

#### ShopeePay Deeplink Callback

Steps to integrate:
1. Set `callback_url` with the deeplink URL redirecting to E-commerce apps.
2. Handle redirection with append query param on callback URL or via Dashboard > Snap Preferences.

> ⚠️ It is highly recommended to avoid using value passed on `result` to update status on backend. Use [HTTP notification](/reference/handle-notifications) for this use case.

#### UI Mode
- Default: `auto` (wide screen gets QRIS, small screen gets deeplink)
- Can be specified using `options.uiMode` in [Snap JS](/reference/snap-js)
- Transaction expiry: 5 minutes (min 20s, max 5 days)

---

## Important Notes

- **Static QRIS**: Available via Dashboard > + New Payment Methods > Manage Static QRIS
- **HTTP Notifications**: Always use webhook/HTTP notifications to update payment status on backend, not the callback `result` parameter
- **Payment Type Values**:
  - `qris` - when paid via QR code (desktop flow)
  - `gopay` - when paid via GoPay deeplink (mobile flow)
  - `shopeepay` - when paid via ShopeePay deeplink (mobile flow)

---

## References

- GoPay Tokenization: `/reference/gopay-tokenization-1`
- Snap JS: `/reference/snap-js`
- JSON Objects: `/reference/json-objects`
- Handle Notifications: `/reference/handle-notifications`
- Sample Response: `/reference/sample-response`

---

*Scraped from https://docs.midtrans.com/reference/payment-e-wallet on 2026-04-30*
