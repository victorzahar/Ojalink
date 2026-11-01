import Link from "next/link";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { Button } from "@/components/ui/button";

export default function DisputeNotFound() {
  return (
    <AdminPageShell
      title="Dispute not found"
      description="We couldn’t find that dispute. It may have been removed or the link may be incorrect."
    >
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-base text-muted-foreground">
          Check the dispute link or return to the dispute list.
        </p>
        <Button asChild className="mt-4 w-full sm:w-auto">
          <Link href="/admin/disputes">Back to disputes</Link>
        </Button>
      </div>
    </AdminPageShell>
  );
}
