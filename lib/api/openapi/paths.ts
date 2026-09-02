/**
 * Déclaration des chemins OpenAPI.
 * Enregistre les opérations CRUD génériques pour band/album/track via une
 * boucle sur la table `resources`, puis les opérations spécifiques aux
 * genres (liste + création). Chaque appel `registerPath` alimente le
 * registre consommé par `buildDocument`.
 */

// Utilitaires zod (composition de schémas inline)
import { z } from "zod";
// Registre central des opérations OpenAPI
import { registerPath } from "./registry";
// Helpers de réponses : succès JSON et sélection d'erreurs
import { jsonOk, pick, errorResponses } from "./responses";
// Schémas d'entités et de pagination propres à la spec
import {
  AlbumSchema,
  BandSchema,
  GenreSchema,
  PaginatedMetaSchema,
  PaginationQuerySchema,
  TrackSchema,
  UuidParamSchema,
  GlobalSearchQuerySchema,
  GlobalSearchResponseSchema,
  BandDetailSchema,
  AdminUserSchema,
  ProfileSchema,
  AlbumDetailSchema,
  GenreDetailSchema,
  SetBandGenresRequestSchema,
  BandGenresSyncedSchema,
  AudioUploadRequestSchema,
  AudioUploadResponseSchema,
  RevalidateRequestSchema,
  HealthSchema,
} from "./schemas";
// Schémas de requêtes réutilisés comme requestBody des mutations
import { createBandSchema, updateBandSchema } from "@/lib/validations/band";
import { createAlbumSchema, updateAlbumSchema } from "@/lib/validations/album";
import { createTrackSchema, updateTrackSchema } from "@/lib/validations/track";
import {
  createGenreSchema,
  updateGenreBodySchema,
} from "@/lib/validations/genre";
// Contrat d'administration des comptes (source unique avec la route)
import { updateUserSchema } from "@/lib/validations/user";
import { updateProfileSchema } from "@/lib/validations/profile";
// Schémas médias & contributions
import {
  BandMediaSchema,
  SetBandRefsRequestSchema,
  BandRefsSyncedSchema,
  CreateContributionRequestSchema,
  ContributionSchema,
  EvidenceItemSchema,
  TransitionStatusRequestSchema,
} from "./schemas";

/** Enveloppe de liste paginée `{ items, meta }` pour un type d'entité. */
function listSchema<T extends z.ZodType>(item: T) {
  return z.object({ items: z.array(item), meta: PaginatedMetaSchema });
}

/** Descripteur de contenu `application/json` à partir d'un schéma. */
function json<T extends z.ZodType>(schema: T) {
  return { content: { "application/json": { schema } } };
}

/** Description générique d'une ressource exposée en CRUD. */
type Resource = {
  name: string;
  tag: string;
  path: string;
  entity: z.ZodType;
  create: z.ZodType;
  update: z.ZodType;
};

// Table des ressources générant automatiquement les 5 opérations CRUD
const resources: Resource[] = [
  {
    name: "band",
    tag: "bands",
    path: "/api/bands",
    entity: BandSchema,
    create: createBandSchema,
    update: updateBandSchema,
  },
  {
    name: "album",
    tag: "albums",
    path: "/api/albums",
    entity: AlbumSchema,
    create: createAlbumSchema,
    update: updateAlbumSchema,
  },
  {
    name: "track",
    tag: "tracks",
    path: "/api/tracks",
    entity: TrackSchema,
    create: createTrackSchema,
    update: updateTrackSchema,
  },
];

// Génération des opérations CRUD : liste, création, lecture,
// modification et suppression (avec sécurité sessionCookie sur les mutations)
for (const r of resources) {
  registerPath(r.path, "get", {
    tags: [r.tag],
    summary: `Liste les ${r.tag}`,
    requestParams: { query: PaginationQuerySchema },
    responses: {
      200: jsonOk(listSchema(r.entity)),
      ...pick(422, 429, 500),
    },
  });

  registerPath(r.path, "post", {
    tags: [r.tag],
    summary: `Crée un ${r.name}`,
    security: [{ sessionCookie: [] }],
    requestBody: json(r.create),
    responses: {
      201: jsonOk(r.entity, "Créé"),
      ...pick(401, 403, 409, 422, 429, 500),
    },
  });

  registerPath(`${r.path}/{id}`, "get", {
    tags: [r.tag],
    summary: `Récupère un ${r.name}`,
    requestParams: { path: UuidParamSchema },
    responses: {
      200: jsonOk(r.entity),
      ...pick(404, 422, 429, 500),
    },
  });

  registerPath(`${r.path}/{id}`, "patch", {
    tags: [r.tag],
    summary: `Modifie un ${r.name}`,
    security: [{ sessionCookie: [] }],
    requestParams: { path: UuidParamSchema },
    requestBody: json(r.update),
    responses: {
      200: jsonOk(r.entity),
      ...pick(401, 403, 404, 409, 422, 429, 500),
    },
  });

  registerPath(`${r.path}/{id}`, "delete", {
    tags: [r.tag],
    summary: `Supprime un ${r.name}`,
    security: [{ sessionCookie: [] }],
    requestParams: { path: UuidParamSchema },
    responses: {
      200: jsonOk(z.object({ id: z.string().uuid() })),
      ...pick(401, 403, 404, 409, 422, 429, 500),
    },
  });
}

// Genres : opérations spécifiques (liste publique sans pagination,
// création réservée à moderator+)
registerPath("/api/genres", "get", {
  tags: ["genres"],
  summary: "Liste les genres",
  responses: {
    200: jsonOk(z.object({ items: z.array(GenreSchema) })),
    ...pick(429, 500),
  },
});

registerPath("/api/genres", "post", {
  tags: ["genres"],
  summary: "Crée un genre (moderator+)",
  security: [{ sessionCookie: [] }],
  requestBody: json(createGenreSchema),
  responses: {
    201: jsonOk(GenreSchema, "Créé"),
    ...pick(401, 403, 409, 422, 429, 500),
  },
});

// Détail d'un genre : hors de la boucle `resources` car les genres n'ont ni
// pagination ni indexation Meilisearch, et la suppression est réservée à
// l'admin (les autres entités s'arrêtent à moderator).
registerPath("/api/genres/{id}", "get", {
  tags: ["genres"],
  summary: "Récupère un genre",
  requestParams: { path: UuidParamSchema },
  responses: {
    200: jsonOk(GenreSchema),
    ...pick(404, 422, 429, 500),
  },
});

registerPath("/api/genres/{id}", "patch", {
  tags: ["genres"],
  summary: "Modifie un genre (moderator+)",
  security: [{ sessionCookie: [] }],
  requestParams: { path: UuidParamSchema },
  requestBody: json(updateGenreBodySchema),
  responses: {
    200: jsonOk(GenreSchema),
    ...pick(401, 403, 404, 409, 422, 429, 500),
  },
});

registerPath("/api/genres/{id}", "delete", {
  tags: ["genres"],
  summary: "Supprime un genre (admin)",
  security: [{ sessionCookie: [] }],
  requestParams: { path: UuidParamSchema },
  responses: {
    200: jsonOk(z.object({ id: z.string().uuid() })),
    ...pick(401, 403, 404, 409, 422, 429, 500),
  },
});

// Recherche globale publique : multi-index Meilisearch, rate limitée
registerPath("/api/search", "get", {
  tags: ["search"],
  summary: "Recherche globale (groupes, albums, pistes)",
  requestParams: { query: GlobalSearchQuerySchema },
  responses: {
    200: jsonOk(GlobalSearchResponseSchema),
    ...pick(422, 429, 500, 503),
  },
});

// --- Endpoints additionnels ---

// Détail d'un groupe avec ses genres associés
registerPath("/api/bands/{id}/genres", "put", {
  tags: ["bands"],
  summary: "Remplace les genres d'un groupe (sync complète)",
  security: [{ sessionCookie: [] }],
  requestParams: { path: UuidParamSchema },
  requestBody: json(SetBandGenresRequestSchema),
  responses: {
    200: jsonOk(BandGenresSyncedSchema),
    ...pick(401, 403, 404, 422, 429, 500),
  },
});

// Lecture publique par slug (pages publiques)
registerPath("/api/bands/by-slug/{slug}", "get", {
  tags: ["bands"],
  summary: "Récupère un groupe par son slug (avec genres)",
  requestParams: {
    path: z.object({ slug: z.string().min(1).max(200) }),
  },
  responses: {
    200: jsonOk(BandDetailSchema),
    ...pick(404, 422, 429, 500),
  },
});

// Détail album par slug. DEUX segments : la contrainte
// `albums_band_slug_uq` ne rend le slug unique qu'au sein d'un groupe,
// un slug seul ne désignerait donc pas un album de façon déterministe.
registerPath("/api/albums/by-slug/{bandSlug}/{albumSlug}", "get", {
  tags: ["albums"],
  summary: "Récupère un album par slug de groupe + slug d'album",
  requestParams: {
    path: z.object({
      bandSlug: z.string().min(1).max(200),
      albumSlug: z.string().min(1).max(200),
    }),
  },
  responses: {
    200: jsonOk(AlbumDetailSchema),
    ...pick(404, 422, 429, 500),
  },
});

// Détail genre par slug (unique globalement, un seul segment suffit)
registerPath("/api/genres/by-slug/{slug}", "get", {
  tags: ["genres"],
  summary: "Récupère un genre par son slug (parent, sous-genres, groupes)",
  requestParams: {
    path: z.object({ slug: z.string().min(1).max(200) }),
  },
  responses: {
    200: jsonOk(GenreDetailSchema),
    ...pick(404, 422, 429, 500),
  },
});

// Administration des comptes. Réservée aux admins : c'est la seule
// famille de routes qui expose des emails, et la seule voie de changement
// de rôle (Better Auth interdit au client de se l'attribuer).
registerPath("/api/users", "get", {
  tags: ["users"],
  summary: "Liste les comptes (admin)",
  security: [{ sessionCookie: [] }],
  requestParams: {
    query: z.object({
      page: z.coerce.number().int().min(1).optional(),
      perPage: z.coerce.number().int().min(1).max(100).optional(),
      q: z.string().max(200).optional(),
      role: z.enum(["user", "contributor", "moderator", "admin"]).optional(),
    }),
  },
  responses: {
    200: jsonOk(listSchema(AdminUserSchema)),
    ...pick(401, 403, 422, 429, 500),
  },
});

registerPath("/api/users/{id}", "get", {
  tags: ["users"],
  summary: "Récupère un compte (admin)",
  security: [{ sessionCookie: [] }],
  requestParams: { path: z.object({ id: z.string().min(1).max(200) }) },
  responses: {
    200: jsonOk(AdminUserSchema),
    ...pick(401, 403, 404, 422, 429, 500),
  },
});

registerPath("/api/users/{id}", "patch", {
  tags: ["users"],
  summary: "Change le rôle ou le bannissement d'un compte (admin)",
  description:
    "409 si l'opération retirerait ses droits au dernier administrateur ; 403 si l'administrateur se vise lui-même.",
  security: [{ sessionCookie: [] }],
  requestParams: { path: z.object({ id: z.string().min(1).max(200) }) },
  requestBody: json(updateUserSchema),
  responses: {
    200: jsonOk(AdminUserSchema),
    ...pick(401, 403, 404, 409, 422, 429, 500),
  },
});

registerPath("/api/users/{id}", "delete", {
  tags: ["users"],
  summary: "Supprime un compte (admin)",
  description:
    "Les contributions déjà soumises sont conservées et deviennent anonymes.",
  security: [{ sessionCookie: [] }],
  requestParams: { path: z.object({ id: z.string().min(1).max(200) }) },
  responses: {
    200: jsonOk(z.object({ deleted: z.boolean(), id: z.string() })),
    ...pick(401, 403, 404, 409, 422, 429, 500),
  },
});

// Profil de l'utilisateur connecté : lit la projection publique, pas la
// base identité — le nom affiché suffit, l'email n'a pas à circuler ici.
registerPath("/api/profile", "get", {
  tags: ["profile"],
  summary: "Profil public de l'utilisateur connecté",
  security: [{ sessionCookie: [] }],
  responses: {
    200: jsonOk(ProfileSchema),
    ...pick(401, 404, 429, 500),
  },
});

registerPath("/api/profile", "patch", {
  tags: ["profile"],
  summary: "Met à jour son nom affiché",
  description:
    "Passe par Better Auth : ses hooks répliquent le nom vers la projection publique.",
  security: [{ sessionCookie: [] }],
  requestBody: json(updateProfileSchema),
  responses: {
    200: jsonOk(ProfileSchema),
    ...pick(401, 404, 422, 429, 500),
  },
});

// Presign d'upload audio pour une piste
registerPath("/api/tracks/{id}/audio", "post", {
  tags: ["tracks"],
  summary: "Prépare l'upload du fichier audio d'une piste (URL présignée)",
  security: [{ sessionCookie: [] }],
  requestParams: { path: UuidParamSchema },
  requestBody: json(AudioUploadRequestSchema),
  responses: {
    200: jsonOk(AudioUploadResponseSchema),
    ...pick(401, 403, 404, 422, 429, 500),
  },
});

// Purge ISR machine-to-machine (secret header)
registerPath("/api/revalidate", "post", {
  tags: ["search"],
  summary: "Invalide le cache ISR (chemin et/ou tag)",
  security: [{ revalidateSecret: [] }],
  requestBody: json(RevalidateRequestSchema),
  responses: {
    200: jsonOk(z.object({ invalidated: z.array(z.string()) })),
    ...pick(401, 422, 429, 503),
  },
});

// Sonde de disponibilité
registerPath("/api/health", "get", {
  tags: ["search"],
  summary: "Santé des dépendances (PostgreSQL, Redis, Meilisearch)",
  responses: {
    200: jsonOk(HealthSchema),
    429: errorResponses[429],
    503: jsonOk(HealthSchema, "Dégradé"),
  },
});

// --- Médias externes & contributions ---

// DTO média agrégé : infos + images + liens + previews (providers externes)
registerPath("/api/bands/{id}/media", "get", {
  tags: ["bands"],
  summary: "Média-complet d'un groupe (providers externes, cache 24 h)",
  requestParams: { path: UuidParamSchema },
  responses: {
    200: jsonOk(BandMediaSchema),
    ...pick(404, 429, 500, 503),
  },
});

// Sync des références externes (miroir de PUT genres)
registerPath("/api/bands/{id}/refs", "put", {
  tags: ["bands"],
  summary: "Remplace les références externes d'un groupe",
  security: [{ sessionCookie: [] }],
  requestParams: { path: UuidParamSchema },
  requestBody: json(SetBandRefsRequestSchema),
  responses: {
    200: jsonOk(BandRefsSyncedSchema),
    ...pick(401, 403, 404, 422, 429, 500),
  },
});

// Contributions : soumission (contributor+) et liste (mine/review)
registerPath("/api/contributions", "post", {
  tags: ["contributions"],
  summary:
    "Soumet un dossier de contribution (2 preuves min., dont une officielle)",
  security: [{ sessionCookie: [] }],
  requestBody: json(CreateContributionRequestSchema),
  responses: {
    201: jsonOk(
      z.object({
        contribution: ContributionSchema,
        uploads: z.array(z.record(z.string(), z.unknown())),
      }),
      "Créé",
    ),
    ...pick(401, 403, 422, 429, 500),
  },
});

registerPath("/api/contributions", "get", {
  tags: ["contributions"],
  summary: "Liste les contributions (scope=mine par défaut, review=modérateur)",
  security: [{ sessionCookie: [] }],
  responses: {
    200: jsonOk(z.array(ContributionSchema)),
    ...pick(401, 403, 500),
  },
});

// Ajout de preuves par le contributeur (retour en pending)
registerPath("/api/contributions/{id}/evidence", "post", {
  tags: ["contributions"],
  summary: "Ajoute des preuves à une demande de l'auteur",
  security: [{ sessionCookie: [] }],
  requestParams: { path: UuidParamSchema },
  requestBody: json(z.object({ evidence: z.array(EvidenceItemSchema).min(1) })),
  responses: {
    200: jsonOk(ContributionSchema),
    ...pick(401, 403, 404, 422, 429, 500),
  },
});

// Transition modérateur : demande de preuves / approbation / rejet admin
registerPath("/api/contributions/{id}", "patch", {
  tags: ["contributions"],
  summary: "Transition de statut (evidence_requested | approved | rejected)",
  security: [{ sessionCookie: [] }],
  requestParams: { path: UuidParamSchema },
  requestBody: json(TransitionStatusRequestSchema),
  responses: {
    200: jsonOk(ContributionSchema),
    ...pick(401, 403, 404, 422, 429, 500, 503),
  },
});
