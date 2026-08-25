CREATE TYPE "public"."external_entity" AS ENUM('band', 'album', 'track');--> statement-breakpoint
CREATE TYPE "public"."external_provider" AS ENUM('musicbrainz', 'discogs', 'wikidata', 'spotify', 'youtube', 'bandcamp', 'qobuz', 'deezer');--> statement-breakpoint
CREATE TYPE "public"."contribution_status" AS ENUM('pending', 'evidence_requested', 'approved', 'expired', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."contribution_type" AS ENUM('band_create', 'band_update');--> statement-breakpoint
CREATE TABLE "external_refs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" "external_entity" NOT NULL,
	"entity_id" uuid NOT NULL,
	"provider" "external_provider" NOT NULL,
	"external_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "contribution_type" NOT NULL,
	"status" "contribution_status" DEFAULT 'pending' NOT NULL,
	"payload" jsonb NOT NULL,
	"evidence" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"review_notes" text,
	"submitted_by" uuid NOT NULL,
	"reviewed_by" uuid,
	"reminder_count" integer DEFAULT 0 NOT NULL,
	"deadline_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "external_refs_provider_external_idx" ON "external_refs" USING btree ("provider","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "external_refs_entity_provider_idx" ON "external_refs" USING btree ("entity_type","entity_id","provider");--> statement-breakpoint
CREATE INDEX "external_refs_provider_idx" ON "external_refs" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "contributions_status_idx" ON "contributions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "contributions_submitted_by_idx" ON "contributions" USING btree ("submitted_by");--> statement-breakpoint
CREATE INDEX "contributions_deadline_idx" ON "contributions" USING btree ("deadline_at");