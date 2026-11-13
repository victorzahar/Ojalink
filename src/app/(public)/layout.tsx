import type { ReactNode } from "react";
import Link from "next/link";
import { AtSign, Share2 } from "lucide-react";

import { contactPlaceholders } from "@/lib/landing/content";
import { PublicNavigation } from "@/components/landing/public-navigation";

const COPYRIGHT_YEAR = 2026;
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" aria-label="OjaLink home" className="shrink-0 rounded-sm font-heading text-2xl font-bold tracking-tight text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50">OjaLink</Link>
          <PublicNavigation />
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer id="contact" className="scroll-mt-24 border-t border-border/70 bg-card/60 py-10">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Link href="/" className="font-heading text-xl font-bold text-primary">OjaLink</Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">OjaLink — Benin City Market, Online. Order fresh food, fabrics, electronics, and provisions from local vendors.</p>
            <p className="mt-4 text-xs text-muted-foreground">© {COPYRIGHT_YEAR} OjaLink. All rights reserved.</p>
          </div>
          <div>
            <h2 className="font-heading font-bold">Explore</h2>
            <ul className="mt-3 grid gap-2 text-sm">
              <li><Link className="hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/50" href="/marketplace">Marketplace</Link></li>
              <li><Link className="hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/50" href="/vendors">Vendors</Link></li>
              <li><Link className="hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/50" href="/orders">My orders</Link></li>
              <li><Link className="hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/50" href="/login">Log in</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="font-heading font-bold">Contact and follow</h2>
            <p className="mt-3 text-sm text-muted-foreground">Email: {contactPlaceholders.email}</p>
            <p className="mt-1 text-sm text-muted-foreground">Phone: {contactPlaceholders.phone}</p>
            <div className="mt-3 flex gap-3 text-muted-foreground" aria-label="Social links to be added">
              <span title={contactPlaceholders.instagram} aria-label={contactPlaceholders.instagram}><AtSign aria-hidden="true" className="size-5" /></span>
              <span title={contactPlaceholders.facebook} aria-label={contactPlaceholders.facebook}><Share2 aria-hidden="true" className="size-5" /></span>
            </div>
            <Link href="/orders" className="mt-3 inline-block min-h-11 py-2 text-sm font-semibold text-primary hover:underline">Order help: My orders</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
