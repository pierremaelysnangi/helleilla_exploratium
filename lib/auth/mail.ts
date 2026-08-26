/**
 * Envoi d'emails transactionnels (réinitialisation de mot de passe).
 *
 * Mode de dégradation :
 * - SMTP configuré (SMTP_HOST + MAIL_FROM) -> envoi réel via nodemailer ;
 * - sinon -> le contenu (lien signé) est journalisé en console : pratique
 *   en dev, et aucun crash en prod si le SMTP tombe (l'utilisateur peut
 *   relancer la demande).
 *
 * Règle stricte projet : ce mail ne contient QUE du texte transactionnel
 * (aucun média généré).
 */

// Transport SMTP nodemailer (lazy pour éviter l'instanciation inutile)
import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/lib/env";

/** Indique si l'envoi réel est possible. */
export function isMailConfigured(): boolean {
  return Boolean(env.SMTP_HOST && env.MAIL_FROM);
}

/** Transport partagé, créé une seule fois. */
let transporter: Transporter | null = null;
function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth:
        env.SMTP_USER && env.SMTP_PASS
          ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
          : undefined,
    });
  }
  return transporter;
}

/**
 * Envoie l'email de réinitialisation de mot de passe.
 *
 * @param to - Email du destinataire.
 * @param resetUrl - URL absolue signée par Better Auth (/reset-password?token=…).
 */
export async function sendResetPasswordEmail(
  to: string,
  resetUrl: string,
): Promise<void> {
  const subject =
    "Réinitialisation de votre mot de passe — Helleilla Exploratium";

  // Dégradation dev/sans SMTP : lien en console uniquement
  if (!isMailConfigured()) {
    console.info(
      `[mail] SMTP non configuré — lien de réinitialisation pour ${to} :\n${resetUrl}`,
    );
    return;
  }

  await getTransporter().sendMail({
    from: env.MAIL_FROM,
    to,
    subject,
    text: [
      "Bonjour,",
      "",
      "Vous avez demandé la réinitialisation de votre mot de passe.",
      "Cliquez sur le lien ci-dessous (valide une heure) :",
      resetUrl,
      "",
      "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.",
      "",
      "— Helleilla Exploratium",
    ].join("\n"),
    // Pas de HTML riche ni de médias : texte transactionnel seul
  });
}
