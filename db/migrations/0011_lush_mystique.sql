ALTER TYPE "public"."album_type" ADD VALUE 'split';--> statement-breakpoint
CREATE TABLE "album_genres" (
	"album_id" uuid NOT NULL,
	"genre_id" uuid NOT NULL,
	CONSTRAINT "album_genres_album_id_genre_id_pk" PRIMARY KEY("album_id","genre_id")
);
--> statement-breakpoint
ALTER TABLE "album_genres" ADD CONSTRAINT "album_genres_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "album_genres" ADD CONSTRAINT "album_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "album_genres_genre_idx" ON "album_genres" USING btree ("genre_id");