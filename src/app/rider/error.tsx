"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { riderPageCopy } from "@/lib/rider/page-copy";

export default function RiderError({ unstable_retry }: { unstable_retry: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <Card>
        <CardContent className="flex flex-col items-start gap-5 py-8">
          <p className="text-base leading-7 text-foreground">{riderPageCopy.errorMessage}</p>
          <Button onClick={unstable_retry}>{riderPageCopy.retryButton}</Button>
        </CardContent>
      </Card>
    </main>
  );
}
