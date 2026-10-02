import { describe, expect, it } from "vitest";

import {
  ConsoleChannel,
  DeliveryError,
  ResendEmailChannel,
  WhatsAppChannel,
  channelsFromEnv,
  normalizePhone,
} from "./index";

function fakeFetch(status: number, calls: { url: string; body: unknown }[]) {
  return (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), body: JSON.parse(String(init?.body ?? "{}")) });
    return new Response("{}", { status });
  }) as typeof fetch;
}

describe("canaux de notification", () => {
  it("normalise les numéros guinéens", () => {
    expect(normalizePhone("+224 620 12 34 56")).toBe("224620123456");
    expect(normalizePhone("00224620123456")).toBe("224620123456");
    expect(normalizePhone("620123456")).toBe("224620123456");
  });

  it("envoie un e-mail via Resend et classe les erreurs", async () => {
    const calls: { url: string; body: unknown }[] = [];
    await new ResendEmailChannel(
      "k",
      "MissionOps <no-reply@missionops.app>",
      fakeFetch(200, calls),
    ).send({
      to: "a@b.gn",
      subject: "Sujet",
      text: "Corps",
      url: "https://x",
    });
    expect(calls[0]?.url).toBe("https://api.resend.com/emails");
    expect((calls[0]?.body as { text: string }).text).toContain("https://x");
    const permanent = await new ResendEmailChannel("k", "f", fakeFetch(422, []))
      .send({ to: "x", subject: "s", text: "t" })
      .catch((e: DeliveryError) => e);
    expect(permanent).toBeInstanceOf(DeliveryError);
    expect((permanent as DeliveryError).permanent).toBe(true);
    const transient = await new ResendEmailChannel("k", "f", fakeFetch(503, []))
      .send({ to: "x", subject: "s", text: "t" })
      .catch((e: DeliveryError) => e);
    expect((transient as DeliveryError).permanent).toBe(false);
  });

  it("utilise un modèle WhatsApp approuvé", async () => {
    const calls: { url: string; body: unknown }[] = [];
    await new WhatsAppChannel("tok", "123", undefined, undefined, fakeFetch(200, calls)).send({
      to: "+224620123456",
      subject: "Mission validée",
      text: "MIS-2026-0001",
    });
    const body = calls[0]?.body as { type: string; to: string };
    expect(body.type).toBe("template");
    expect(body.to).toBe("224620123456");
  });

  it("retombe sur la console sans configuration", async () => {
    const channels = channelsFromEnv({});
    expect(channels.email).toBeInstanceOf(ConsoleChannel);
    const lines: string[] = [];
    await new ConsoleChannel("sms", (l) => lines.push(l)).send({
      to: "1",
      subject: "s",
      text: "t",
    });
    expect(lines[0]).toContain("[sms]");
  });
});
