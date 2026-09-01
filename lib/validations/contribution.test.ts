/**
 * Tests du contrat de validation des contributions.
 * Cible principale : la barrière anti-contenu-IA de `createContributionSchema`
 * (règle stricte d'AGENTS.md) — un dossier n'entre dans la file de modération
 * qu'avec au moins deux preuves DONT une référence officielle vérifiable.
 * Ces refus n'étaient jusqu'ici jamais exercés.
 */

// API Vitest : suites, tests et assertions
import { describe, it, expect } from "vitest";
// Schémas sous test (source unique partagée serveur/client/OpenAPI)
import {
  createContributionSchema,
  evidenceItemSchema,
  type EvidenceKind,
} from "./contribution";

/** Payload de groupe minimal valide, réutilisé par tous les cas. */
const payload = { name: "Necrofrost", slug: "necrofrost" };

/** Fabrique une preuve du type demandé. */
function evidence(kind: EvidenceKind, url = "https://exemple.test/source") {
  return { kind, url };
}

/**
 * Construit un dossier de contribution valide, surchargeable champ à champ.
 */
function contribution(overrides: Record<string, unknown> = {}) {
  return {
    type: "band_create",
    payload,
    evidence: [evidence("musicbrainz"), evidence("press")],
    ...overrides,
  };
}

/** Extrait les chemins d'erreur d'un parse échoué. */
function issuePaths(input: unknown): string[] {
  const res = createContributionSchema.safeParse(input);
  if (res.success) return [];
  return res.error.issues.map((i) => i.path.join("."));
}

describe("createContributionSchema — barrière anti-contenu-IA", () => {
  it("accepte un dossier avec deux preuves dont une officielle", () => {
    expect(createContributionSchema.safeParse(contribution()).success).toBe(
      true,
    );
  });

  it("rejette un dossier avec une seule preuve", () => {
    const input = contribution({ evidence: [evidence("musicbrainz")] });
    const res = createContributionSchema.safeParse(input);

    expect(res.success).toBe(false);
    expect(issuePaths(input)).toContain("evidence");
  });

  it("rejette deux preuves sans aucune source officielle", () => {
    // « press » et « other » sont recevables comme compléments, jamais comme
    // unique justification : c'est ce qui empêche un dossier fabriqué
    // d'entrer dans la file de modération.
    const input = contribution({
      evidence: [evidence("press"), evidence("other")],
    });
    const res = createContributionSchema.safeParse(input);

    expect(res.success).toBe(false);
    expect(issuePaths(input)).toContain("evidence");
  });

  it.each(["musicbrainz", "discogs", "label", "official-site"] as const)(
    "accepte « %s » comme preuve officielle",
    (kind) => {
      const input = contribution({
        evidence: [evidence(kind), evidence("other")],
      });
      expect(createContributionSchema.safeParse(input).success).toBe(true);
    },
  );
});

describe("createContributionSchema — cohérence du dossier", () => {
  it("exige targetBandId pour une contribution band_update", () => {
    const input = contribution({ type: "band_update" });
    const res = createContributionSchema.safeParse(input);

    expect(res.success).toBe(false);
    expect(issuePaths(input)).toContain("targetBandId");
  });

  it("accepte une band_update accompagnée de son targetBandId", () => {
    const input = contribution({
      type: "band_update",
      targetBandId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(createContributionSchema.safeParse(input).success).toBe(true);
  });

  it("rejette un champ inconnu dans le payload (schéma strict)", () => {
    const input = contribution({
      payload: { ...payload, championDuMonde: "1998" },
    });
    expect(createContributionSchema.safeParse(input).success).toBe(false);
  });

  it("rejette une dissolution antérieure à la formation", () => {
    const input = contribution({
      payload: { ...payload, formedYear: 1995, dissolvedYear: 1990 },
    });
    expect(createContributionSchema.safeParse(input).success).toBe(false);
  });
});

describe("evidenceItemSchema", () => {
  it("exige une URL valide", () => {
    expect(
      evidenceItemSchema.safeParse({ kind: "discogs", url: "pas-une-url" })
        .success,
    ).toBe(false);
  });

  it("refuse un type de preuve hors nomenclature", () => {
    expect(
      evidenceItemSchema.safeParse({
        kind: "generated-by-ai",
        url: "https://exemple.test",
      }).success,
    ).toBe(false);
  });

  it("accepte une note explicative optionnelle", () => {
    expect(
      evidenceItemSchema.safeParse({
        kind: "label",
        url: "https://exemple.test",
        note: "Page officielle du label",
      }).success,
    ).toBe(true);
  });
});
