import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SignupForm } from "@/components/auth/signup-form";
import { roleHome } from "@/lib/auth/role-home";
import { getCurrentUser } from "@/lib/auth/session";

// This page reads the session on every request. Block on the server so the
// signed-in redirect is decided fresh, never from a cache.
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

  return (
    <div>
      <h1 className="font-heading text-[28px] leading-tight font-bold text-foreground">
        Create your account
      </h1>
      <p className="mt-1 mb-4 text-base text-muted-foreground">
        New accounts are buyer accounts. Vendors are approved by an admin after
        you sign up.
      </p>
      <SignupForm />
    </div>
  );
}
