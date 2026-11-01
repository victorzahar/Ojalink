# Team contributions and hand-in checklist

This roster combines the team assignment screenshot with the ownership details received so far. Replace “To confirm” only after each teammate confirms their name and task. The screenshot pairs features with non-code roles; Snow separately confirmed a personal assignment of Feature 5 plus Role 9 (Docs & README).

| Teammate | Feature | Non-code role | Commit / PR link |
|---|---|---|---|
| Snow (@snow-sud0) | 5 — Vendor product manager | 9 — Docs & README | [PR #3](https://github.com/victorzahar/Ojalink/pull/3) — pending review and merge |
| Feature 1 owner — to confirm | 1 — Marketplace and search (not started on main) | Project lead | Awaiting owner confirmation and screenshot |
| To confirm | 2 — Vendor storefronts | Client & research lead | Add link |
| To confirm | 3 — Cart and checkout | UX & wireframes | Add link |
| Humphrey Uwagboe Igbinore (T4Y-0163) | 4 — Buyer order tracking | Content writer | [PR #4](https://github.com/victorzahar/Ojalink/pull/4); evidence: [docs/order-tracking.md](order-tracking.md) |
| To confirm | 6 — Vendor orders and payouts | QA test lead | Add link |
| To confirm | 7 — Rider app | Accessibility & mobile reviewer | Add link |
| To confirm | 8 — Admin and disputes | Security & access tester | Add link |
| To confirm | 9 — Notifications and automations | Docs & README | Add link |
| Zahar | 10 — Accounts, roles and security | Pitch & demo lead | [PR #2](https://github.com/victorzahar/Ojalink/pull/2); screenshots in [docs/screenshots](screenshots/) |

## Feature notes received

### Feature 4 — Buyer order tracking

Buyers can see their own orders on My orders and open any order to follow its progress on a four-step tracker: payment, accepted, picked up, delivered. Cancelled, rejected and refunded orders show clear messages.

The owner reports 2/2 automated tests, lint and build passing, plus manual checks of order statuses and refused-access cases. Another buyer’s order URL returns “Not found”. Details and screenshots are in [docs/order-tracking.md](order-tracking.md).

Known issues: the seven status email messages are written in [docs/content-guide.md](content-guide.md), but sending is not wired up; there is no refunded email yet; the refunded status message is short.

### Feature 10 — Authentication and security

Visitors can sign up, log in and log out. Protected pages and API routes check the signed-in user’s role on the server. Unauthorized users see “You do not have access”.

The owner reports that sign-up ignores a submitted `role: "admin"` and creates a buyer, wrong password and unknown email use the same message, role changes apply on the next request, and protected pages are not cached after logout. Screenshots are already in `docs/screenshots/`; the admin-all-areas image is a composite of four screenshots.

Known issues: production rate limiting is in memory and weak for Vercel; sign-up reveals whether an email exists (accepted trade-off); Google login and the admin role-management screen are not built. Vendor-to-vendor and buyer-to-buyer refused-access checks remain to be completed as specified by the Feature 10 owner.

## Submission checklist

- [ ] Confirm the Feature 1 status with its owner; add a screenshot only if the marketplace page exists.
- [ ] Add the remaining teammate names.
- [ ] Replace “Add link” with each teammate’s merged commit or pull request.
- [ ] Add the final live-site URL to the README after deployment.
- [ ] Confirm test accounts work; use throwaway passwords stored outside GitHub.
- [ ] Collect any additional refused-access screenshots from the Security & access tester.
- [ ] Check the README against the deployed site and list remaining known issues.
