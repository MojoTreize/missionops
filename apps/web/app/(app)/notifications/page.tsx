import { Bell } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { getPreferences, inbox } from "@missionops/services";

import { ActionForm } from "@/components/forms/action-form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDb } from "@/lib/db";
import { formatDate } from "@/lib/i18n/format";
import { getT } from "@/lib/i18n/server";
import { serviceContext } from "@/lib/server/context";

import { markAllReadAction, savePreferencesAction } from "../organizations/settings-actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t("notifications.title")} — MissionOps` };
}

/** Centre de notifications (B2.9) et préférences de canaux (B7.4). */
export default async function NotificationsPage() {
  const ctx = await serviceContext();
  const db = getDb();
  const { t, locale } = await getT();
  const [items, prefs] = await Promise.all([inbox(db, ctx, 50), getPreferences(db, ctx)]);
  const unread = items.filter((i) => !i.readAt).length;
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
            {t("notifications.title")}
          </h1>
          {unread > 0 ? (
            <p className="mt-1.5 text-[0.95rem] text-muted">
              {t("notifications.unread", { count: unread })}
            </p>
          ) : null}
        </div>
        {unread > 0 ? (
          <form action={markAllReadAction}>
            <Button type="submit" variant="secondary" size="sm">
              {t("notifications.markAllRead")}
            </Button>
          </form>
        ) : null}
      </div>
      {items.length === 0 ? (
        <EmptyState icon={<Bell aria-hidden />} title={t("notifications.empty")} />
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface shadow-xs">
          {items.map((n) => (
            <li
              key={n.id}
              className={`flex items-start justify-between gap-3 px-4 py-3 ${n.readAt ? "" : "bg-field-soft/40"}`}
            >
              <div className="flex flex-col">
                <span className="text-sm">
                  {t(`notifications.template.${n.template}`, n.payload)}
                </span>
                <span className="text-xs text-muted">
                  {formatDate(n.createdAt, locale, { dateStyle: "medium", timeStyle: "short" })}
                </span>
              </div>
              {n.payload.missionId ? (
                <Link
                  href={`/missions/${n.payload.missionId}`}
                  className="text-sm text-field hover:underline"
                >
                  {t("notifications.open")}
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface shadow-xs p-4">
        <h2 className="font-semibold">{t("notifications.preferences")}</h2>
        <p className="text-sm text-muted">{t("notifications.preferencesDescription")}</p>
        <ActionForm
          action={savePreferencesAction}
          submitLabel={t("notifications.savePreferences")}
          variant="secondary"
        >
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="email" defaultChecked={prefs.email} />
            {t("notifications.email")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="whatsapp" defaultChecked={prefs.whatsapp} />
            {t("notifications.whatsapp")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="sms" defaultChecked={prefs.sms} />
            {t("notifications.sms")}
          </label>
          <div className="flex flex-col gap-1">
            <Label htmlFor="wa">{t("notifications.whatsappNumber")}</Label>
            <Input
              id="wa"
              name="whatsappNumber"
              type="tel"
              defaultValue={prefs.whatsappNumber ?? ""}
              placeholder="+224…"
            />
          </div>
        </ActionForm>
      </section>
    </div>
  );
}
