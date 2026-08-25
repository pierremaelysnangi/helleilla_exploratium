/**
 * Validation zod des contributions (workflow contributeur/modérateur).
 * Définit le payload d'un groupe soumis, les preuves obligatoires et
 * les transitions de statut autorisées.
 */

// Validation de schéma
import { z } from "zod";
// Réutilisation de la validation métier existante (source unique)
import { bandShape, withYearRule } from "@/lib/validations/band";

/** Types de preuves exigées pour lutter contre le contenu généré par IA. */
export const evidenceKindSchema = z.enum([
  "official-site",
  "label",
  "press",
  "musicbrainz",
  "discogs",
  "other",
]);

export type EvidenceKind = z.infer<typeof evidenceKindSchema>;

/** Une preuve : lien vérifiable + note explicative optionnelle. */
export const evidenceItemSchema = z.object({
  kind: evidenceKindSchema,
  url: z.string().url().max(500),
  note: z.string().trim().max(500).optional(),
});

export type EvidenceItem = z.infer<typeof evidenceItemSchema>;

/**
 * Payload du groupe soumis : même forme que createBandSchema (source
 * unique `bandShape`), enrichi des références externes connues.
 */
export const contributionPayloadSchema = withYearRule(
  z
    .object({
      ...bandShape,
      /** Références officielles déjà identifiées par le contributeur. */
      refs: z
        .array(
          z.object({
            provider: z.enum(["musicbrainz", "discogs", "wikidata"]),
            externalId: z.string().min(1).max(200),
          }),
        )
        .max(5)
        .optional(),
    })
    .strict(),
);

export type ContributionPayloadInput = z.input<
  typeof contributionPayloadSchema
>;

/**
 * Création d'une contribution : payload + au moins DEUX preuves dont
 * une référence officielle vérifiable (musicbrainz/discogs/label).
 * C'est la barrière procédurale anti-contenu-IA : un dossier sans
 * source vérifiable n'entre pas dans la file de modération.
 */
export const createContributionSchema = z
  .object({
    type: z.enum(["band_create", "band_update"]).default("band_create"),
    /** Groupe cible si type = band_update. */
    targetBandId: z.string().uuid().optional(),
    payload: contributionPayloadSchema,
    evidence: z.array(evidenceItemSchema).max(20),
  })
  .refine((data) => data.evidence.length >= 2, {
    message:
      "Au moins deux preuves sont requises (dont une référence officielle vérifiable)",
    path: ["evidence"],
  })
  .refine(
    (data) =>
      data.evidence.some(
        (e) =>
          e.kind === "musicbrainz" ||
          e.kind === "discogs" ||
          e.kind === "label" ||
          e.kind === "official-site",
      ),
    {
      message:
        "Une preuve à caractère officiel est requise (MusicBrainz, Discogs, label ou site officiel)",
      path: ["evidence"],
    },
  )
  .refine((data) => data.type !== "band_update" || data.targetBandId, {
    message: "targetBandId requis pour une contribution band_update",
    path: ["targetBandId"],
  });

export type CreateContributionInput = z.input<typeof createContributionSchema>;

/** Demande de preuves émise par le modérateur. */
export const requestEvidenceSchema = z.object({
  reviewNotes: z.string().trim().min(10).max(2000),
});

/** Ajout de preuves par le contributeur après demande. */
export const addEvidenceSchema = z.object({
  evidence: z.array(evidenceItemSchema).min(1).max(20),
});

/** Changement de statut par le modérateur/admin. */
export const transitionStatusSchema = z.object({
  status: z.enum(["approved", "evidence_requested", "rejected"]),
});
