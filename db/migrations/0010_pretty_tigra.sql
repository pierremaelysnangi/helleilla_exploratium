CREATE TABLE "press_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"album_id" uuid NOT NULL,
	"outlet" text NOT NULL,
	"author" text,
	"score" integer,
	"url" text NOT NULL,
	"published_at" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "press_reviews_score_range" CHECK ("press_reviews"."score" BETWEEN 0 AND 100)
);
--> statement-breakpoint
ALTER TABLE "press_reviews" ADD CONSTRAINT "press_reviews_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "press_reviews_album_idx" ON "press_reviews" USING btree ("album_id");--> statement-breakpoint
CREATE UNIQUE INDEX "press_reviews_album_outlet_uq" ON "press_reviews" USING btree ("album_id","outlet");