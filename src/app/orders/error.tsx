"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ordersPageCopy } from "@/lib/orders/page-copy";

export default function OrdersError({ retry }: { retry: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-12 sm:px-6">
      <Card>
        <CardContent className="flex flex-col items-start gap-5 py-8">
          <p className="text-base leading-7 text-foreground">{ordersPageCopy.errorMessage}</p>
          <Button onClick={retry}>{ordersPageCopy.retryButton}</Button>
        </CardContent>
      </Card>
    </main>
  );
}
