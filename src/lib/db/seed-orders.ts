import { config } from "dotenv";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "@/lib/db/schema";

if (process.env.NODE_ENV === "production") {
  throw new Error("seed-orders refuses to run in production");
}

config({ path: ".env.local" });

// This seed only writes sample database rows; it does not import email code or send email.

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to seed sample orders.");
}

const { users, vendors, products, orders, orderItems, payments, deliveries } = schema;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

type OrderSample = {
  id: string;
  itemId: string;
  paymentId: string;
  deliveryId: string;
  reference: string;
  status: "pending" | "paid" | "accepted" | "rejected" | "picked_up" | "delivered" | "cancelled";
  vendorSlug: string;
  productSlug: string;
  quantity: number;
  address: string;
  area: string;
  createdAt: Date;
  paidAt?: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  refundKobo?: number;
  refundedAt?: Date;
};

const orderSamples: OrderSample[] = [
  {
    id: "40000000-0000-4000-8000-000000000001",
    itemId: "41000000-0000-4000-8000-000000000001",
    paymentId: "42000000-0000-4000-8000-000000000001",
    deliveryId: "43000000-0000-4000-8000-000000000001",
    reference: "ojalink-demo-order-pending-001",
    status: "pending",
    vendorSlug: "edo-provisions-mart",
    productSlug: "mama-pride-parboiled-rice-5kg",
    quantity: 2,
    address: "14 Uselu-Lagos Road, near Uselu Market",
    area: "Uselu, Benin City",
    createdAt: new Date("2026-10-25T09:30:00+01:00"),
  },
  {
    id: "40000000-0000-4000-8000-000000000002",
    itemId: "41000000-0000-4000-8000-000000000002",
    paymentId: "42000000-0000-4000-8000-000000000002",
    deliveryId: "43000000-0000-4000-8000-000000000002",
    reference: "ojalink-demo-order-paid-002",
    status: "paid",
    vendorSlug: "benin-gadget-hub",
    productSlug: "oraimo-20000mah-power-bank",
    quantity: 1,
    address: "8 Sakponba Road, opposite New Benin Market",
    area: "New Benin, Benin City",
    createdAt: new Date("2026-10-26T11:15:00+01:00"),
    paidAt: new Date("2026-10-26T11:18:00+01:00"),
  },
  {
    id: "40000000-0000-4000-8000-000000000003",
    itemId: "41000000-0000-4000-8000-000000000003",
    paymentId: "42000000-0000-4000-8000-000000000003",
    deliveryId: "43000000-0000-4000-8000-000000000003",
    reference: "ojalink-demo-order-accepted-003",
    status: "accepted",
    vendorSlug: "adaeze-fabrics",
    productSlug: "ankara-fabric-6-yards",
    quantity: 2,
    address: "21 Airport Road, by Ekenwan Junction",
    area: "Oredo, Benin City",
    createdAt: new Date("2026-10-27T13:45:00+01:00"),
    paidAt: new Date("2026-10-27T13:49:00+01:00"),
  },
  {
    id: "40000000-0000-4000-8000-000000000004",
    itemId: "41000000-0000-4000-8000-000000000004",
    paymentId: "42000000-0000-4000-8000-000000000004",
    deliveryId: "43000000-0000-4000-8000-000000000004",
    reference: "ojalink-demo-order-rejected-004",
    status: "rejected",
    vendorSlug: "omo-fresh-produce",
    productSlug: "fresh-tomatoes-1kg",
    quantity: 3,
    address: "5 Ekenwan Road, near Iyaro Junction",
    area: "Iyaro, Benin City",
    createdAt: new Date("2026-10-28T08:20:00+01:00"),
  },
  {
    id: "40000000-0000-4000-8000-000000000005",
    itemId: "41000000-0000-4000-8000-000000000005",
    paymentId: "42000000-0000-4000-8000-000000000005",
    deliveryId: "43000000-0000-4000-8000-000000000005",
    reference: "ojalink-demo-order-picked-up-005",
    status: "picked_up",
    vendorSlug: "uselu-home-stores",
    productSlug: "big-bull-rice-5kg",
    quantity: 1,
    address: "32 Ekenwan Road, by Adesuwa Junction",
    area: "Oredo, Benin City",
    createdAt: new Date("2026-10-29T10:05:00+01:00"),
    paidAt: new Date("2026-10-29T10:08:00+01:00"),
    pickedUpAt: new Date("2026-10-29T11:10:00+01:00"),
  },
  {
    id: "40000000-0000-4000-8000-000000000006",
    itemId: "41000000-0000-4000-8000-000000000006",
    paymentId: "42000000-0000-4000-8000-000000000006",
    deliveryId: "43000000-0000-4000-8000-000000000006",
    reference: "ojalink-demo-order-delivered-006",
    status: "delivered",
    vendorSlug: "kingsway-mobile",
    productSlug: "wired-earphones-microphone",
    quantity: 2,
    address: "17 Akpakpava Road, near Oba Market",
    area: "Ring Road, Benin City",
    createdAt: new Date("2026-10-30T14:25:00+01:00"),
    paidAt: new Date("2026-10-30T14:28:00+01:00"),
    pickedUpAt: new Date("2026-10-30T15:05:00+01:00"),
    deliveredAt: new Date("2026-10-30T15:42:00+01:00"),
  },
  {
    // Delivered with a PARTIAL refund: still `delivered` (not `refunded`),
    // totals unchanged; the refund is recorded on the order. Keeps the
    // `refund_kobo <= total_kobo` and `refund_kobo >= 0` checks exercised
    // by a real row.
    id: "40000000-0000-4000-8000-000000000008",
    itemId: "41000000-0000-4000-8000-000000000008",
    paymentId: "42000000-0000-4000-8000-000000000008",
    deliveryId: "43000000-0000-4000-8000-000000000008",
    reference: "ojalink-demo-order-partial-refund-008",
    status: "delivered",
    vendorSlug: "uselu-home-stores",
    productSlug: "big-bull-rice-5kg",
    quantity: 1,
    address: "32 Ekenwan Road, by Adesuwa Junction",
    area: "Oredo, Benin City",
    createdAt: new Date("2026-10-30T17:10:00+01:00"),
    paidAt: new Date("2026-10-30T17:12:00+01:00"),
    pickedUpAt: new Date("2026-10-30T18:05:00+01:00"),
    deliveredAt: new Date("2026-10-30T18:40:00+01:00"),
    refundKobo: 30000, // ₦300 partial refund, well below total_kobo
    refundedAt: new Date("2026-10-31T09:15:00+01:00"),
  },
  {
    id: "40000000-0000-4000-8000-000000000007",
    itemId: "41000000-0000-4000-8000-000000000007",
    paymentId: "42000000-0000-4000-8000-000000000007",
    deliveryId: "43000000-0000-4000-8000-000000000007",
    reference: "ojalink-demo-order-cancelled-007",
    status: "cancelled",
    vendorSlug: "edo-provisions-mart",
    productSlug: "golden-penny-spaghetti-500g",
    quantity: 6,
    address: "3 Upper Sakponba Road, near Ogbelaka Market",
    area: "Sakponba, Benin City",
    createdAt: new Date("2026-10-31T09:00:00+01:00"),
  },
];

try {
  await db.transaction(async (tx) => {
    const [buyer] = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, "buyer@ojalink.test"))
      .limit(1);

    if (!buyer) {
      throw new Error("Seed buyer buyer@ojalink.test was not found. Run the regular seed first.");
    }

    const savedVendors = await tx
      .select({ id: vendors.id, slug: vendors.slug })
      .from(vendors);
    const vendorBySlug = new Map(savedVendors.map((vendor) => [vendor.slug, vendor]));

    for (const sample of orderSamples) {
      const vendor = vendorBySlug.get(sample.vendorSlug);
      if (!vendor) {
        throw new Error(`Seed vendor ${sample.vendorSlug} was not found. Run the regular seed first.`);
      }

      const [product] = await tx
        .select({ id: products.id, name: products.name, priceKobo: products.priceKobo })
        .from(products)
        .where(and(eq(products.vendorId, vendor.id), eq(products.slug, sample.productSlug)))
        .limit(1);

      if (!product) {
        throw new Error(`Seed product ${sample.productSlug} was not found. Run the regular seed first.`);
      }

      const subtotalKobo = product.priceKobo * sample.quantity;
      const deliveryFeeKobo = 30000;
      const platformFeeKobo = 10000;
      const totalKobo = subtotalKobo + deliveryFeeKobo + platformFeeKobo;
      const paymentIsSuccessful = ["paid", "accepted", "picked_up", "delivered"].includes(sample.status);

      await tx
        .insert(orders)
        .values({
          id: sample.id,
          buyerId: buyer.id,
          vendorId: vendor.id,
          deliveryAddress: sample.address,
          deliveryArea: sample.area,
          deliveryFeeKobo,
          platformFeeKobo,
          subtotalKobo,
          totalKobo,
          status: sample.status,
          deliveredAt: sample.deliveredAt,
          refundKobo: sample.refundKobo ?? 0,
          refundedAt: sample.refundedAt,
          createdAt: sample.createdAt,
          updatedAt: sample.createdAt,
        })
        .onConflictDoNothing();

      await tx
        .insert(orderItems)
        .values({
          id: sample.itemId,
          orderId: sample.id,
          productId: product.id,
          productName: product.name,
          unitPriceKobo: product.priceKobo,
          quantity: sample.quantity,
          createdAt: sample.createdAt,
        })
        .onConflictDoNothing();

      await tx
        .insert(payments)
        .values({
          id: sample.paymentId,
          orderId: sample.id,
          paystackReference: sample.reference,
          amountKobo: totalKobo,
          status: paymentIsSuccessful ? "success" : "pending",
          paidAt: sample.paidAt,
          createdAt: sample.createdAt,
          updatedAt: sample.createdAt,
        })
        .onConflictDoNothing();

      if (
        sample.status === "accepted" ||
        sample.status === "picked_up" ||
        sample.status === "delivered"
      ) {
        await tx
          .insert(deliveries)
          .values({
            id: sample.deliveryId,
            orderId: sample.id,
            status: sample.status === "accepted" ? "accepted" : sample.status,
            acceptedAt: sample.status === "accepted" ? sample.createdAt : undefined,
            pickedUpAt: sample.pickedUpAt,
            deliveredAt: sample.deliveredAt,
            createdAt: sample.createdAt,
            updatedAt: sample.createdAt,
          })
          .onConflictDoNothing();
      }
    }
  });

  console.log("Order seed complete: 8 sample orders, one per status plus a delivered order with a partial refund.");
} finally {
  await pool.end();
}
