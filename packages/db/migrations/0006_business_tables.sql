CREATE TABLE IF NOT EXISTS "approval_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"position" integer NOT NULL,
	"approver_role" text NOT NULL,
	"min_budget_minor" bigint
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"mission_id" uuid NOT NULL,
	"cycle" integer DEFAULT 1 NOT NULL,
	"position" integer NOT NULL,
	"approver_role" text NOT NULL,
	"decision" text NOT NULL,
	"comment" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"parent_code" text NOT NULL,
	"name" text NOT NULL,
	"normalized_name" text NOT NULL,
	"kind" text DEFAULT 'site' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mission_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"mission_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"note" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"latitude_e6" integer,
	"longitude_e6" integer,
	"created_offline" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mission_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"mission_id" uuid NOT NULL,
	"user_id" uuid,
	"external_name" text,
	"role" text DEFAULT 'membre' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mission_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"mission_id" uuid NOT NULL,
	"summary" text NOT NULL,
	"results" text,
	"difficulties" text,
	"recommendations" text,
	"submitted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mission_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"mission_id" uuid NOT NULL,
	"from_status" text NOT NULL,
	"to_status" text NOT NULL,
	"event" text NOT NULL,
	"comment" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "missions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"reference" text NOT NULL,
	"title" text NOT NULL,
	"purpose" text NOT NULL,
	"status" text DEFAULT 'BROUILLON' NOT NULL,
	"requester_id" uuid NOT NULL,
	"destination_code" text,
	"destination_location_id" uuid,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"transport_mode" text,
	"notes" text,
	"submitted_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "advances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"mission_id" uuid NOT NULL,
	"beneficiary_id" uuid NOT NULL,
	"amount_minor" bigint NOT NULL,
	"amount_currency" text NOT NULL,
	"fx_rate_to_base" numeric(30, 10) NOT NULL,
	"fx_rate_date" date NOT NULL,
	"amount_base_minor" bigint NOT NULL,
	"paid_on" date NOT NULL,
	"payment_method" text NOT NULL,
	"reference" text,
	"note" text,
	"director_approved" boolean DEFAULT false NOT NULL,
	"reverses_id" uuid,
	"cancelled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "budget_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"mission_id" uuid NOT NULL,
	"category" text NOT NULL,
	"label" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_amount_minor" bigint NOT NULL,
	"unit_amount_currency" text NOT NULL,
	"fx_rate_to_base" numeric(30, 10) NOT NULL,
	"fx_rate_date" date NOT NULL,
	"total_base_minor" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "exchange_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"from_currency" text NOT NULL,
	"to_currency" text NOT NULL,
	"rate" numeric(30, 10) NOT NULL,
	"effective_on" date NOT NULL,
	"source" text DEFAULT 'manuel' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"mission_id" uuid NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"amount_minor" bigint NOT NULL,
	"amount_currency" text NOT NULL,
	"fx_rate_to_base" numeric(30, 10) NOT NULL,
	"fx_rate_date" date NOT NULL,
	"amount_base_minor" bigint NOT NULL,
	"spent_on" date NOT NULL,
	"status" text DEFAULT 'soumise' NOT NULL,
	"out_of_period" boolean DEFAULT false NOT NULL,
	"receipt_missing_reason" text,
	"decided_by" uuid,
	"decided_at" timestamp with time zone,
	"rejection_reason" text,
	"created_offline" boolean DEFAULT false NOT NULL,
	"client_created_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"expense_id" uuid NOT NULL,
	"storage_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"sha256" text NOT NULL,
	"width" integer,
	"height" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reconciliations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"mission_id" uuid NOT NULL,
	"status" text DEFAULT 'ouverte' NOT NULL,
	"base_currency" text NOT NULL,
	"advances_base_minor" bigint DEFAULT 0 NOT NULL,
	"expenses_base_minor" bigint DEFAULT 0 NOT NULL,
	"balance_base_minor" bigint DEFAULT 0 NOT NULL,
	"submitted_by" uuid,
	"submitted_at" timestamp with time zone,
	"settlement_method" text,
	"settlement_reference" text,
	"settled_on" date,
	"validated_by" uuid,
	"validated_at" timestamp with time zone,
	"comment" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "variance_justifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"mission_id" uuid NOT NULL,
	"category" text NOT NULL,
	"justification" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"mission_id" uuid,
	"kind" text NOT NULL,
	"version" integer NOT NULL,
	"storage_key" text NOT NULL,
	"sha256" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"locale" text DEFAULT 'fr' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"user_id" uuid NOT NULL,
	"email" boolean DEFAULT true NOT NULL,
	"whatsapp" boolean DEFAULT false NOT NULL,
	"sms" boolean DEFAULT false NOT NULL,
	"whatsapp_number" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"recipient_id" uuid NOT NULL,
	"channel" text NOT NULL,
	"template" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'en_attente' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"sent_at" timestamp with time zone,
	"read_at" timestamp with time zone,
	"dedupe_key" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"window_started_at" timestamp with time zone NOT NULL,
	"blocked_until" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"plan" text DEFAULT 'essai' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"seats" integer DEFAULT 10 NOT NULL,
	"trial_ends_on" timestamp with time zone,
	"price_minor" bigint,
	"price_currency" text
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "approval_steps" ADD CONSTRAINT "approval_steps_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "approval_steps" ADD CONSTRAINT "approval_steps_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "approval_steps" ADD CONSTRAINT "approval_steps_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "approvals" ADD CONSTRAINT "approvals_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "approvals" ADD CONSTRAINT "approvals_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "approvals" ADD CONSTRAINT "approvals_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "approvals" ADD CONSTRAINT "approvals_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "locations" ADD CONSTRAINT "locations_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "locations" ADD CONSTRAINT "locations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "locations" ADD CONSTRAINT "locations_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mission_events" ADD CONSTRAINT "mission_events_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mission_events" ADD CONSTRAINT "mission_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mission_events" ADD CONSTRAINT "mission_events_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mission_events" ADD CONSTRAINT "mission_events_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mission_participants" ADD CONSTRAINT "mission_participants_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mission_participants" ADD CONSTRAINT "mission_participants_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mission_participants" ADD CONSTRAINT "mission_participants_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mission_participants" ADD CONSTRAINT "mission_participants_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mission_participants" ADD CONSTRAINT "mission_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mission_reports" ADD CONSTRAINT "mission_reports_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mission_reports" ADD CONSTRAINT "mission_reports_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mission_reports" ADD CONSTRAINT "mission_reports_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mission_reports" ADD CONSTRAINT "mission_reports_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mission_status_history" ADD CONSTRAINT "mission_status_history_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mission_status_history" ADD CONSTRAINT "mission_status_history_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mission_status_history" ADD CONSTRAINT "mission_status_history_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mission_status_history" ADD CONSTRAINT "mission_status_history_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "missions" ADD CONSTRAINT "missions_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "missions" ADD CONSTRAINT "missions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "missions" ADD CONSTRAINT "missions_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "missions" ADD CONSTRAINT "missions_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "missions" ADD CONSTRAINT "missions_destination_location_id_locations_id_fk" FOREIGN KEY ("destination_location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "advances" ADD CONSTRAINT "advances_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "advances" ADD CONSTRAINT "advances_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "advances" ADD CONSTRAINT "advances_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "advances" ADD CONSTRAINT "advances_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "advances" ADD CONSTRAINT "advances_beneficiary_id_users_id_fk" FOREIGN KEY ("beneficiary_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "budget_lines" ADD CONSTRAINT "budget_lines_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "budget_lines" ADD CONSTRAINT "budget_lines_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "budget_lines" ADD CONSTRAINT "budget_lines_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "budget_lines" ADD CONSTRAINT "budget_lines_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "expenses" ADD CONSTRAINT "expenses_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "expenses" ADD CONSTRAINT "expenses_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "expenses" ADD CONSTRAINT "expenses_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "expenses" ADD CONSTRAINT "expenses_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "receipts" ADD CONSTRAINT "receipts_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "receipts" ADD CONSTRAINT "receipts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "receipts" ADD CONSTRAINT "receipts_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "receipts" ADD CONSTRAINT "receipts_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_validated_by_users_id_fk" FOREIGN KEY ("validated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "variance_justifications" ADD CONSTRAINT "variance_justifications_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "variance_justifications" ADD CONSTRAINT "variance_justifications_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "variance_justifications" ADD CONSTRAINT "variance_justifications_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "variance_justifications" ADD CONSTRAINT "variance_justifications_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documents" ADD CONSTRAINT "documents_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documents" ADD CONSTRAINT "documents_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documents" ADD CONSTRAINT "documents_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documents" ADD CONSTRAINT "documents_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "approval_steps_org_created_idx" ON "approval_steps" USING btree ("organisation_id","created_at" DESC NULLS LAST) WHERE deleted_at is null;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "approval_steps_org_position_key" ON "approval_steps" USING btree ("organisation_id","position") WHERE deleted_at is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "approvals_org_created_idx" ON "approvals" USING btree ("organisation_id","created_at" DESC NULLS LAST) WHERE deleted_at is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "approvals_org_mission_idx" ON "approvals" USING btree ("organisation_id","mission_id","cycle");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "locations_org_created_idx" ON "locations" USING btree ("organisation_id","created_at" DESC NULLS LAST) WHERE deleted_at is null;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "locations_org_parent_name_key" ON "locations" USING btree ("organisation_id","parent_code","normalized_name") WHERE deleted_at is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mission_events_org_created_idx" ON "mission_events" USING btree ("organisation_id","created_at" DESC NULLS LAST) WHERE deleted_at is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mission_events_org_mission_idx" ON "mission_events" USING btree ("organisation_id","mission_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mission_participants_org_created_idx" ON "mission_participants" USING btree ("organisation_id","created_at" DESC NULLS LAST) WHERE deleted_at is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mission_participants_org_mission_idx" ON "mission_participants" USING btree ("organisation_id","mission_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mission_participants_org_user_idx" ON "mission_participants" USING btree ("organisation_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mission_reports_org_created_idx" ON "mission_reports" USING btree ("organisation_id","created_at" DESC NULLS LAST) WHERE deleted_at is null;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "mission_reports_org_mission_key" ON "mission_reports" USING btree ("organisation_id","mission_id") WHERE deleted_at is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mission_status_history_org_created_idx" ON "mission_status_history" USING btree ("organisation_id","created_at" DESC NULLS LAST) WHERE deleted_at is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mission_status_history_org_mission_idx" ON "mission_status_history" USING btree ("organisation_id","mission_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "missions_org_created_idx" ON "missions" USING btree ("organisation_id","created_at" DESC NULLS LAST) WHERE deleted_at is null;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "missions_org_reference_key" ON "missions" USING btree ("organisation_id","reference");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "missions_org_status_idx" ON "missions" USING btree ("organisation_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "missions_org_dates_idx" ON "missions" USING btree ("organisation_id","start_date","end_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "missions_org_requester_idx" ON "missions" USING btree ("organisation_id","requester_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "advances_org_created_idx" ON "advances" USING btree ("organisation_id","created_at" DESC NULLS LAST) WHERE deleted_at is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "advances_org_mission_idx" ON "advances" USING btree ("organisation_id","mission_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "advances_reverses_key" ON "advances" USING btree ("reverses_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "budget_lines_org_created_idx" ON "budget_lines" USING btree ("organisation_id","created_at" DESC NULLS LAST) WHERE deleted_at is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "budget_lines_org_mission_idx" ON "budget_lines" USING btree ("organisation_id","mission_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "exchange_rates_org_created_idx" ON "exchange_rates" USING btree ("organisation_id","created_at" DESC NULLS LAST) WHERE deleted_at is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "exchange_rates_org_pair_idx" ON "exchange_rates" USING btree ("organisation_id","from_currency","to_currency","effective_on");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expenses_org_created_idx" ON "expenses" USING btree ("organisation_id","created_at" DESC NULLS LAST) WHERE deleted_at is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expenses_org_mission_idx" ON "expenses" USING btree ("organisation_id","mission_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expenses_org_status_idx" ON "expenses" USING btree ("organisation_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "receipts_org_created_idx" ON "receipts" USING btree ("organisation_id","created_at" DESC NULLS LAST) WHERE deleted_at is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "receipts_org_expense_idx" ON "receipts" USING btree ("organisation_id","expense_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reconciliations_org_created_idx" ON "reconciliations" USING btree ("organisation_id","created_at" DESC NULLS LAST) WHERE deleted_at is null;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "reconciliations_org_mission_key" ON "reconciliations" USING btree ("organisation_id","mission_id") WHERE deleted_at is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "variance_justifications_org_created_idx" ON "variance_justifications" USING btree ("organisation_id","created_at" DESC NULLS LAST) WHERE deleted_at is null;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "variance_justifications_org_mission_cat_key" ON "variance_justifications" USING btree ("organisation_id","mission_id","category") WHERE deleted_at is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "documents_org_created_idx" ON "documents" USING btree ("organisation_id","created_at" DESC NULLS LAST) WHERE deleted_at is null;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "documents_org_mission_kind_version_key" ON "documents" USING btree ("organisation_id","mission_id","kind","version");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_preferences_org_created_idx" ON "notification_preferences" USING btree ("organisation_id","created_at" DESC NULLS LAST) WHERE deleted_at is null;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "notification_preferences_org_user_key" ON "notification_preferences" USING btree ("organisation_id","user_id") WHERE deleted_at is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_org_created_idx" ON "notifications" USING btree ("organisation_id","created_at" DESC NULLS LAST) WHERE deleted_at is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_org_status_idx" ON "notifications" USING btree ("organisation_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_org_recipient_idx" ON "notifications" USING btree ("organisation_id","recipient_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "notifications_org_dedupe_key" ON "notifications" USING btree ("organisation_id","dedupe_key") WHERE dedupe_key is not null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_org_created_idx" ON "subscriptions" USING btree ("organisation_id","created_at" DESC NULLS LAST) WHERE deleted_at is null;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_org_key" ON "subscriptions" USING btree ("organisation_id") WHERE deleted_at is null;
--> statement-breakpoint
-- Isolation multi-tenant (ADR-001) et journal d'audit (ADR-004) sur chaque
-- table métier créée par cette migration.
SELECT enable_org_rls('locations');--> statement-breakpoint
SELECT enable_audit('locations');--> statement-breakpoint
SELECT enable_org_rls('approval_steps');--> statement-breakpoint
SELECT enable_audit('approval_steps');--> statement-breakpoint
SELECT enable_org_rls('missions');--> statement-breakpoint
SELECT enable_audit('missions');--> statement-breakpoint
SELECT enable_org_rls('mission_participants');--> statement-breakpoint
SELECT enable_audit('mission_participants');--> statement-breakpoint
SELECT enable_org_rls('mission_status_history');--> statement-breakpoint
SELECT enable_audit('mission_status_history');--> statement-breakpoint
SELECT enable_org_rls('approvals');--> statement-breakpoint
SELECT enable_audit('approvals');--> statement-breakpoint
SELECT enable_org_rls('mission_events');--> statement-breakpoint
SELECT enable_audit('mission_events');--> statement-breakpoint
SELECT enable_org_rls('mission_reports');--> statement-breakpoint
SELECT enable_audit('mission_reports');--> statement-breakpoint
SELECT enable_org_rls('exchange_rates');--> statement-breakpoint
SELECT enable_audit('exchange_rates');--> statement-breakpoint
SELECT enable_org_rls('budget_lines');--> statement-breakpoint
SELECT enable_audit('budget_lines');--> statement-breakpoint
SELECT enable_org_rls('advances');--> statement-breakpoint
SELECT enable_audit('advances');--> statement-breakpoint
SELECT enable_org_rls('expenses');--> statement-breakpoint
SELECT enable_audit('expenses');--> statement-breakpoint
SELECT enable_org_rls('receipts');--> statement-breakpoint
SELECT enable_audit('receipts');--> statement-breakpoint
SELECT enable_org_rls('variance_justifications');--> statement-breakpoint
SELECT enable_audit('variance_justifications');--> statement-breakpoint
SELECT enable_org_rls('reconciliations');--> statement-breakpoint
SELECT enable_audit('reconciliations');--> statement-breakpoint
SELECT enable_org_rls('documents');--> statement-breakpoint
SELECT enable_audit('documents');--> statement-breakpoint
SELECT enable_org_rls('notifications');--> statement-breakpoint
SELECT enable_audit('notifications');--> statement-breakpoint
SELECT enable_org_rls('notification_preferences');--> statement-breakpoint
SELECT enable_audit('notification_preferences');--> statement-breakpoint
SELECT enable_org_rls('subscriptions');--> statement-breakpoint
SELECT enable_audit('subscriptions');--> statement-breakpoint
-- Écriture du journal hors contexte d'organisation (flux système : création
-- d'organisation, acceptation d'invitation, scripts de seed). Dans un contexte
-- `withTenant`, la politique `org_isolation` impose toujours l'organisation
-- courante ; hors contexte, le déclencheur d'audit peut écrire pour la ligne
-- concernée. La lecture reste strictement cloisonnée.
CREATE POLICY audit_system_insert ON audit_log FOR INSERT
  WITH CHECK (NULLIF(current_setting('app.current_org', true), '') IS NULL);--> statement-breakpoint
-- Dette B1.9 : les changements de rôle et les invitations sont désormais
-- journalisés (ces tables portent organisation_id, sans RLS : elles
-- précèdent le choix d'une organisation).
SELECT enable_audit('memberships');--> statement-breakpoint
SELECT enable_audit('invitations');
