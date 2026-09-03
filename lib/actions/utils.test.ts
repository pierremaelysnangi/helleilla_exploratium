/**
 * Tests du gestionnaire d'erreurs commun aux Server Actions.
 * Invariant vérifié : une exception inattendue est journalisée côté serveur
 * mais ne fuit jamais au client — seule une ActionError, dont le message est
 * écrit pour être lu, traverse telle quelle.
 */

// API Vitest : suites, tests, assertions et mocks
import { describe, it, expect, vi, afterEach } from "vitest";
// Fonction sous test
import { handleActionError } from "./utils";
// Erreur métier levée par les gardes RBAC
import { ActionError } from "@/lib/rbac/guards";

// next/headers throw hors contexte Next (importé via la chaîne des gardes)
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
  // La résolution de langue lit le cookie avant l'en-tête : sans ce
  // substitut, toute action qui traduit un message échouerait ici.
  cookies: vi.fn(async () => ({ get: () => undefined })),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn(async () => null) } },
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("handleActionError", () => {
  it("propage tel quel le message d'une ActionError", async () => {
    const res = await handleActionError(
      new ActionError("Permission refusée.", "FORBIDDEN"),
    );
    expect(res).toEqual({ success: false, error: "Permission refusée." });
  });

  it("masque une erreur inattendue et la journalise côté serveur", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await handleActionError(
      new Error("connexion Postgres refusée"),
    );

    expect(res).toEqual({
      success: false,
      error: "Erreur serveur inattendue.",
    });
    // Le détail technique reste au serveur, jamais dans la réponse
    expect(res.error).not.toContain("Postgres");
    expect(spy).toHaveBeenCalledWith("[action]", expect.any(Error));
  });

  it("masque aussi une valeur levée qui n'est pas une Error", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await handleActionError("panne interne");

    expect(res.error).toBe("Erreur serveur inattendue.");
    expect(spy).toHaveBeenCalledWith("[action]", "panne interne");
  });
});
