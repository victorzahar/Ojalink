"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    setIsPending(true);
    try {
      // End the session on the server first (clears the cookie), then leave.
      await authClient.signOut();
      router.push("/login");
      router.refresh();
    } catch {
      setIsPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => void handleClick()}
      disabled={isPending}
      aria-busy={isPending}
      className={className}
    >
      {isPending ? "Logging out…" : "Log out"}
    </Button>
  );
}
