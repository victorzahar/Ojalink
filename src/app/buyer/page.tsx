import type { Metadata } from "next";

import { Card, CardContent } from "@/components/ui/card";
import { LogoutButton } from "@/components/auth/logout-button";
import { requireRole } from "@/lib/auth/guard";

// This page reads the session on every request. Block on the server so
// protected content is never served from the static shell or a cache.
export const instant = false;

export const metadata: Metadata = {
  title: "Buyer area · OjaLink",
  description: "Your OjaLink buyer area: orders, cart and saved addresses.",
};

export default async function BuyerPage() {
  const user = await requireRole("buyer");

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-6 px-4 py-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Buyer area</p>
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
            This is a placeholder page for the buyer area.
          </p>
          <p className="text-sm text-muted-foreground">
            Browsing, cart and orders will live here.
          </p>
          <LogoutButton className="w-full sm:w-auto" />
        </CardContent>
      </Card>
    </main>
  );
}
