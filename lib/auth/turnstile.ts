/**
 * Vérification serveur du CAPTCHA Cloudflare Turnstile.
 * Le token généré par le widget navigateur est validé auprès de l'API
 * siteverify (avec l'IP du client). Si `TURNSTILE_SECRET_KEY` n'est pas
 * configurée, la vérification est DÉSACTIVÉE et retourne true : le
 * rate limiting Better Auth reste alors la seule barrière anti-bot.
 */

// Secret validé au boot ; absent = fonctionnalité désactivée
import { env } from "@/lib/env";

/** Contrat de réponse de l'API siteverify Cloudflare. */
const siteverifyResponseSchema = z.object({
  success: z.boolean(),
  "error-codes": z.array(z.string()).optional(),
});

// Import différé pour garder le module léger côté client
import { z } from "zod";

/**
 * Vérifie un token Turnstile.
 *
 * @param token - Valeur du champ `cf-turnstile-response` du formulaire.
 * @param ip - IP du client (transmise à Cloudflare pour le scoring).
 * @returns true si le CAPTCHA est validé ou désactivé ; false sinon
 *   (échec réseau traité comme échec de vérification : fail-closed,
 *   une inscription est moins critique qu'un contournement).
 */
export async function verifyTurnstileToken(
  token: string | undefined | null,
  ip: string | undefined,
): Promise<boolean> {
  if (!env.TURNSTILE_SECRET_KEY) return true; // désactivé proprement
  if (!token) return false;

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: env.TURNSTILE_SECRET_KEY,
          response: token,
          ...(ip ? { remoteip: ip } : {}),
        }),
        signal: AbortSignal.timeout(5_000),
      },
    );
    const payload = siteverifyResponseSchema.parse(await res.json());
    if (!payload.success) {
      console.warn(
        "[turnstile] Échec de vérification :",
        payload["error-codes"]?.join(", "),
      );
    }
    return payload.success;
  } catch (err) {
    // Fail-closed : indispo Cloudflare ne doit pas ouvrir un trou anti-bot
    console.error("[turnstile] Erreur de vérification :", err);
    return false;
  }
}
