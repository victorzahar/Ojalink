# Team contributions and hand-in checklist

This roster combines the team assignment screenshot with the ownership details received so far. Replace “To confirm” only after each teammate confirms their name and task. Snow separately confirmed a personal assignment of Feature 5 plus Role 9 (Docs & README).

| Teammate | Feature | Non-code role | Commit / PR link |
|---|---|---|---|
| Snow (@snow-sud0) | 5 — Vendor product manager | 9 — Docs & README | [PR #3](https://github.com/victorzahar/Ojalink/pull/3) — pending review and merge |
| Feature 1 owner — to confirm | 1 — Marketplace and search (not started on main) | Project lead | Awaiting owner confirmation and screenshot |
| Edegbe Esohe Favour (T4Y-1220) | 2 — Vendor storefronts | Client & research lead | [feature/vendor-storefront](https://github.com/victorzahar/Ojalink/tree/feature/vendor-storefront) — screenshot and Neon data check pending |
| To confirm | 3 — Cart and checkout | UX & wireframes | Add link |
| Humphrey Uwagboe Igbinore (T4Y-0163) | 4 — Buyer order tracking | Content writer | [PR #4](https://github.com/victorzahar/Ojalink/pull/4); evidence: [docs/order-tracking.md](order-tracking.md) |
| Egbon Aisosa (T4Y-1242) | 6 — Vendor orders and payouts | QA test lead | [feature/vendor-order-payouts](https://github.com/victorzahar/Ojalink/tree/feature/vendor-order-payouts) — code pushed; build and tests pending |
| To confirm | 7 — Rider app | Accessibility & mobile reviewer | Add link |
| Ajari Obed (T4Y-1250) | 8 — Admin and disputes | Security & access tester | [feature/admin-disputes](https://github.com/victorzahar/Ojalink/tree/feature/admin-disputes) — owner reports access tests not run; refund migration not applied to their database |
| To confirm | 9 — Notifications and automations | Docs & README | Add link |
| Zahar | 10 — Accounts, roles and security | Pitch & demo lead | [PR #2](https://github.com/victorzahar/Ojalink/pull/2); screenshots in [docs/screenshots](screenshots/) |

## Feature notes received

### Feature 2 — Vendor storefronts

The owner reports a public `/vendors/[slug]` page for approved vendors with shop name, market and area, description, available products and prices, and reviews from delivered orders. Cart actions are placeholders; buyer accounts and checkout are not included in this feature.

The owner could not capture a working screenshot because `/vendors/adaeze-fabrics` currently fails its database query. The cause has not been confirmed by querying Neon. Earlier focused tests, lint and a production build passed, but did not verify the storefront against live Neon data.

After database setup, check an approved vendor with products, a missing or unapproved vendor, and empty product/review states. Capture the page at phone width.

### Feature 4 — Buyer order tracking

Buyers can see their own orders on My orders and open any order to follow its progress on a four-step tracker: payment, accepted, picked up, delivered. Cancelled, rejected and refunded orders show clear messages.

The owner reports 2/2 automated tests, lint and build passing, plus manual checks of order statuses and refused-access cases. Another buyer’s order URL returns “Not found”. Details and screenshots are in [docs/order-tracking.md](order-tracking.md).

Known issues: the seven status email messages are written in [docs/content-guide.md](content-guide.md), but sending is not wired up; there is no refunded email yet; the refunded status message is short.

### Feature 6 — Vendor orders and payouts

Vendors should see their own paid orders, accept or reject each order, and view weekly payout summaries (gross, commission and net) in Naira. The owner reports the code is pushed to [feature/vendor-order-payouts](https://github.com/victorzahar/Ojalink/tree/feature/vendor-order-payouts), but it has not been built or run yet and no screenshot is available. Planned tests cover vendor-only ownership, refusal of logged-out/buyer/rider users, accepting only paid orders, and payout arithmetic in kobo. Results are pending.

### Feature 8 — Admin and disputes

The owner describes an admin area for vendor approvals, dispute review and updates, user browsing and platform stats. Access should be admin-only; checks as admin, buyer and signed-out visitor have not yet been run in this session. The owner reports the refund migration has not been applied to their database. Verify the target database and migration state before testing refunds.

### Feature 10 — Authentication and security

Visitors can sign up, log in and log out. Protected pages and API routes check the signed-in user’s role on the server. Unauthorized users see “You do not have access”.

The owner reports that sign-up ignores a submitted `role: "admin"` and creates a buyer, wrong password and unknown email use the same message, role changes apply on the next request, and protected pages are not cached after logout. Screenshots are already in `docs/screenshots/`; the admin-all-areas image is a composite of four screenshots.

Known issues: production rate limiting is in memory and weak for Vercel; sign-up reveals whether an email exists (accepted trade-off); Google login and the admin role-management screen are not built. The buyer-to-buyer order refusal is reported as manually checked by the Feature 4 owner; the vendor-to-vendor refusal check remains to be completed with two vendor accounts.

## Submission checklist

- [ ] Confirm the Feature 1 status with its owner; add a screenshot only if the marketplace page exists.
- [ ] Add the remaining teammate names.
- [ ] Replace “Add link” with each teammate’s merged commit or pull request.
- [ ] Add the final live-site URL to the README after deployment.
- [ ] Confirm test accounts work; use throwaway passwords stored outside GitHub.
- [ ] Collect any additional refused-access screenshots from the Security & access tester.
- [ ] Check the README against the deployed site and list remaining known issues.
