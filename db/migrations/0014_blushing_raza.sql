CREATE TABLE "forum_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"band_id" uuid,
	"album_id" uuid,
	"user_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "forum_posts_one_subject" CHECK (num_nonnulls("forum_posts"."band_id", "forum_posts"."album_id") = 1),
	CONSTRAINT "forum_posts_body_length" CHECK (char_length("forum_posts"."body") BETWEEN 10 AND 4000)
);
--> statement-breakpoint
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_band_id_bands_id_fk" FOREIGN KEY ("band_id") REFERENCES "public"."bands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "forum_posts_band_idx" ON "forum_posts" USING btree ("band_id");--> statement-breakpoint
CREATE INDEX "forum_posts_album_idx" ON "forum_posts" USING btree ("album_id");--> statement-breakpoint
CREATE INDEX "forum_posts_recent_idx" ON "forum_posts" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "forum_posts_user_idx" ON "forum_posts" USING btree ("user_id");