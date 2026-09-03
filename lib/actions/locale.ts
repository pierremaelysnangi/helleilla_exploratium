"use server";

/**
 * Server Action de changement de langue.
 *
 * Le choix est écrit dans un cookie plutôt que dans l'URL : le catalogue
 * n'est pas traduit — les biographies, les noms de groupes et de genres
 * restent tels qu'ils ont été contribués —, et préfixer chaque adresse
 * d'un code de langue créerait autant d'URL concurrentes pour une même
 * fiche, au détriment du référencement et des liens partagés.
 *
 * Le cookie n'est pas `httpOnly` : il ne porte aucun secret, et le
 * laisser lisible permettra plus tard de l'ajuster sans aller-retour
 * serveur.
 */

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isLocale } from "@/lib/i18n/locales";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE } from "@/lib/i18n/server";

export async function setLocaleAction(formData: FormData): Promise<void> {
  const requested = String(formData.get("locale") ?? "");
  if (!isLocale(requested)) return;

  (await cookies()).set(LOCALE_COOKIE, requested, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
  });

  // Les textes sont rendus côté serveur : sans invalidation, la page
  // reviendrait dans la langue précédente.
  revalidatePath("/", "layout");
}
