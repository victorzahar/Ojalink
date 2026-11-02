# OjaLink

OjaLink is a phone-first marketplace project for buyers, market vendors, delivery riders and administrators in Benin City, Nigeria.

## Project status

The current `main` branch includes email-and-password accounts with role-protected areas, the public marketplace, vendor product management, vendor order pages, the rider phone app, the admin area, buyer order tracking, the PostgreSQL schema and seed scripts.

- **Feature 1 — Marketplace and search:** merged (PR #12). Public home plus `/marketplace` with search, category pills and per-shop filtering (`/marketplace?vendor=<slug>`). Scope-tested and verified in the browser.
- **Feature 2 — Vendor storefronts:** the owner reports a `/vendors/[slug]` storefront for approved vendors, with shop details, available products and reviews. Work is on `feature/vendor-storefront`; it has not been verified against live Neon data, and no working screenshot is available yet.
- **Feature 4 — Buyer order tracking:** buyers can see their own orders on My orders and open an order to follow payment, accepted, picked up and delivered progress. Cancelled, rejected and refunded orders have clear messages. The owner reports 2/2 automated tests, lint, build and manual status/access checks passing. See [docs/order-tracking.md](docs/order-tracking.md).
- **Feature 5 — Vendor product manager (Michael Iyoha):** merged (PR #3). Vendors manage their own products; creating products requires an approved vendor (pending/rejected vendors are refused server-side). Product photo upload is pending the team’s choice of storage provider. Michael also has team Role 9, Docs & README; see [team contributions](docs/team-contributions.md).
- **Feature 6 — Vendor orders and payouts:** merged (PR #9). Vendors see their orders grouped by status (Needs action / In progress / Done / History) and can accept or reject paid orders with one race-safe conditional update, scoped to their own vendor profile. The `payouts` table enforces one payout per vendor and week (Monday, Lagos time); the payout calculation workflow itself is still future work (see [money rules](docs/money-rules.md)).
- **Feature 7 — Rider app (Iyen Monica):** merged (PR #11). Phone-first rider area: available jobs (no buyer contact details until accepted), accept, picked up, delivered and delivery history, all in one transaction per status flip. Iyen’s accessibility/mobile reviewer role covers touch target and text sizes, contrast, labels, alt text, slow 3G, 360px screens and Lighthouse checks.
- **Feature 8 — Admin and disputes:** merged (PR #8, label fix PR #13). Admins approve or reject vendors, manage disputes (a resolution note is required to resolve; refunds stay with the separate refund workflow), read-only users list and stats where sales are shown as **Paid sales**. Access checks (admin guard on every admin page and action) were verified by review.
- **Feature 10 — Authentication and security:** visitors can sign up, log in and out. Protected pages and API routes check roles on the server. See [docs/auth.md](docs/auth.md).

Payment checkout and the Paystack webhook are not yet implemented in this repository. A live deployment URL has not been supplied.

## Technology

- Next.js App Router, React, TypeScript and Tailwind CSS
- Neon serverless PostgreSQL with Drizzle ORM
- Better Auth for accounts and sessions
- Resend integration helper for order status emails (not yet wired into order actions)
- Vitest and ESLint
- Vercel is the planned deployment target; add the live URL after deployment

## Local setup

Requirements: Git, Node.js and npm. Clone the repository and open its folder:

```powershell
git clone https://github.com/victorzahar/Ojalink.git
cd Ojalink
```

Create a local environment file and enter the values supplied by the team:

```powershell
Copy-Item .env.example .env.local
```

Never commit `.env.local` or share its values in chat. Install dependencies, apply the migrations, and start the app:

```powershell
npm install
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Database-backed pages need a valid `DATABASE_URL`. To create throwaway demo accounts, fill the four `SEED_*_PASSWORD` values in `.env.local` and run:

```powershell
npm run db:seed
```

The seed script creates the accounts `admin@ojalink.test`, `buyer@ojalink.test`, `rider@ojalink.test`, and vendor accounts including `vendor@ojalink.test`. Passwords are set locally through the seed environment variables; there are no shared default passwords.

To add the sample order data after seeding:

```powershell
npx tsx src/lib/db/seed-orders.ts
```

## Checks

```powershell
npm test
npm run lint
npm run build
```

The production build requires a valid `DATABASE_URL` in the local environment.

## Current routes

- `/` — marketplace home with categories and featured vendors
- `/marketplace` — product grid with search, category pills, shop filtering and filter chips
- `/signup`, `/login` — account creation and login
- `/buyer`, `/vendor`, `/rider`, `/admin` — role-protected areas
- `/orders`, `/orders/[id]` — signed-in buyer’s order list and tracking page
- `/vendor/products` and its new/edit pages — vendor product manager (Feature 5, merged)
- `/vendor/orders` — vendor order list grouped by status with accept/reject (Feature 6, merged)
- `/rider`, `/rider/history` — rider jobs and delivery history (Feature 7, merged)
- `/admin` and its subpages — vendor approvals, disputes, users, stats (Feature 8, merged)
- `/vendors/[slug]` — Feature 2 work on its branch, not yet integrated into main

A vendor role check is not an ownership check: data queries must also scope records to the vendor profile belonging to the signed-in user. See [docs/auth.md](docs/auth.md).

## Known issues and next work

- Feature 2 needs database tables and sample vendor/product data to be verified against Neon; its owner could not capture a working storefront screenshot.
- Feature 4’s seven order-status email messages are documented in `docs/content-guide.md`, but sending is not wired up and requires the vendor/rider features to call the Resend helper. There is no refunded email yet; the refunded status uses a short message.
- Feature 6’s payout calculation workflow (weekly vendor payouts from the `payouts` table) is not built yet; the schema and Lagos-week rules are in [money rules](docs/money-rules.md).
- Refund money movement still belongs to the future refund workflow; admin disputes cannot set refund status, and the admin refund panel is a disabled placeholder.
- Rider online/offline toggle, proof photos and rider earnings are not built (no schema or team decision yet).
- Feature 10’s production rate limiting is stored in memory, which is weak for Vercel. Sign-up currently reveals whether an email is registered. Google login and an admin role-management screen are not built.
- The owner reports the buyer-to-buyer order refusal test passed manually. Vendor-to-vendor data refusal still needs a manual check with two vendor accounts.
- Feature 5 photo upload awaits the team’s storage-provider decision.
- The live URL and the remaining team member names and commit links still need to be added.

## Environment variables

The names and explanations are in [.env.example](.env.example): `DATABASE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, the four optional `SEED_*_PASSWORD` demo-account passwords, and `RESEND_API_KEY` / `EMAIL_FROM` for when email sending is wired up. `BETTER_AUTH_SECRET` is read by Better Auth itself (it is not referenced by name in the code), so it must exist or sessions will not work. Generate a local secret yourself (for example with `openssl rand -base64 32`) and use a different one on Vercel. Resend values are only needed when email sending is wired up.

## Project documentation

- [Authentication and access rules](docs/auth.md)
- [Order tracking](docs/order-tracking.md)
- [Money, refunds and payouts rules](docs/money-rules.md)
- [Content guide](docs/content-guide.md)
- [Team contributions and hand-in checklist](docs/team-contributions.md)

## Screenshots

Current access-control and order-tracking evidence:

| Evidence | Screenshot |
|---|---|
| Signed-out visitor opening `/vendor` is redirected to login | ![Signed-out vendor redirect](docs/screenshots/screenshot-1-signed-out-vendor-login.png) |
| Buyer opening `/admin` is denied | ![Buyer denied on admin](docs/screenshots/screenshot-2-buyer-on-admin-denied.png) |
| Composite of four screenshots: admin opened all four role areas | ![Composite showing admin access to the four role areas](docs/screenshots/screenshot-3-admin-all-areas.png) |
| Signed-out visitor opening orders is sent to login | ![Orders login guard](docs/screenshots/order-tracking-1-logged-out-login.png) |
| Vendor cannot view another buyer’s order | ![Vendor denied on order](docs/screenshots/order-tracking-2-vendor-no-access.png) |
| Buyer cannot view another buyer’s order; page says not found | ![Other buyer denied](docs/screenshots/order-tracking-4-other-buyer-not-found.png) |
