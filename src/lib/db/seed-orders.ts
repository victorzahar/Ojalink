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
  // Set to "available" for an accepted order that is waiting for a rider.
  // Leave it out to keep the original behaviour (delivery follows the order status).
  deliveryStatus?: "available";
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
  {
    // Delivered LAST WEEK (before the current payout week): lands in the
    //Africa/Lagos week starting Monday 2026-10-19, so the delivered orders
    // page and payout grouping have two different weeks to show.
    id: "40000000-0000-4000-8000-000000000009",
    itemId: "41000000-0000-4000-8000-000000000009",
    paymentId: "42000000-0000-4000-8000-000000000009",
    deliveryId: "43000000-0000-4000-8000-000000000009",
    reference: "ojalink-demo-order-delivered-lastweek-009",
    status: "delivered",
    vendorSlug: "kingsway-mobile",
    productSlug: "wired-earphones-microphone",
    quantity: 1,
    address: "17 Akpakpava Road, near Oba Market",
    area: "Ring Road, Benin City",
    createdAt: new Date("2026-10-22T10:05:00+01:00"),
    paidAt: new Date("2026-10-22T10:08:00+01:00"),
    pickedUpAt: new Date("2026-10-22T11:30:00+01:00"),
    deliveredAt: new Date("2026-10-22T12:40:00+01:00"),
  },
  {
    // this sample tests that weeks are grouped in Africa/Lagos time:
    // delivered_at is Monday 00:30 Lagos (+01:00), which is Sunday 23:30 UTC,
    // so a UTC-based week grouping would put it in the PREVIOUS week while
    // Lagos time correctly starts the week of Monday 2026-10-26.
    id: "40000000-0000-4000-8000-000000000010",
    itemId: "41000000-0000-4000-8000-000000000010",
    paymentId: "42000000-0000-4000-8000-000000000010",
    deliveryId: "43000000-0000-4000-8000-000000000010",
    reference: "ojalink-demo-order-delivered-lagos-week-010",
    status: "delivered",
    vendorSlug: "uselu-home-stores",
    productSlug: "big-bull-rice-5kg",
    quantity: 2,
    address: "32 Ekenwan Road, by Adesuwa Junction",
    area: "Oredo, Benin City",
    createdAt: new Date("2026-10-25T18:50:00+01:00"),
    paidAt: new Date("2026-10-25T18:52:00+01:00"),
    pickedUpAt: new Date("2026-10-25T19:40:00+01:00"),
    deliveredAt: new Date("2026-10-26T00:30:00+01:00"),
  },
  {
    // Rider app sample: the vendor accepted this paid order and its delivery is
    // `available` with no rider, so a job shows on /rider without the Paystack
    // webhook. A rider who accepts it moves the delivery to `accepted`.
    id: "40000000-0000-4000-8000-000000000011",
    itemId: "41000000-0000-4000-8000-000000000011",
    paymentId: "42000000-0000-4000-8000-000000000011",
    deliveryId: "43000000-0000-4000-8000-000000000011",
    reference: "ojalink-demo-order-accepted-available-011",
    status: "accepted",
    deliveryStatus: "available",
    vendorSlug: "uselu-home-stores",
    productSlug: "big-bull-rice-5kg",
    quantity: 1,
    address: "11 Ugbowo-Lagos Road, near the University of Benin gate",
    area: "Ugbowo, Benin City",
    createdAt: new Date("2026-11-01T10:20:00+01:00"),
    paidAt: new Date("2026-11-01T10:23:00+01:00"),
  },
  // Delivered orders for every vendor that had none, so payouts QA (PR #14
  // record) can run tests 2, 3 and 6 against any test vendor. The two week
  // edge samples keep deliveredAt on the exact boundary times: Monday 00:30
  // Lagos belongs to the new week, Sunday 23:59 Lagos to the previous one.
  {
    // adaeze-fabrics - delivered just after the Lagos week edge (Monday 00:30).
    id: "40000000-0000-4000-8000-000000000012",
    itemId: "41000000-0000-4000-8000-000000000012",
    paymentId: "42000000-0000-4000-8000-000000000012",
    deliveryId: "43000000-0000-4000-8000-000000000012",
    reference: "ojalink-demo-order-delivered-monday-edge-012",
    status: "delivered",
    vendorSlug: "adaeze-fabrics",
    productSlug: "ankara-fabric-6-yards",
    quantity: 1,
    address: "3 Sokponba Road, by the fabric line",
    area: "Sokponba, Benin City",
    createdAt: new Date("2026-10-25T19:20:00+01:00"),
    paidAt: new Date("2026-10-25T19:23:00+01:00"),
    pickedUpAt: new Date("2026-10-25T23:05:00+01:00"),
    deliveredAt: new Date("2026-10-26T00:30:00+01:00"),
  },
  {
    // adaeze-fabrics - delivered one minute before the Lagos week ends.
    id: "40000000-0000-4000-8000-000000000013",
    itemId: "41000000-0000-4000-8000-000000000013",
    paymentId: "42000000-0000-4000-8000-000000000013",
    deliveryId: "43000000-0000-4000-8000-000000000013",
    reference: "ojalink-demo-order-delivered-sunday-edge-013",
    status: "delivered",
    vendorSlug: "adaeze-fabrics",
    productSlug: "french-lace-fabric-5-yards",
    quantity: 1,
    address: "Adesuwa Street, opposite the golf course",
    area: "GRA, Benin City",
    createdAt: new Date("2026-10-25T15:40:00+01:00"),
    paidAt: new Date("2026-10-25T15:43:00+01:00"),
    pickedUpAt: new Date("2026-10-25T22:30:00+01:00"),
    deliveredAt: new Date("2026-10-25T23:59:00+01:00"),
  },
  {
    // adaeze-fabrics - delivered with a partial refund (₦500 of ₦6,900).
    id: "40000000-0000-4000-8000-000000000014",
    itemId: "41000000-0000-4000-8000-000000000014",
    paymentId: "42000000-0000-4000-8000-000000000014",
    deliveryId: "43000000-0000-4000-8000-000000000014",
    reference: "ojalink-demo-order-delivered-partial-refund-014",
    status: "delivered",
    vendorSlug: "adaeze-fabrics",
    productSlug: "plain-pattern-adire-6-yards",
    quantity: 1,
    address: "18 Ekosodin Road",
    area: "Ekosodin, Benin City",
    createdAt: new Date("2026-10-30T12:10:00+01:00"),
    paidAt: new Date("2026-10-30T12:13:00+01:00"),
    pickedUpAt: new Date("2026-10-30T16:45:00+01:00"),
    deliveredAt: new Date("2026-10-30T18:30:00+01:00"),
    refundKobo: 50000,
    refundedAt: new Date("2026-10-30T20:15:00+01:00"),
  },
  {
    // benin-gadget-hub - delivered just after the Lagos week edge.
    id: "40000000-0000-4000-8000-000000000015",
    itemId: "41000000-0000-4000-8000-000000000015",
    paymentId: "42000000-0000-4000-8000-000000000015",
    deliveryId: "43000000-0000-4000-8000-000000000015",
    reference: "ojalink-demo-order-delivered-monday-edge-015",
    status: "delivered",
    vendorSlug: "benin-gadget-hub",
    productSlug: "oraimo-20000mah-power-bank",
    quantity: 1,
    address: "Ring Road by Aduwawa junction",
    area: "Aduwawa, Benin City",
    createdAt: new Date("2026-10-25T19:34:00+01:00"),
    paidAt: new Date("2026-10-25T19:37:00+01:00"),
    pickedUpAt: new Date("2026-10-25T23:12:00+01:00"),
    deliveredAt: new Date("2026-10-26T00:30:00+01:00"),
  },
  {
    // benin-gadget-hub - delivered one minute before the Lagos week ends.
    id: "40000000-0000-4000-8000-000000000016",
    itemId: "41000000-0000-4000-8000-000000000016",
    paymentId: "42000000-0000-4000-8000-000000000016",
    deliveryId: "43000000-0000-4000-8000-000000000016",
    reference: "ojalink-demo-order-delivered-sunday-edge-016",
    status: "delivered",
    vendorSlug: "benin-gadget-hub",
    productSlug: "usb-c-fast-charger-20w",
    quantity: 1,
    address: "2 Ihama Road, by the museum",
    area: "GRA, Benin City",
    createdAt: new Date("2026-10-25T15:52:00+01:00"),
    paidAt: new Date("2026-10-25T15:55:00+01:00"),
    pickedUpAt: new Date("2026-10-25T22:38:00+01:00"),
    deliveredAt: new Date("2026-10-25T23:59:00+01:00"),
  },
  {
    // benin-gadget-hub - delivered with a partial refund (₦1,000 of ₦28,400).
    id: "40000000-0000-4000-8000-000000000017",
    itemId: "41000000-0000-4000-8000-000000000017",
    paymentId: "42000000-0000-4000-8000-000000000017",
    deliveryId: "43000000-0000-4000-8000-000000000017",
    reference: "ojalink-demo-order-delivered-partial-refund-017",
    status: "delivered",
    vendorSlug: "benin-gadget-hub",
    productSlug: "infinix-smart-9-128gb",
    quantity: 1,
    address: "Sapele Road, near the motor park",
    area: "Sapele Road, Benin City",
    createdAt: new Date("2026-10-30T12:24:00+01:00"),
    paidAt: new Date("2026-10-30T12:27:00+01:00"),
    pickedUpAt: new Date("2026-10-30T16:52:00+01:00"),
    deliveredAt: new Date("2026-10-30T18:34:00+01:00"),
    refundKobo: 100000,
    refundedAt: new Date("2026-10-30T20:24:00+01:00"),
  },
  {
    // edo-provisions-mart - delivered just after the Lagos week edge.
    id: "40000000-0000-4000-8000-000000000018",
    itemId: "41000000-0000-4000-8000-000000000018",
    paymentId: "42000000-0000-4000-8000-000000000018",
    deliveryId: "43000000-0000-4000-8000-000000000018",
    reference: "ojalink-demo-order-delivered-monday-edge-018",
    status: "delivered",
    vendorSlug: "edo-provisions-mart",
    productSlug: "mama-pride-parboiled-rice-5kg",
    quantity: 1,
    address: "Ugbowo Lagos Road, by the UNIBEN second gate",
    area: "Ugbowo, Benin City",
    createdAt: new Date("2026-10-25T19:48:00+01:00"),
    paidAt: new Date("2026-10-25T19:51:00+01:00"),
    pickedUpAt: new Date("2026-10-25T23:19:00+01:00"),
    deliveredAt: new Date("2026-10-26T00:30:00+01:00"),
  },
  {
    // edo-provisions-mart - delivered one minute before the Lagos week ends.
    id: "40000000-0000-4000-8000-000000000019",
    itemId: "41000000-0000-4000-8000-000000000019",
    paymentId: "42000000-0000-4000-8000-000000000019",
    deliveryId: "43000000-0000-4000-8000-000000000019",
    reference: "ojalink-demo-order-delivered-sunday-edge-019",
    status: "delivered",
    vendorSlug: "edo-provisions-mart",
    productSlug: "golden-penny-spaghetti-500g",
    quantity: 1,
    address: "Upper Sakponba, by the market gate",
    area: "Upper Sakponba, Benin City",
    createdAt: new Date("2026-10-25T16:04:00+01:00"),
    paidAt: new Date("2026-10-25T16:07:00+01:00"),
    pickedUpAt: new Date("2026-10-25T22:46:00+01:00"),
    deliveredAt: new Date("2026-10-25T23:59:00+01:00"),
  },
  {
    // edo-provisions-mart - delivered with a partial refund (₦2,000 of ₦13,900).
    id: "40000000-0000-4000-8000-000000000020",
    itemId: "41000000-0000-4000-8000-000000000020",
    paymentId: "42000000-0000-4000-8000-000000000020",
    deliveryId: "43000000-0000-4000-8000-000000000020",
    reference: "ojalink-demo-order-delivered-partial-refund-020",
    status: "delivered",
    vendorSlug: "edo-provisions-mart",
    productSlug: "peak-milk-refill-400g",
    quantity: 1,
    address: "9 Siluko Road",
    area: "Siluko, Benin City",
    createdAt: new Date("2026-10-30T12:38:00+01:00"),
    paidAt: new Date("2026-10-30T12:41:00+01:00"),
    pickedUpAt: new Date("2026-10-30T16:59:00+01:00"),
    deliveredAt: new Date("2026-10-30T18:38:00+01:00"),
    refundKobo: 200000,
    refundedAt: new Date("2026-10-30T20:33:00+01:00"),
  },
  {
    // omo-fresh-produce - delivered just after the Lagos week edge.
    id: "40000000-0000-4000-8000-000000000021",
    itemId: "41000000-0000-4000-8000-000000000021",
    paymentId: "42000000-0000-4000-8000-000000000021",
    deliveryId: "43000000-0000-4000-8000-000000000021",
    reference: "ojalink-demo-order-delivered-monday-edge-021",
    status: "delivered",
    vendorSlug: "omo-fresh-produce",
    productSlug: "sweet-oranges-1kg",
    quantity: 1,
    address: "Ekenwan Road, by the campus gate",
    area: "Ekenwan, Benin City",
    createdAt: new Date("2026-10-25T20:02:00+01:00"),
    paidAt: new Date("2026-10-25T20:05:00+01:00"),
    pickedUpAt: new Date("2026-10-25T23:26:00+01:00"),
    deliveredAt: new Date("2026-10-26T00:30:00+01:00"),
  },
  {
    // omo-fresh-produce - delivered one minute before the Lagos week ends.
    id: "40000000-0000-4000-8000-000000000022",
    itemId: "41000000-0000-4000-8000-000000000022",
    paymentId: "42000000-0000-4000-8000-000000000022",
    deliveryId: "43000000-0000-4000-8000-000000000022",
    reference: "ojalink-demo-order-delivered-sunday-edge-022",
    status: "delivered",
    vendorSlug: "omo-fresh-produce",
    productSlug: "fresh-tomatoes-1kg",
    quantity: 1,
    address: "Ram Park, New Benin",
    area: "New Benin, Benin City",
    createdAt: new Date("2026-10-25T16:18:00+01:00"),
    paidAt: new Date("2026-10-25T16:21:00+01:00"),
    pickedUpAt: new Date("2026-10-25T22:54:00+01:00"),
    deliveredAt: new Date("2026-10-25T23:59:00+01:00"),
  },
  {
    // omo-fresh-produce - delivered with a partial refund (₦500 of ₦2,600).
    id: "40000000-0000-4000-8000-000000000023",
    itemId: "41000000-0000-4000-8000-000000000023",
    paymentId: "42000000-0000-4000-8000-000000000023",
    deliveryId: "43000000-0000-4000-8000-000000000023",
    reference: "ojalink-demo-order-delivered-partial-refund-023",
    status: "delivered",
    vendorSlug: "omo-fresh-produce",
    productSlug: "fresh-pepper-mix-500g",
    quantity: 1,
    address: "12 Oba Market Road",
    area: "Oba Market, Benin City",
    createdAt: new Date("2026-10-30T12:52:00+01:00"),
    paidAt: new Date("2026-10-30T12:55:00+01:00"),
    pickedUpAt: new Date("2026-10-30T17:06:00+01:00"),
    deliveredAt: new Date("2026-10-30T18:42:00+01:00"),
    refundKobo: 50000,
    refundedAt: new Date("2026-10-30T20:42:00+01:00"),
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
            status:
              sample.deliveryStatus ?? (sample.status === "accepted" ? "accepted" : sample.status),
            // No rider has accepted an `available` delivery yet, so no acceptedAt.
            acceptedAt:
              sample.status === "accepted" && !sample.deliveryStatus ? sample.createdAt : undefined,
            pickedUpAt: sample.pickedUpAt,
            deliveredAt: sample.deliveredAt,
            createdAt: sample.createdAt,
            updatedAt: sample.createdAt,
          })
          .onConflictDoNothing();
      }
    }
  });

  console.log("Order seed complete: 23 sample orders, one per status plus delivered orders (last week, both Lagos-time week edges, and a partial refund) for every vendor, and one accepted order with an available delivery for the rider app.");
} finally {
  await pool.end();
}
