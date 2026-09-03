/**
 * Tests de la Server Action de changement de langue.
 *
 * Le choix est écrit dans un cookie, jamais dans l'URL : le catalogue
 * n'est pas traduit, et préfixer chaque adresse d'un code de langue
 * créerait autant d'URL concurrentes pour une même fiche.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const cookieMock = vi.hoisted(() => ({ set: vi.fn() }));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieMock),
}));

const cacheMock = vi.hoisted(() => ({ revalidatePath: vi.fn() }));
vi.mock("next/cache", () => cacheMock);

const { setLocaleAction } = await import("./locale");

/** Fabrique le FormData attendu par l'action. */
function form(locale: string): FormData {
  const data = new FormData();
  data.set("locale", locale);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("setLocaleAction", () => {
  it("enregistre une langue proposée dans le cookie", async () => {
    await setLocaleAction(form("ja"));

    expect(cookieMock.set).toHaveBeenCalledWith(
      "locale",
      "ja",
      expect.objectContaining({ path: "/", sameSite: "lax" }),
    );
  });

  it("invalide le rendu, sans quoi la page reste dans l'ancienne langue", () => {
    // Les textes sont produits côté serveur : le cookie seul ne suffit
    // pas à changer ce qui est déjà en cache.
    return setLocaleAction(form("de")).then(() => {
      expect(cacheMock.revalidatePath).toHaveBeenCalledWith("/", "layout");
    });
  });

  it("ignore une valeur qui ne désigne aucune langue proposée", async () => {
    // Le champ vient du navigateur : une valeur arbitraire ne doit pas
    // se retrouver dans `<html lang>`, ni faire échouer le rendu.
    await setLocaleAction(form("xx"));
    await setLocaleAction(form(""));
    await setLocaleAction(form("../../etc/passwd"));

    expect(cookieMock.set).not.toHaveBeenCalled();
    expect(cacheMock.revalidatePath).not.toHaveBeenCalled();
  });
});
