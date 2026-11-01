import { OrdersLoadingSkeleton } from "@/app/orders/orders-loading-skeleton";

export default function OrdersLoading() {
  return (
    <main
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12"
    >
      <OrdersLoadingSkeleton />
    </main>
  );
}
