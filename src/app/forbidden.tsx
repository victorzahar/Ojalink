import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";

export default function Forbidden() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm text-center">
        <h1 className="font-heading text-[28px] leading-tight font-bold text-foreground">
          You do not have access
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          This page is not open to your account.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3">
          <Link
            href="/"
            className="text-base font-medium text-primary rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Go to the home page
          </Link>
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
