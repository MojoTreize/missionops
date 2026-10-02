import "server-only";

import { channelsFromEnv, type Channel, type ChannelName } from "@missionops/notifications";
import { recipientOf, type OutboxItem, type ServiceContext } from "@missionops/services";

import { getDb } from "@/lib/db";
import { isLocale } from "@/lib/i18n/locales";
import { dictionaries } from "@/lib/i18n/messages";
import { createTranslator, type MessageKey } from "@/lib/i18n/translate";

/**
 * Distribution des notifications (B7.1) : rend le message dans la langue du
 * destinataire, puis l'envoie sur le canal demandé. Les adaptateurs réels
 * (Resend, WhatsApp Cloud, passerelle SMS) s'activent par variables
 * d'environnement ; sinon, repli console.
 */
let channels: Record<ChannelName, Channel> | undefined;

export function getChannels(): Record<ChannelName, Channel> {
  channels ??= channelsFromEnv(process.env);
  return channels;
}

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export async function deliver(ctx: ServiceContext, item: OutboxItem): Promise<void> {
  const recipient = await recipientOf(getDb(), ctx, item.recipientId);
  if (!recipient) throw new Error("recipient_missing");
  const locale = isLocale(recipient.locale) ? recipient.locale : "fr";
  const t = createTranslator(dictionaries[locale]);
  const subject = t(`notifications.template.${item.template}` as MessageKey, item.payload);
  const url = item.payload.missionId
    ? `${appUrl()}/missions/${item.payload.missionId}`
    : `${appUrl()}/notifications`;
  const to = item.channel === "email" ? recipient.email : recipient.phone;
  if (!to) throw new Error("no_address");
  await getChannels()[item.channel].send({ to, subject, text: subject, url });
}
