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
import { userRoleEnum } from "@/lib/auth/role";

export { userRoleEnum };

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

export const stockReservationStatusEnum = pgEnum("stock_reservation_status", [
  "reserved",
  "consumed",
  "released",
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

// Verification (KYC) types. Identity evidence itself (NIN numbers, BVN, ID
// images, selfies) is held by the verification provider — this table only ever
// stores a status and a provider reference, never the document data.
export const verificationKindEnum = pgEnum("verification_kind", [
  "phone_otp",
  "nin",
  "id_document",
  "selfie",
  "cac",
  "tin",
  "bank_account",
  "driver_licence",
  "vehicle",
  "shop_evidence",
]);

export const verificationStatusEnum = pgEnum("verification_status", [
  "pending",
  "verified",
  "failed",
]);

export const guarantorOutcomeEnum = pgEnum("guarantor_outcome", [
  "pending",
  "reachable",
  "unreachable",
]);

export const businessTypeEnum = pgEnum("vendor_business_type", [
  "informal",
  "business_name",
  "limited",
]);

export const vehicleTypeEnum = pgEnum("rider_vehicle_type", [
  "motorbike",
  "tricycle",
  "car",
]);

export const verificationAuditActionEnum = pgEnum("verification_audit_action", [
  "approve",
  "reject",
  "guarantor_call",
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
    // Verification fields (Nigeria). Documents are checked by admins or the
    // verification provider and recorded here as facts, never as images.
    stallNumber: text("stall_number"),
    businessType: businessTypeEnum("business_type"),
    cacNumber: text("cac_number"),
    tinNumber: text("tin_number"),
    mapPin: text("map_pin"),
    // First payouts are held until this date (Lagos day). Null = no hold.
    payoutHoldUntil: date("payout_hold_until"),
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

export const carts = pgTable(
  "carts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    buyerId: uuid("buyer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    vendorId: uuid("vendor_id").references(() => vendors.id, {
      onDelete: "set null",
    }),
    createdAt,
    updatedAt,
  },
  (table) => [uniqueIndex("carts_buyer_id_unique").on(table.buyerId)],
);

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cartId: uuid("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("cart_items_cart_product_unique").on(
      table.cartId,
      table.productId,
    ),
    index("cart_items_product_id_idx").on(table.productId),
    check("cart_items_quantity_positive", sql`${table.quantity} > 0`),
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
    // Handover code shown to the buyer, required from the rider to close a
    // delivery. Null on legacy rows created before this column existed.
    confirmationCode: text("confirmation_code"),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("deliveries_order_id_unique").on(table.orderId),
    index("deliveries_rider_id_idx").on(table.riderId),
    check(
      "deliveries_confirmation_code_format",
      sql`${table.confirmationCode} IS NULL OR ${table.confirmationCode} ~ '^[0-9]{4}$'`,
    ),
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
    refundReviewRequired: boolean("refund_review_required").notNull().default(false),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("payments_paystack_reference_unique").on(table.paystackReference),
    index("payments_order_id_idx").on(table.orderId),
  ],
);

export const stockReservations = pgTable(
  "stock_reservations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    quantity: integer("quantity").notNull(),
    status: stockReservationStatusEnum("status").notNull().default("reserved"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("stock_reservations_order_product_unique").on(
      table.orderId,
      table.productId,
    ),
    index("stock_reservations_product_status_expiry_idx").on(
      table.productId,
      table.status,
      table.expiresAt,
    ),
    index("stock_reservations_status_expiry_idx").on(
      table.status,
      table.expiresAt,
    ),
    check("stock_reservations_quantity_positive", sql`${table.quantity} > 0`),
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
    check(
      "payouts_week_start_is_monday",
      sql`extract(isodow from ${table.weekStart}) = 1`,
    ),
  ],
);

export const roleRequestStatuses = ["pending", "approved", "rejected"] as const;

export const roleRequestStatusEnum = pgEnum("role_request_status", roleRequestStatuses);

/**
 * Self-serve role requests (currently rider onboarding). One open request
 * per user; approval grants the requested role through setUserRoleAsAdmin.
 */
export const roleRequests = pgTable(
  "role_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    requestedRole: userRoleEnum("requested_role").notNull(),
    status: roleRequestStatusEnum("status").notNull().default("pending"),
    note: text("note"),
    resolvedBy: uuid("resolved_by").references(() => users.id, { onDelete: "set null" }),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("role_requests_user_id_unique").on(table.userId),
    index("role_requests_status_idx").on(table.status),
    check(
      "role_requests_resolved_by_when_resolved",
      sql`${table.status} = 'pending' OR ${table.resolvedBy} IS NOT NULL`,
    ),
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

/**
 * Nigeria KYC verification records. One row per verification attempt; the
 * latest row per (user, kind) is the current state. Never stores the raw NIN,
 * BVN, ID images or selfies — only provider name, a provider reference and the
 * resulting status (Nigeria Data Protection Act 2023 rule).
 */
export const identityVerifications = pgTable(
  "identity_verifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: verificationKindEnum("kind").notNull(),
    status: verificationStatusEnum("status").notNull().default("pending"),
    provider: text("provider").notNull().default("manual_admin"),
    // Reference at the provider (or a hash for internal OTP codes) — never the
    // document itself.
    providerRef: text("provider_ref"),
    attempts: integer("attempts").notNull().default(0),
    note: text("note"),
    reviewedBy: uuid("reviewed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    checkedAt: timestamp("checked_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("identity_verifications_user_kind_idx").on(table.userId, table.kind),
    index("identity_verifications_status_idx").on(table.status),
    // One verified record per user per kind: re-verification replaces it.
    uniqueIndex("identity_verifications_verified_unique")
      .on(table.userId, table.kind)
      .where(sql`status = 'verified'`),
    check(
      "identity_verifications_attempts_nonnegative",
      sql`${table.attempts} >= 0`,
    ),
    check(
      "identity_verifications_review_when_resolved",
      sql`(${table.status} = 'pending') OR (${table.reviewedBy} IS NOT NULL AND ${table.reviewedAt} IS NOT NULL AND ${table.note} IS NOT NULL)`,
    ),
  ],
);

/** Rider delivery profile. Documents live in identity_verifications. */
export const riders = pgTable(
  "riders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    vehicleType: vehicleTypeEnum("vehicle_type").notNull(),
    plateNumber: text("plate_number").notNull(),
    // Reference for ownership papers or the owner's letter (admin-recorded).
    vehiclePaperRef: text("vehicle_paper_ref"),
    homeMapPin: text("home_map_pin").notNull(),
    emergencyContactName: text("emergency_contact_name").notNull(),
    emergencyContactPhone: text("emergency_contact_phone").notNull(),
    trainingCompletedAt: timestamp("training_completed_at", {
      withTimezone: true,
    }),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("riders_user_id_unique").on(table.userId),
    index("riders_plate_number_idx").on(table.plateNumber),
  ],
);

/** Guarantors: vendors list one, riders list two. Admins record the call. */
export const guarantors = pgTable(
  "guarantors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    relation: text("relation").notNull(),
    outcome: guarantorOutcomeEnum("outcome").notNull().default("pending"),
    calledBy: uuid("called_by").references(() => users.id, {
      onDelete: "set null",
    }),
    calledAt: timestamp("called_at", { withTimezone: true }),
    callNote: text("call_note"),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("guarantors_user_id_idx").on(table.userId),
    check("guarantors_name_not_blank", sql`length(trim(${table.name})) > 0`),
  ],
);

/**
 * Who touched identity data and what they decided. Admin actions on the
 * verification queue and guarantor calls are logged here; the queue itself
 * only ever shows status and references, never document contents.
 */
export const verificationAuditLogs = pgTable(
  "verification_audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    adminId: uuid("admin_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    verificationId: uuid("verification_id").references(
      () => identityVerifications.id,
      { onDelete: "cascade" },
    ),
    guarantorId: uuid("guarantor_id").references(() => guarantors.id, {
      onDelete: "cascade",
    }),
    action: verificationAuditActionEnum("action").notNull(),
    note: text("note"),
    createdAt,
  },
  (table) => [
    index("verification_audit_logs_admin_id_idx").on(table.adminId),
    index("verification_audit_logs_verification_id_idx").on(table.verificationId),
    check(
      "verification_audit_logs_target_present",
      sql`${table.verificationId} IS NOT NULL OR ${table.guarantorId} IS NOT NULL`,
    ),
  ],
);
