CREATE TYPE "public"."media_outlet_kind" AS ENUM('webzine', 'magazine', 'radio', 'podcast', 'video');--> statement-breakpoint
CREATE TABLE "media_outlets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"kind" "media_outlet_kind" DEFAULT 'webzine' NOT NULL,
	"country_code" text NOT NULL,
	"website_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_outlets_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "media_outlets_country_idx" ON "media_outlets" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "media_outlets_kind_idx" ON "media_outlets" USING btree ("kind");--> statement-breakpoint
CREATE UNIQUE INDEX "media_outlets_country_name_uq" ON "media_outlets" USING btree ("country_code","name");