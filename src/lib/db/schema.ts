import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
};

export const userRoleEnum = pgEnum("user_role", [
  "buyer",
  "vendor",
  "rider",
  "admin",
]);

export const vendorApprovalStatusEnum = pgEnum("vendor_approval_status", [
  "pending",
  "approved",
  "rejected",
  "suspended",
]);

export const productStatusEnum = pgEnum("product_status", [
  "draft",
  "published",
  "archived",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending_payment",
  "paid",
  "vendor_accepted",
  "vendor_rejected",
  "ready_for_pickup",
  "rider_assigned",
  "picked_up",
  "delivered",
  "cancelled",
  "refunded",
  "disputed",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "initialized",
  "pending",
  "success",
  "failed",
  "abandoned",
  "reversed",
  "refunded",
]);

export const deliveryStatusEnum = pgEnum("delivery_status", [
  "unassigned",
  "assigned",
  "picked_up",
  "delivered",
  "cancelled",
]);

export const reviewStatusEnum = pgEnum("review_status", [
  "published",
  "hidden",
]);

export const disputeStatusEnum = pgEnum("dispute_status", [
  "open",
  "under_review",
  "resolved",
  "closed",
]);

export const payoutStatusEnum = pgEnum("payout_status", [
  "pending",
  "processing",
  "paid",
  "failed",
]);

// Better Auth core tables. The role is the application's authorization source.
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    phone: text("phone"),
    role: userRoleEnum("role").notNull().default("buyer"),
    ...timestamps,
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("sessions_token_unique").on(table.token),
    index("sessions_user_id_idx").on(table.userId),
  ],
);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    idToken: text("id_token"),
    password: text("password"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("accounts_provider_account_unique").on(
      table.providerId,
      table.accountId,
    ),
    index("accounts_user_id_idx").on(table.userId),
  ],
);

export const verifications = pgTable(
  "verifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [index("verifications_identifier_idx").on(table.identifier)],
);

export const markets = pgTable(
  "markets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    area: text("area").notNull(),
    description: text("description"),
    ...timestamps,
  },
  (table) => [uniqueIndex("markets_slug_unique").on(table.slug)],
);

export const vendorProfiles = pgTable(
  "vendor_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    marketId: uuid("market_id").references(() => markets.id, {
      onDelete: "set null",
    }),
    shopName: text("shop_name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    phone: text("phone").notNull(),
    approvalStatus: vendorApprovalStatusEnum("approval_status")
      .notNull()
      .default("pending"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    approvedBy: uuid("approved_by").references(() => users.id, {
      onDelete: "set null",
    }),
    payoutRecipientCode: text("payout_recipient_code"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("vendor_profiles_user_id_unique").on(table.userId),
    uniqueIndex("vendor_profiles_slug_unique").on(table.slug),
    index("vendor_profiles_market_id_idx").on(table.marketId),
    index("vendor_profiles_approval_status_idx").on(table.approvalStatus),
  ],
);

export const riderProfiles = pgTable(
  "rider_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    phone: text("phone").notNull(),
    vehicleDescription: text("vehicle_description"),
    isAvailable: boolean("is_available").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("rider_profiles_user_id_unique").on(table.userId),
    index("rider_profiles_available_idx").on(table.isAvailable),
  ],
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("categories_slug_unique").on(table.slug)],
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendorProfiles.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    priceKobo: integer("price_kobo").notNull(),
    stockQuantity: integer("stock_quantity").notNull().default(0),
    status: productStatusEnum("status").notNull().default("draft"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("products_vendor_slug_unique").on(table.vendorId, table.slug),
    index("products_vendor_id_idx").on(table.vendorId),
    index("products_category_id_idx").on(table.categoryId),
    index("products_status_idx").on(table.status),
  ],
);

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    altText: text("alt_text").notNull(),
    position: integer("position").notNull().default(0),
    ...timestamps,
  },
  (table) => [index("product_images_product_id_idx").on(table.productId)],
);

export const addresses = pgTable(
  "addresses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    recipientName: text("recipient_name").notNull(),
    recipientPhone: text("recipient_phone").notNull(),
    addressLine1: text("address_line_1").notNull(),
    addressLine2: text("address_line_2"),
    area: text("area").notNull(),
    city: text("city").notNull().default("Benin City"),
    state: text("state").notNull().default("Edo"),
    landmark: text("landmark"),
    deliveryInstructions: text("delivery_instructions"),
    isDefault: boolean("is_default").notNull().default(false),
    ...timestamps,
  },
  (table) => [index("addresses_user_id_idx").on(table.userId)],
);

export const carts = pgTable(
  "carts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [uniqueIndex("carts_user_id_unique").on(table.userId)],
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
    unitPriceKobo: integer("unit_price_kobo").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("cart_items_cart_product_unique").on(table.cartId, table.productId),
    index("cart_items_cart_id_idx").on(table.cartId),
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
      .references(() => vendorProfiles.id, { onDelete: "restrict" }),
    deliveryAddress: jsonb("delivery_address").notNull(),
    status: orderStatusEnum("status").notNull().default("pending_payment"),
    subtotalKobo: integer("subtotal_kobo").notNull(),
    deliveryFeeKobo: integer("delivery_fee_kobo").notNull().default(0),
    serviceFeeKobo: integer("service_fee_kobo").notNull().default(0),
    totalKobo: integer("total_kobo").notNull(),
    currency: text("currency").notNull().default("NGN"),
    customerNote: text("customer_note"),
    ...timestamps,
  },
  (table) => [
    index("orders_buyer_created_at_idx").on(table.buyerId, table.createdAt),
    index("orders_vendor_status_idx").on(table.vendorId, table.status),
    index("orders_status_idx").on(table.status),
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
    productImageUrl: text("product_image_url"),
    unitPriceKobo: integer("unit_price_kobo").notNull(),
    quantity: integer("quantity").notNull(),
    ...timestamps,
  },
  (table) => [index("order_items_order_id_idx").on(table.orderId)],
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
    status: paymentStatusEnum("status").notNull().default("initialized"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    gatewayResponse: jsonb("gateway_response"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("payments_order_id_unique").on(table.orderId),
    uniqueIndex("payments_paystack_reference_unique").on(table.paystackReference),
    index("payments_status_idx").on(table.status),
  ],
);

export const orderStatusEvents = pgTable(
  "order_status_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    status: orderStatusEnum("status").notNull(),
    actorId: uuid("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    note: text("note"),
    ...timestamps,
  },
  (table) => [index("order_status_events_order_id_idx").on(table.orderId)],
);

export const deliveries = pgTable(
  "deliveries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "restrict" }),
    riderId: uuid("rider_id").references(() => riderProfiles.id, {
      onDelete: "set null",
    }),
    status: deliveryStatusEnum("status").notNull().default("unassigned"),
    pickupNote: text("pickup_note"),
    assignedAt: timestamp("assigned_at", { withTimezone: true }),
    pickedUpAt: timestamp("picked_up_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("deliveries_order_id_unique").on(table.orderId),
    index("deliveries_rider_status_idx").on(table.riderId, table.status),
    index("deliveries_status_idx").on(table.status),
  ],
);

export const deliveryProofs = pgTable(
  "delivery_proofs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    deliveryId: uuid("delivery_id")
      .notNull()
      .references(() => deliveries.id, { onDelete: "cascade" }),
    imageUrl: text("image_url").notNull(),
    note: text("note"),
    ...timestamps,
  },
  (table) => [index("delivery_proofs_delivery_id_idx").on(table.deliveryId)],
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    buyerId: uuid("buyer_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendorProfiles.id, { onDelete: "restrict" }),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "restrict" }),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    status: reviewStatusEnum("status").notNull().default("published"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("reviews_order_id_unique").on(table.orderId),
    index("reviews_vendor_status_idx").on(table.vendorId, table.status),
  ],
);

export const disputes = pgTable(
  "disputes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "restrict" }),
    openedById: uuid("opened_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    reason: text("reason").notNull(),
    details: text("details").notNull(),
    status: disputeStatusEnum("status").notNull().default("open"),
    adminId: uuid("admin_id").references(() => users.id, {
      onDelete: "set null",
    }),
    resolution: text("resolution"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    refundAmountKobo: integer("refund_amount_kobo"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("disputes_order_id_unique").on(table.orderId),
    index("disputes_status_idx").on(table.status),
  ],
);

export const vendorPayouts = pgTable(
  "vendor_payouts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendorProfiles.id, { onDelete: "restrict" }),
    amountKobo: integer("amount_kobo").notNull(),
    status: payoutStatusEnum("status").notNull().default("pending"),
    providerReference: text("provider_reference"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("vendor_payouts_vendor_status_idx").on(table.vendorId, table.status),
  ],
);
