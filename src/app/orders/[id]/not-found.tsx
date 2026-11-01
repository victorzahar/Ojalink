import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ordersPageCopy } from "@/lib/orders/page-copy";

export default function OrderNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-5 px-4 py-12 sm:px-6">
      <Card>
        <CardContent className="flex flex-col items-start gap-5 py-8">
          <p className="text-base leading-7 text-foreground">{ordersPageCopy.notFoundMessage}</p>
          <Button asChild variant="outline">
            <Link href="/orders">{ordersPageCopy.backToOrders}</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
