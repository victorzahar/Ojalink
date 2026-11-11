# Team contributions and hand-in checklist

This roster combines the team assignment screenshot with the ownership details received so far. Replace “To confirm” only after each teammate confirms their name and task. Michael Iyoha confirmed Feature 5 plus Role 9 (Docs & README).

| Teammate | Feature | Non-code role | Commit / PR link |
|---|---|---|---|
| Michael Iyoha | 5 — Vendor product manager (merged on main) | 9 — Docs & README | [PR #3](https://github.com/victorzahar/Ojalink/pull/3) — merged |
| Feature 1 owner — to confirm | 1 — Marketplace and search (merged on main) | Project lead | [PR #12](https://github.com/victorzahar/Ojalink/pull/12) — merged |
| Edegbe Esohe Favour | 2 — Vendor storefronts | Client & research lead | [feature/vendor-storefront](https://github.com/victorzahar/Ojalink/tree/feature/vendor-storefront) — screenshot and Neon data check pending |
| To confirm | 3 — Cart and checkout | UX & wireframes | Add link |
| Humphrey Uwagboe Igbinore | 4 — Buyer order tracking (merged) | Content writer | [PR #4](https://github.com/victorzahar/Ojalink/pull/4) — merged; evidence: [docs/order-tracking.md](order-tracking.md) |
| Egbon Aisosa | 6 — Vendor orders and payouts (merged on main) | QA test lead | [PR #9](https://github.com/victorzahar/Ojalink/pull/9) — merged |
| Iyen Monica | 7 — Rider app (merged on main) | Accessibility & mobile reviewer | [PR #11](https://github.com/victorzahar/Ojalink/pull/11) — merged |
| Ajari Obed | 8 — Admin and disputes (merged on main) | Security & access tester | [PR #8](https://github.com/victorzahar/Ojalink/pull/8) — merged; label fix in PR #13 |
| To confirm | 9 — Notifications and automations | Docs & README | Add link |
| Zahar | 10 — Accounts, roles and security | Pitch & demo lead | [PR #2](https://github.com/victorzahar/Ojalink/pull/2); screenshots in [docs/screenshots](screenshots/) |

## Feature notes received

### Feature 5 — Vendor product manager (Michael Iyoha)

Vendors can list, add and edit their own products, set Naira prices and stock, and mark products available or sold out. Server-side checks scope product access to the signed-in vendor; creating products requires vendor approval. Photo upload is waiting for the team to choose a storage provider. Merged in [PR #3](https://github.com/victorzahar/Ojalink/pull/3).

### Feature 2 — Vendor storefronts

The owner reports a public `/vendors/[slug]` page for approved vendors with shop name, market and area, description, available products and prices, and reviews from delivered orders. Cart actions are placeholders; buyer accounts and checkout are not included in this feature.

The owner could not capture a working screenshot because `/vendors/adaeze-fabrics` currently fails its database query. The cause has not been confirmed by querying Neon. Earlier focused tests, lint and a production build passed, but did not verify the storefront against live Neon data.

After database setup, check an approved vendor with products, a missing or unapproved vendor, and empty product/review states. Capture the page at phone width.

### Feature 4 — Buyer order tracking

Buyers can see their own orders on My orders and open any order to follow its progress on a four-step tracker: payment, accepted, picked up, delivered. Cancelled, rejected and refunded orders show clear messages.

The owner reports 2/2 automated tests, lint and build passing, plus manual checks of order statuses and refused-access cases. Another buyer’s order URL returns “Not found”. Details and screenshots are in [docs/order-tracking.md](order-tracking.md).

Owner-reported ownership test run on 1 November: a second buyer opening the first buyer’s order link saw “Not found”; signed-out `/orders` redirected to the login page. The throwaway user was deleted afterwards.

Known issues: the seven status email messages are written in [docs/content-guide.md](content-guide.md), but sending is not wired up; there is no refunded email yet; the refunded status message is short.

### Feature 6 — Vendor orders and payouts

Merged in [PR #9](https://github.com/victorzahar/Ojalink/pull/9). Vendors see their own orders grouped by status and can accept or reject paid orders with one race-safe conditional update scoped to their vendor profile. The `payouts` table enforces one payout per vendor and week (Monday, Lagos time); the weekly payout calculation workflow itself is still future work (see [docs/money-rules.md](money-rules.md)).

### Feature 7 — Rider app (Iyen Monica)

Merged in [PR #11](https://github.com/victorzahar/Ojalink/pull/11). The rider app has a phone-first job list, accept/picked-up/delivered actions (one transaction per status flip), delivery history and a seed rider account. Online/offline toggle, proof photos and rider earnings are not built yet.

As Accessibility & mobile reviewer, Iyen checks team pages for 44px-or-larger tap targets, body text of at least 16px, readable colour contrast, visible form labels, image alt text, usability on a 360px Android screen and slow-3G behavior, plus Lighthouse accessibility before merge.

### Feature 8 — Admin and disputes

Merged in [PR #8](https://github.com/victorzahar/Ojalink/pull/8), with the sales label fix in [PR #13](https://github.com/victorzahar/Ojalink/pull/13). Admins approve or reject vendors, manage disputes (a resolution note is required to resolve; refund status stays with the separate refund workflow), read-only users list and stats where sales are shown as **Paid sales**. The migration is the single 0001 schema migration; see [docs/feature-8-admin-sitemap.md](feature-8-admin-sitemap.md).

### Feature 10 — Authentication and security

Visitors can sign up, log in and log out. Protected pages and API routes check the signed-in user’s role on the server. Unauthorized users see “You do not have access”.

The owner reports that sign-up ignores a submitted `role: "admin"` and creates a buyer, wrong password and unknown email use the same message, role changes apply on the next request, and protected pages are not cached after logout. Screenshots are already in `docs/screenshots/`; the admin-all-areas image is a composite of four screenshots.

Known issues: production rate limiting is in memory and weak for Vercel; sign-up reveals whether an email exists (accepted trade-off); Google login and the admin role-management screen are not built. The buyer-to-buyer order refusal is reported as manually checked by the Feature 4 owner; the vendor-to-vendor refusal check remains to be completed with two vendor accounts.

## Submission checklist

- [ ] Confirm the Feature 1 owner’s name; marketplace screenshots can be captured from `/marketplace` (merged).
- [ ] Add the remaining teammate names.
- [ ] Replace “Add link” with each teammate’s merged commit or pull request.
- [ ] Add the final live-site URL to the README after deployment.
- [ ] Confirm test accounts work; use throwaway passwords stored outside GitHub.
- [ ] Collect any additional refused-access screenshots from the Security & access tester.
- [ ] Check the README against the deployed site and list remaining known issues.
