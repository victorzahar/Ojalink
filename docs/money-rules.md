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
   `kobo / 100` inline in a component. (The concrete helper is proposed in
   open PR #3 and PR #4 — see those PRs; it is not on main yet.)
3. **Never round for storage.** The database sees exact integers. The only
   place a "round" exists is the 2-decimal display format.
4. **Reject bad input on the server.** Validate the Naira string with a
   pattern, not `parseFloat`: optional thousands commas, up to two decimals.
   The `nairaToKobo()` helper (in `src/lib/vendor-products/validation.ts`)
   is proposed in open PR #3 and PR #4 — see those PRs; it is not on main
   yet. Until it merges, follow the same pattern rather than writing a
   second variant.
5. **Guard the integer.** A computed kobo amount must be
   `Number.isSafeInteger(amount)` and `>= 0` before it is stored. A negative
   price or fee is always a bug, never a refund.

## Paystack-specific rules

- Always talk to Paystack in **kobo** (`amount: 650000` for ₦6,500). Test
  mode only.
- Reconcile by the **reference**, never by trusting an amount the client sent.
- The webhook verifies the signature before touching `payments` or `orders`
  (see CLAUDE.md Security rules).

## Payouts, refunds and the Paystack webhook (proposed until the Feature 6 owner confirms)

- Payout status table: pending, rejected, cancelled count as nothing. paid,
  accepted, picked_up are pending payout. delivered is earned payout.
  refunded counts as nothing.
- Payout = subtotal_kobo - platform_fee_kobo - refunds. The delivery fee is
  not part of the vendor payout.
- A full refund returns the platform fee. A partial refund reduces payout
  and fee in proportion, and the order stays delivered.
- The server calculates all totals, never the browser. Every payout query
  filters by the signed-in vendor, and admin is the only exception.
- The server must check refund_kobo is never more than the order total,
  because the database cannot.
- Webhook: owned by the Feature 3 owner, reviewed by the Project lead. It
  verifies the Paystack signature on the raw body first. Then in ONE
  transaction (Neon WebSocket driver) it sets the payment to success, the
  order to paid, and creates the delivery with status available. A repeated
  message with the same paystack_reference must change nothing. The amount
  Paystack reports must match total_kobo.
- Open decisions: payouts table needed or not (Feature 6 owner), who gets
  the delivery fee, and the refund migration (refund_kobo, refunded_at, and
  refunded status).

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
- [ ] Refunds never exceed the order total.
