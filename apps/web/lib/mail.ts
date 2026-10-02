import "server-only";

import { getChannels } from "@/lib/server/notify";

/**
 * Envoi d'e-mails transactionnels (B7.2) : passe par le canal e-mail de
 * `@missionops/notifications` (Resend si `RESEND_API_KEY` et `MAIL_FROM` sont
 * définis, sinon journalisation console).
 */

export interface Mail {
  to: string;
  subject: string;
  text: string;
}

export async function sendMail(mail: Mail): Promise<void> {
  await getChannels().email.send({ to: mail.to, subject: mail.subject, text: mail.text });
}

export function sendMagicLinkEmail(to: string, url: string): Promise<void> {
  return sendMail({
    to,
    subject: "Votre lien de connexion à MissionOps",
    text: `Connectez-vous en ouvrant ce lien (valable 15 minutes) :\n${url}`,
  });
}

export function sendPasswordResetEmail(to: string, url: string): Promise<void> {
  return sendMail({
    to,
    subject: "Réinitialisation de votre mot de passe MissionOps",
    text: `Définissez un nouveau mot de passe via ce lien (valable 1 heure) :\n${url}`,
  });
}

export function sendInvitationEmail(
  to: string,
  url: string,
  organisationName: string,
): Promise<void> {
  return sendMail({
    to,
    subject: `Invitation à rejoindre ${organisationName} sur MissionOps`,
    text: `Vous avez été invité à rejoindre « ${organisationName} ». Acceptez via ce lien :\n${url}`,
  });
}
