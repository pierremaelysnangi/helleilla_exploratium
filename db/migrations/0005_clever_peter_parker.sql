CREATE TYPE "public"."collection_status" AS ENUM('owned', 'wanted');--> statement-breakpoint
CREATE TABLE "labels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"country_code" text,
	"founded_year" integer,
	"website_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "labels_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "album_lineups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"album_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"role" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "band_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"band_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"role" text,
	"joined_year" integer,
	"left_year" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"bio" text,
	"musicbrainz_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "members_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "ratings" (
	"user_id" text NOT NULL,
	"album_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ratings_user_id_album_id_pk" PRIMARY KEY("user_id","album_id"),
	CONSTRAINT "ratings_score_range" CHECK ("ratings"."score" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE TABLE "user_albums" (
	"user_id" text NOT NULL,
	"album_id" uuid NOT NULL,
	"status" "collection_status" DEFAULT 'owned' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_albums_user_id_album_id_pk" PRIMARY KEY("user_id","album_id")
);
--> statement-breakpoint
ALTER TABLE "albums" ADD COLUMN "label_id" uuid;--> statement-breakpoint
ALTER TABLE "album_lineups" ADD CONSTRAINT "album_lineups_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "album_lineups" ADD CONSTRAINT "album_lineups_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "band_members" ADD CONSTRAINT "band_members_band_id_bands_id_fk" FOREIGN KEY ("band_id") REFERENCES "public"."bands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "band_members" ADD CONSTRAINT "band_members_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_albums" ADD CONSTRAINT "user_albums_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "labels_name_idx" ON "labels" USING btree ("name");--> statement-breakpoint
CREATE INDEX "album_lineups_album_idx" ON "album_lineups" USING btree ("album_id");--> statement-breakpoint
CREATE INDEX "album_lineups_member_idx" ON "album_lineups" USING btree ("member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "album_lineups_uq" ON "album_lineups" USING btree ("album_id","member_id","role");--> statement-breakpoint
CREATE INDEX "band_members_band_idx" ON "band_members" USING btree ("band_id");--> statement-breakpoint
CREATE INDEX "band_members_member_idx" ON "band_members" USING btree ("member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "band_members_period_uq" ON "band_members" USING btree ("band_id","member_id","joined_year");--> statement-breakpoint
CREATE UNIQUE INDEX "members_musicbrainz_uq" ON "members" USING btree ("musicbrainz_id");--> statement-breakpoint
CREATE INDEX "ratings_album_idx" ON "ratings" USING btree ("album_id");--> statement-breakpoint
CREATE INDEX "user_albums_user_idx" ON "user_albums" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "albums" ADD CONSTRAINT "albums_label_id_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."labels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "albums_label_idx" ON "albums" USING btree ("label_id");