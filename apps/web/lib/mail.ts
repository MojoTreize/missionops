import "server-only";

/**
 * Envoi d'e-mails. Aucune passerelle réelle n'est câblée à ce stade : le
 * transport par défaut journalise le message (et l'URL du lien) côté serveur.
 * Un vrai transport (Resend, SMTP…) sera branché en remplaçant `sendMail` sans
 * toucher aux appelants.
 */

export interface Mail {
  to: string;
  subject: string;
  text: string;
}

export async function sendMail(mail: Mail): Promise<void> {
  // Transport de développement : trace lisible dans les journaux du serveur.
  console.info(`[mail] → ${mail.to} : ${mail.subject}\n${mail.text}`);
  return Promise.resolve();
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
