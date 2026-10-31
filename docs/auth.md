# Auth helpers

Two server-side helpers cover every access check in OjaLink. Both live under
`src/lib/auth/` and only run on the server (pages, route handlers, server
actions).

- **`getCurrentUser()`** — who is asking, or `null`.
- **`requireRole(...roles)`** — enforce access, one call.

## `getCurrentUser()`

Reads the Better Auth session for the current request.

```ts
import { getCurrentUser } from "@/lib/auth/session";

const user = await getCurrentUser();
// user: { id, name, email, phone, role } | null
```

It returns `null` when:

- nobody is signed in, or
- the signed-in user's role is missing or unknown (default deny).

Pages or components that call it become dynamic, which is what you want for
anything personal.

## `requireRole(...roles)` — pages

In a server component, call it at the top of the page. It either returns the
user or stops the request:

- not signed in (or no usable role) → redirect to `/login`
- wrong role → 403 page showing **"You do not have access"**
- admin → passes every check, for every area
- the allowed list is checked strictly; an unknown or missing role never passes

```tsx
// src/app/buyer/page.tsx
import { requireRole } from "@/lib/auth/guard";

export default async function BuyerPage() {
  const user = await requireRole("buyer");

  return <h1>Welcome, {user.name}</h1>;
}
```

Multiple roles are allowed: `requireRole("vendor", "rider")`.

Do not add a `next`/`redirect` URL parameter to any login or guard flow. After
login the server-known role decides where the user goes.

## `requireRole({ api: true }, ...roles)` — API routes

Pass `{ api: true }` as the first argument. It never redirects; on failure it
returns a JSON `Response`, so you can return it straight to the caller:

- `401 { "error": "Not signed in" }`
- `403 { "error": "You do not have access" }`

```ts
// src/app/api/admin/stats/route.ts
import { requireRole } from "@/lib/auth/guard";

export async function GET() {
  const auth = await requireRole({ api: true }, "admin");
  if (auth instanceof Response) return auth; // 401 or 403 JSON

  return Response.json({ ok: true, adminId: auth.id });
}
```

## `requireRole({ api: true }, ...roles)` — server actions

Server actions cannot set an HTTP status, so return the guard's status and
JSON body to the caller instead of redirecting:

```ts
// src/app/vendor/actions.ts
"use server";

import { requireRole } from "@/lib/auth/guard";

export async function publishProduct(productId: string) {
  const auth = await requireRole({ api: true }, "vendor", "admin");
  if (auth instanceof Response) {
    // Same 401/403 JSON as the API case, passed back as action data.
    return { ok: false as const, status: auth.status, body: await auth.json() };
  }

  // ...update the product for auth.id...
  return { ok: true as const };
}
```

## A role check is not an ownership check

`requireRole("vendor")` only proves the caller is *a* vendor. It does not prove
the order, product, delivery or payout belongs to **their** shop. Without an
ownership filter, any vendor can read or change another vendor's data by
guessing an id. Filter by the vendor row whose `user_id` is the current user.

Copy-paste baseline for a vendor orders query:

```ts
// src/app/vendor/orders/page.tsx
import { eq } from "drizzle-orm";

import { requireRole } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { orders, vendors } from "@/lib/db/schema";

export default async function VendorOrdersPage() {
  const user = await requireRole("vendor"); // admin also passes

  // Admin is the only exception; every other caller is scoped to the vendor
  // row that belongs to them (vendors.userId === the signed-in user's id).
  const ownership =
    user.role === "admin" ? undefined : eq(vendors.userId, user.id);

  const rows = await getDb()
    .select({
      id: orders.id,
      status: orders.status,
      totalKobo: orders.totalKobo,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .innerJoin(vendors, eq(orders.vendorId, vendors.id))
    .where(ownership);

  return <pre>{JSON.stringify(rows, null, 2)}</pre>;
}
```

For a single row, never trust an id from the URL or request body on its own —
scope the same query too:

```ts
// Same page: also import { and } from "drizzle-orm" and notFound from "next/navigation".
// Only returns the order if this vendor owns it (admin skips the filter).
const [order] = await getDb()
  .select()
  .from(orders)
  .innerJoin(vendors, eq(orders.vendorId, vendors.id))
  .where(
    user.role === "admin"
      ? eq(orders.id, orderId)
      : and(eq(orders.id, orderId), eq(vendors.userId, user.id)),
  );
if (!order) notFound(); // not yours and not found look the same to the caller
```

**Every query for orders, products, deliveries and payouts must do this.**
Join (or subquery) through `vendors.userId`, or filter by `buyerId` /
`riderId` where that is the correct owner, and keep admin as the only
exception. A route that takes a `vendorId`, `orderId` or `productId` from the
browser and skips the ownership filter is a data leak.

If you wrote a temporary `requireRole` stub, delete it and import the real one.

## Rules of thumb

- Check on the server. Hiding a button is not security.
- A role check is not an ownership check: scope every query to the caller.
- Default is deny: only the roles you pass (plus admin) get in.
- Return kind, clear errors; never reveal what other areas contain.
- Re-check inside every server action and API handler — a page guard does not
  protect endpoints by itself.
