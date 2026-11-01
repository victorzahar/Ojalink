import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { users } from "@/lib/auth/schema";
export { userRoleEnum } from "@/lib/auth/role";

export { accounts, sessions, users, verifications } from "@/lib/auth/schema";

const createdAt = timestamp("created_at", { withTimezone: true })
  .notNull()
  .defaultNow();

const updatedAt = timestamp("updated_at", { withTimezone: true })
  .notNull()
  .defaultNow()
  .$onUpdate(() => new Date());

export const vendorApprovalStatusEnum = pgEnum("vendor_approval_status", [
  "pending",
  "approved",
  "rejected",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "paid",
  "accepted",
  "rejected",
  "picked_up",
  "delivered",
  "cancelled",
  "refunded",
]);

export const deliveryStatusEnum = pgEnum("delivery_status", [
  "available",
  "accepted",
  "picked_up",
  "delivered",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "success",
  "failed",
  "refunded",
]);

export const payoutStatusEnum = pgEnum("payout_status", [
  "unpaid",
  "paid",
]);

export const disputeStatusEnum = pgEnum("dispute_status", [
  "open",
  "resolved",
  "refunded",
]);

export const markets = pgTable(
  "markets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    area: text("area").notNull(),
    description: text("description"),
    createdAt,
  },
  (table) => [uniqueIndex("markets_slug_unique").on(table.slug)],
);

export const vendors = pgTable(
  "vendors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    marketId: uuid("market_id")
      .notNull()
      .references(() => markets.id, { onDelete: "restrict" }),
    shopName: text("shop_name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    shopImageUrl: text("shop_image_url"),
    approvalStatus: vendorApprovalStatusEnum("approval_status")
      .notNull()
      .default("pending"),
    isFeatured: boolean("is_featured").notNull().default(false),
    createdAt,
  },
  (table) => [
    uniqueIndex("vendors_user_id_unique").on(table.userId),
    uniqueIndex("vendors_slug_unique").on(table.slug),
    index("vendors_market_id_idx").on(table.marketId),
  ],
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    createdAt,
  },
  (table) => [uniqueIndex("categories_slug_unique").on(table.slug)],
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    priceKobo: integer("price_kobo").notNull(),
    stockQuantity: integer("stock_quantity").notNull(),
    imageUrl: text("image_url"),
    isAvailable: boolean("is_available").notNull().default(true),
    createdAt,
  },
  (table) => [
    uniqueIndex("products_vendor_slug_unique").on(table.vendorId, table.slug),
    index("products_vendor_id_idx").on(table.vendorId),
    index("products_category_id_idx").on(table.categoryId),
    check("products_price_kobo_nonnegative", sql`${table.priceKobo} >= 0`),
    check("products_stock_quantity_nonnegative", sql`${table.stockQuantity} >= 0`),
  ],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    buyerId: uuid("buyer_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "restrict" }),
    deliveryAddress: text("delivery_address").notNull(),
    deliveryArea: text("delivery_area").notNull(),
    deliveryFeeKobo: integer("delivery_fee_kobo").notNull(),
    platformFeeKobo: integer("platform_fee_kobo").notNull(),
    subtotalKobo: integer("subtotal_kobo").notNull(),
    totalKobo: integer("total_kobo").notNull(),
    status: orderStatusEnum("status").notNull().default("pending"),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    refundKobo: integer("refund_kobo").notNull().default(0),
    refundedAt: timestamp("refunded_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("orders_buyer_id_idx").on(table.buyerId),
    index("orders_vendor_id_idx").on(table.vendorId),
    check("orders_delivery_fee_kobo_nonnegative", sql`${table.deliveryFeeKobo} >= 0`),
    check("orders_platform_fee_kobo_nonnegative", sql`${table.platformFeeKobo} >= 0`),
    check("orders_subtotal_kobo_nonnegative", sql`${table.subtotalKobo} >= 0`),
    check("orders_total_kobo_nonnegative", sql`${table.totalKobo} >= 0`),
    check("orders_refund_kobo_nonnegative", sql`${table.refundKobo} >= 0`),
    check("orders_refund_kobo_not_over_total", sql`${table.refundKobo} <= ${table.totalKobo}`),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    productName: text("product_name").notNull(),
    unitPriceKobo: integer("unit_price_kobo").notNull(),
    quantity: integer("quantity").notNull(),
    createdAt,
  },
  (table) => [
    index("order_items_order_id_idx").on(table.orderId),
    check("order_items_quantity_positive", sql`${table.quantity} > 0`),
  ],
);

export const deliveries = pgTable(
  "deliveries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "restrict" }),
    riderId: uuid("rider_id").references(() => users.id, {
      onDelete: "set null",
    }),
    status: deliveryStatusEnum("status").notNull().default("available"),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    pickedUpAt: timestamp("picked_up_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("deliveries_order_id_unique").on(table.orderId),
    index("deliveries_rider_id_idx").on(table.riderId),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "restrict" }),
    paystackReference: text("paystack_reference").notNull(),
    amountKobo: integer("amount_kobo").notNull(),
    status: paymentStatusEnum("status").notNull().default("pending"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("payments_paystack_reference_unique").on(table.paystackReference),
    index("payments_order_id_idx").on(table.orderId),
  ],
);

export const payouts = pgTable(
  "payouts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "restrict" }),
    weekStart: date("week_start").notNull(),
    amountKobo: integer("amount_kobo").notNull(),
    status: payoutStatusEnum("status").notNull().default("unpaid"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    paidBy: uuid("paid_by").references(() => users.id, { onDelete: "set null" }),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("payouts_vendor_id_week_start_unique").on(table.vendorId, table.weekStart),
    index("payouts_vendor_id_idx").on(table.vendorId),
    check("payouts_amount_kobo_nonnegative", sql`${table.amountKobo} >= 0`),
    check("payouts_paid_at_when_paid", sql`${table.status} <> 'paid' OR ${table.paidAt} IS NOT NULL`),
  ],
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "restrict" }),
    buyerId: uuid("buyer_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "restrict" }),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    createdAt,
  },
  (table) => [
    uniqueIndex("reviews_order_id_unique").on(table.orderId),
    index("reviews_vendor_id_idx").on(table.vendorId),
    check("reviews_rating_between_one_and_five", sql`${table.rating} BETWEEN 1 AND 5`),
  ],
);

export const disputes = pgTable(
  "disputes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "restrict" }),
    raisedBy: uuid("raised_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    reason: text("reason").notNull(),
    status: disputeStatusEnum("status").notNull().default("open"),
    resolutionNote: text("resolution_note"),
    createdAt,
  },
  (table) => [index("disputes_order_id_idx").on(table.orderId)],
);
