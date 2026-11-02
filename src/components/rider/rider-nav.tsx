import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { riderPageCopy } from "@/lib/rider/page-copy";

type RiderNavProps = {
  current: "jobs" | "history";
};

const linkBase =
  "inline-flex h-12 flex-1 items-center justify-center rounded-md border px-4 text-base font-medium";

export function RiderNav({ current }: RiderNavProps) {
  return (
    <nav aria-label="Rider area" className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Link
          href="/rider"
          aria-current={current === "jobs" ? "page" : undefined}
          className={`${linkBase} ${
            current === "jobs"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-foreground"
          }`}
        >
          {riderPageCopy.jobsLink}
        </Link>
        <Link
          href="/rider/history"
          aria-current={current === "history" ? "page" : undefined}
          className={`${linkBase} ${
            current === "history"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-foreground"
          }`}
        >
          {riderPageCopy.historyLink}
        </Link>
      </div>
      <LogoutButton className="w-full" />
    </nav>
  );
}
