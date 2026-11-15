# OjaLink Verification Rework — Build Plan (Nigeria only)

**Status:** proposal for lead sign-off · **Owner:** Zahar (review + merge authority on all schema changes)
**Source:** team verification checklist (tiers, buyers, vendors, riders, NDPA rules)
**Baseline:** main `9beeac7` — ships after Demo Day; nothing here blocks the Friday presentation.

---

## 1. What we already have vs what the checklist needs

| Checklist requirement | Today in the code | Gap |
|---|---|---|
| Email verified | `users.emailVerified` (Better Auth) | ✅ exists |
| Phone stored | `users.phone` (text, nullable) | No OTP verification flag or flow |
| Buyer tiers + order limits | nothing | Tier column, limit engine, checkout enforcement |
| Vendor shop identity | `vendors` (shopName, slug, marketId, shopImageUrl, approvalStatus) | No stall number, business type, CAC, TIN, map pin, guarantor, bank account |
| Rider identity | `roleRequests` (note = free text, admin approves) | No licence, vehicle, plate, guarantors, bank account |
| Vendor/rider payouts gated on bank account | `payouts` table exists; nothing checks an account | Payout hold + account-name match rule |
| NIN/BVN/ID checks | nothing | Provider integration; **status + reference only** in our DB |
| Admin reviews documents | admin approvals queue (vendors + role requests) | Needs verification-specific queue + access logging |

**Core decision (already mandated by the checklist):** one separate `verifications` table — not new columns per check on `users`. Raw NIN, BVN, ID images and selfies never enter our main database; we store only **status + provider reference**.

---

## 2. Schema proposal (lead must approve before anyone writes code)

### 2.1 `verifications` — the one table everything hangs off

```ts
export const verificationKindEnum = pgEnum("verification_kind", [
  "phone_otp", "email_link",        // buyers + everyone
  "nin", "id_document", "selfie",   // person identity (provider-held)
  "cac", "tin",                     // business registration
  "bank_account",                   // Paystack account resolution
  "driver_licence", "vehicle", "guarantor", "training", // riders
  "shop_evidence",                  // vendor: stall photo, map pin, association ref
]);

export const verificationStatusEnum = pgEnum("verification_status", [
  "pending",    // submitted, waiting on provider or admin
  "verified",
  "failed",
  "expired",    // re-verify (e.g. licence expiry)
]);

export const verifications = pgTable("verifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: verificationKindEnum("kind").notNull(),
  status: verificationStatusEnum("status").notNull().default("pending"),

  // Provider trail — NEVER the document itself
  provider: text("provider"),            // "smile_id" | "dojah" | "paystack" | "manual_admin"
  providerRef: text("provider_ref"),     // provider's job/reference id
  providerPayloadUrl: text("provider_payload_url"), // link to provider-held record, not a copy

  // Admin review (kinds we check by hand in Phase 2)
  reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  note: text("note"),                    // mandatory when rejected

  checkedAt: timestamp("checked_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt, updatedAt,
}, (t) => [
  index("verifications_user_kind_idx").on(t.userId, t.kind),
  index("verifications_status_idx").on(t.status),
]);
```

Rules built into the table design:
- One row per `(user, kind)` attempt; latest row wins (query by `createdAt desc`).
- `status + providerRef` is all any other part of the app is allowed to read — guards and checkout never touch identity payloads.
- Rejections require `note` (same discipline as dispute resolution notes).

### 2.2 Thin columns elsewhere (the only additions outside `verifications`)

| Table | Column | Why |
|---|---|---|
| `users` | `phoneVerifiedAt timestamp`, `buyerTier smallint default 0` | Tier 0/1/2 gate; OTP timestamp is a fact, not a document |
| `vendors` | `stallNumber text`, `businessType enum('informal','business_name','ltd')`, `cacNumber text nullable`, `tinNumber text nullable`, `mapPin text`, `payoutHoldUntil date nullable` | Application fields; CAC/TIN are numbers the admin records, not images |
| `vendors` | `bankAccountRef text nullable` | Paystack resolution reference; account **number never stored**, only the ref + the name-match verdict in `verifications` |
| `riders` (new table) | `userId`, `vehicleType enum('motorbike','tricycle','car')`, `plateNumber`, `vehicleOwnerLetterRef`, `homeMapPin`, `emergencyContactName/Phone`, `trainingCompletedAt` | Rider profile; documents live in `verifications` |
| `guarantors` (new table) | `id`, `userId`, `name`, `phone`, `relation`, `calledBy`, `calledAt`, `outcome enum('pending','reachable','unreachable')` | Vendors need 1, riders need 2 — same table, admin records the call result |
| `payouts` | *(no change)* — the gate lives in the payout workflow, not the table | Holding back payouts is a rule, not new data |

**Rejected by design:** storing NIN digits, BVN, ID images or selfie files anywhere in our schema.

### 2.3 Buyer order limit (Tier 0/1/2)

- Tier 0 (new signup): browse only — checkout button disabled with copy "Verify your phone to order".
- Tier 1 (phone OTP + email verified): order value ≤ ₦50,000 per order and ≤ ₦100,000 per 7 days (config constants, lead sets final numbers).
- Tier 2 (NIN or BVN check passed, **or** ≥ 3 delivered orders with no disputes): limits raised to lead-configured values.
- Enforcement point: cart → checkout server action (Esohe's F3 seam) + the Paystack webhook — both re-check the tier server-side. Extra-risk triggers (large first order, many failed payments, new device) force Tier-1 caps regardless of stored tier.

---

## 3. Provider decision (Phase 0 — one week, lead + Michael)

| Provider | What we'd use | Notes to check |
|---|---|---|
| **Smile ID** | NIN verification, ID + selfie match | Strongest Nigeria coverage; pricing per check |
| **Dojah** | NIN, BVN, CAC lookup, account resolution | Good all-in-one; check CAC search quality |
| **Prembly** | NIN, identity checks | Local pricing may be best |
| **VerifyMe** | identity + address | Compare per-check cost at our volumes |
| **Paystack** (already integrated) | Account resolution for vendor/rider bank accounts | Zero new vendor relationship — use first for bank accounts |

**Recommendation:** Phase 1 ships with **Paystack account resolution only** (no new contract), and one identity provider for NIN — pick Smile ID vs Dojah after a price/coverage call. Provider access goes behind one adapter module (`src/lib/verification/provider.ts`) so switching later never touches feature code.

---

## 4. Phased work with owners

### Phase 1 — foundations + buyers (week 1 post-demo)
| Task | Owner | Area |
|---|---|---|
| Schema PR: `verifications`, `phoneVerifiedAt`, `buyerTier` (lead approves design above first) | **Zahar** | F10 |
| OTP send/verify flow (SMS or WhatsApp — pick one; Termii/Twilio comparison), `verifications` rows for `phone_otp` | **Zahar** | F10 |
| Buyer tier guard: checkout + webhook enforce Tier-1 limits | **Esohe** | F3 |
| Tier UI in buyer area: "verify phone → Tier 1", progress states | **Humphrey** | F4 |
| NDPA copy: why we collect phone/OTP, retention note | **Michael** | F9 |
| Tests: tier gate can't be bypassed by direct API calls; unverified phone can't order | **Ajari Obed** | F8 |

### Phase 2 — vendors + riders (weeks 2–3)
| Task | Owner | Area |
|---|---|---|
| Vendor application v2: stall number, business type, CAC/TIN fields, shop-front photo, map pin (extends existing vendor apply + admin queue) | **Aisosa** | F6 |
| `riders` + `guarantors` tables; rider application replaces free-text `roleRequests.note` with structured fields | **Iyen Monica** | F7 |
| Admin verification queue: review `verifications` rows, record guarantor calls, approve/reject with mandatory notes | **Ajari Obed** | F8 |
| Bank account: Paystack account resolution on vendor/rider payout settings; name-match verdict written to `verifications` | **Aisosa** | F6 |
| NIN/ID/selfie via chosen provider (adapter); store ref + status only | **Zahar** | F10 |
| Licence expiry check (`expiresAt`) on rider `driver_licence` rows | **Iyen Monica** | F7 |
| Access logging: every admin read of a verification row is logged (who, when, which user) | **Ajari Obed** | F8 |

### Phase 3 — payouts + ongoing risk (week 4)
| Task | Owner | Area |
|---|---|---|
| Payout gate: vendor payouts blocked until `bank_account` verified; `payoutHoldUntil` holds first payouts a lead-set number of days | **Aisosa** | F6 |
| Buyer delivery confirmation code shown to buyer, required at rider handover | **Humphrey + Monica** | F4/F7 |
| Risk signals job: flag many-accounts-per-phone/device, repeated failed payments, address drift → admin review task | **Ajari Obed** | F8 |
| Suspension flow: repeated disputes/fake deliveries → role suspended pending admin review | **Zahar** | F10 |
| Rider app shows rider photo + plate to buyer during delivery | **Iyen Monica** | F7 |

---

## 5. NDPA 2023 compliance checklist (maps to the build)

- [ ] **Collect only what's needed** — every field above has a stated purpose; no "nice to have" identity data.
- [ ] **Say why** — privacy notice at each collection point (Michael, F9).
- [ ] **Store safely** — identity evidence stays with the provider; our DB holds status + reference.
- [ ] **Delete when no longer needed** — retention rule: verification rows for rejected/suspended accounts purged after lead-set period; `expiresAt` triggers re-verification.
- [ ] **Never show ID details** to other users — `verifications` reads are admin+owner-only, enforced by the same guard pattern as orders.
- [ ] **Limit and log admin access** — access log table from Phase 2.
- [ ] **Schema changes need lead approval** — this document is that approval gate; each Phase PR references it.

---

## 6. Open decisions for the lead (before Phase 1 PRs)

1. **Tier limit numbers** — ₦50k/₦100k proposed; confirm or adjust.
2. **OTP channel** — SMS (Termii) vs WhatsApp; affects cost per verification.
3. **Identity provider** — Smile ID vs Dojah after the pricing call; Paystack-only until then.
4. **Manual fallback** — for vendors without NIN-linked records, admin video-call/visit step replaces provider check for Phase 2; confirm we accept that.
5. **Rider vehicle-owner letters** — accept a letter + plate check, or require proof of ownership documents in Phase 2 only.
6. **Payout hold length** — proposed 3 days from first approved sale.

---

## 7. Definition of done (whole rework)

- A brand-new buyer can browse, verify phone by OTP, and is capped at Tier-1 limits — enforced server-side, tested.
- A vendor cannot appear publicly or receive a payout until identity, shop evidence and bank-account-name checks are all `verified` in `verifications`.
- A rider cannot see a single job until identity, licence, vehicle and two reachable guarantors are recorded — and the buyer sees photo + plate and a handover code.
- No raw NIN, BVN, ID image or selfie exists anywhere in the OjaLink database; an auditor can prove it by reading the schema.
- Every admin action on identity data is logged.
