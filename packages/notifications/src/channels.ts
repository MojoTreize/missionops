/**
 * Abstraction des canaux (B7.1). Le code métier ne sait jamais par quel canal
 * part une notification : il enfile un message ; l'envoyeur choisit le canal
 * selon les préférences et les adaptateurs configurés.
 */
export type ChannelName = "email" | "whatsapp" | "sms";

export interface OutgoingMessage {
  to: string;
  subject: string;
  text: string;
  /** Lien d'action principal (ouvert depuis l'e-mail ou le message). */
  url?: string;
}

export interface Channel {
  readonly name: ChannelName;
  send(message: OutgoingMessage): Promise<void>;
}

export class DeliveryError extends Error {
  constructor(
    readonly channel: ChannelName,
    message: string,
    /** Une erreur définitive (adresse invalide) ne doit pas être retentée. */
    readonly permanent = false,
  ) {
    super(message);
    this.name = "DeliveryError";
  }
}

type Fetch = typeof fetch;

/** Journalise au lieu d'envoyer : développement et démonstrations. */
export class ConsoleChannel implements Channel {
  constructor(
    readonly name: ChannelName,
    private readonly log: (line: string) => void = (line) => console.info(line),
  ) {}

  async send(message: OutgoingMessage): Promise<void> {
    this.log(
      `[${this.name}] → ${message.to} : ${message.subject}\n${message.text}${message.url ? `\n${message.url}` : ""}`,
    );
  }
}

/**
 * E-mail transactionnel durci (B7.2) via l'API HTTP de Resend (région UE
 * possible). Délai d'attente, erreurs 4xx définitives, 5xx retentées.
 */
export class ResendEmailChannel implements Channel {
  readonly name = "email" as const;

  constructor(
    private readonly apiKey: string,
    private readonly from: string,
    private readonly http: Fetch = fetch,
  ) {}

  async send(message: OutgoingMessage): Promise<void> {
    const response = await this.http("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${this.apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: this.from,
        to: [message.to],
        subject: message.subject,
        text: message.url ? `${message.text}\n\n${message.url}` : message.text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw new DeliveryError(
        "email",
        `resend_${response.status}`,
        response.status >= 400 && response.status < 500 && response.status !== 429,
      );
    }
  }
}

/**
 * WhatsApp Business (B7.3) via l'API Cloud de Meta. Les messages initiés par
 * l'entreprise doivent utiliser un modèle approuvé : on envoie le modèle
 * générique `missionops_notification` avec le texte en paramètre.
 */
export class WhatsAppChannel implements Channel {
  readonly name = "whatsapp" as const;

  constructor(
    private readonly token: string,
    private readonly phoneNumberId: string,
    private readonly templateName = "missionops_notification",
    private readonly languageCode = "fr",
    private readonly http: Fetch = fetch,
  ) {}

  async send(message: OutgoingMessage): Promise<void> {
    const response = await this.http(
      `https://graph.facebook.com/v20.0/${this.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: { authorization: `Bearer ${this.token}`, "content-type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: normalizePhone(message.to),
          type: "template",
          template: {
            name: this.templateName,
            language: { code: this.languageCode },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: truncate(`${message.subject} — ${message.text}`, 900) },
                ],
              },
            ],
          },
        }),
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!response.ok) {
      throw new DeliveryError("whatsapp", `whatsapp_${response.status}`, response.status === 400);
    }
  }
}

/** SMS via une passerelle HTTP générique (opérateur local) : `POST {to, text}`. */
export class HttpSmsChannel implements Channel {
  readonly name = "sms" as const;

  constructor(
    private readonly endpoint: string,
    private readonly token: string,
    private readonly http: Fetch = fetch,
  ) {}

  async send(message: OutgoingMessage): Promise<void> {
    const response = await this.http(this.endpoint, {
      method: "POST",
      headers: { authorization: `Bearer ${this.token}`, "content-type": "application/json" },
      body: JSON.stringify({
        to: normalizePhone(message.to),
        text: truncate(message.subject, 160),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok)
      throw new DeliveryError("sms", `sms_${response.status}`, response.status === 400);
  }
}

/** Numéro au format international sans « + » (+224 620 00 00 00 → 224620000000). */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits.slice(1);
  if (digits.startsWith("00")) return digits.slice(2);
  // Numéro guinéen local à 9 chiffres.
  if (/^6\d{8}$/.test(digits)) return `224${digits}`;
  return digits;
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

export interface ChannelConfig {
  RESEND_API_KEY?: string;
  MAIL_FROM?: string;
  WHATSAPP_TOKEN?: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
  SMS_ENDPOINT?: string;
  SMS_TOKEN?: string;
}

/** Canaux configurés à partir de l'environnement ; repli console sinon. */
export function channelsFromEnv(
  env: ChannelConfig & Record<string, string | undefined>,
): Record<ChannelName, Channel> {
  return {
    email:
      env.RESEND_API_KEY && env.MAIL_FROM
        ? new ResendEmailChannel(env.RESEND_API_KEY, env.MAIL_FROM)
        : new ConsoleChannel("email"),
    whatsapp:
      env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID
        ? new WhatsAppChannel(env.WHATSAPP_TOKEN, env.WHATSAPP_PHONE_NUMBER_ID)
        : new ConsoleChannel("whatsapp"),
    sms:
      env.SMS_ENDPOINT && env.SMS_TOKEN
        ? new HttpSmsChannel(env.SMS_ENDPOINT, env.SMS_TOKEN)
        : new ConsoleChannel("sms"),
  };
}
