import type { ReactNode } from "react";

import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative isolate flex min-h-svh flex-col items-center justify-center overflow-hidden bg-primary px-4 py-10 sm:py-12">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <Image
          src="/images/landing/auth-market-background.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center brightness-[0.68] blur-[2px]"
        />
        <div className="absolute inset-0 bg-primary/35" />
        <div className="absolute inset-0 bg-gradient-to-br from-foreground/25 via-transparent to-primary/35" />
      </div>
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mx-auto mb-6 block w-fit rounded-xl border border-white/70 bg-background/95 px-5 py-2 font-heading text-2xl font-bold text-primary shadow-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          OjaLink
        </Link>
        {children}
      </div>
    </main>
  );
}
