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
import {
  extractMemberships,
  extractOfficialLinks,
  extractWikidataId,
} from "@/lib/providers/musicbrainz";
// Aucun lien sortant ne doit transporter d'identifiant de campagne
import { stripTracking } from "@/lib/url/tracking";
// Nommage des liens par destination plutôt que par type de relation
import { officialLinkLabel } from "@/lib/media/linkLabels";
// Hiérarchie d'écoute des liens sortants
import { byListenOrder } from "@/lib/media/listenOrder";
// Cache Redis partagé
import { redis } from "@/lib/redis";

/**
 * Durée de cache du DTO agrégé, extraits EXCLUS (24 h).
 *
 * Cette partie coûte cher à reconstruire : MusicBrainz est limité à une
 * requête par seconde, et s'y ajoutent trois appels Wikidata. Un cache
 * court se payait par une fiche vide pendant plusieurs secondes à chaque
 * première visite — précisément le symptôme « l'image apparaît seulement
 * après un rafraîchissement ».
 *
 * Les extraits Deezer, eux, ne sont JAMAIS servis depuis ce cache : voir
 * `resolvePreviews`.
 */
const MEDIA_CACHE_TTL = 86_400;

/**
 * Libellés français des types de relation MusicBrainz retenus comme
 * liens officiels. Une clé absente est affichée telle quelle.
 */
const OFFICIAL_LINK_LABELS: Record<string, string> = {
  "official homepage": "Site officiel",
  "social network": "Réseau social",
  streaming: "Écoute en ligne",
  "free streaming": "Écoute gratuite",
  "purchase for download": "Achat / téléchargement",
  bandcamp: "Bandcamp",
  discogs: "Discogs",
  allmusic: "AllMusic",
  "last.fm": "Last.fm",
  wikipedia: "Wikipédia",
  youtube: "YouTube",
  soundcloud: "SoundCloud",
};

/**
 * Domaines écartés des liens officiels.
 *
 * Qobuz a été retiré du projet : le laisser remonter par les relations
 * MusicBrainz le réintroduirait par une porte dérobée.
 */
const EXCLUDED_LINK_HOSTS = ["qobuz.com"];

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
        imageUrl: z.string().url().optional(),
      })
      .nullish(),
  }),
  /**
   * PHOTOS du groupe — scène ou studio —, jamais copiées.
   *
   * Uniquement des photos : les pochettes d'album n'y figurent plus.
   * Elles montraient une œuvre, pas le groupe, et la discographie les
   * présente déjà à leur place.
   *
   * Chaque entrée porte sa PROVENANCE. Les photos de Wikimedia Commons
   * sont publiées sous licence libre, laquelle exige d'en créditer
   * l'auteur : afficher l'image sans lien vers sa page de fichier ne
   * respecterait pas cette condition.
   */
  images: z.array(
    z.object({
      provider: z.string(),
      url: z.string().url(),
      /** Nature du visuel, pour l'annoncer sans deviner. */
      kind: z.enum(["photo", "logo"]),
      /** Page d'origine : auteur, licence, historique. */
      sourceUrl: z.string().url().nullish(),
      /** Libellé de provenance affiché sous la photo. */
      credit: z.string().nullish(),
    }),
  ),
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

  // Le nom du groupe est requis dès la lecture du cache, pour re-résoudre
  // les extraits ; la requête est locale et négligeable.
  const band = await getBandById(bandId);
  if (!band) throw new Error(`Groupe introuvable : ${bandId}`);

  // 1. Cache — les extraits sont volontairement laissés de côté et
  // re-résolus à chaque appel : leurs URLs expirent en une heure.
  if (!force) {
    const cached = await redis.get(key).catch(() => null);
    if (cached) {
      // Un déploiement qui fait évoluer le DTO laisse en cache des
      // entrées à l'ancien format pendant 24 h : elles doivent être
      // ignorées et recalculées, jamais propagées en erreur 500.
      const parsed = bandMediaSchema.safeParse(safeJson(cached));
      if (parsed.success) {
        return { ...parsed.data, previews: await resolvePreviews(band.name) };
      }
    }
  }

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
    // Le nom du groupe sert AUSSI de filtre : sans lui, un homonyme
    // fournissait des « titres iconiques » qui ne sont pas de lui, et
    // ses pochettes se retrouvaient dans la galerie du groupe.
    dataProviders.deezer.searchTracks(band.name, band.name),
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
  let wikidataImage: Awaited<
    ReturnType<typeof dataProviders.wikidata.getEntityImage>
  > = null;
  let wikidataLogo: Awaited<
    ReturnType<typeof dataProviders.wikidata.getEntityLogo>
  > = null;
  if (wikidataId && isProviderAvailable("wikidata")) {
    const [wd, img, logo] = await Promise.allSettled([
      dataProviders.wikidata.getSummary(wikidataId),
      dataProviders.wikidata.getEntityImage(wikidataId),
      dataProviders.wikidata.getEntityLogo(wikidataId),
    ]);
    if (wd.status === "fulfilled") wikidataSummary = wd.value;
    else degraded = true;
    if (img.status === "fulfilled") wikidataImage = img.value;
    if (logo.status === "fulfilled") wikidataLogo = logo.value;
  }

  // La recherche Discogs par nom a été retirée : elle ne servait qu'à
  // trouver une vignette de secours pour la galerie, laquelle n'accepte
  // plus que des photos sourcées. Les liens Discogs, eux, viennent de la
  // référence exacte (`discogsArtist`), jamais d'un nom approchant.

  // 4. Fusion des sources
  const images: BandMedia["images"] = [];
  const links: BandMedia["links"] = [];

  // Photo du groupe, puis logo officiel. Les pochettes rapportées par
  // les plateformes ont été retirées : une galerie de GROUPE montre le
  // groupe, et la discographie affiche déjà les pochettes.
  if (wikidataImage) {
    images.push({
      provider: "wikimedia",
      url: wikidataImage.url,
      kind: "photo",
      sourceUrl: wikidataImage.sourceUrl,
      credit: "Wikimedia Commons — auteur et licence sur la page du fichier",
    });
  }
  if (wikidataLogo) {
    images.push({
      provider: "wikimedia",
      url: wikidataLogo.url,
      kind: "logo",
      sourceUrl: wikidataLogo.sourceUrl,
      credit: "Wikimedia Commons — auteur et licence sur la page du fichier",
    });
  }

  // Liens officiels déclarés dans MusicBrainz : quelqu'un les a
  // vérifiés, ils existent — contrairement à une URL de recherche
  // fabriquée à l'aveugle, qui peut ne mener nulle part.
  if (mbArtist) {
    for (const link of extractOfficialLinks(mbArtist)) {
      links.push({
        provider: "musicbrainz",
        label: officialLinkLabel(
          link.url,
          OFFICIAL_LINK_LABELS[link.kind] ?? link.kind,
        ),
        url: link.url,
      });
    }
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
      memberships: mbArtist ? extractMemberships(mbArtist) : [],
      genres: dedupeGenres((mbArtist?.genres ?? []).map((g) => g.name)),
      wikidata:
        wikidataId && wikidataSummary
          ? {
              id: wikidataId,
              extract: wikidataSummary.extract,
              imageUrl: wikidataSummary.originalimage?.source,
            }
          : null,
    },
    images: dedupeImages(images),
    // Hiérarchie d'écoute : site officiel ou label d'abord, puis
    // Bandcamp, Spotify, YouTube, Deezer ; documentation et réseaux
    // sociaux ensuite. L'ordre de MusicBrainz ne dit rien de l'usage.
    links: byListenOrder(dedupeLinks(links)),
    previews: deezerTracks.map((t) => ({
      title: t.title,
      artistName: t.artist.name,
      previewUrl: t.preview,
      coverUrl: t.album.cover_medium ?? null,
    })),
    degraded,
  });

  // Mise en cache même en cas de dégradation (évite le martèlement).
  // Les extraits sont retirés avant écriture : leurs URLs seraient
  // expirées bien avant l'échéance du cache.
  await redis
    .set(
      key,
      JSON.stringify({ ...payload, previews: [] }),
      "EX",
      MEDIA_CACHE_TTL,
    )
    .catch(() => undefined);
  return payload;
}

/**
 * Déduplique la galerie sur l'URL nettoyée.
 *
 * Deezer renvoie la même pochette pour toutes les pistes d'un album :
 * sans cela, la galerie afficherait dix fois le même visuel.
 */
function dedupeImages(images: BandMedia["images"]): BandMedia["images"] {
  const seen = new Map<string, BandMedia["images"][number]>();
  for (const image of images) {
    const url = stripTracking(image.url);
    if (!seen.has(url)) seen.set(url, { ...image, url });
  }
  return [...seen.values()];
}

/**
 * Extraits officiels de 30 s d'un groupe, TOUJOURS frais.
 *
 * Les URLs renvoyées par Deezer portent un jeton signé (`hdnea=exp=…`)
 * valable environ une heure. Les conserver dans le cache long du DTO
 * revenait à servir des liens morts la quasi-totalité du temps : la
 * lecture échouait en 403, sans message.
 *
 * L'appel reste peu coûteux — un seul aller-retour, lui-même mémorisé
 * quinze minutes par le client HTTP — et une panne Deezer rend une liste
 * vide plutôt que de faire échouer toute la fiche.
 */
async function resolvePreviews(
  bandName: string,
): Promise<BandMedia["previews"]> {
  try {
    const tracks = await dataProviders.deezer.searchTracks(bandName, bandName);
    return tracks.map((t) => ({
      title: t.title,
      artistName: t.artist.name,
      previewUrl: t.preview,
      coverUrl: t.album.cover_medium ?? null,
    }));
  } catch {
    return [];
  }
}

/** Analyse une entrée de cache, sans jamais lever sur du JSON abîmé. */
function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Déduplique les genres MusicBrainz.
 *
 * MusicBrainz mélange `genres` et `tags` votés : « black metal »,
 * « Black Metal » et « black-metal » y coexistent pour un même groupe,
 * souvent accompagnés du genre parent (« metal »). On compare sur une
 * forme normalisée, on conserve le premier libellé rencontré — le mieux
 * orthographié — et on écarte les genres englobants.
 */
function dedupeGenres(names: readonly string[]): string[] {
  const seen = new Map<string, string>();
  for (const name of names) {
    const key = name
      .toLowerCase()
      .replace(/[\s_-]+/g, " ")
      .trim();
    if (key && !seen.has(key)) seen.set(key, name);
  }

  const keys = [...seen.keys()];
  // Seul le genre GÉNÉRIQUE d'un seul mot est écarté quand un genre plus
  // précis le contient : « metal » n'apprend rien à côté de « black
  // metal ». La règle s'arrête là — écarter tout genre englobant ferait
  // disparaître « black metal » derrière « symphonic black metal », or
  // les deux qualifient réellement le groupe.
  const kept = keys.filter(
    (key) =>
      key.includes(" ") ||
      !keys.some((other) => other !== key && other.endsWith(` ${key}`)),
  );

  return kept.map((key) => seen.get(key)!);
}

/**
 * Déduplique les liens et écarte les plateformes exclues du projet.
 *
 * Un même site officiel est souvent déclaré à la fois par MusicBrainz et
 * par Discogs ; l'ordre d'insertion fait gagner la source la plus fiable.
 */
function dedupeLinks(links: BandMedia["links"]): BandMedia["links"] {
  const seen = new Map<string, BandMedia["links"][number]>();
  for (const link of links) {
    const url = stripTracking(link.url);
    if (EXCLUDED_LINK_HOSTS.some((host) => url.includes(host))) continue;
    // La clé est le LIBELLÉ, pas l'URL : MusicBrainz déclare souvent deux
    // adresses Spotify pour un même groupe, et deux boutons identiques
    // n'aident personne à choisir.
    if (!seen.has(link.label)) seen.set(link.label, { ...link, url });
  }
  return [...seen.values()];
}

/** Invalide le cache média d'un groupe (appelé par PUT refs). */
export async function invalidateBandMedia(bandId: string): Promise<void> {
  await redis.del(bandMediaCacheKey(bandId)).catch(() => undefined);
}
