import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { roleHome } from "@/lib/auth/role-home";
import { getCurrentUser } from "@/lib/auth/session";

// This page reads the session on every request. Block on the server so the
// signed-in redirect is decided fresh, never from a cache.
export const instant = false;

export const metadata: Metadata = {
  title: "Log in · OjaLink",
  description: "Log in to your OjaLink account to buy, sell or deliver.",
};

export default async function LoginPage() {
  // Already signed in? Send people to their own area by role — never to
  // any address the browser might have suggested.
  const user = await getCurrentUser();
  if (user) redirect(roleHome[user.role]);

  return (
    <div>
      <h1 className="font-heading text-[28px] leading-tight font-bold text-foreground">
        Welcome back
      </h1>
      <p className="mt-1 mb-4 text-base text-muted-foreground">
        Log in to continue trading on OjaLink.
      </p>
      <LoginForm />
    </div>
  );
}
