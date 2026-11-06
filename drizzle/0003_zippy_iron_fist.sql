CREATE TYPE "public"."stock_reservation_status" AS ENUM('reserved', 'consumed', 'released');--> statement-breakpoint
CREATE TABLE "stock_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid,
	"quantity" integer NOT NULL,
	"status" "stock_reservation_status" DEFAULT 'reserved' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stock_reservations_quantity_positive" CHECK ("stock_reservations"."quantity" > 0)
);
--> statement-breakpoint
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "stock_reservations_order_product_unique" ON "stock_reservations" USING btree ("order_id","product_id");--> statement-breakpoint
CREATE INDEX "stock_reservations_product_status_expiry_idx" ON "stock_reservations" USING btree ("product_id","status","expires_at");--> statement-breakpoint
CREATE INDEX "stock_reservations_status_expiry_idx" ON "stock_reservations" USING btree ("status","expires_at");