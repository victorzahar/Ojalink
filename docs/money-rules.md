# Money rules

One page for every decision about money in OjaLink. The database team, UI
team and Payments lead all follow this. If a review question is about money,
the answer lives here.

## The one rule

**Money lives in the database and in code as integer kobo.** ₦1 = 100 kobo.
Naira appears only at the edges: when the user types it and when the screen
shows it.

## Why kobo and nothing else

- `₦6,500` is `650000`. There is no `6.5`, no `float`, no `decimal` anywhere.
- 0.1 + 0.2 does not equal 0.3 in floating point. Kobo integers never have
  that problem, and the sum of ten thousand items stays exact.
- Every money column is `integer`: `price_kobo`, `unit_price_kobo`,
  `subtotal_kobo`, `delivery_fee_kobo`, `platform_fee_kobo`, `total_kobo`,
  `amount_kobo`. The schema already adds `CHECK (... >= 0)` constraints — keep
  them on every new money column.

## Arithmetic rules

1. **Add and multiply in kobo only.**
   `subtotalKobo = unitPriceKobo × quantity`,
   `totalKobo = subtotalKobo + deliveryFeeKobo + platformFeeKobo`.
2. **Convert to Naira only inside display helpers.** Format with a helper
   like `formatNaira(kobo)` → `Intl` `en-NG`/NGN → `₦5,000.00`; never
   `kobo / 100` inline in a component. The concrete helper is on main in
   `src/lib/orders/format.ts` (merged from PR #4).
3. **Never round for storage.** The database sees exact integers. The only
   place a "round" exists is the 2-decimal display format.
4. **Reject bad input on the server.** Validate the Naira string with a
   pattern, not `parseFloat`: optional thousands commas, up to two decimals.
   The `nairaToKobo()` helper (in `src/lib/vendor-products/validation.ts`)
   is in open PR #3 — see that PR; until it merges, follow the same pattern
   rather than writing a second variant.
5. **Guard the integer.** A computed kobo amount must be
   `Number.isSafeInteger(amount)` and `>= 0` before it is stored. A negative
   price or fee is always a bug, never a refund.

## Paystack-specific rules

- Always talk to Paystack in **kobo** (`amount: 650000` for ₦6,500). Test
  mode only.
- Reconcile by the **reference**, never by trusting an amount the client sent.
- The webhook verifies the signature before touching `payments` or `orders`
  (see CLAUDE.md Security rules).

## Payouts, refunds and the Paystack webhook (agreed)

1. Payout status table: pending, rejected, cancelled count as nothing. paid,
   accepted, picked_up are pending payout. delivered is earned payout.
   refunded counts as nothing.
2. Weekly payout = subtotal_kobo - platform_fee_kobo - refund_kobo, never
   below 0. All amounts are integer kobo. The delivery fee is not part of
   the vendor payout.
3. Refunds are recorded on the order (orders.refund_kobo and
   orders.refunded_at), not on the dispute. A partial refund keeps the order
   delivered and reduces that order's payout by the refund. The platform fee
   is not changed by a partial refund. A full refund moves the order to
   refunded and it drops out of earnings. Only admin can issue a refund, and
   all the status changes happen in one transaction. The feature owner will
   wire the refund action to orders.refund_kobo.
4. The database checks refund_kobo <= total_kobo on the order row, and the
   server validates it before saving.
5. A week runs Monday to Sunday in Nigerian time (Africa/Lagos), grouped by
   orders.delivered_at. delivered_at is set by the server in the same
   transaction that sets the order to delivered.
6. Payouts table: id, vendor_id, week_start (a Monday), amount_kobo, status
   (unpaid or paid), paid_at, paid_by, created_at, updated_at. Unique on
   (vendor_id, week_start), so a vendor cannot be paid twice for the same
   week. Only admin creates payouts and marks them paid. A vendor can only
   read their own. The amount is frozen when created. A refund after a paid
   week is shown to admin as an adjustment and handled by hand (v1 limit).
7. The server calculates all totals, never the browser. Every payout query
   filters by the signed-in vendor, and admin is the only exception.
8. Webhook: owned by the Feature 3 owner, reviewed by the Project lead. It
   verifies the Paystack signature on the raw body first. Then in ONE
   transaction (Neon WebSocket driver) it sets the payment to success, the
   order to paid, and creates the delivery with status available. A repeated
   message with the same paystack_reference must change nothing. The amount
   Paystack reports must match total_kobo.
9. Open decisions: who gets the delivery fee (rider or OjaLink). Note: the
   schema change (orders.delivered_at, refund_kobo, refunded_at, the payouts
   table, and refunded in the order and payment statuses) is on main (migration
   0001_sloppy_reavers.sql, merged in PR #6). The feature owner will wire the
   refund action to orders.refund_kobo. Nobody else edits schema.ts or a
   migration.

## Checklist for every money review

- [ ] Column names end in `_kobo` and are `integer`.
- [ ] No `Number()`, `parseFloat` or division before the display step.
- [ ] Sums are computed in kobo and tested with exact values
      (`₦3500.50` → `350050`).
- [ ] Display goes through `formatNaira` (or an equivalent in the same file).
- [ ] Zero is a valid price where applicable (free sample), negative is not.
- [ ] The UI copy says "₦" with the formatted amount, no manual string
      concatenation.
- [ ] Payouts are calculated on the server and every payout query is
      filtered by the signed-in vendor (admin is the only exception).
- [ ] The Paystack webhook is one transaction and idempotent.
- [ ] Refunds never exceed the order total: `refund_kobo <= total_kobo`,
      checked by a database CHECK on the order row and by the server before
      saving.
