import { BadgeCheck } from "lucide-react";

export function VerifiedBadge() {
  return (
    <span className="inline-flex min-h-8 shrink-0 items-center gap-2 rounded-full bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground">
      <BadgeCheck aria-hidden="true" className="size-4" />
      Verified vendor
    </span>
  );
}
