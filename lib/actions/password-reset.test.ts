/**
 * Tests des Server Actions de réinitialisation de mot de passe.
 * Invariant central : la demande de réinitialisation répond TOUJOURS le même
 * message — email invalide, compte inexistant ou envoi en échec sont
 * indiscernables, sans quoi le formulaire deviendrait un oracle d'existence
 * de comptes.
 */

// API Vitest : suites, tests, assertions, mocks et hooks
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
// Actions sous test
import {
  requestPasswordResetAction,
  resetPasswordAction,
} from "./password-reset";

// En-têtes pilotables (extraction d'IP transmise au CAPTCHA)
const req = vi.hoisted(() => ({ headers: new Headers() }));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => req.headers) }));

// API Better Auth
const api = vi.hoisted(() => ({
  requestPasswordReset: vi.fn(async () => ({ status: true })),
  resetPassword: vi.fn(async () => ({ status: true })),
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

/** Message unique renvoyé par la demande, succès ou non. */
const MESSAGE_NEUTRE = "Si un compte existe, un email a été envoyé.";

/** Token de reset de longueur valide (10-200 caractères). */
const TOKEN = "a".repeat(32);

/** Fabrique un FormData de demande de réinitialisation. */
function requestForm(overrides: Record<string, string> = {}) {
  const fd = new FormData();
  fd.set("email", "nyx@exemple.test");
  fd.set("cf-turnstile-response", "jeton-captcha");
  for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
  return fd;
}

/** Fabrique un FormData de nouveau mot de passe. */
function resetForm(overrides: Record<string, string> = {}) {
  const fd = new FormData();
  fd.set("token", TOKEN);
  fd.set("password", "TombeauDeGivre88");
  for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  req.headers = new Headers();
  captcha.verifyTurnstileToken.mockResolvedValue(true);
  // La variable est présente dans .env.local mais absente en CI : on la
  // fixe explicitement pour que le test ne dépende pas de l'environnement.
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://helleilla.test");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("requestPasswordResetAction — anti-énumération", () => {
  it("répond le message neutre pour un email invalide, sans rien envoyer", async () => {
    const res = await requestPasswordResetAction(
      {},
      requestForm({
        email: "pas-un-email",
      }),
    );

    expect(res.success).toBe(MESSAGE_NEUTRE);
    expect(res.error).toBeUndefined();
    expect(api.requestPasswordReset).not.toHaveBeenCalled();
  });

  it("répond le même message neutre quand l'envoi échoue", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    api.requestPasswordReset.mockRejectedValueOnce(
      new Error("SMTP indisponible"),
    );

    const res = await requestPasswordResetAction({}, requestForm());

    expect(res.success).toBe(MESSAGE_NEUTRE);
    expect(res.error).toBeUndefined();
    // La panne est journalisée mais jamais exposée
    expect(warn).toHaveBeenCalledWith("[forgot-password]", "SMTP indisponible");
  });

  it("journalise une exception qui n'est pas une Error", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    api.requestPasswordReset.mockRejectedValueOnce("panne interne");

    const res = await requestPasswordResetAction({}, requestForm());

    expect(res.success).toBe(MESSAGE_NEUTRE);
    expect(warn).toHaveBeenCalledWith("[forgot-password]", "panne interne");
  });

  it("refuse quand la vérification Turnstile échoue", async () => {
    captcha.verifyTurnstileToken.mockResolvedValueOnce(false);

    const res = await requestPasswordResetAction({}, requestForm());

    expect(res.error).toBe("Vérification anti-robot échouée, réessayez");
    expect(api.requestPasswordReset).not.toHaveBeenCalled();
  });
});

describe("requestPasswordResetAction — IP et lien de retour", () => {
  it("transmet au CAPTCHA la première IP de x-forwarded-for, trimée", async () => {
    req.headers = new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" });

    await requestPasswordResetAction({}, requestForm());

    expect(captcha.verifyTurnstileToken).toHaveBeenCalledWith(
      "jeton-captcha",
      "203.0.113.7",
    );
  });

  it("retombe sur x-real-ip quand x-forwarded-for est absent", async () => {
    req.headers = new Headers({ "x-real-ip": "198.51.100.4" });

    await requestPasswordResetAction({}, requestForm());

    expect(captcha.verifyTurnstileToken).toHaveBeenCalledWith(
      "jeton-captcha",
      "198.51.100.4",
    );
  });

  it("construit le lien de retour depuis NEXT_PUBLIC_APP_URL", async () => {
    await requestPasswordResetAction({}, requestForm());

    expect(api.requestPasswordReset).toHaveBeenCalledWith({
      body: {
        email: "nyx@exemple.test",
        redirectTo: "https://helleilla.test/reset-password",
      },
      headers: expect.any(Headers),
    });
  });

  it("retombe sur localhost quand NEXT_PUBLIC_APP_URL est absente", async () => {
    // `undefined` supprime réellement la variable ; une chaîne vide ne
    // déclencherait pas le `??` et produirait un lien relatif cassé.
    vi.stubEnv("NEXT_PUBLIC_APP_URL", undefined);

    await requestPasswordResetAction({}, requestForm());

    expect(api.requestPasswordReset).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          redirectTo: "http://localhost:3000/reset-password",
        }),
      }),
    );
  });
});

describe("resetPasswordAction", () => {
  it("refuse un token trop court", async () => {
    const res = await resetPasswordAction({}, resetForm({ token: "abc" }));

    expect(res.error).toBe("Mot de passe invalide (12 caractères minimum)");
    expect(api.resetPassword).not.toHaveBeenCalled();
  });

  it("refuse un mot de passe de moins de 12 caractères", async () => {
    const res = await resetPasswordAction({}, resetForm({ password: "court" }));

    expect(res.error).toBe("Mot de passe invalide (12 caractères minimum)");
    expect(api.resetPassword).not.toHaveBeenCalled();
  });

  it("refuse un mot de passe figurant dans la liste noire", async () => {
    const res = await resetPasswordAction(
      {},
      resetForm({ password: "motdepasse123" }),
    );

    expect(res.error).toBe(
      "Ce mot de passe figure dans des fuites connues, choisissez-en un autre",
    );
    expect(api.resetPassword).not.toHaveBeenCalled();
  });

  it("masque le détail technique quand le token est refusé", async () => {
    api.resetPassword.mockRejectedValueOnce(new Error("token expired"));

    const res = await resetPasswordAction({}, resetForm());

    expect(res.error).toBe("Lien invalide ou expiré — refaites une demande");
    expect(res.error).not.toMatch(/expired/i);
  });

  it("confirme la mise à jour après un reset valide", async () => {
    const res = await resetPasswordAction({}, resetForm());

    expect(res.success).toBe(
      "Mot de passe mis à jour. Vous pouvez vous connecter.",
    );
    expect(api.resetPassword).toHaveBeenCalledWith({
      body: { newPassword: "TombeauDeGivre88", token: TOKEN },
      headers: expect.any(Headers),
    });
  });
});
