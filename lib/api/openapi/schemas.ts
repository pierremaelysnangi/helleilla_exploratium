/**
 * Schémas zod annotés pour la documentation OpenAPI.
 * Définit les composants nommés (Error, Band, Album, Track, Genre),
 * l'enveloppe de succès, la pagination et le paramètre UUID.
 */

// Primitives zod ; `.meta({ id })` nomme les schémas dans components
import { z } from "zod";
// Schémas de recherche partagés (source unique avec les routes API)
import {
  bandHitSchema,
  albumHitSchema,
  trackHitSchema,
  globalSearchQuerySchema,
  globalSearchResponseSchema,
} from "@/lib/api/schemas";

// Composant "Error" : corps des réponses d'échec
export const ErrorSchema = z
  .object({
    ok: z.literal(false),
    error: z.string().meta({ example: "Permission refusée." }),
    issues: z
      .array(
        z.object({
          path: z.array(z.union([z.string(), z.number()])),
          message: z.string(),
        }),
      )
      .optional(),
  })
  .meta({ id: "Error" });

/** Enveloppe de succès `{ ok: true, data }` autour d'un schéma donné. */
export function okSchema<T extends z.ZodType>(data: T) {
  return z.object({ ok: z.literal(true), data });
}

// Query de pagination : recherche + limite/décalage avec coercion
export const PaginationQuerySchema = z.object({
  q: z.string().optional().meta({ description: "Recherche plein-texte" }),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// Métadonnées jointes aux listes paginées
export const PaginatedMetaSchema = z.object({
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
});

// Paramètre de chemin `{ id }` : UUID avec exemple
export const UuidParamSchema = z.object({
  id: z
    .string()
    .uuid()
    .meta({ example: "7b5e4850-93fd-48f0-bb37-cd67219015a1" }),
});

// Composant "Band" : entité groupe
export const BandSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().meta({ example: "Necrofrost" }),
    slug: z.string().meta({ example: "necrofrost" }),
    country: z.string().nullable(),
    formedYear: z.number().int().nullable(),
    bio: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .meta({ id: "Band" });

// Composant "Album" : entité album rattachée à un groupe
export const AlbumSchema = z
  .object({
    id: z.string().uuid(),
    bandId: z.string().uuid(),
    title: z.string().meta({ example: "Frozen Depths" }),
    slug: z.string(),
    releaseYear: z.number().int().nullable(),
    coverUrl: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .meta({ id: "Album" });

// Composant "Track" : piste rattachée à un album
export const TrackSchema = z
  .object({
    id: z.string().uuid(),
    albumId: z.string().uuid(),
    title: z.string().meta({ example: "Winterfall" }),
    position: z.number().int().nullable(),
    durationSec: z.number().int().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .meta({ id: "Track" });

// Composant "Genre" : taxonomie des genres musicaux
export const GenreSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().meta({ example: "Black Metal" }),
    slug: z.string(),
  })
  .meta({ id: "Genre" });

// Résultats de recherche : dérivés des schémas partagés de lib/api/schemas.ts
// (source unique, annotés ici pour apparaître dans components OpenAPI)

// Composant "BandHit" : résultat "groupe" de la recherche globale
export const BandHitSchema = bandHitSchema.meta({ id: "BandHit" });
// Composant "AlbumHit" : résultat "album" de la recherche globale
export const AlbumHitSchema = albumHitSchema.meta({ id: "AlbumHit" });
// Composant "TrackHit" : résultat "piste" de la recherche globale
export const TrackHitSchema = trackHitSchema.meta({ id: "TrackHit" });

// Composant "GlobalSearchResponse" : réponse groupée { bands, albums, tracks }
export const GlobalSearchResponseSchema = globalSearchResponseSchema.meta({
  id: "GlobalSearchResponse",
});

// Query de GET /api/search : terme requis + limite par index
export const GlobalSearchQuerySchema = globalSearchQuerySchema;

// --- Endpoints additionnels (genres, slug, audio, revalidate, health) ---

// Composant "BandDetail" : groupe + genres associés (GET détail et by-slug)
export const BandDetailSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    country: z.string().nullable(),
    formedYear: z.number().int().nullable(),
    bio: z.string().nullable(),
    genres: z.array(GenreSchema),
  })
  .meta({ id: "BandDetail" });

// Composant "AlbumDetail" : album + groupe + tracklist ordonnée
// (GET /api/albums/by-slug/{bandSlug}/{albumSlug})
export const AlbumDetailSchema = AlbumSchema.extend({
  band: z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
  }),
  tracks: z.array(TrackSchema),
}).meta({ id: "AlbumDetail" });

// Composant "GenreDetail" : genre + contexte hiérarchique + groupes
// rattachés (GET /api/genres/by-slug/{slug})
export const GenreDetailSchema = GenreSchema.extend({
  parent: GenreSchema.nullable(),
  subgenres: z.array(GenreSchema),
  bands: z.array(BandSchema),
}).meta({ id: "GenreDetail" });

// Corps du PUT /api/bands/{id}/genres : liste complète de genreIds
export const SetBandGenresRequestSchema = z
  .object({ genreIds: z.array(z.string().uuid()).max(20) })
  .meta({ id: "SetBandGenresRequest" });

// Réponse du PUT genres : écho de la synchronisation effectuée
export const BandGenresSyncedSchema = z
  .object({
    bandId: z.string().uuid(),
    genreIds: z.array(z.string().uuid()),
  })
  .meta({ id: "BandGenresSynced" });

// Réponse du POST /api/tracks/{id}/audio : URL présignée + URL publique
export const AudioUploadResponseSchema = z
  .object({
    uploadUrl: z.string().url(),
    audioUrl: z.string().url(),
  })
  .meta({ id: "AudioUploadResponse" });

// Corps du POST /api/tracks/{id}/audio
export const AudioUploadRequestSchema = z.object({
  contentType: z.enum([
    "audio/mpeg",
    "audio/ogg",
    "audio/wav",
    "audio/flac",
    "audio/webm",
  ]),
});

// Corps du POST /api/revalidate : chemin et/ou tag à purger
export const RevalidateRequestSchema = z
  .object({
    path: z.string().optional(),
    tag: z.string().optional(),
  })
  .meta({ id: "RevalidateRequest" });

// Réponse de GET /api/health : statut agrégé des dépendances
export const HealthSchema = z
  .object({
    status: z.enum(["healthy", "degraded"]),
    dependencies: z.record(
      z.string(),
      z.object({
        status: z.enum(["up", "down"]),
        latencyMs: z.number().optional(),
      }),
    ),
  })
  .meta({ id: "Health" });

// --- Contributions & références externes ---

// Référence externe stockée en base (band/album/track -> plateforme)
export const ExternalRefSchema = z
  .object({
    provider: z.enum([
      "musicbrainz",
      "discogs",
      "wikidata",
      "spotify",
      "youtube",
      "bandcamp",
      "qobuz",
      "deezer",
    ]),
    externalId: z.string(),
  })
  .meta({ id: "ExternalRef" });

// Corps du PUT /api/bands/{id}/refs : sync complète des références
export const SetBandRefsRequestSchema = z
  .object({ refs: z.array(ExternalRefSchema).max(8) })
  .meta({ id: "SetBandRefsRequest" });

// Réponse du PUT refs : écho de la synchronisation
export const BandRefsSyncedSchema = z
  .object({
    bandId: z.string().uuid(),
    refs: z.array(ExternalRefSchema),
  })
  .meta({ id: "BandRefsSynced" });

// DTO média agrégé renvoyé par GET /api/bands/{id}/media
export const BandMediaSchema = z
  .object({
    band: z.object({
      id: z.string().uuid(),
      name: z.string(),
      slug: z.string(),
      countryCode: z.string().nullish(),
      formedYear: z.number().int().nullish(),
      dissolvedYear: z.number().int().nullish(),
      bio: z.string().nullish(),
      imageUrl: z.string().nullish(),
    }),
    info: z.object({
      area: z.string().nullish(),
      lifeSpan: z
        .object({
          begin: z.string().nullish(),
          end: z.string().nullish(),
          ended: z.boolean().optional(),
        })
        .nullish(),
      members: z.array(z.object({ id: z.string(), name: z.string() })),
      genres: z.array(z.string()),
      wikidata: z
        .object({
          id: z.string(),
          extract: z.string().optional(),
          imageUrl: z.string().optional(),
        })
        .nullish(),
    }),
    images: z.array(z.object({ provider: z.string(), url: z.string() })),
    links: z.array(
      z.object({ provider: z.string(), label: z.string(), url: z.string() }),
    ),
    previews: z.array(
      z.object({
        title: z.string(),
        artistName: z.string(),
        previewUrl: z.string(),
        coverUrl: z.string().nullish(),
      }),
    ),
    degraded: z.boolean(),
  })
  .meta({ id: "BandMedia" });

// Preuve de contribution : lien vérifiable + note optionnelle
export const EvidenceItemSchema = z
  .object({
    kind: z.enum([
      "official-site",
      "label",
      "press",
      "musicbrainz",
      "discogs",
      "other",
    ]),
    url: z.string(),
    note: z.string().optional(),
  })
  .meta({ id: "EvidenceItem" });

// Corps du POST /api/contributions
export const CreateContributionRequestSchema = z
  .object({
    type: z.enum(["band_create", "band_update"]).default("band_create"),
    targetBandId: z.string().uuid().optional(),
    payload: z.record(z.string(), z.unknown()),
    evidence: z.array(EvidenceItemSchema).min(2).max(20),
  })
  .meta({ id: "CreateContributionRequest" });

// Composant "Contribution" : dossier de contribution
export const ContributionSchema = z
  .object({
    id: z.string().uuid(),
    type: z.enum(["band_create", "band_update"]),
    status: z.enum([
      "pending",
      "evidence_requested",
      "approved",
      "expired",
      "rejected",
    ]),
    payload: z.record(z.string(), z.unknown()),
    evidence: z.array(EvidenceItemSchema),
    reviewNotes: z.string().nullish(),
    reminderCount: z.number().int(),
    deadlineAt: z.string().datetime().nullish(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .meta({ id: "Contribution" });

// Corps du PATCH modérateur (union discriminée)
export const TransitionStatusRequestSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("evidence_requested"),
    reviewNotes: z.string(),
  }),
  z.object({ status: z.literal("approved") }),
  z.object({ status: z.literal("rejected") }),
]);
