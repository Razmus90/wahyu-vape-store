## Problem Statement

Customer perlu opsi pembayaran QRIS yang mudah dan cepat. Saat ini toko hanya memiliki Midtrans sebagai payment gateway. iPaymu menawarkan integrasi QRIS yang lebih sederhana dengan biaya yang kompetitif. Customer ingin memiliki pilihan pembayaran antara Midtrans dan iPaymu QRIS tanpa mengganggu sistem yang sudah berjalan.

## Solution

Menambahkan iPaymu sebagai payment gateway kedua yang berjalan paralel dengan Midtrans. Customer dapat memilih metode pembayaran saat checkout: Midtrans (VA/QRIS/Kartu Kredit) atau iPaymu QRIS. Kedua sistem mempunyai API, webhook, dan halaman admin masing-masing yang tidak saling mempengaruhi.

## User Stories

1. As a customer, I want to see iPaymu QRIS as a payment option at checkout, so that I can pay using my preferred e-wallet (OVO, GoPay, DANA, LinkAja).

2. As a customer, I want to see a QR code after selecting iPaymu, so that I can scan it with my mobile banking or e-wallet app.

3. As a customer, I want the payment page to automatically detect when my QRIS payment is successful, so that I don't need to manually refresh.

4. As a customer, I want to see a thank you page after successful payment, so that I know my order is confirmed.

5. As an admin, I want a settings page for iPaymu configuration, so that I can update API keys and virtual account numbers without touching code.

6. As an admin, I want to toggle between sandbox and production mode for iPaymu, so that I can test payments safely before going live.

7. As an admin, I want to see iPaymu payment status in the orders page, so that I can track which payment method customers are using.

8. As an admin, I want a test connection button in iPaymu settings, so that I can verify my API credentials are correct.

9. As a developer, I want the iPaymu integration to be isolated in its own modules, so that it doesn't break existing Midtrans functionality.

10. As a developer, I want the signature generation to follow iPaymu v2 specification (HMAC-SHA256), so that API requests are properly authenticated.

11. As a developer, I want both payment gateways to run in parallel, so that I can gradually migrate or let customers choose their preferred method.

12. As a developer, I want the webhook handler to update order status automatically, so that paid orders are processed without manual intervention.

13. As a developer, I want proper error logging for iPaymu transactions, so that I can debug payment failures quickly.

14. As a customer, I want the QR code to have a clear expiration time, so that I know how long I have to complete the payment.

15. As a customer, I want fallback text (raw QR string) when QR image fails to load, so that I can still complete payment using manual input.

16. As an admin, I want iPaymu credentials stored securely in environment variables, so that sensitive data isn't exposed in the codebase.

## Implementation Decisions

- **Parallel Architecture**: iPaymu will be added as a separate module alongside Midtrans, not replacing it. Both payment gateways will run simultaneously.

- **Module Isolation**: All iPaymu-related code will be in new files with "ipaymu" in the name, keeping it separate from Midtrans files.

- **API Client Module**: A new service module will handle iPaymu API communication including signature generation (HMAC-SHA256), request formatting, and response parsing.

- **QRIS-Specific Implementation**: The initial implementation focuses on QRIS payments using paymentMethod: 'qris' and paymentChannel: 'linkaja' (required for iPaymu QRIS to work).

- **Webhook Handling**: Separate webhook endpoint for iPaymu notifications, independent from Midtrans webhook.

- **Sandbox/Production Toggle**: Environment-based configuration (IPAYMU_SB_*, IPAYMU_PR_*) allowing easy switching between sandbox testing and production.

- **Checkout Modification**: The existing checkout page will be modified to add iPaymu as a radio button option, without removing Midtrans.

- **Notification URL**: Webhook URL will be dynamically generated using NEXT_PUBLIC_BASE_URL to ensure correct callback in different environments.

- **Signature Formula**: HMAC-SHA256("POST:VA:SHA256(body):API_KEY", apiKey) - verified working with sandbox credentials.

- **QR Display**: Payment page will show QR image (QrImage URL) with fallback to raw QR string (QrString) for maximum compatibility.

## Testing Decisions

- **Good Test Definition**: Tests should verify external behavior (QR creation, webhook processing, status updates) without testing implementation details like exact signature values.

- **Modules to Test**:
  - iPaymu API client (signature generation, payment creation)
  - iPaymu webhook handler (signature verification, status mapping)
  - Order status updates (PAID/FAILED transitions)

- **Prior Art**: Existing Midtrans integration tests in the codebase serve as reference for payment gateway testing patterns.

- **Manual Testing Strategy**:
  - Test QRIS creation in sandbox mode
  - Scan QR with multiple e-wallet apps (OVO, GoPay, DANA)
  - Verify webhook receipt and order status update
  - Test Midtrans still works after iPaymu addition

- **Automated Test Cases**:
  - Signature generation produces correct HMAC-SHA256 output
  - Invalid signatures are rejected by webhook
  - Payment creation returns valid QR data
  - Order status updates correctly based on webhook status

## Out of Scope

- **Replacing Midtrans**: This PRD adds iPaymu as an option, not a replacement. Midtrans remains fully functional.

- **Other iPaymu Payment Methods**: Initial implementation covers QRIS only. VA, credit card, and other methods can be added later.

- **Payment Analytics Dashboard**: Comparing conversion rates between Midtrans and iPaymu is out of scope for initial implementation.

- **Automatic Migration**: No automatic migration of existing customers to iPaymu. Both systems coexist.

- **Mobile App Integration**: This is for the web-based customer checkout flow only.

- **Bulk Payment Processing**: Batch payments or recurring payments are not included.

- **Admin Notification**: Email/SMS notifications for iPaymu payments (can be added later using existing logService).

## Further Notes

- **Critical Discovery**: iPaymu QRIS requires `paymentChannel: 'linkaja'` (or 'paylater'). Empty string causes misleading "unauthorized signature" error.

- **Verified Working**: Sandbox credentials (VA: 0000001288006006, API Key: SANDBOXBEBE9B14-87BC-4D70-A157-86684DC68ED1) tested successfully with QRIS payment creation.

- **Rollback Plan**: Since Midtrans files are untouched, removing iPaymu integration only requires deleting the 6 new files and removing iPaymu environment variables.

- **Future Enhancement**: Once stable, consider adding iPaymu VA payments or credit card processing using the same module structure.

- **Fee Structure**: iPaymu charges different fees than Midtrans. Fee direction (MERCHANT vs BUYER) should be considered when displaying total amount to customers.

- **Transaction ID Mapping**: iPaymu returns TransactionId and ReferenceId. Ensure order_id mapping is consistent for webhook processing.
