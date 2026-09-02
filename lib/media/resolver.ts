/**
 * Resolver média : agrège, à la demande, les informations et médias
 * d'un groupe depuis les providers externes (MusicBrainz, Wikidata,
 * Discogs, Deezer) en se basant UNIQUEMENT sur les références stockées
 * en base (`external_refs`). Aucun média n'est téléchargé ni stocké :
 * on ne renvoie que des URLs officielles.
 *
 * Résilience : chaque provider est isolé (`allSettled`) — une panne
 * externe produit un résultat dégradé (flag `degraded`), jamais un 500.
 */

// Validation du DTO de sortie (contrat partagé front/OpenAPI)
import { z } from "zod";
// Lecture du groupe et de ses références externes
import { getBandById } from "@/db/queries/bands";
import { getExternalRefs } from "@/db/queries/externalRefs";
// Providers de données + registre de disponibilité
import { dataProviders, isProviderAvailable } from "@/lib/providers";
import { extractMembers, extractWikidataId } from "@/lib/providers/musicbrainz";
// Cache Redis partagé
import { redis } from "@/lib/redis";

/** Durée de cache du DTO agrégé (24 h) ; invalidé par PUT refs. */
const MEDIA_CACHE_TTL = 86_400;

/** Clé Redis du DTO média d'un groupe. */
export function bandMediaCacheKey(bandId: string): string {
  return `media:band:${bandId}`;
}

/** Sortie typée du resolver — contrat partagé avec le front. */
export const bandMediaSchema = z.object({
  band: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    countryCode: z.string().nullable().optional(),
    formedYear: z.number().nullable().optional(),
    dissolvedYear: z.number().nullable().optional(),
    bio: z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
  }),
  /** Informations structurées MusicBrainz + résumé Wikidata. */
  info: z.object({
    /** Zone/pays selon MusicBrainz (plus fine que le code ISO local). */
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
        imageUrl: z.string().url().optional(),
      })
      .nullish(),
  }),
  /** Images officielles (Discogs, Wikidata) — URLs brutes, jamais copiées. */
  images: z.array(z.object({ provider: z.string(), url: z.string().url() })),
  /** Liens officiels (site, Discogs, Wikipédia…). */
  links: z.array(
    z.object({
      provider: z.string(),
      label: z.string(),
      url: z.string().url(),
    }),
  ),
  /** Extraits audio 30 s (Deezer) pour l'écoute d'aperçu. */
  previews: z.array(
    z.object({
      title: z.string(),
      artistName: z.string(),
      previewUrl: z.string().url(),
      coverUrl: z.string().url().nullish(),
    }),
  ),
  /** true si au moins un provider a échoué (résultat partiel). */
  degraded: z.boolean(),
});

export type BandMedia = z.infer<typeof bandMediaSchema>;

/**
 * Résout le média-complet d'un groupe.
 *
 * Séquence :
 * 1. Cache Redis -> retour immédiat si présent ;
 * 2. Lecture band + refs ; sans ref MusicBrainz/Discogs, seules les
 *    previews Deezer (provider public sans référence) sont résolues ;
 * 3. Providers interrogés en parallèle via allSettled ;
 * 4. Fusion + validation + mise en cache.
 *
 * @param bandId - UUID du groupe.
 * @param options.force - Bypass du cache (après invalidation refs).
 * @throws Error si le groupe n'existe pas en base.
 */
export async function resolveBandMedia(
  bandId: string,
  { force = false }: { force?: boolean } = {},
): Promise<BandMedia> {
  const key = bandMediaCacheKey(bandId);

  // 1. Cache
  if (!force) {
    const cached = await redis.get(key).catch(() => null);
    if (cached) return bandMediaSchema.parse(JSON.parse(cached));
  }

  const band = await getBandById(bandId);
  if (!band) throw new Error(`Groupe introuvable : ${bandId}`);

  const refs = await getExternalRefs("band", bandId);
  const mbRef = refs.find((r) => r.provider === "musicbrainz");
  const discogsRef = refs.find((r) => r.provider === "discogs");

  // 2. Providers en parallèle, chacun isolé par allSettled
  const [mbResult, discogsResult, deezerResult] = await Promise.allSettled([
    mbRef && isProviderAvailable("musicbrainz")
      ? dataProviders.musicbrainz.getArtist(mbRef.externalId)
      : Promise.resolve(null),
    discogsRef && isProviderAvailable("discogs")
      ? dataProviders.discogs.getArtist(Number(discogsRef.externalId))
      : Promise.resolve(null),
    dataProviders.deezer.searchTracks(band.name),
  ]);

  let degraded = false;
  const unwrap = <T>(r: PromiseSettledResult<T>): T | null =>
    r.status === "fulfilled" ? r.value : ((degraded = true), null);

  const mbArtist = unwrap(mbResult);
  const discogsArtist = unwrap(discogsResult);
  const deezerTracks = unwrap(deezerResult) ?? [];

  // Enrichissement Wikidata conditionné à l'ID extrait de MusicBrainz
  const wikidataId = mbArtist ? extractWikidataId(mbArtist) : null;
  let wikidataSummary: Awaited<
    ReturnType<typeof dataProviders.wikidata.getSummary>
  > = null;
  // L'image ne vient PAS du résumé : celui-ci décrit la page Wikidata,
  // pas le sujet. Elle est portée par la déclaration P18 de l'entité,
  // d'où deux appels distincts.
  let wikidataImageUrl: string | null = null;
  if (wikidataId && isProviderAvailable("wikidata")) {
    const [wd, img] = await Promise.allSettled([
      dataProviders.wikidata.getSummary(wikidataId),
      dataProviders.wikidata.getEntityImageUrl(wikidataId),
    ]);
    if (wd.status === "fulfilled") wikidataSummary = wd.value;
    else degraded = true;
    if (img.status === "fulfilled") wikidataImageUrl = img.value;
  }

  // Meilleur match Discogs : détail connu, sinon recherche par nom
  let bestDiscogsMatch: {
    id?: number;
    title?: string;
    cover_image?: string | null;
    thumb?: string | null;
    profile?: string | null;
    urls?: string[];
  } | null = discogsArtist;
  if (!bestDiscogsMatch && discogsRef && isProviderAvailable("discogs")) {
    const [search] = await Promise.allSettled([
      dataProviders.discogs.searchArtists(band.name),
    ]);
    if (search.status === "fulfilled")
      bestDiscogsMatch = search.value?.results.at(0) ?? null;
    else degraded = true;
  }
  // 4. Fusion des sources
  const images: BandMedia["images"] = [];
  const links: BandMedia["links"] = [];

  if (bestDiscogsMatch?.cover_image || bestDiscogsMatch?.thumb) {
    images.push({
      provider: "discogs",
      url: bestDiscogsMatch.cover_image ?? bestDiscogsMatch.thumb!,
    });
  }
  if (wikidataImageUrl) {
    images.push({ provider: "wikidata", url: wikidataImageUrl });
  }
  if (discogsArtist?.urls?.length && discogsRef) {
    for (const url of discogsArtist.urls.slice(0, 3)) {
      links.push({ provider: "discogs", label: "Site lié (Discogs)", url });
    }
  }
  if (wikidataSummary && wikidataId) {
    links.push({
      provider: "wikidata",
      label: "Wikipédia",
      url: `https://www.wikidata.org/wiki/${wikidataId}`,
    });
  }

  const payload = bandMediaSchema.parse({
    band: {
      id: band.id,
      name: band.name,
      slug: band.slug,
      countryCode: band.countryCode,
      formedYear: band.formedYear,
      dissolvedYear: band.dissolvedYear,
      bio: band.bio,
      imageUrl: band.imageUrl,
    },
    info: {
      area: mbArtist?.area?.name ?? null,
      lifeSpan: mbArtist?.["life-span"]
        ? {
            begin: mbArtist["life-span"].begin ?? null,
            end: mbArtist["life-span"].end ?? null,
            ended: mbArtist["life-span"].ended,
          }
        : null,
      members: mbArtist ? extractMembers(mbArtist) : [],
      genres: (mbArtist?.genres ?? []).map((g) => g.name),
      wikidata:
        wikidataId && wikidataSummary
          ? {
              id: wikidataId,
              extract: wikidataSummary.extract,
              imageUrl: wikidataSummary.originalimage?.source,
            }
          : null,
    },
    images,
    links,
    previews: deezerTracks.map((t) => ({
      title: t.title,
      artistName: t.artist.name,
      previewUrl: t.preview,
      coverUrl: t.album.cover_medium ?? null,
    })),
    degraded,
  });

  // Mise en cache même en cas de dégradation (évite le martèlement)
  await redis
    .set(key, JSON.stringify(payload), "EX", MEDIA_CACHE_TTL)
    .catch(() => undefined);
  return payload;
}

/** Invalide le cache média d'un groupe (appelé par PUT refs). */
export async function invalidateBandMedia(bandId: string): Promise<void> {
  await redis.del(bandMediaCacheKey(bandId)).catch(() => undefined);
}
