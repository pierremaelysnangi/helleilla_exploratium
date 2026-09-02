/**
 * Nettoyage des paramètres de pistage dans les URLs sortantes.
 *
 * Le projet ne monétise rien et ne profile personne : un lien affiché
 * ne doit pas transporter d'identifiant de campagne vers la plateforme
 * de destination, ni permettre à celle-ci de recouper la provenance
 * d'un visiteur. Les URLs des providers en contiennent régulièrement
 * (Deezer, Discogs, Bandcamp, YouTube).
 */

/**
 * Paramètres retirés systématiquement.
 *
 * Familles couvertes : UTM (Google Analytics), identifiants de clic
 * réseau (`fbclid`, `gclid`, `ttclid`…), et les paramètres propres aux
 * plateformes musicales (`utm_campaign` de Bandcamp, `si` de Spotify /
 * YouTube, `deep_link` de Deezer).
 */
const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "utm_name",
  "utm_reader",
  "fbclid",
  "gclid",
  "dclid",
  "gbraid",
  "wbraid",
  "msclkid",
  "twclid",
  "ttclid",
  "igshid",
  "mc_cid",
  "mc_eid",
  "_ga",
  "_gl",
  "ref",
  "ref_src",
  "ref_url",
  "referrer",
  "si",
  "spm",
  "yclid",
  "deep_link",
  "app_id",
  "trackingId",
  "tracking_id",
]);

/**
 * Retire les paramètres de pistage d'une URL absolue.
 *
 * Tolérant par construction : une URL non analysable est renvoyée
 * telle quelle plutôt que de faire disparaître un lien légitime.
 *
 * @param rawUrl - URL absolue issue d'un provider ou d'une contribution.
 * @returns La même URL sans paramètres de pistage.
 */
export function stripTracking(rawUrl: string): string {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return rawUrl;
  }

  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMS.has(key) || key.toLowerCase().startsWith("utm_")) {
      url.searchParams.delete(key);
    }
  }
  // `?` orphelin une fois le dernier paramètre supprimé
  if ([...url.searchParams.keys()].length === 0) url.search = "";

  return url.toString();
}
