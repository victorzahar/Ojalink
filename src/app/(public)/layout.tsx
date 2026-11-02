import type { ReactNode } from "react";
import Link from "next/link";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="font-heading text-2xl font-bold tracking-tight text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-sm"
          >
            OjaLink
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4 text-sm font-medium">
            <Link
              href="/marketplace"
              className="rounded-md px-3 py-2 text-foreground transition-colors hover:text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Marketplace
            </Link>
            <Link
              href="/orders"
              className="hidden sm:inline-block rounded-md px-3 py-2 text-muted-foreground transition-colors hover:text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              My orders
            </Link>
            <Link
              href="/login"
              className="rounded-md bg-primary/10 px-3.5 py-2 font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Log in
            </Link>
          </nav>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t border-border/60 bg-card/50 py-8 text-center text-sm text-muted-foreground">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-3">
          <p className="font-heading font-semibold text-foreground">
            OjaLink &mdash; Benin City Market, Online
          </p>
          <p className="text-xs text-muted-foreground">
            Order fresh goods from trusted Benin City market vendors and have them delivered.
          </p>
          <div className="flex justify-center gap-4 text-xs font-medium pt-2">
            <Link href="/" className="hover:text-primary">
              Home
            </Link>
            <Link href="/marketplace" className="hover:text-primary">
              Marketplace
            </Link>
            <Link href="/orders" className="hover:text-primary">
              My orders
            </Link>
            <Link href="/login" className="hover:text-primary">
              Log in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
