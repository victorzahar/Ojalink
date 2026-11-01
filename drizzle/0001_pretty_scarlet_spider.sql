CREATE TYPE "public"."payout_status" AS ENUM('unpaid', 'paid');--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'refunded';--> statement-breakpoint
ALTER TYPE "public"."payment_status" ADD VALUE 'refunded';--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"week_start" date NOT NULL,
	"amount_kobo" integer NOT NULL,
	"status" "payout_status" DEFAULT 'unpaid' NOT NULL,
	"paid_at" timestamp with time zone,
	"paid_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payouts_amount_kobo_nonnegative" CHECK ("payouts"."amount_kobo" >= 0),
	CONSTRAINT "payouts_paid_at_when_paid" CHECK ("payouts"."status" <> 'paid' OR "payouts"."paid_at" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivered_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "refund_kobo" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "refunded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_paid_by_users_id_fk" FOREIGN KEY ("paid_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "payouts_vendor_id_week_start_unique" ON "payouts" USING btree ("vendor_id","week_start");--> statement-breakpoint
CREATE INDEX "payouts_vendor_id_idx" ON "payouts" USING btree ("vendor_id");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_refund_kobo_nonnegative" CHECK ("orders"."refund_kobo" >= 0);--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_refund_kobo_not_over_total" CHECK ("orders"."refund_kobo" <= "orders"."total_kobo");--> statement-breakpoint
-- Backfill: mark conversion from the baseline data.
-- Orders already delivered get delivered_at from their last update; refund_kobo
-- defaults to 0, which passes both refund checks for every existing row.
UPDATE "orders" SET "delivered_at" = "updated_at"
WHERE "status" = 'delivered' AND "delivered_at" IS NULL;
