/**
 * Vérifie que chaque adresse de festival ou de salle répond encore.
 *
 * Une adresse morte est pire qu'une adresse absente : elle donne
 * l'impression d'une information à jour. Ce script les débusque plutôt
 * que d'attendre qu'un lecteur tombe dessus.
 *
 * La requête se fait en GET avec un User-Agent de navigateur : beaucoup
 * de sites refusent HEAD, et certains répondent 403 à un client qui ne
 * s'annonce pas. Un 403 ou un 405 signale d'ailleurs un serveur BIEN
 * vivant qui filtre : ils ne sont pas comptés comme des échecs.
 *
 *   pnpm check:venue-links
 */

import { VENUES } from "@/db/seed/venues";

const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/126.0.0.0 Safari/537.36";

/** Codes qui prouvent un serveur vivant, même s'il refuse la requête. */
const ALIVE = new Set([
  200, 201, 202, 204, 301, 302, 303, 307, 308, 401, 403, 405, 429,
]);

/** Délai au-delà duquel on cesse d'attendre une réponse. */
const TIMEOUT_MS = 15_000;

async function check(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return ALIVE.has(res.status) ? "ok" : `HTTP ${res.status}`;
  } catch (err) {
    return err instanceof Error ? err.name : "échec";
  }
}

async function main() {
  const withUrl = VENUES.filter((v) => v.websiteUrl);
  const problems: string[] = [];

  for (const venue of withUrl) {
    const status = await check(venue.websiteUrl!);
    if (status !== "ok") {
      problems.push(
        `  ${venue.name} (${venue.countryCode}) — ${status}\n      ${venue.websiteUrl}`,
      );
    }
  }

  console.info(`${withUrl.length} adresse(s) vérifiée(s).`);
  if (problems.length === 0) {
    console.info("Toutes répondent.");
  } else {
    console.info(`\n${problems.length} à revoir :\n${problems.join("\n")}`);
    console.info(
      "\nUn échec réseau depuis cette machine ne prouve pas qu'un site " +
        "est mort : vérifier au navigateur avant de retirer une adresse.",
    );
  }
  process.exit(0);
}

void main();
