-- Retrait de « qobuz » de l'énum external_provider.
-- PostgreSQL ne sait pas supprimer une valeur d'énum : le type est
-- recréé et la colonne recastée. Le cast échoue volontairement s'il
-- reste une référence qobuz en base — mieux vaut un échec de migration
-- qu'une donnée silencieusement perdue.
ALTER TABLE "external_refs" ALTER COLUMN "provider" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."external_provider";--> statement-breakpoint
CREATE TYPE "public"."external_provider" AS ENUM('musicbrainz', 'discogs', 'wikidata', 'spotify', 'youtube', 'bandcamp', 'deezer');--> statement-breakpoint
ALTER TABLE "external_refs" ALTER COLUMN "provider" SET DATA TYPE "public"."external_provider" USING "provider"::"public"."external_provider";