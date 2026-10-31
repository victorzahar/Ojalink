import type { Metadata } from "next";

import { Card, CardContent } from "@/components/ui/card";
import { LogoutButton } from "@/components/auth/logout-button";
import { requireRole } from "@/lib/auth/guard";

export const metadata: Metadata = {
  title: "Vendor area · OjaLink",
  description: "Your OjaLink vendor area: products, stock and orders.",
};

export default async function VendorPage() {
  const user = await requireRole("vendor");

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-6 px-4 py-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Vendor area</p>
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
            This is a placeholder page for the vendor area.
          </p>
          <p className="text-sm text-muted-foreground">
            Products, stock and incoming orders will live here.
          </p>
          <LogoutButton className="w-full sm:w-auto" />
        </CardContent>
      </Card>
    </main>
  );
}
