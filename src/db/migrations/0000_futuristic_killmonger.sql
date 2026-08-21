CREATE TYPE "public"."album_type" AS ENUM('album', 'ep', 'single', 'compilation', 'live', 'demo');--> statement-breakpoint
CREATE TABLE "bands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"bio" text,
	"country_code" text,
	"formed_year" integer,
	"dissolved_year" integer,
	"image_url" text,
	"embedding" vector(1536),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bands_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "albums" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"band_id" uuid NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"type" "album_type" DEFAULT 'album' NOT NULL,
	"release_date" date,
	"release_year" integer,
	"cover_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"album_id" uuid NOT NULL,
	"title" text NOT NULL,
	"track_number" integer NOT NULL,
	"disc_number" integer DEFAULT 1 NOT NULL,
	"duration_ms" integer,
	"audio_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "band_genres" (
	"band_id" uuid NOT NULL,
	"genre_id" uuid NOT NULL,
	CONSTRAINT "band_genres_band_id_genre_id_pk" PRIMARY KEY("band_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "genres" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"parent_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "genres_name_unique" UNIQUE("name"),
	CONSTRAINT "genres_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "albums" ADD CONSTRAINT "albums_band_id_bands_id_fk" FOREIGN KEY ("band_id") REFERENCES "public"."bands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "band_genres" ADD CONSTRAINT "band_genres_band_id_bands_id_fk" FOREIGN KEY ("band_id") REFERENCES "public"."bands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "band_genres" ADD CONSTRAINT "band_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bands_name_trgm_idx" ON "bands" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "bands_embedding_idx" ON "bands" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "albums_band_idx" ON "albums" USING btree ("band_id");--> statement-breakpoint
CREATE INDEX "albums_title_trgm_idx" ON "albums" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "albums_band_slug_uq" ON "albums" USING btree ("band_id","slug");--> statement-breakpoint
CREATE INDEX "tracks_album_idx" ON "tracks" USING btree ("album_id");--> statement-breakpoint
CREATE INDEX "tracks_title_trgm_idx" ON "tracks" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "tracks_album_position_uq" ON "tracks" USING btree ("album_id","disc_number","track_number");--> statement-breakpoint
CREATE INDEX "band_genres_genre_idx" ON "band_genres" USING btree ("genre_id");