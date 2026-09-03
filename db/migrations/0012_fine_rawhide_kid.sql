CREATE TYPE "public"."venue_kind" AS ENUM('festival', 'venue');--> statement-breakpoint
CREATE TABLE "venues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"kind" "venue_kind" DEFAULT 'festival' NOT NULL,
	"country_code" text NOT NULL,
	"city" text,
	"founded_year" integer,
	"ended_year" integer,
	"website_url" text,
	"capacity" integer,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "venues_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "venues_country_idx" ON "venues" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "venues_kind_idx" ON "venues" USING btree ("kind");--> statement-breakpoint
CREATE UNIQUE INDEX "venues_country_name_uq" ON "venues" USING btree ("country_code","name");