/**
 * Résolution linguistique du contenu encyclopédique servi par l'API.
 *
 * Les biographies sont écrites par des contributeurs, dans une langue,
 * et traduites au fil de l'eau. L'API en sert UNE seule : celle que le
 * client demande. Deux raisons de trancher côté serveur plutôt que de
 * transmettre toutes les traductions :
 *
 * - la charge utile. Quinze versions d'une biographie multipliées par
 *   une page de vingt groupes, pour n'en lire qu'une ;
 * - la mise en cache. La langue voyage dans la QUERY, pas dans un
 *   en-tête : deux langues sont deux URL, donc deux entrées de cache
 *   distinctes. Faire varier la réponse sur `Accept-Language` ou sur un
 *   cookie servirait la version d'un autre visiteur, le cache de
 *   données de Next ne les prenant pas en compte.
 */

import { z } from "zod";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { localizedText } from "@/lib/i18n/content";

/**
 * Paramètre de langue, facultatif.
 *
 * Absent — un client externe, un appel direct —, le contenu est servi
 * dans sa langue d'origine plutôt que dans une langue devinée.
 */
export const localeQuerySchema = z.object({
  locale: z
    .string()
    .refine(isLocale, { message: "Langue inconnue" })
    .optional(),
});

/** Une ligne de groupe telle qu'elle sort de la base. */
type BandWithTranslations = {
  bio: string | null;
  bioTranslations: Record<string, string>;
};

/**
 * Projette une ligne de groupe pour l'API : la biographie est résolue,
 * le dictionnaire des traductions retiré.
 */
export function localizeBand<T extends BandWithTranslations>(
  row: T,
  locale: Locale | undefined,
): Omit<T, "bioTranslations"> {
  const { bioTranslations, ...band } = row;
  return {
    ...band,
    bio: locale ? localizedText(row.bio, bioTranslations, locale) : row.bio,
  };
}
