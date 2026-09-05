/**
 * Schémas zod des réponses API consommées côté client (hooks TanStack
 * Query). Miroir JSON des lignes Drizzle (`db/schema/*`) : les champs
 * `Date`/`timestamp` arrivent en chaînes ISO et les clés inconnues sont
 * ignorées par défaut (comportement non-strict de zod).
 * Toute évolution du schéma DB exposée via l'API doit être répercutée ici.
 */

// Validation de schéma côté client
import { z } from "zod";
// Enveloppe paginée partagée avec le serveur (source unique)
import { paginatedSchema } from "@/lib/api/schemas";

/** Ligne "band" sérialisée telle que renvoyée par GET /api/bands[/:id]. */
export const bandRowSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  bio: z.string().nullable().optional(),
  countryCode: z.string().nullable().optional(),
  formedYear: z.number().int().nullable().optional(),
  dissolvedYear: z.number().int().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  /** Thèmes des textes du groupe (donnée éditoriale, pas de source API). */
  themes: z.array(z.string()).nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** Ligne "album" sérialisée telle que renvoyée par GET /api/albums[/:id]. */
export const albumRowSchema = z.object({
  id: z.uuid(),
  bandId: z.uuid(),
  title: z.string(),
  slug: z.string(),
  // `split` : sortie partagée entre plusieurs groupes, distincte d'un
  // album studio — l'y ranger attribuerait à un groupe une œuvre qui
  // n'est pas la sienne seule.
  type: z.enum([
    "album",
    "ep",
    "single",
    "compilation",
    "live",
    "demo",
    "split",
  ]),
  releaseDate: z.string().nullable().optional(),
  releaseYear: z.number().int().nullable().optional(),
  coverUrl: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** Ligne "track" sérialisée telle que renvoyée par GET /api/tracks[/:id]. */
export const trackRowSchema = z.object({
  id: z.uuid(),
  albumId: z.uuid(),
  title: z.string(),
  trackNumber: z.number().int(),
  discNumber: z.number().int(),
  durationMs: z.number().int().nullable().optional(),
  audioUrl: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** Ligne "genre" sérialisée telle que renvoyée par GET /api/genres[/:id]. */
export const genreRowSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  parentId: z.uuid().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** Réponse paginée standard `{ data: T[], meta: {...} }` déballée par apiJson. */
export function paginatedRows<T extends z.ZodTypeAny>(row: T) {
  return paginatedSchema(row);
}

// Types inférés utilisés par les hooks et les composants clients
export type BandRow = z.infer<typeof bandRowSchema>;
export type AlbumRow = z.infer<typeof albumRowSchema>;
export type TrackRow = z.infer<typeof trackRowSchema>;
export type GenreRow = z.infer<typeof genreRowSchema>;

/** Métadonnées de pagination jointes aux réponses de liste. */
export type PaginationMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

/** Paramètres de filtre/tri d'une liste (query params des routes GET). */
export type ListParams = {
  page?: number;
  perPage?: number;
  q?: string;
};

/** Genre résumé projeté dans le détail groupe ({id,name,slug}). */
export const genreSummarySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
});

/** Détail public d'un groupe : ligne + genres associés (GET by-slug / :id). */
export const bandDetailSchema = bandRowSchema.extend({
  genres: z.array(genreSummarySchema),
});

export type BandDetail = z.infer<typeof bandDetailSchema>;
export type GenreSummary = z.infer<typeof genreSummarySchema>;

/** Groupe résumé projeté dans le détail album ({id,name,slug}). */
export const bandSummarySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  /**
   * Visuel du groupe — photo des musiciens ou logo officiel.
   *
   * Sert de REPLI aux pochettes absentes : une part des démos et des
   * captations live n'a aucun visuel archivé, et le pictogramme neutre
   * ne dit rien du groupe. Le visuel du groupe, lui, l'identifie.
   */
  imageUrl: z.string().nullish(),
});

/**
 * Détail public d'un album : ligne + groupe + tracklist ordonnée
 * (GET /api/albums/by-slug/:bandSlug/:albumSlug).
 */
/**
 * Ligne d'album telle que renvoyée par GET /api/albums : la ligne, plus
 * le groupe qui signe la sortie. Sans lui, l'URL canonique d'un album
 * (band-scopée) ne peut pas être construite côté client.
 */
export const albumListItemSchema = albumRowSchema.extend({
  band: bandSummarySchema,
});

export type AlbumListItem = z.infer<typeof albumListItemSchema>;

export const albumDetailSchema = albumRowSchema.extend({
  band: bandSummarySchema,
  tracks: z.array(trackRowSchema),
});

/**
 * Détail public d'un genre : ligne + contexte hiérarchique + groupes
 * rattachés (GET /api/genres/by-slug/:slug).
 */
export const genreDetailSchema = genreRowSchema.extend({
  parent: genreSummarySchema.nullable(),
  subgenres: z.array(genreSummarySchema),
  bands: z.array(bandRowSchema),
});

export type BandSummary = z.infer<typeof bandSummarySchema>;
export type AlbumDetail = z.infer<typeof albumDetailSchema>;
export type GenreDetail = z.infer<typeof genreDetailSchema>;

/** Statuts du workflow de médiation (enum PostgreSQL `contribution_status`). */
export const contributionStatusSchema = z.enum([
  "pending",
  "evidence_requested",
  "approved",
  "expired",
  "rejected",
]);

/** Une preuve telle que stockée dans le dossier. */
export const evidenceRowSchema = z.object({
  kind: z.enum([
    "official-site",
    "label",
    "press",
    "musicbrainz",
    "discogs",
    "other",
  ]),
  url: z.string(),
  note: z.string().nullish(),
});

/**
 * Ligne « contribution » sérialisée (GET /api/contributions).
 *
 * `payload` reste volontairement permissif : sa forme est contractualisée
 * à l'écriture par `contributionPayloadSchema`, et le front n'en lit que
 * quelques champs d'affichage.
 */
export const contributionRowSchema = z.object({
  id: z.uuid(),
  type: z.enum(["band_create", "band_update"]),
  status: contributionStatusSchema,
  payload: z.object({
    name: z.string().optional(),
    slug: z.string().optional(),
    targetBandId: z.string().nullish(),
  }),
  evidence: z.array(evidenceRowSchema),
  reviewNotes: z.string().nullish(),
  submittedBy: z.string(),
  reviewedBy: z.string().nullish(),
  reminderCount: z.number().int(),
  deadlineAt: z.string().nullish(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ContributionStatus = z.infer<typeof contributionStatusSchema>;
export type EvidenceRow = z.infer<typeof evidenceRowSchema>;
export type ContributionRow = z.infer<typeof contributionRowSchema>;

/**
 * Compte tel qu'exposé par l'administration (GET /api/users).
 *
 * Seule ligne de l'API portant un email : elle ne transite que vers
 * l'espace admin, derrière la permission `user:read`.
 */
export const adminUserRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  role: z.enum(["user", "contributor", "moderator", "admin"]),
  banned: z.boolean().nullish(),
  banReason: z.string().nullish(),
  banExpires: z.string().nullish(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AdminUserRow = z.infer<typeof adminUserRowSchema>;
export type UserRole = AdminUserRow["role"];

/** DTO du resolver média (miroir de lib/media/resolver.ts). */
export const bandMediaSchema = z.object({
  band: z.object({
    id: z.uuid(),
    name: z.string(),
    slug: z.string(),
    countryCode: z.string().nullish(),
    formedYear: z.number().nullish(),
    dissolvedYear: z.number().nullish(),
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
    /**
     * Line-up du groupe : chaque passage porte ses dates et ses
     * instruments, et `ended` distingue le line-up actuel des anciens
     * membres — l'interface n'affiche par défaut que les actifs.
     */
    memberships: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        ended: z.boolean(),
        beginYear: z.number().nullable(),
        endYear: z.number().nullable(),
        roles: z.array(z.string()),
      }),
    ),
    genres: z.array(z.string()),
    wikidata: z
      .object({
        id: z.string(),
        extract: z.string().optional(),
        imageUrl: z.string().optional(),
      })
      .nullish(),
  }),
  /**
   * PHOTOS du groupe — scène ou studio —, avec leur provenance.
   *
   * Les pochettes d'album n'y figurent plus : elles montrent une œuvre,
   * pas un groupe. `sourceUrl` mène à la page du fichier, où l'auteur et
   * la licence sont indiqués — condition des licences libres de
   * Wikimedia Commons.
   */
  images: z.array(
    z.object({
      provider: z.string(),
      url: z.string(),
      kind: z.enum(["photo", "logo"]),
      sourceUrl: z.string().nullish(),
      author: z.string().nullish(),
      licence: z.string().nullish(),
    }),
  ),
  links: z.array(
    z.object({ provider: z.string(), label: z.string(), url: z.string() }),
  ),
  degraded: z.boolean(),
});

export type BandMedia = z.infer<typeof bandMediaSchema>;

/**
 * Sujet d'un avis de forum, résolu par l'API.
 *
 * Union discriminée : l'URL d'un album exige le slug de son groupe, pas
 * celle d'un groupe. Un objet à champs facultatifs aurait laissé au
 * rendu la charge de deviner lequel est renseigné.
 */
export const forumSubjectSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("band"),
    name: z.string(),
    slug: z.string(),
  }),
  z.object({
    kind: z.literal("album"),
    name: z.string(),
    slug: z.string(),
    bandSlug: z.string(),
  }),
]);

/** Un avis tel que renvoyé par GET /api/forum. */
export const forumPostSchema = z.object({
  id: z.uuid(),
  body: z.string(),
  createdAt: z.string(),
  authorId: z.string(),
  /** `null` quand le compte a été supprimé : l'avis reste, anonyme. */
  authorName: z.string().nullable(),
  subject: forumSubjectSchema,
});

export type ForumSubject = z.infer<typeof forumSubjectSchema>;
export type ForumPost = z.infer<typeof forumPostSchema>;
