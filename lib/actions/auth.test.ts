/**
 * Tests des Server Actions d'authentification (lib/actions/auth.ts).
 * Vérifie la chaîne de sécurité appliquée AVANT Better Auth (validation zod,
 * CAPTCHA Turnstile, liste noire) et surtout l'invariant anti-énumération :
 * aucun message d'erreur ne doit permettre de distinguer un compte existant
 * d'un compte inexistant.
 *
 * `redirect()` est mocké pour LEVER, comme le vrai : une action qui réussit
 * rejette donc sa promesse, une action qui échoue la résout avec `{ error }`.
 */

// API Vitest : suites, tests, assertions, mocks et hooks
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
// Actions sous test
import { signUpAction, signInAction, signOutAction } from "./auth";

/**
 * Mock de `redirect` : reproduit le contrat de Next (interruption par une
 * exception à digest). Un no-op laisserait passer du code mort en production.
 */
const nav = vi.hoisted(() => ({
  redirect: vi.fn((url: string): never => {
    const err = new Error("NEXT_REDIRECT") as Error & { digest: string };
    err.digest = `NEXT_REDIRECT;replace;${url};307;`;
    throw err;
  }),
}));

vi.mock("next/navigation", () => ({ redirect: nav.redirect }));

// En-têtes pilotables : signUpAction appelle headers() deux fois, un
// mockResolvedValueOnce ne viserait que le premier appel.
const req = vi.hoisted(() => ({ headers: new Headers() }));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => req.headers) }));

// API Better Auth : chaque test pilote le succès ou l'échec voulu
const api = vi.hoisted(() => ({
  signUpEmail: vi.fn(async () => ({ token: "t", user: { id: "u1" } })),
  signInEmail: vi.fn(async () => ({ token: "t", user: { id: "u1" } })),
  signOut: vi.fn(async () => ({ success: true })),
  getSession: vi.fn(async () => null),
}));
vi.mock("@/lib/auth", () => ({ auth: { api } }));

// Turnstile mocké : évite d'importer lib/env.ts (validation zod au boot)
const captcha = vi.hoisted(() => ({
  verifyTurnstileToken: vi.fn(async () => true),
}));
vi.mock("@/lib/auth/turnstile", () => ({
  verifyTurnstileToken: captcha.verifyTurnstileToken,
}));

// `@/lib/auth/password-policy` n'est PAS mocké : c'est un module pur, et on
// veut exercer la vraie liste noire.

/** Fabrique un FormData d'inscription valide, surchargeable. */
function signUpForm(overrides: Record<string, string> = {}) {
  const fd = new FormData();
  fd.set("name", "Nyx");
  fd.set("email", "nyx@exemple.test");
  fd.set("password", "TombeauDeGivre88");
  fd.set("cf-turnstile-response", "jeton-captcha");
  for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
  return fd;
}

/** Fabrique un FormData de connexion valide, surchargeable. */
function signInForm(overrides: Record<string, string> = {}) {
  const fd = new FormData();
  fd.set("email", "nyx@exemple.test");
  fd.set("password", "TombeauDeGivre88");
  for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
  return fd;
}

/** Affirme que l'action a redirigé vers `to` (chemin de succès). */
async function expectRedirect(p: Promise<unknown>, to: string) {
  await expect(p).rejects.toThrowError(/NEXT_REDIRECT/);
  expect(nav.redirect).toHaveBeenCalledWith(to);
}

beforeEach(() => {
  vi.clearAllMocks();
  req.headers = new Headers();
  captcha.verifyTurnstileToken.mockResolvedValue(true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("signUpAction", () => {
  it("refuse un formulaire invalide sans appeler Better Auth", async () => {
    const res = await signUpAction({}, signUpForm({ password: "trop court" }));

    expect(res.error).toBe(
      "Formulaire invalide (12 caractères minimum pour le mot de passe)",
    );
    expect(api.signUpEmail).not.toHaveBeenCalled();
    expect(nav.redirect).not.toHaveBeenCalled();
  });

  it("refuse quand la vérification Turnstile échoue", async () => {
    captcha.verifyTurnstileToken.mockResolvedValueOnce(false);

    const res = await signUpAction({}, signUpForm());

    expect(res.error).toBe("Vérification anti-robot échouée, réessayez");
    expect(api.signUpEmail).not.toHaveBeenCalled();
  });

  it("transmet au CAPTCHA la première IP de x-forwarded-for, trimée", async () => {
    req.headers = new Headers({
      "x-forwarded-for": "203.0.113.7, 10.0.0.1",
    });

    await expectRedirect(signUpAction({}, signUpForm()), "/");

    expect(captcha.verifyTurnstileToken).toHaveBeenCalledWith(
      "jeton-captcha",
      "203.0.113.7",
    );
  });

  it("retombe sur x-real-ip quand x-forwarded-for est absent", async () => {
    req.headers = new Headers({ "x-real-ip": "198.51.100.4" });

    await expectRedirect(signUpAction({}, signUpForm()), "/");

    expect(captcha.verifyTurnstileToken).toHaveBeenCalledWith(
      "jeton-captcha",
      "198.51.100.4",
    );
  });

  it("refuse un mot de passe figurant dans la liste noire", async () => {
    const res = await signUpAction(
      {},
      signUpForm({ password: "motdepasse123" }),
    );

    expect(res.error).toBe(
      "Ce mot de passe figure dans des fuites connues, choisissez-en un autre",
    );
    expect(api.signUpEmail).not.toHaveBeenCalled();
  });

  it("masque la raison réelle quand Better Auth refuse l'inscription", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    api.signUpEmail.mockRejectedValueOnce(new Error("User already exists"));

    const res = await signUpAction({}, signUpForm());

    // Invariant anti-énumération : le client ne doit pas pouvoir déduire
    // qu'un compte existe déjà pour cette adresse.
    expect(res.error).toBe("Inscription impossible avec ces informations");
    expect(res.error).not.toMatch(/exists/i);
    expect(warn).toHaveBeenCalledWith(
      "[sign-up] Refusé :",
      "User already exists",
    );
    expect(nav.redirect).not.toHaveBeenCalled();
  });

  it("journalise une exception qui n'est pas une Error", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    api.signUpEmail.mockRejectedValueOnce("panne interne");

    const res = await signUpAction({}, signUpForm());

    expect(res.error).toBe("Inscription impossible avec ces informations");
    expect(warn).toHaveBeenCalledWith("[sign-up] Refusé :", "panne interne");
  });

  it("redirige vers / après une inscription réussie", async () => {
    await expectRedirect(signUpAction({}, signUpForm()), "/");

    expect(api.signUpEmail).toHaveBeenCalledWith({
      body: {
        name: "Nyx",
        email: "nyx@exemple.test",
        password: "TombeauDeGivre88",
      },
      headers: expect.any(Headers),
    });
  });
});

describe("signInAction", () => {
  it("renvoie le message générique pour un formulaire invalide", async () => {
    const res = await signInAction({}, signInForm({ email: "pas-un-email" }));

    expect(res.error).toBe("Email ou mot de passe incorrect");
    expect(api.signInEmail).not.toHaveBeenCalled();
  });

  it("renvoie exactement le même message quand Better Auth refuse", async () => {
    const invalide = await signInAction(
      {},
      signInForm({ email: "pas-un-email" }),
    );
    vi.clearAllMocks();
    api.signInEmail.mockRejectedValueOnce(new Error("Invalid credentials"));

    const refuse = await signInAction({}, signInForm());

    // Compte inexistant et mot de passe erroné doivent être indiscernables.
    expect(refuse.error).toBe(invalide.error);
    expect(nav.redirect).not.toHaveBeenCalled();
  });

  it("ne soumet pas la connexion au CAPTCHA", async () => {
    // Décision d'architecture : côté connexion, la barrière est le rate
    // limiting de Better Auth (5 tentatives / 5 min / IP), pas Turnstile.
    await expectRedirect(signInAction({}, signInForm()), "/");
    expect(captcha.verifyTurnstileToken).not.toHaveBeenCalled();
  });

  it("redirige vers / après une connexion réussie", async () => {
    await expectRedirect(signInAction({}, signInForm()), "/");

    expect(api.signInEmail).toHaveBeenCalledWith({
      body: { email: "nyx@exemple.test", password: "TombeauDeGivre88" },
      headers: expect.any(Headers),
    });
  });
});

describe("signOutAction", () => {
  it("révoque la session côté serveur puis redirige vers /sign-in", async () => {
    await expectRedirect(signOutAction(), "/sign-in");

    expect(api.signOut).toHaveBeenCalledWith({
      headers: expect.any(Headers),
    });
  });
});
