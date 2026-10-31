import type { Metadata } from "next";

import { Card, CardContent } from "@/components/ui/card";
import { LogoutButton } from "@/components/auth/logout-button";
import { requireRole } from "@/lib/auth/guard";

// This page reads the session on every request. Block on the server so
// protected content is never served from the static shell or a cache.
export const instant = false;

export const metadata: Metadata = {
  title: "Rider area · OjaLink",
  description: "Your OjaLink rider area: delivery jobs and history.",
};

export default async function RiderPage() {
  const user = await requireRole("rider");

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-6 px-4 py-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Rider area</p>
        <h1 className="font-heading text-[28px] leading-tight font-bold text-foreground">
          Welcome, {user.name}
        </h1>
        <p className="mt-1 text-base text-muted-foreground">
          Signed in as {user.email} · {user.role}
        </p>
      </div>

      <Card size="sm">
        <CardContent className="flex flex-col gap-4">
          <p className="text-base text-foreground">
            This is a placeholder page for the rider area.
          </p>
          <p className="text-sm text-muted-foreground">
            Delivery jobs and your history will live here.
          </p>
          <LogoutButton className="w-full sm:w-auto" />
        </CardContent>
      </Card>
    </main>
  );
}
