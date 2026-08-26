/**
 * Tests du mailer transactionnel (lib/auth/mail.ts).
 * nodemailer est mocké : vérifie le mode dégradé (console sans SMTP),
 * la configuration du transport et le contenu de l'email de reset.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Env pilotable (SMTP configuré ou non).
const envMock = vi.hoisted(() => ({
  SMTP_HOST: undefined as string | undefined,
  SMTP_PORT: 587,
  SMTP_USER: undefined as string | undefined,
  SMTP_PASS: undefined as string | undefined,
  MAIL_FROM: undefined as string | undefined,
}));
vi.mock("@/lib/env", () => ({ env: envMock }));

// Espions transport nodemailer.
const mocks = vi.hoisted(() => {
  const sendMail = vi.fn(
    async (_mail: {
      from?: string;
      to?: string;
      subject?: string;
      text?: string;
    }) => undefined,
  );
  return {
    sendMail,
    createTransport: vi.fn(() => ({ sendMail })),
  };
});
vi.mock("nodemailer", () => ({
  default: { createTransport: mocks.createTransport },
}));

const { sendResetPasswordEmail, isMailConfigured } = await import("./mail");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("isMailConfigured", () => {
  it("false sans SMTP_HOST ni MAIL_FROM", () => {
    expect(isMailConfigured()).toBe(false);
  });

  it("true quand host + from sont définis", () => {
    envMock.SMTP_HOST = "smtp.example.com";
    envMock.MAIL_FROM = "no-reply@example.com";
    expect(isMailConfigured()).toBe(true);
    envMock.SMTP_HOST = undefined;
    envMock.MAIL_FROM = undefined;
  });
});

describe("sendResetPasswordEmail", () => {
  it("ne crash pas et journalise le lien sans configuration SMTP", async () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    await sendResetPasswordEmail(
      "user@test.dev",
      "https://app/reset?token=abc",
    );
    expect(mocks.sendMail).not.toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalledWith(
      expect.stringContaining("/reset?token=abc"),
    );
    infoSpy.mockRestore();
  });

  it("envoie un email texte transactionnel via SMTP configuré", async () => {
    envMock.SMTP_HOST = "smtp.example.com";
    envMock.SMTP_USER = "mailer";
    envMock.SMTP_PASS = "secret";
    envMock.MAIL_FROM = "no-reply@example.com";

    await sendResetPasswordEmail(
      "user@test.dev",
      "https://app/reset?token=xyz",
    );

    const arg = mocks.sendMail.mock.calls[0][0];
    expect(arg.from).toBe("no-reply@example.com");
    expect(arg.to).toBe("user@test.dev");
    expect(arg.text).toContain("https://app/reset?token=xyz");
    // Texte brut uniquement : pas de média généré ni de HTML riche
    expect("html" in arg).toBe(false);

    envMock.SMTP_HOST = undefined;
    envMock.SMTP_PASS = undefined;
    envMock.MAIL_FROM = undefined;
  });
});
