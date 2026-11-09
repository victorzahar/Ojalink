import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CheckoutOrderNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <h1 className="font-heading text-2xl font-bold">We couldn&apos;t find that order</h1>
      <p className="text-base text-muted-foreground">It may have been removed, or it may belong to another account.</p>
      <Button asChild className="h-12 w-full sm:w-auto"><Link href="/orders">Go to my orders</Link></Button>
    </main>
  );
}
