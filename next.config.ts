import type { NextConfig } from "next";

/**
 * En-têtes de sécurité appliqués à toutes les réponses.
 * - HSTS                    : force HTTPS (efficace une fois en prod TLS)
 * - X-Frame-Options         : anti-clickjacking
 * - X-Content-Type-Options  : empêche le MIME-sniffing
 * - Referrer-Policy         : ne fuit ni URLs ni tokens dans le Referer
 * - Content-Security-Policy : whitelist stricte des sources de script/
 *   frame — self, Next.js inline (styles/hydration) et Cloudflare
 *   Turnstile (CAPTCHA inscription). Aucun autre tiers autorisé.
 */
/**
 * Origine du stockage objet (MinIO/S3), d'où proviennent les fichiers
 * audio téléversés. Lue au build : la CSP est statique, mais l'endpoint
 * varie selon l'environnement. Une valeur absente ou invalide ne doit pas
 * casser le build — elle produit simplement une directive plus stricte.
 */
function storageOrigin(): string | null {
  const raw = process.env.MINIO_ENDPOINT;
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

/**
 * Sources autorisées pour les médias audio (extraits et fichiers hébergés).
 *
 * Deezer répartit ses extraits sur plusieurs sous-domaines de `dzcdn.net`
 * (`cdns-preview`, `cdnt-preview`…) et en change sans préavis : lister un
 * hôte précis bloquait la lecture dès que l'API renvoyait l'autre. Le
 * joker reste borné au domaine de la plateforme.
 */
const mediaSources = [
  "'self'",
  "blob:",
  "https://*.dzcdn.net",
  storageOrigin(),
].filter(Boolean) as string[];

/**
 * Le serveur de développement ouvre une WebSocket de rechargement à chaud
 * sur un port local aléatoire ; sans cette autorisation, la CSP la bloque
 * et le HMR cesse de fonctionner. Jamais ajoutée en production.
 */
const devConnectSources =
  process.env.NODE_ENV === "development" ? ["ws:", "http://localhost:*"] : [];

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js requiert unsafe-inline/eval pour l'hydratation en dev ;
      // les scripts inline de nonce complet nécessitent un middleware dédié.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline'",
      // Cover Art Archive redirige vers un nœud Internet Archive au nom
      // variable (dn710009.ca.archive.org…) : les DEUX hôtes sont requis,
      // sinon la pochette est bloquée après la redirection.
      "img-src 'self' data: blob: https://i.ytimg.com https://upload.wikimedia.org https://commons.wikimedia.org https://api.discogs.com https://imgutils.discogs.com https://*.dzcdn.net https://coverartarchive.org https://*.archive.org",
      "frame-src https://challenges.cloudflare.com https://www.youtube-nocookie.com https://open.spotify.com https://bandcamp.com",
      // Sans media-src, l'audio retombait sur default-src 'self' : les
      // extraits Deezer et les fichiers MinIO étaient purement et
      // simplement bloqués par le navigateur.
      `media-src ${mediaSources.join(" ")}`,
      // Même liste pour connect-src : le décodage d'une forme d'onde
      // télécharge le fichier via fetch avant de l'analyser.
      `connect-src 'self' https://challenges.cloudflare.com ${[
        ...mediaSources.filter((s) => s !== "'self'" && s !== "blob:"),
        ...devConnectSources,
      ].join(" ")}`,
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    /**
     * Domaines externes autorisés pour <Image> (médias officiels,
     * jamais copiés localement) :
     * - i.ytimg.com        : miniatures YouTube (façades d'embed)
     * - upload.wikimedia.org : images Wikidata/Wikipédia
     * - api.discogs.com + imgutils.discogs.com : pochettes/photos Discogs
     * - *.dzcdn.net : pochettes et extraits Deezer (les sous-domaines
     *   varient : cdns-preview, cdnt-preview, e-cdns-images…)
     * - coverartarchive.org + *.archive.org : pochettes d'album, l'archive
     *   redirigeant vers un nœud Internet Archive au nom variable
     */
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      // Special:FilePath, qui redirige vers upload.wikimedia.org
      { protocol: "https", hostname: "commons.wikimedia.org" },
      { protocol: "https", hostname: "api.discogs.com" },
      { protocol: "https", hostname: "imgutils.discogs.com" },
      { protocol: "https", hostname: "**.dzcdn.net" },
      // Pochettes Cover Art Archive et son stockage Internet Archive
      { protocol: "https", hostname: "coverartarchive.org" },
      { protocol: "https", hostname: "**.archive.org" },
    ],
  },
};

export default nextConfig;
