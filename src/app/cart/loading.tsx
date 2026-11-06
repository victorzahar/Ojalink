import { Card, CardContent } from "@/components/ui/card";

export default function CartLoading() {
  return (
    <main
      className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10"
      aria-busy="true"
      aria-label="Loading your cart"
    >
      <div className="h-9 w-40 animate-pulse rounded-md bg-muted" />
      <Card className="rounded-xl">
        <CardContent className="space-y-4 p-5">
          <div className="h-24 animate-pulse rounded-lg bg-muted" />
          <div className="h-24 animate-pulse rounded-lg bg-muted" />
        </CardContent>
      </Card>
    </main>
  );
}
