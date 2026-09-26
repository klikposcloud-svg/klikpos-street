# src/lib/payments/pago-movil-webhook-store.ts

> 55 nodes · cohesion 0.05

## Key Concepts

- **src/lib/payments/pago-movil-webhook-store.ts** (15 connections) — `src/lib/payments/pago-movil-webhook-store.ts`
- **src/lib/scanner-events.ts** (14 connections) — `src/lib/scanner-events.ts`
- **src/app/api/payments/webhook/route.ts** (12 connections) — `src/app/api/payments/webhook/route.ts`
- **src/app/api/scanner/sale/route.ts** (9 connections) — `src/app/api/scanner/sale/route.ts`
- **scannerEmitter** (9 connections) — `src/lib/scanner-events.ts`
- **src/app/api/scanner/inventory/route.ts** (8 connections) — `src/app/api/scanner/inventory/route.ts`
- **src/app/api/scanner/status/route.ts** (8 connections) — `src/app/api/scanner/status/route.ts`
- **src/app/api/scanner/create-product/route.ts** (6 connections) — `src/app/api/scanner/create-product/route.ts`
- **src/app/api/scanner/events/route.ts** (6 connections) — `src/app/api/scanner/events/route.ts`
- **src/app/api/scanner/scan/route.ts** (6 connections) — `src/app/api/scanner/scan/route.ts`
- **src/app/api/scanner/trigger/route.ts** (6 connections) — `src/app/api/scanner/trigger/route.ts`
- **POST()** (5 connections) — `src/app/api/payments/webhook/route.ts`
- **ref_events** (4 connections)
- **GET()** (4 connections) — `src/app/api/payments/webhook/route.ts`
- **normalizeAmountVES()** (4 connections) — `src/lib/payments/pago-movil-webhook-store.ts`
- **parseBankNotificationText()** (4 connections) — `src/lib/payments/pago-movil-webhook-store.ts`
- **registerWebhookPayment()** (4 connections) — `src/lib/payments/pago-movil-webhook-store.ts`
- **findMatchingPayment()** (3 connections) — `src/lib/payments/pago-movil-webhook-store.ts`
- **getWebhookSecret()** (3 connections) — `src/lib/payments/pago-movil-webhook-store.ts`
- **markPaymentAsUsed()** (3 connections) — `src/lib/payments/pago-movil-webhook-store.ts`
- **scannerSessions** (3 connections) — `src/lib/scanner-events.ts`
- **webhookPaymentsBuffer** (2 connections) — `src/lib/payments/pago-movil-webhook-store.ts`
- **mobileSalesQueue** (2 connections) — `src/lib/scanner-events.ts`
- **dynamic** (1 connections) — `src/app/api/payments/webhook/route.ts`
- **CORS_HEADERS** (1 connections) — `src/app/api/scanner/create-product/route.ts`
- *... and 30 more nodes in this community*

## Relationships

- [ref_next](ref_next.md) (8 shared connections)
- [venematic-desktop/src/lib/payments/pago-movil-webhook-store.ts](venematic-desktop-src-lib-payments-pago-movil-webhook-store.ts.md) (1 shared connections)
- [venematic-desktop/src/lib/scanner-events.ts](venematic-desktop-src-lib-scanner-events.ts.md) (1 shared connections)

## Source Files

- `src/app/api/payments/webhook/route.ts`
- `src/app/api/scanner/create-product/route.ts`
- `src/app/api/scanner/events/route.ts`
- `src/app/api/scanner/inventory/route.ts`
- `src/app/api/scanner/sale/route.ts`
- `src/app/api/scanner/scan/route.ts`
- `src/app/api/scanner/status/route.ts`
- `src/app/api/scanner/trigger/route.ts`
- `src/lib/payments/pago-movil-webhook-store.ts`
- `src/lib/scanner-events.ts`

## Audit Trail

- EXTRACTED: 91 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*