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
2. **Convert to Naira only inside display helpers.** Format with the shared
   helper (`formatNaira(kobo)` → `Intl` `en-NG`/NGN → `₦5,000.00`); never
   `kobo / 100` inline in a component.
3. **Never round for storage.** The database sees exact integers. The only
   place a "round" exists is the 2-decimal display format.
4. **Reject bad input on the server.** Validate the Naira string with a
   pattern, not `parseFloat`: optional thousands commas, up to two decimals:
   the shipped helper is `nairaToKobo()` in
   `src/lib/vendor-products/validation.ts` — reuse it, do not write a second
   one.
5. **Guard the integer.** A computed kobo amount must be
   `Number.isSafeInteger(amount)` and `>= 0` before it is stored. A negative
   price or fee is always a bug, never a refund.

## Paystack-specific rules

- Always talk to Paystack in **kobo** (`amount: 650000` for ₦6,500). Test
  mode only.
- Reconcile by the **reference**, never by trusting an amount the client sent.
- The webhook verifies the signature before touching `payments` or `orders`
  (see CLAUDE.md Security rules).

## Checklist for every money review

- [ ] Column names end in `_kobo` and are `integer`.
- [ ] No `Number()`, `parseFloat` or division before the display step.
- [ ] Sums are computed in kobo and tested with exact values
      (`₦3500.50` → `350050`).
- [ ] Display goes through `formatNaira` (or an equivalent in the same file).
- [ ] Zero is a valid price where applicable (free sample), negative is not.
- [ ] The UI copy says "₦" with the formatted amount, no manual string
      concatenation.
