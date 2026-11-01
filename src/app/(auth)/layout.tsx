import type { ReactNode } from "react";

import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-6 block text-center font-heading text-2xl font-bold text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-sm"
        >
          OjaLink
        </Link>
        {children}
      </div>
    </main>
  );
}
