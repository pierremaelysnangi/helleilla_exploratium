/**
 * Helpers HTTP des tests E2E : client fetch minimal avec gestion des
 * cookies de session Better Auth (un « navigateur » par utilisateur),
 * déballage JSON et fabrique d'en-têtes authentifiés.
 */

// URL du serveur sous test
import { BASE_URL } from "../config";

/**
 * Compteur d'adresses IP de test uniques. Chaque client E2E reçoit une
 * IP distincte (plage TEST-NET-2 198.51.100.0/24, réservée à la doc) afin
 * d'isoler les buckets du rate limiter applicatif : sans cela, tous les
 * rôles partageant 127.0.0.1 saturent de façon non-déterministe un même
 * bucket (ex. POST /api/bands à 10/min) et rendent les suites flaky.
 * Le rate limiting reste ainsi exercé (chaque bucket est vérifié) sans
 * interférer entre clients.
 */
let ipCounter = 0;
function nextTestIp(): string {
  ipCounter += 1;
  return `198.51.100.${ipCounter}`;
}

/** Client HTTP attaché à une session (cookie jar minimal). */
export class ApiClient {
  /** IP simulée envoyée via `x-forwarded-for` (isolation du rate limit). */
  private readonly ip = nextTestIp();
  /** Cookies reçus du serveur, renvoyés à chaque requête suivante. */
  private cookies = new Map<string, string>();

  /**
   * Enregistre les cookies d'une réponse (set-cookie multiples).
   * Public : utilisé par `signIn` après l'appel d'authentification.
   * @param response - Réponse fetch dont on veut capter les cookies.
   */
  storeCookies(response: Response) {
    for (const raw of response.headers.getSetCookie()) {
      const [pair] = raw.split(";");
      const eq = pair.indexOf("=");
      if (eq > 0) {
        this.cookies.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
      }
    }
  }

  /** En-tête Cookie courant (chaîne vide si non connecté). */
  get cookieHeader(): string {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }

  /**
   * Requête générique vers le serveur sous test.
   * @param path - Chemin commençant par "/api".
   * @param init - Options fetch (method, body...).
   * @returns La réponse brute (les tests assertent sur status/json).
   */
  request(path: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    if (init.body !== undefined)
      headers.set("Content-Type", "application/json");
    if (this.cookieHeader) headers.set("Cookie", this.cookieHeader);
    // IP simulée distincte par client : isole les buckets de rate limit.
    headers.set("x-forwarded-for", this.ip);
    return fetch(`${BASE_URL}${path}`, { ...init, headers });
  }

  /** GET avec déballage JSON typé. */
  async get<T = unknown>(path: string) {
    return this.request(path).then(async (res) => ({
      status: res.status,
      json: (await res.json().catch(() => null)) as T,
    }));
  }

  /** POST avec corps JSON. */
  async post<T = unknown>(path: string, body?: unknown) {
    return this.request(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    }).then(async (res) => ({
      status: res.status,
      json: (await res.json().catch(() => null)) as T,
    }));
  }

  /** PATCH avec corps JSON partiel. */
  async patch<T = unknown>(path: string, body: unknown) {
    return this.request(path, {
      method: "PATCH",
      body: JSON.stringify(body),
    }).then(async (res) => ({
      status: res.status,
      json: (await res.json().catch(() => null)) as T,
    }));
  }

  /** DELETE. */
  async delete<T = unknown>(path: string) {
    return this.request(path, { method: "DELETE" }).then(async (res) => ({
      status: res.status,
      json: (await res.json().catch(() => null)) as T,
    }));
  }
}

/**
 * Connecte un utilisateur via l'endpoint Better Auth et retourne un
 * client porteur du cookie de session.
 *
 * @param email - Email du compte de test.
 * @param password - Mot de passe associé.
 * @returns Le client authentifié.
 */
export async function signIn(
  email: string,
  password: string,
): Promise<ApiClient> {
  const client = new ApiClient();
  const res = await client.request("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(
      `Échec sign-in ${email} : HTTP ${res.status} ${await res.text()}`,
    );
  }
  client.storeCookies(res);
  return client;
}

/** Client anonyme (sans cookie) pour tester les accès publics/401. */
export function anonymous(): ApiClient {
  return new ApiClient();
}
