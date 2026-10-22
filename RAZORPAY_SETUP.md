# Secure Razorpay Course Payment Integration Guide — Brainstorm Academy

This document outlines the architecture, security policies, test-mode setup, and operational runbook for course fee payments in **Brainstorm Academy**.

---

## 1. Payment Lifecycle & Architecture

The payment system follows a zero-trust, server-authoritative checkout and verification workflow:

```
[Student in Browser]
       │
       │  1. Clicks "Enroll with Razorpay (₹X)"
       ▼
[Backend: paymentService.createRazorpayOrder]
       │  - Authoritative course price checked against database (client price ignored)
       │  - Checks existing active enrollments (prevents duplicate purchases)
       │  - Creates Razorpay order (amount in paise, INR)
       │  - Stores pending payment record in `payments` collection
       ▼
[Frontend: Razorpay Checkout Standard SDK]
       │  - Opens secure Razorpay iframe with `rzp_test_...` key
       │  - Student completes payment via UPI / Netbanking / Card / Wallet (or simulates in test mode)
       │  - Browser receives `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }`
       ▼
[Backend: paymentService.verifyPaymentAndEnroll]
       │  - NEVER trusts browser payment success status
       │  - Idempotency Shield: If already processed, returns existing confirmation
       │  - Computes HMAC-SHA256(order_id + "|" + payment_id, secret_key)
       │  - Rejects tampered / forged signatures (marks transaction 'failed', access denied)
       │  - Atomically marks payment status 'success', records provider identifiers & timestamps
       │  - Atomically writes enrollment with deterministic ID (`enr_${userId}_${courseId}`)
       ▼
[Student in Browser]
       │  - Instant access granted: "Go to Classroom" button unlocked
       │  - Digital invoice & receipt generated in Student Dashboard
```

---

## 2. Security Safeguards

| Threat | Safeguard Implemented |
|---|---|
| **Secret Key Leakage** | `RAZORPAY_KEY_SECRET` is NEVER exposed to the frontend or bundled client code. Only `VITE_RAZORPAY_KEY_ID` (public key) is accessible. |
| **Client-Side Price Tampering** | Course price is resolved authoritatively from the backend database in `createRazorpayOrder()`. Client-supplied amounts are discarded. |
| **Forged Payment Callback** | Every callback is strictly verified using constant-time HMAC-SHA256 signature validation against the order and transaction ID. |
| **Duplicate Callbacks / Replays** | Idempotency guard checks `payment.status === 'success'` and rejects repeated writes or multi-enrollments. |
| **Duplicate Enrollments** | Deterministic enrollment IDs (`enr_${userId}_${courseId}`) prevent accidental multiple active enrollments. |
| **Cancelled / Dismissed Payments** | Dismissals and gateway drops are explicitly logged as `cancelled` or `failed` without creating enrollments. |
| **Refund Abuse** | Refunds immediately update payment to `refunded`, log reason & admin email, and revoke course access (`status: 'cancelled'`). |

---

## 3. Environment Configuration

### Client Environment (`.env`)
```env
# Razorpay Public Key ID (Test Mode for development)
VITE_RAZORPAY_KEY_ID=rzp_test_YourTestKeyIdHere
```

> **Note:** If `VITE_RAZORPAY_KEY_ID` is omitted during local development, the system falls back safely to test key `rzp_test_brainstorm_demo_2026`.

### Backend / Cloud Functions Environment
Set the secret key in your secure server environment (Firebase Secrets Manager or Cloud Functions config):
```bash
firebase functions:secrets:set RAZORPAY_KEY_SECRET="your_actual_test_secret_here"
```

---

## 4. Razorpay Test Mode Setup

1. **Sign Up / Log in to Razorpay Dashboard**: [https://dashboard.razorpay.com](https://dashboard.razorpay.com)
2. **Switch to Test Mode**: Toggle the switch in the top header from *Live* to *Test Mode*.
3. **Generate API Keys**:
   - Navigate to **Settings** > **API Keys**.
   - Click **Generate Test Key**.
   - Copy the **Key ID** and paste it into `VITE_RAZORPAY_KEY_ID` in `.env`.
   - Copy the **Key Secret** and keep it strictly confidential for backend signature verification.

### Test Payment Credentials

When using Razorpay Checkout in Test Mode:
- **Card**: Enter test cards provided by Razorpay (e.g., `4012 0000 0000 0002` with any future expiry date and CVV `123`).
- **UPI**: Use any virtual VPA, e.g., `success@razorpay`.
- **OTP**: Use `123456` or click "Success" on the bank emulator screen.

---

## 5. Development Test Mode Sandbox

To test edge-case failure modes without manual bank simulators, `RazorpayCheckoutModal` includes a built-in **Test Sandbox Controller**:
1. **Simulate Gateway Success**: Emulates standard Razorpay success payload with verified HMAC-SHA256 signature and activates enrollment.
2. **Simulate Bank Decline**: Simulates issuing bank timeout / card decline, records `status: 'failed'` and logs failure reason.
3. **Simulate Tampered Signature**: Submits a fraudulent/forged signature to test backend rejection. Verified to fail securely and block enrollment.
4. **Cancel Transaction**: Closes checkout modal and records `status: 'cancelled'`.

---

## 6. Super Admin Payment Features

Super Administrators can navigate to `/dashboard/admin/payments` to:
- **Audit All Transactions**: Filter by `all`, `success`, `pending`, `failed`, and `refunded`.
- **Search Records**: Search by invoice number, order ID, Razorpay payment ID, student ID, or course title.
- **Review Failed Transactions**: Inspect specific failure reasons returned by the payment gateway.
- **Process Secured Refunds**: Issue refunds with mandatory reason logging. Course enrollment access is revoked automatically.

---

## 7. Production Cutover Checklist

- [ ] Complete Razorpay business KYC and activate Live Mode.
- [ ] Generate Live API Keys (`rzp_live_...`).
- [ ] Configure live webhook endpoint with HTTPS and webhook secret signature verification.
- [ ] Set `RAZORPAY_KEY_SECRET` in Firebase Secrets / Cloud Functions environment.
- [ ] Set `VITE_RAZORPAY_KEY_ID` in production hosting environment variables.
- [ ] Confirm GST invoicing numbers and terms of service link in Razorpay checkout options.
