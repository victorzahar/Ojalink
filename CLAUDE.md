# CLAUDE.md: OjaLink

Read this file before writing any code. The whole team has agreed to it. If you want to change it, raise it at the daily check-in first.

## What we are building

OjaLink is a marketplace where Benin City market vendors sell online, buyers order and pay, and dispatch riders deliver. This is a Tech4Youth Edo Module 06 group project, built by 10 people in one repo.

## Users and roles

Four roles, stored as `users.role`: `buyer`, `vendor`, `rider`, `admin`.

- Buyer: search, cart, checkout, track orders, report problems.
- Vendor: manage products and stock, accept or reject orders, see payouts.
- Rider: see jobs, accept, mark picked up and delivered with a proof photo.
- Admin: approve vendors, handle disputes and refunds, see stats.

## Stack

- Next.js (App Router) with TypeScript
- Neon (PostgreSQL) with a type-safe ORM (Drizzle or Prisma, agreed on day one)
- Better Auth for sign up, login and sessions
- Resend for email
- Paystack in TEST MODE ONLY
- n8n or Make for WhatsApp alerts and the daily vendor summary
- Vercel for deploys
- Tailwind CSS for styling

## Commands

- Install: `npm install`
- Run locally: `npm run dev`
- Check before every push: `npm run build`
- Lint: `npm run lint`

## Hard rules

1. **Nobody pushes to `main`.** Work on a branch named `feature/<short-name>` (for example `feature/rider-app`). Open a pull request. Another person reviews. The project lead merges.
2. **Pull before you start.** `git pull origin main`, then branch.
3. **Small commits with clear messages**, for example `Add stock check to product form`. Commit under your own name.
4. **Never commit secrets.** No API keys, database URLs, Paystack keys or webhook secrets in the repo. They live in Vercel environment variables and a private team chat. Commit `.env.example` with empty values only. `.env` is in `.gitignore`.
5. **Paystack test mode only.** Use test keys and the test cards from the Paystack docs. Never a real card or a live key.
6. **Shared parts change only by team agreement:** header, footer, layout, the style guide, auth setup and database tables. Ask at the check-in, then make one dedicated pull request.
7. **Real content only.** Real product names, Naira prices, real Benin City market names and areas. No lorem ipsum. No fake reviews shown as real.

## Folder layout

```
src/
  app/
    (public)/            home, search, category, vendor shop, product, cart
    (buyer)/             checkout, orders, profile
    vendor/              dashboard, products, orders, payouts
    rider/               jobs, active job, history
    admin/               vendors, disputes, users, stats
    api/
      paystack/webhook/  signature-verified payment webhook
  components/
    ui/                  shared buttons, inputs, cards (style guide)
    layout/              header, footer, nav (shared, change by agreement)
  lib/
    db/                  schema, queries, migrations
    auth/                Better Auth config and role guards
    email/               Resend templates
    paystack/            helpers
```

Each feature owner works mainly inside their own folders and avoids editing other people's files.

## Database rules

- Money is stored as integer kobo (₦1 = 100 kobo). Convert to Naira only when displaying, as `₦6,500`. Full arithmetic and display rules: **[docs/money-rules.md](docs/money-rules.md)**.
- Every table has `id` (UUID), `created_at`, `updated_at`.
- Schema changes need team agreement and a migration file. Never edit the database by hand on the live project.
- Order statuses: `pending_payment`, `paid`, `vendor_accepted`, `vendor_rejected`, `ready_for_pickup`, `rider_assigned`, `picked_up`, `delivered`, `cancelled`, `refunded`, `disputed`.
- Store a name and price snapshot on `order_items` so old orders do not change when a product changes.
- Use Neon's WebSocket driver (neon-serverless Pool) for any action that changes more than one table, so it can use a real transaction.

## Security rules

- **Access control happens on the server.** Hiding a button is not security. Every route, server action and API handler checks the session and the role.
- A buyer reads only their own orders, addresses and cart.
- A vendor reads and edits only their own products and orders.
- A rider sees unassigned jobs and only their own accepted jobs.
- Only admin approves vendors, resolves disputes and issues refunds.
- The Paystack webhook must verify the signature before changing any payment or order. Never trust a payment status sent from the browser.
- Validate all form input on the server. Return kind, clear error messages.
- File uploads: check type and size. Only images for product photos and proof photos.

## Design and content

- Mobile first. Test on a cheap phone: contrast, tap size at least 44px, fast loading.
- Follow the style guide from the UX lead (colours, fonts, spacing). Use the shared components in `components/ui`.
- All page text, button labels, emails and error messages come from the content writer's copy document. Ask before inventing text.
- Every public page has a unique title and meta description (SEO lead provides them).
- Use clear, plain English that a market trader would understand.

## Definition of done for a pull request

- Works on the Vercel preview link
- Works on a phone screen
- Refused-access cases handled for your feature
- No console errors, no secrets, no leftover test code
- Reviewed by QA lead or a teammate
- PR description says what changed, how to test it, and which test account to use

## End-of-project checklist

Before the final handover:

- Review experimental Next.js flags with the team and decide keep/remove-with-reason for each one in `next.config.ts`: `cacheComponents`, `partialPrefetching`, `experimental.authInterrupts`.
- Confirm the `export const instant = false` opt-out on the auth pages is still documented in the installed Next.js docs (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/instant.md`) before any Next.js version bump.

## Test accounts

Created by the Docs & README owner and listed in README.md: one each for buyer, vendor, rider and admin. Use Paystack test cards only.

## Daily check-in (10 minutes)

Each person answers: what I finished, what I am doing next, what is blocking me.

## When using Claude Code

- Prompt in small steps: one page or one function at a time.
- Tell Claude which feature and which files you own, and ask it not to touch shared files.
- Read errors and ask Claude to explain them. Be ready to explain one bug you fixed on demo day.
- Review every change before committing. You must understand the code you commit.
