import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { redirect } from "next/navigation";

import { SignupForm } from "@/components/auth/signup-form";
import { roleHome } from "@/lib/auth/role-home";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { markets } from "@/lib/db/schema";

// This page reads the session and the market list on every request. Block on
// the server so the signed-in redirect is decided fresh, never from a cache.
export const instant = false;

export const metadata: Metadata = {
  title: "Create account · OjaLink",
  description:
    "Join OjaLink to buy from Benin City markets or sell from your own market stall.",
};

export default async function SignupPage() {
  // Already signed in? Their account exists, so no need to sign up again.
  const user = await getCurrentUser();
  if (user) redirect(roleHome[user.role]);

  // The market list backs the shop dropdown shown when "Vendor" is chosen.
  const marketOptions = await getDb()
    .select({ name: markets.name, slug: markets.slug, area: markets.area })
    .from(markets)
    .orderBy(asc(markets.name));

  return (
    <div>
      <h1 className="font-heading text-[28px] leading-tight font-bold text-background drop-shadow-sm">
        Create your account
      </h1>
      <p className="mt-1 mb-4 text-base text-background/95 drop-shadow-sm">
        Choose how you want to use OjaLink. Buyers get instant access; vendor
        and rider accounts are approved by an admin.
      </p>
      <SignupForm markets={marketOptions} />
    </div>
  );
}
