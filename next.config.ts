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

/** Sources autorisées pour les médias audio (extraits et fichiers hébergés). */
const mediaSources = [
  "'self'",
  "blob:",
  // Extraits 30 s Deezer, résolus par lib/providers/deezer.ts
  "https://cdns-preview.dzcdn.net",
  storageOrigin(),
].filter(Boolean) as string[];

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
      "img-src 'self' data: blob: https://i.ytimg.com https://upload.wikimedia.org https://api.discogs.com https://imgutils.discogs.com https://cdns-preview.dzcdn.net https://e-cdns-images.dzcdn.net",
      "frame-src https://challenges.cloudflare.com https://www.youtube-nocookie.com https://open.spotify.com https://bandcamp.com https://widget.qobuz.com",
      // Sans media-src, l'audio retombait sur default-src 'self' : les
      // extraits Deezer et les fichiers MinIO étaient purement et
      // simplement bloqués par le navigateur.
      `media-src ${mediaSources.join(" ")}`,
      // Même liste pour connect-src : le décodage d'une forme d'onde
      // télécharge le fichier via fetch avant de l'analyser.
      `connect-src 'self' https://challenges.cloudflare.com ${mediaSources
        .filter((s) => s !== "'self'" && s !== "blob:")
        .join(" ")}`,
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
     * - cdns-preview.dzcdn.net / e-cdns-images.dzcdn.net : covers Deezer
     */
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "api.discogs.com" },
      { protocol: "https", hostname: "imgutils.discogs.com" },
      { protocol: "https", hostname: "cdns-preview.dzcdn.net" },
      { protocol: "https", hostname: "e-cdns-images.dzcdn.net" },
    ],
  },
};

export default nextConfig;
