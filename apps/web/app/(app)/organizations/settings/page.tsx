import type { Metadata } from "next";

import { CURRENCIES } from "@missionops/core";
import { getOrganisation, getSubscription } from "@missionops/services";

import { NativeSelect, Textarea } from "@/components/forms/controls";
import { ActionForm } from "@/components/forms/action-form";
import { Field } from "@/components/forms/field";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getDb } from "@/lib/db";
import { formatDate } from "@/lib/i18n/format";
import { getT } from "@/lib/i18n/server";
import { requireCan } from "@/lib/policy";
import { serviceContext } from "@/lib/server/context";

import {
  archiveAction,
  importLocationsAction,
  importMembersAction,
  saveSettingsAction,
} from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t("settings.title")} — MissionOps` };
}

const TIMEZONES = ["Africa/Conakry", "Africa/Abidjan", "Africa/Dakar", "Europe/Paris", "UTC"];

/** Paramétrage de l'organisation (B9.2), modèles de documents (B5.2), abonnement (B9.4). */
export default async function SettingsPage() {
  await requireCan("update", "organisation");
  const ctx = await serviceContext();
  const db = getDb();
  const { t, locale } = await getT();
  const [org, sub] = await Promise.all([
    getOrganisation(db, ctx.organisationId),
    getSubscription(db, ctx),
  ]);
  const section = "flex flex-col gap-3 rounded-lg border border-border bg-surface p-4";
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <h1 className="text-2xl font-semibold text-ink">{t("settings.title")}</h1>

      <section className={section}>
        <h2 className="font-semibold">{t("settings.subscription")}</h2>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="ledger">{t(`settings.plan.${sub.plan}`)}</Badge>
          <Badge variant={sub.status === "active" ? "success" : "danger"}>
            {t(`settings.status.${sub.status}`)}
          </Badge>
          <span>{t("settings.seats", { used: sub.seatsUsed, total: sub.seats })}</span>
          {sub.trialEndsOn ? (
            <span className="text-muted">
              {t("settings.trialEnds", { date: formatDate(sub.trialEndsOn, locale) })}
            </span>
          ) : null}
        </div>
        <p className="text-xs text-muted">{t("settings.billing")}</p>
      </section>

      <ActionForm action={saveSettingsAction} submitLabel={t("settings.save")} className={section}>
        <h2 className="font-semibold">{t("settings.general")}</h2>
        <Field id="o-name" label={t("settings.name")}>
          <Input id="o-name" name="name" defaultValue={org.name} required />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field
            id="o-cur"
            label={t("settings.baseCurrency")}
            hint={t("settings.baseCurrencyHint")}
          >
            <NativeSelect id="o-cur" name="baseCurrency" defaultValue={org.baseCurrency}>
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field id="o-tz" label={t("settings.timezone")}>
            <NativeSelect id="o-tz" name="timezone" defaultValue={org.timezone}>
              {TIMEZONES.map((z) => (
                <option key={z}>{z}</option>
              ))}
            </NativeSelect>
          </Field>
        </div>
        <Field id="o-floor" label={t("settings.varianceFloor")}>
          <Input
            id="o-floor"
            name="varianceFloor"
            inputMode="numeric"
            defaultValue={org.settings.varianceFloorMinor.toString()}
          />
        </Field>
        <h2 className="mt-2 font-semibold">{t("settings.documents")}</h2>
        <Field id="o-header" label={t("settings.documentHeader")}>
          <Input
            id="o-header"
            name="documentHeader"
            defaultValue={org.settings.documentHeader ?? ""}
          />
        </Field>
        <Field id="o-footer" label={t("settings.documentFooter")}>
          <Textarea
            id="o-footer"
            name="documentFooter"
            rows={2}
            defaultValue={org.settings.documentFooter ?? ""}
          />
        </Field>
        <Field id="o-sign" label={t("settings.signatureLabels")}>
          <Input
            id="o-sign"
            name="signatureLabels"
            defaultValue={org.settings.signatureLabels.join("; ")}
          />
        </Field>
      </ActionForm>

      <section className={section}>
        <h2 className="font-semibold">{t("settings.imports")}</h2>
        <ActionForm
          action={importLocationsAction}
          submitLabel={t("settings.import")}
          variant="secondary"
          size="sm"
        >
          <Field id="i-loc" label={t("settings.importLocations")}>
            <Input
              id="i-loc"
              name="file"
              type="file"
              accept=".csv,text/csv"
              className="h-auto py-2"
            />
          </Field>
        </ActionForm>
        <ActionForm
          action={importMembersAction}
          submitLabel={t("settings.import")}
          variant="secondary"
          size="sm"
        >
          <Field id="i-mem" label={t("settings.importMembers")}>
            <Input
              id="i-mem"
              name="file"
              type="file"
              accept=".csv,text/csv"
              className="h-auto py-2"
            />
          </Field>
        </ActionForm>
      </section>

      <section className={section}>
        <h2 className="font-semibold">{t("settings.archive")}</h2>
        <p className="text-sm text-muted">{t("settings.archiveDescription")}</p>
        <ActionForm
          action={archiveAction}
          submitLabel={t("settings.archiveRun")}
          variant="secondary"
          size="sm"
        />
      </section>
    </div>
  );
}
