/**
 * Lecture serveur de la discographie complète d'un groupe.
 *
 * Partagée par la fiche du groupe et la page `/discography`, qui
 * affichaient chacune leur propre requête — avec le même plafond de 100
 * sorties, atteint dès qu'un catalogue est importé en entier.
 *
 * L'API borne `perPage` à 100 : la pagination est donc déroulée ici,
 * plutôt que de tronquer silencieusement les discographies fournies.
 */

import { z } from "zod";
import { apiFetch } from "@/lib/api/client";
import { albumRowSchema, type AlbumRow } from "@/hooks/api/schemas";

/** Taille de page maximale acceptée par `paginationSchema`. */
const PER_PAGE = 100;

const pageSchema = z.object({
  data: z.array(albumRowSchema),
  meta: z.object({ totalPages: z.number() }).loose(),
});

/**
 * Toutes les sorties d'un groupe, de la plus ancienne à la plus récente.
 *
 * @param bandId - UUID du groupe.
 */
export async function fetchDiscography(bandId: string): Promise<AlbumRow[]> {
  const all: AlbumRow[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const payload = await apiFetch("/api/albums", pageSchema, {
      query: { bandId, page, perPage: PER_PAGE, sort: "year", order: "asc" },
      // Pas de cache : l'import écrit en continu, et une discographie
      // figée 60 s s'affichait incomplète après un enrichissement.
      revalidate: 0,
    });
    all.push(...payload.data);
    totalPages = payload.meta.totalPages;
    page += 1;
  } while (page <= totalPages);

  return all;
}
