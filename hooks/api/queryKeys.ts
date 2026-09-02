/**
 * Fabrique de clés de requête TanStack Query.
 * Centralise la nomenclature `["entité", "portée", ...params]` pour
 * garantir des invalidations cohérentes entre les hooks (une seule
 * source de vérité) et éviter les fautes de frappe dans les tableaux.
 */

/**
 * Hiérarchie de clés par entité :
 * - `all`      : racine, invalide TOUT ce qui concerne l'entité ;
 * - `lists()`  : toutes les listes (invalider après create/delete) ;
 * - `list(f)`  : une liste précise avec ses paramètres de filtre ;
 * - `details()`: tous les détails (invalider après update) ;
 * - `detail(id)` : un détail précis.
 * Convention recommandée par la documentation TanStack Query.
 */
export function entityKeys(entity: string) {
  return {
    /** Racine de l'entité (ex : ["bands"]). */
    all: [entity] as const,
    /** Toutes les listes de l'entité. */
    lists: () => [entity, "list"] as const,
    /** Une liste précise, paramétrée. */
    list: (filters: Record<string, unknown>) =>
      [entity, "list", filters] as const,
    /** Tous les détails de l'entité. */
    details: () => [entity, "detail"] as const,
    /** Un détail précis par identifiant. */
    detail: (id: string) => [entity, "detail", id] as const,
  };
}

/** Clés des requêtes liées aux groupes. */
export const bandKeys = entityKeys("bands");
/** Clés des requêtes liées aux albums. */
export const albumKeys = entityKeys("albums");
/** Clés des requêtes liées aux pistes. */
export const trackKeys = entityKeys("tracks");
/** Clés des requêtes liées aux genres. */
export const genreKeys = entityKeys("genres");

/**
 * Clés des contributions.
 *
 * Hors de `entityKeys` : la route ne renvoie pas de liste paginée mais
 * deux vues distinctes selon le rôle — « mes dossiers » et la file de
 * relecture — qui doivent s'invalider séparément.
 */
export const contributionKeys = {
  all: ["contributions"] as const,
  /** Dossiers de l'utilisateur courant. */
  mine: () => ["contributions", "mine"] as const,
  /** File de modération, éventuellement filtrée par statut. */
  review: (status?: string) =>
    ["contributions", "review", status ?? "open"] as const,
};

/** Clé de la recherche globale (terme + limite). */
export const searchKeys = {
  all: ["search"] as const,
  query: (q: string, limit: number) => ["search", q, limit] as const,
};

/** Clés des DTO média agrégé (resolver providers externes). */
export const mediaKeys = {
  all: ["media"] as const,
  /** Média-complet d'un groupe par identifiant. */
  band: (id: string) => ["media", "band", id] as const,
};
