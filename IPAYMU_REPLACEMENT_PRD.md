## Problem Statement

Midtrans payment gateway多次 error saat uji coba. Customer kesulitan menyelesaikan pembayaran. Perlu penggantian ke iPaymu QRIS yang lebih stabil dan biaya kompetitif. Tapi butuh toggle untuk pilih gateway (Midtrans atau iPaymu) di General Settings, karena Midtrans masih digunakan sebagai fallback/antisipasi error.

## Solution

Ganti sistem payment gateway dari Midtrans ke iPaymu QRIS sebagai primary. Tambahkan toggle `payment_gateway` di General Settings (pilih "midtrans" atau "ipaymu"). Checkout page baca setting ini → gunakan gateway yang dipilih. Midtrans tetap ada sebagai opsi fallback, tidak dihapus.

## User Stories

1. As an admin, I want a toggle in General Settings to choose payment gateway (Midtrans or iPaymu), so that I can switch between gateways without code changes.

2. As an admin, I want the default gateway set to iPaymu (since Midtrans has errors), so that customers use the stable option first.

3. As an admin, I want to be able to switch back to Midtrans if iPaymu has issues, so that I always have a working payment option.

4. As a customer, I want the checkout page to automatically use the gateway selected in settings, so that I don't need to manually choose.

5. As a customer, I want to see iPaymu QRIS code after clicking "Pay", so that I can scan with OVO/GoPay/DANA/LinkAja.

6. As a customer, I want the payment page to show a clear expiration time for the QR code, so that I know how long I have to complete payment.

7. As a customer, I want automatic detection when my QRIS payment succeeds, so that I don't need to manually refresh the page.

8. As an admin, I want iPaymu settings (API Key, VA) stored in database, so that I can update without touching code.

9. As an admin, I want a test button to verify iPaymu credentials, so that I know the API keys are correct before going live.

10. As a developer, I want the checkout page to read `payment_gateway` setting from DB, so that gateway selection is dynamic.

11. As a developer, I want Midtrans code to remain intact (not deleted), so that we can switch back if needed.

12. As a developer, I want the iPaymu integration to use HMAC-SHA256 signature (verified working), so that API requests are properly authenticated.

13. As a developer, I want proper error logging for both gateways, so that I can debug payment failures quickly.

14. As an admin, I want to see which payment gateway was used in the orders page, so that I can track gateway performance.

15. As a customer, I want fallback text (raw QR string) when QR image fails to load, so that I can still complete payment manually.

16. As an admin, I want the General Settings page to save the gateway choice immediately, so that changes take effect right away.

## Implementation Decisions

- **Toggle Location**: Add `payment_gateway` field to General Settings (`app/admin/settings/page.tsx`). Options: `"midtrans"` or `"ipaymu"` (default: `"ipaymu"`).

- **DB Storage**: Store `payment_gateway` in existing `general_settings` table (add column if not exists) or create new `ipaymu_settings` table with `is_active` flag.

- **Checkout Page Logic**: Read `payment_gateway` from settings API → if `"midtrans"` use `/api/payment/create`, if `"ipaymu"` use `/api/payment/ipaymu`.

- **iPaymu Implementation**: Use existing `lib/ipaymu.ts` (already created), `app/api/payment/ipaymu/route.ts` (needs create), webhook `/api/webhooks/ipaymu` (needs create).

- **Midtrans Fallback**: Keep all Midtrans files untouched (`lib/midtrans.ts`, `app/api/payment/create`, `app/api/webhooks/payment`). Only switch which one is called based on settings.

- **QRIS Specific**: iPaymu QRIS uses `paymentMethod: 'qris'` + `paymentChannel: 'linkaja'` (critical discovery from testing).

- **Environment Variables**: Use `IPAYMU_MODE` (true=production, false=sandbox), `IPAYMU_SB_API_KEY`, `IPAYMU_SB_VA` (already in `.env`).

- **Signature Formula**: HMAC-SHA256("POST:VA:SHA256(body):API_KEY", apiKey) — verified working with sandbox credentials.

## Testing Decisions

- **Good Test**: Verify checkout page uses correct gateway based on settings toggle. Test behavior, not implementation.

- **Modules to Test**:
  - Settings toggle (save + read `payment_gateway`)
  - Checkout page (reads setting, calls correct API)
  - iPaymu QRIS creation (returns QR data)
  - iPaymu webhook (updates order status)

- **Prior Art**: Existing Midtrans integration tests serve as reference.

- **Manual Testing**:
  1. Set toggle to "ipaymu" → checkout → QRIS shows → scan → payment success
  2. Set toggle to "midtrans" → checkout → Midtrans Snap → complete payment
  3. Test toggle switches gateway immediately (no restart needed)

- **Automated Test Cases**:
  - Settings API returns correct `payment_gateway` value
  - Checkout uses correct endpoint based on setting
  - Invalid iPaymu signature rejected by webhook

## Out of Scope

- **Removing Midtrans**: Midtrans code stays, only toggle switches which gateway is primaty.
- **Other iPaymu Methods**: Initial implementation covers QRIS only. VA/Credit Card can be added later.
- **Payment Analytics**: Comparing conversion rates between gateways is out of scope for initial implementation.
- **Automatic Migration**: No automatic migration of existing customers. Both systems coexist via toggle.
- **Mobile App Integration**: Web-based checkout flow only.
- **Bulk Payment Processing**: Batch payments or recurring payments not included.
- **Admin Notifications**: Email/SMS notifications for payments (can be added later using existing logService).

## Further Notes

- **Critical Discovery**: iPaymu QRIS requires `paymentChannel: 'linkaja'` (or 'paylater'). Empty string causes misleading "unauthorized signature" error.
- **Verified Working**: Sandbox credentials (VA: 0000001288006006, API Key: SANDBOXBEBE9B14-87BC-4D70-A157-86684DC68ED1) tested successfully with QRIS payment creation.
- **User's Env Spec**: `IPAYMU_MODE=true` = Production, `IPAYMU_MODE=false` = Sandbox (NOT the standard true=false convention).
- **Rollback Plan**: Since Midtrans files are untouched, switching back is just changing the toggle in General Settings.
- **Future Enhancement**: Once stable, consider adding iPaymu VA payments or credit card processing using the same module structure.
- **Fee Structure**: iPaymu charges different fees than Midtrans. Fee direction (MERCHANT vs BUYER) should be considered when displaying total amount.
- **Transaction ID Mapping**: iPaymu returns TransactionId and ReferenceId. Ensure order_id mapping is consistent for webhook processing.
- **General Settings Integration**: Add toggle to existing `app/admin/settings/page.tsx` (not create new page). Follow existing UI patterns (toggle switch like Midtrans production mode).

---

> *This was generated by AI during triage.*
