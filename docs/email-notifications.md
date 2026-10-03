# Good Things Co. — email notification infrastructure

This phase implements server-side transactional email through Resend's HTTPS API. No provider SDK or new dependency is required. Existing Node.js fetch performs the one centralized provider call. No live sender or API key is needed to run the app.

## Architecture

`trusted order operation → notificationService → emailService → template → Resend`

- `server/email/config.ts` reads environment variables at send time and validates single-mailbox addresses. Importing Node built-ins keeps this code out of browser builds.
- `server/email/types.ts` defines typed events, minimal email snapshots, results and structured notification logs. Private gift messages, phone numbers, transaction references and internal IDs are omitted from customer emails.
- `server/email/templates/` renders escaped HTML plus plain text, with an ivory/espresso palette, restrained branding, a single-column layout and readable buttons. Tracking links must be HTTPS. Full delivery addresses are included only in admin order emails.
- `server/services/emailService.ts` is the sole Resend transport, including From, Reply-To, fixed provider URL, bounded four-second requests, stable idempotency headers and sanitized error results.
- `server/services/notificationService.ts` maps committed order events to customer/admin notifications and isolates unexpected errors. It is a future channel boundary; only email exists now.

No React component or client service imports this layer. No email HTTP route is exposed. Status/delay hooks must be called by a trusted server operation after authorization and persistence, never with an arbitrary public email payload.

## Configuration and activation

All four variables belong in the server environment (local `.env` or deployment secrets). Never use a `VITE_` prefix:

```dotenv
RESEND_API_KEY=
EMAIL_FROM=
EMAIL_REPLY_TO=
ADMIN_NOTIFICATION_EMAIL=
```

`EMAIL_FROM` accepts a mailbox or `Good Things Co. <your-verified-mailbox>`. `EMAIL_REPLY_TO` and `ADMIN_NOTIFICATION_EMAIL` each accept one mailbox. They may differ from the sender. No business address is assumed to exist.

To activate delivery later:

1. Verify your sending domain in Resend and choose the sender address.
2. Create a Resend sending API key and set all four server variables.
3. Restart the local server or redeploy the server functions.
4. In a local development checkout with those variables, run `npm run email:test -- your-test-inbox@example.com`.
5. Check Resend's dashboard and the actual inbox for delivery, formatting and replies. An API acceptance alone does not prove inbox delivery.

No notification implementation needs rewriting to enable existing order/payment emails. See [Resend's email API](https://resend.com/docs/api-reference/emails/send-email) for sender and Reply-To fields.

## Missing configuration and errors

If any variable is missing or an address is invalid, no network request is made:

```json
{ "sent": false, "skipped": true, "reason": "Email provider not configured" }
```

Provider rejection, timeout, malformed response, template errors and logger errors never roll back a saved order or verified payment. Notification work is awaited with a bounded provider timeout so serverless execution does not discard an unawaited task; it may add up to about four seconds per notification group. Customer and admin messages in a group run concurrently.

Results distinguish `sent`, `skipped`, and failures. `sent: true` means Resend accepted the message (`providerStatus: "accepted"`), not that the recipient received it. No delivered/read tracking or webhook is added in this phase.

Every attempted/skipped notification emits a structured `[Notification]` server log with timestamp, channel, event, event ID, order reference when relevant, destination mailbox and sanitized provider result. API keys, full bodies and raw provider error bodies are not logged. Restrict access to server logs because recipient email addresses are personal data. The exported `NotificationLog` type can later back a `notificationLogs` store; there is no new Firestore collection or rules requirement today.

## Templates and hooks

| Customer event | Content / hook |
| --- | --- |
| `ORDER_PLACED` | Items, reference, recipient, total, preferred date, accurate pending payment status; `sendOrderPlacedEmail` |
| `PAYMENT_CONFIRMED` | Verified amount, summary, next stage; `sendPaymentConfirmedEmail` |
| `ORDER_PREPARING` | Preparing; `sendOrderStatusEmail('preparing', ...)` |
| `ORDER_PACKAGED` | Packaged; `sendOrderStatusEmail('packaged', ...)` |
| `ORDER_DISPATCHED` | Dispatched; `sendOrderStatusEmail('dispatched', ...)` |
| `ORDER_OUT_FOR_DELIVERY` | Out for Delivery; `sendOrderStatusEmail('out-for-delivery', ...)` |
| `ORDER_DELIVERED` | Delivered; `sendOrderStatusEmail('delivered', ...)` |
| `ORDER_DELAYED` | Custom issue message and revised expected date; `sendOrderDelayEmail` |
| `CORPORATE_REQUEST_RECEIVED` | Future acknowledgment hook: `sendCorporateRequestEmail` |
| `CUSTOM_REQUEST_RECEIVED` | Future acknowledgment hook: `sendCustomRequestEmail` |
| `ABANDONED_CHECKOUT` | Preview only; `sendAbandonedCheckoutEmail` always returns skipped |

Admin templates: `NEW_ORDER_ADMIN`, `PAYMENT_CONFIRMED_ADMIN`, `ORDER_EXCEPTION_ADMIN`, `CORPORATE_REQUEST_ADMIN`, `CUSTOM_REQUEST_ADMIN`. All admin mail routes exclusively to `ADMIN_NOTIFICATION_EMAIL`. A `TEST_EMAIL` template is also included. There are 17 previewable event templates in total.

Status messages accept optional courier name, tracking number, HTTPS tracking URL and expected date. There is no invented admin order URL: the existing admin app only has product routes. A trusted admin order link can be added when that route actually exists.

## Integrated trigger points

`server/orderService.ts`:

- After the pending order document is saved: customer Order Placed + admin New Order. This occurs even if subsequent Paystack initialization fails; the order genuinely exists.
- Paystack initialization failure: admin exception notice.
- Verified amount/currency mismatch: admin exception, no payment-confirmation email. Zero/missing mismatched amounts are not treated as verified.
- After the paid-order transaction commits: customer Payment Confirmed + admin Payment Confirmed.
- Paid order with inventory conflict: also notify admin of manual review; customer copy avoids promising immediate preparation.
- Simulated payment: payment emails are explicitly skipped even if Resend is configured.

The payment transaction rechecks the live order's paid state before updating inventory. When verification and webhook requests race, only the transaction that changes the order to paid emits payment notifications. Already-paid replays emit none. Transaction retry-local state is reset on each attempt.

No authenticated admin order-status operation currently exists. The complete status/delay email hooks are ready, but a UI/backend workflow is not invented in this phase. A future authorized server operation should save its change, then call:

```ts
// Server code only; authorize the admin and persist first.
await notificationService.orderStatusChanged(
  savedOrder, 'dispatched', persistedStatusChangeId,
  { courierName, trackingNumber, trackingUrl, expectedDeliveryDate }
);
await notificationService.orderDelayed(
  savedOrder, approvedCustomerMessage, persistedIssueId,
  { expectedDeliveryDate: updatedDate }
);
```

Use a stable persisted event/revision ID across retries; use a new ID for a distinct status change or delay notice. The status hook verifies that the passed order snapshot has the stated status. It does not authenticate users itself, write order status, or expose an endpoint.

## Retry limits

Resend idempotency keys include event, stable event ID and destination. They deduplicate identical retries within [Resend's 24-hour window](https://resend.com/docs/dashboard/emails/idempotency-keys). The payment state check also prevents ordinary paid-order replays beyond that window.

This deliberately small infrastructure has no durable outbox, worker or automatic retries. If a process stops after an order commit or a provider request fails, a notification may be missed; order success is preserved and failures are logged. Do not claim exactly-once delivery. A future operator retry must reuse the original event ID and snapshot within the provider window; changed content needs a new event ID. Enabling email later does not replay events skipped while unconfigured.

## Commands and verification

```sh
npm run typecheck
npm run test:email
npm run test:email:bundle
npm run email:preview
npm run email:test -- your-test-inbox@example.com
```

- `test:email`: strict TypeScript check for tests/tools, then Node's test runner. Firebase and Paystack are replaced only in the test bundle; Resend fetch is mocked. No live transactions or messages occur.
- `test:email:bundle`: production build with a fake key sentinel; scans browser JS/HTML for server settings/provider code and verifies direct browser bundling of the email service fails.
- `email:preview`: writes HTML/plain-text samples to `artifacts/email-previews/` using fictional data. Open `index.html` directly, or visit `/artifacts/email-previews/index.html` while Vite runs. These local artifacts are ignored by Git and are not Vite build inputs.
- `email:test`: local operator CLI; no public route. It rejects production/Vercel execution. Missing configuration returns skipped without crashing. A configured run may send one live message to the supplied inbox.

Verification completed for this phase:

- 33 automated tests cover all sending templates, absent configuration, typed status/delay hooks, routing, Reply-To, escaping, private-data omission, blocked unsafe links, provider errors, timeouts, log failures, idempotency, simulation, concurrent payment callbacks, amount/currency mismatches and inventory-review notices.
- Actual order-service functions are exercised with in-memory Firebase/Paystack test substitutes. Saved order/payment state remains successful when email fails.
- Local Vite starts with email configuration absent; the CLI test returns `Email provider not configured`.
- Production build and email-secret boundary scan pass. Vite retains its existing large-chunk warning.
- Desktop and 375px-wide browser previews reviewed. Actual Gmail/Outlook/mobile inbox rendering awaits a verified sender and a live delivery test.
- No live Resend API connection or inbox delivery was tested: no key or verified sender is available. Live Firebase/Paystack checkout was not exercised by the mocked notification tests.

## Files in this phase

Created:

- `server/email/config.ts`
- `server/email/types.ts`
- `server/email/templates/layout.ts`
- `server/email/templates/orderEmails.ts`
- `server/email/templates/index.ts`
- `server/services/emailService.ts`
- `server/services/notificationService.ts`
- `scripts/email.mjs`
- `scripts/emailCommand.ts`
- `scripts/checkEmailBundle.mjs`
- `tests/email/email.test.ts`
- `tests/email/fixtures.ts`
- `tests/email/orderMocks.ts`
- `tsconfig.email-tests.json`
- `docs/email-notifications.md`

Modified: `server/orderService.ts`, `server/server-env.d.ts`, `.env.example`, `.gitignore`, `package.json`, `tsconfig.json`.

No frontend email integration, WhatsApp, abandoned checkout sending/scheduling, corporate/custom backend or customer tracking page was implemented. Existing unrelated working-tree changes were preserved.
