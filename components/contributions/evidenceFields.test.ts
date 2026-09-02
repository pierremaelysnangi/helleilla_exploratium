/**
 * Tests des utilitaires de l'éditeur de preuves.
 *
 * Ces fonctions pilotent le verrou de soumission du formulaire : elles
 * doivent porter exactement la même règle que le serveur (deux preuves
 * dont une officielle), sans quoi l'interface laisserait partir un dossier
 * voué au refus — en consommant l'un des cinq envois horaires autorisés.
 */
import { describe, it, expect } from "vitest";
import {
  emptyEvidence,
  toEvidenceItems,
  evidenceDiagnostics,
  type EvidenceDraft,
} from "./evidenceFields";
import { createContributionSchema } from "@/lib/validations/contribution";

/** Fabrique un brouillon de preuve. */
function draft(overrides: Partial<EvidenceDraft> = {}): EvidenceDraft {
  return { ...emptyEvidence(), url: "https://exemple.test", ...overrides };
}

describe("toEvidenceItems", () => {
  it("ignore les lignes sans URL", () => {
    const items = toEvidenceItems([draft(), draft({ url: "   " })]);
    expect(items).toHaveLength(1);
  });

  it("nettoie les espaces autour de l'URL", () => {
    const items = toEvidenceItems([draft({ url: "  https://a.test  " })]);
    expect(items[0]?.url).toBe("https://a.test");
  });

  it("omet la note quand elle est vide", () => {
    const items = toEvidenceItems([draft({ note: "   " })]);
    expect(items[0]).not.toHaveProperty("note");
  });

  it("conserve une note renseignée", () => {
    const items = toEvidenceItems([draft({ note: " page du label " })]);
    expect(items[0]?.note).toBe("page du label");
  });
});

describe("evidenceDiagnostics", () => {
  it("refuse une seule preuve, même officielle", () => {
    const d = evidenceDiagnostics([draft({ kind: "musicbrainz" })]);
    expect(d.enough).toBe(false);
    expect(d.valid).toBe(false);
  });

  it("refuse deux preuves sans aucune source officielle", () => {
    const d = evidenceDiagnostics([
      draft({ kind: "press" }),
      draft({ kind: "other" }),
    ]);
    expect(d.enough).toBe(true);
    expect(d.official).toBe(false);
    expect(d.valid).toBe(false);
  });

  it("accepte deux preuves dont une officielle", () => {
    const d = evidenceDiagnostics([
      draft({ kind: "discogs" }),
      draft({ kind: "press" }),
    ]);
    expect(d.valid).toBe(true);
  });

  it("ne compte pas les lignes vides encore en cours de saisie", () => {
    const d = evidenceDiagnostics([
      draft({ kind: "musicbrainz" }),
      draft({ kind: "label", url: "" }),
    ]);
    expect(d.enough).toBe(false);
  });
});

describe("cohérence avec la validation serveur", () => {
  const payload = { name: "Necrofrost", slug: "necrofrost" };

  /** Un jeu jugé valide côté client doit passer le schéma serveur. */
  function serverAccepts(drafts: EvidenceDraft[]) {
    return createContributionSchema.safeParse({
      type: "band_create",
      payload,
      evidence: toEvidenceItems(drafts),
    }).success;
  }

  it.each([
    ["une seule preuve", [draft({ kind: "musicbrainz" })]],
    [
      "deux preuves non officielles",
      [draft({ kind: "press" }), draft({ kind: "other" })],
    ],
    [
      "deux preuves dont une officielle",
      [draft({ kind: "label" }), draft({ kind: "press" })],
    ],
  ])("verdict identique client/serveur : %s", (_label, drafts) => {
    // Le verrou d'interface ne doit ni être plus laxiste (dossier refusé
    // après envoi) ni plus strict (soumission bloquée à tort) que l'API.
    expect(evidenceDiagnostics(drafts).valid).toBe(serverAccepts(drafts));
  });
});
