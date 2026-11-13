"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { authClient, type AuthUser } from "@/lib/auth/client";
import { roleHome } from "@/lib/auth/role-home";

const navLink = "min-h-11 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary/5 hover:text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export function PublicNavigation() {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    let active = true;
    const refreshSession = async () => {
      try {
        const { data, error } = await authClient.getSession();
        if (!active) return;
        if (!error) setUser(data?.user ?? null);
      } catch {
        // Keep the last known auth state during a temporary session endpoint error.
      } finally {
        if (active) setSessionChecked(true);
      }
    };
    void refreshSession();
    const refreshOnFocus = () => { if (document.visibilityState === "visible") void refreshSession(); };
    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnFocus);
    return () => { active = false; };
  }, [pathname]);

  const accountHref = user?.role && user.role in roleHome
    ? roleHome[user.role as keyof typeof roleHome]
    : "/login";
  const accountLabel = user?.role === "vendor"
    ? "Vendor dashboard"
    : user?.role === "rider"
      ? "Rider dashboard"
      : user?.role === "admin"
        ? "Admin dashboard"
        : "My account";
  const accountAction = !sessionChecked
    ? <span className="sr-only" aria-live="polite">Checking account</span>
    : user
      ? <>
          <Link href={accountHref} className={navLink}>{accountLabel}</Link>
          <LogoutButton className="min-h-11 rounded-lg px-3 text-sm font-medium" />
        </>
      : <Link href="/login" className={navLink}>Log in</Link>;

  return (
    <>
      <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
        <Link href="/#about" className={navLink}>About</Link>
        <Link href="/#how-it-works" className={navLink}>How it works</Link>
        <Link href="/marketplace" className={navLink}>Marketplace</Link>
        <Link href="/vendors" className={navLink}>Vendors</Link>
        <Link href="/#contact" className={navLink}>Contact</Link>
        {accountAction}
        <Link href="/marketplace" className="ml-1 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground outline-none transition hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50">Start shopping</Link>
      </nav>
      <details className="group relative lg:hidden">
        <summary aria-label="Open navigation menu" className="flex size-11 cursor-pointer list-none items-center justify-center rounded-xl border border-border bg-card text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
          <Menu aria-hidden="true" className="size-5" />
        </summary>
        <nav aria-label="Mobile navigation" className="absolute right-0 top-14 z-50 grid w-[min(88vw,20rem)] gap-1 rounded-2xl border border-border bg-card p-3 shadow-lg">
          <Link href="/#about" className={navLink}>About</Link>
          <Link href="/#how-it-works" className={navLink}>How it works</Link>
          <Link href="/marketplace" className={navLink}>Marketplace</Link>
          <Link href="/vendors" className={navLink}>Vendors</Link>
          <Link href="/#contact" className={navLink}>Contact</Link>
          {accountAction}
          <Link href="/marketplace" className="mt-1 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Start shopping</Link>
        </nav>
      </details>
    </>
  );
}
