import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ServiceError, getMission, getMissionReport } from "@missionops/services";

import { Textarea } from "@/components/forms/controls";
import { Field } from "@/components/forms/field";
import { ActionForm } from "@/components/forms/action-form";
import { getDb } from "@/lib/db";
import { formatDate } from "@/lib/i18n/format";
import { getT } from "@/lib/i18n/server";
import { serviceContext } from "@/lib/server/context";

import { saveReportAction } from "../../actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t("report.title")} — MissionOps` };
}

/** Rapport de mission (B5.6) : rédigé au retour, joint au Closure Pack. */
export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await serviceContext();
  const db = getDb();
  const { t, locale } = await getT();
  const [mission, report] = await Promise.all([
    getMission(db, ctx, id),
    getMissionReport(db, ctx, id),
  ]).catch((error: unknown) => {
    if (error instanceof ServiceError) notFound();
    throw error;
  });
  const editable = ["EN_COURS", "TERMINEE"].includes(mission.status) && !report?.submittedAt;

  const fields = [
    ["summary", t("report.summary"), 5],
    ["results", t("report.results"), 4],
    ["difficulties", t("report.difficulties"), 3],
    ["recommendations", t("report.recommendations"), 3],
  ] as const;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <Link
        href={`/missions/${id}`}
        className="inline-flex items-center gap-1 text-sm text-field hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {mission.reference}
      </Link>
      <h1 className="text-2xl font-semibold text-ink">{t("report.title")}</h1>
      {report?.submittedAt ? (
        <p className="rounded-md bg-success-soft p-2 text-sm text-success">
          {t("report.submitted", { date: formatDate(report.submittedAt, locale) })}
        </p>
      ) : null}
      {!editable && !report ? (
        <p className="text-sm text-muted">{t("report.notAvailable")}</p>
      ) : null}
      {editable ? (
        <ActionForm action={saveReportAction} submitLabel={t("report.save")} variant="secondary">
          <input type="hidden" name="missionId" value={id} />
          {fields.map(([name, label, rows]) => (
            <Field key={name} id={`r-${name}`} label={label}>
              <Textarea
                id={`r-${name}`}
                name={name}
                rows={rows}
                defaultValue={report?.[name] ?? ""}
              />
            </Field>
          ))}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="intent" value="submit" />
            {t("report.submit")}
          </label>
        </ActionForm>
      ) : report ? (
        <dl className="flex flex-col gap-4">
          {fields.map(([name, label]) =>
            report[name] ? (
              <div key={name}>
                <dt className="text-sm font-semibold">{label}</dt>
                <dd className="whitespace-pre-line text-sm">{report[name]}</dd>
              </div>
            ) : null,
          )}
        </dl>
      ) : null}
    </div>
  );
}
