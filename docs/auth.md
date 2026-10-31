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

## Rules of thumb

- Check on the server. Hiding a button is not security.
- Default is deny: only the roles you pass (plus admin) get in.
- Return kind, clear errors; never reveal what other areas contain.
- Re-check inside every server action and API handler — a page guard does not
  protect endpoints by itself.
