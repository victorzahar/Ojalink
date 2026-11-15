CREATE TYPE "public"."vendor_business_type" AS ENUM('informal', 'business_name', 'limited');--> statement-breakpoint
CREATE TYPE "public"."guarantor_outcome" AS ENUM('pending', 'reachable', 'unreachable');--> statement-breakpoint
CREATE TYPE "public"."rider_vehicle_type" AS ENUM('motorbike', 'tricycle', 'car');--> statement-breakpoint
CREATE TYPE "public"."verification_audit_action" AS ENUM('approve', 'reject', 'guarantor_call');--> statement-breakpoint
CREATE TYPE "public"."verification_kind" AS ENUM('phone_otp', 'nin', 'id_document', 'selfie', 'cac', 'tin', 'bank_account', 'driver_licence', 'vehicle', 'shop_evidence');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pending', 'verified', 'failed');--> statement-breakpoint
CREATE TABLE "guarantors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"relation" text NOT NULL,
	"outcome" "guarantor_outcome" DEFAULT 'pending' NOT NULL,
	"called_by" uuid,
	"called_at" timestamp with time zone,
	"call_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guarantors_name_not_blank" CHECK (length(trim("guarantors"."name")) > 0)
);
--> statement-breakpoint
CREATE TABLE "identity_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "verification_kind" NOT NULL,
	"status" "verification_status" DEFAULT 'pending' NOT NULL,
	"provider" text DEFAULT 'manual_admin' NOT NULL,
	"provider_ref" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"note" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"checked_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "identity_verifications_attempts_nonnegative" CHECK ("identity_verifications"."attempts" >= 0),
	CONSTRAINT "identity_verifications_review_when_resolved" CHECK (("identity_verifications"."status" = 'pending') OR ("identity_verifications"."reviewed_by" IS NOT NULL AND "identity_verifications"."reviewed_at" IS NOT NULL AND "identity_verifications"."note" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "riders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"vehicle_type" "rider_vehicle_type" NOT NULL,
	"plate_number" text NOT NULL,
	"vehicle_paper_ref" text,
	"home_map_pin" text NOT NULL,
	"emergency_contact_name" text NOT NULL,
	"emergency_contact_phone" text NOT NULL,
	"training_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"verification_id" uuid,
	"guarantor_id" uuid,
	"action" "verification_audit_action" NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "verification_audit_logs_target_present" CHECK ("verification_audit_logs"."verification_id" IS NOT NULL OR "verification_audit_logs"."guarantor_id" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "deliveries" ADD COLUMN "confirmation_code" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "stall_number" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "business_type" "vendor_business_type";--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "cac_number" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "tin_number" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "map_pin" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "payout_hold_until" date;--> statement-breakpoint
ALTER TABLE "guarantors" ADD CONSTRAINT "guarantors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guarantors" ADD CONSTRAINT "guarantors_called_by_users_id_fk" FOREIGN KEY ("called_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_verifications" ADD CONSTRAINT "identity_verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_verifications" ADD CONSTRAINT "identity_verifications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "riders" ADD CONSTRAINT "riders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_audit_logs" ADD CONSTRAINT "verification_audit_logs_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_audit_logs" ADD CONSTRAINT "verification_audit_logs_verification_id_identity_verifications_id_fk" FOREIGN KEY ("verification_id") REFERENCES "public"."identity_verifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_audit_logs" ADD CONSTRAINT "verification_audit_logs_guarantor_id_guarantors_id_fk" FOREIGN KEY ("guarantor_id") REFERENCES "public"."guarantors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "guarantors_user_id_idx" ON "guarantors" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "identity_verifications_user_kind_idx" ON "identity_verifications" USING btree ("user_id","kind");--> statement-breakpoint
CREATE INDEX "identity_verifications_status_idx" ON "identity_verifications" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "identity_verifications_verified_unique" ON "identity_verifications" USING btree ("user_id","kind") WHERE status = 'verified';--> statement-breakpoint
CREATE UNIQUE INDEX "riders_user_id_unique" ON "riders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "riders_plate_number_idx" ON "riders" USING btree ("plate_number");--> statement-breakpoint
CREATE INDEX "verification_audit_logs_admin_id_idx" ON "verification_audit_logs" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "verification_audit_logs_verification_id_idx" ON "verification_audit_logs" USING btree ("verification_id");--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_confirmation_code_format" CHECK ("deliveries"."confirmation_code" IS NULL OR "deliveries"."confirmation_code" ~ '^[0-9]{4}$');