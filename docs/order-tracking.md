# Buyer order tracking

The buyer tracking feature lists orders at `/orders` and shows a buyer scoped detail page at `/orders/[id]`. The detail page displays the order items, delivery destination, totals, status message, and delivery progress. An optional Resend helper emails buyers a status update with a tracking link.

## Owned files

- `src/app/orders/page.tsx` and `src/app/orders/[id]/page.tsx`: order list and detail pages.
- `src/app/orders/[id]/not-found.tsx`, `src/app/orders/loading.tsx`, and `src/app/orders/error.tsx`: not found, loading, and error states.
- `src/lib/orders/ownership.ts`: reusable buyer ownership filters for order queries.
- `src/lib/orders/queries.ts`: buyer scoped order reads.
- `src/lib/orders/status-copy.ts` and `src/lib/orders/page-copy.ts`: buyer facing UI copy.
- `src/lib/orders/format.ts`: Naira and Africa/Lagos date formatting.
- `src/lib/orders/status-email.ts` and `src/lib/orders/email-copy.ts`: optional status email helper and its copy.
- `src/lib/db/seed-orders.ts`: repeatable sample order seed.

## Progress mapping

| Order status | Progress |
| --- | --- |
| `pending` | No steps complete |
| `paid` | Paid |
| `accepted` | Paid, Vendor confirmed |
| `picked_up` | Paid, Vendor confirmed, On the way |
| `delivered` | All four steps complete |
| `rejected`, `cancelled` | Red status message instead of progress |

## Sample data

After the regular database seed has created the buyer, vendors, and products, run:

```bash
npx tsx src/lib/db/seed-orders.ts
```

The script inserts one fixed-ID sample order for each status and uses a transaction with conflict-safe inserts.

## Status emails

Set `RESEND_API_KEY` and `EMAIL_FROM`. The helper builds its order link from `BETTER_AUTH_URL`.

```ts
import { sendOrderStatusEmail } from "@/lib/orders/status-email";

await sendOrderStatusEmail({
  to: buyer.email,
  orderId: order.id,
  status: order.status,
  shopName: order.shopName,
});
```

Call it from the appropriate status update flow after that flow succeeds. This feature exports the helper but does not wire it into rider, vendor, or checkout code.

## Authentication note

Both order pages call `requireRole("buyer")` before rendering protected content. The returned session user id scopes every order query through `buyerOrdersScope` or `buyerOrderScope`; even admins only see orders whose `buyer_id` matches their own session id. A detail lookup matches both the order id and buyer id, and an unmatched order returns not found.

The buyer scope is unit-tested in `src/lib/orders/ownership.test.ts`.

## Refused-access tests

| What I tested | What the app did | Screenshot |
| --- | --- | --- |
| Logged out opens `/orders` | Redirected to `/login` | [View screenshot](screenshots/order-tracking-1-logged-out-login.png) |
| Logged in as a vendor opens `/orders` | Showed “You do not have access” (403) | [View screenshot](screenshots/order-tracking-2-vendor-no-access.png) |
| New buyer with no orders opens `/orders` | Showed the friendly empty state | [View screenshot](screenshots/order-tracking-3-new-buyer-empty.png) |
| A different buyer opens someone else's order id | Showed “We couldn't find this order”, the same as for an order that does not exist | [View screenshot](screenshots/order-tracking-4-other-buyer-not-found.png) |

## Screenshots of order tracking

- [Delivered order](screenshots/order-tracking-5-delivered.png)
- [Cancelled order](screenshots/order-tracking-6-cancelled.png)
