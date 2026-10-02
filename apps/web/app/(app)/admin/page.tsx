import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PLANS, platformOverview } from "@missionops/services";

import { ActionForm } from "@/components/forms/action-form";
import { NativeSelect } from "@/components/forms/controls";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isPlatformAdmin } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getDb } from "@/lib/db";
import { getT } from "@/lib/i18n/server";

import { subscriptionAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t("admin.title")} — MissionOps` };
}

const pct = (bp: number | null) => (bp === null ? "—" : `${Math.round(bp / 100)} %`);

/**
 * Console d'administration interne (B9.6) et mesure de l'usage (B9.7) : les
 * indicateurs du plan (§12.3) pour chaque organisation cliente.
 */
export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isPlatformAdmin(user.email)) redirect("/forbidden");
  const { t } = await getT();
  const orgs = await platformOverview(getDb(), new Date());
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <div>
        <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
          {t("admin.title")}
        </h1>
        <p className="mt-1.5 text-[0.95rem] text-muted">{t("admin.subtitle")}</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("admin.organisation")}</TableHead>
            <TableHead className="text-right">{t("admin.members")}</TableHead>
            <TableHead className="text-right">{t("admin.missionsMonth")}</TableHead>
            <TableHead className="text-right">{t("admin.closed")}</TableHead>
            <TableHead className="text-right">{t("admin.closurePack")}</TableHead>
            <TableHead className="text-right">{t("admin.medianClosure")}</TableHead>
            <TableHead className="text-right">{t("admin.receipts")}</TableHead>
            <TableHead>{t("admin.status")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orgs.map((o) => (
            <TableRow key={o.id}>
              <TableCell>
                <span className="font-medium">{o.name}</span>
                <span className="block font-mono text-xs text-muted">{o.slug}</span>
              </TableCell>
              <TableCell className="text-right tabular-nums">{o.members}</TableCell>
              <TableCell className="text-right tabular-nums">{o.missionsThisMonth}</TableCell>
              <TableCell className="text-right tabular-nums">{o.missionsClosed}</TableCell>
              <TableCell className="text-right tabular-nums">{pct(o.closurePackShareBp)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {o.medianClosureDays === null
                  ? "—"
                  : t("dashboardPage.days", { days: o.medianClosureDays })}
              </TableCell>
              <TableCell className="text-right tabular-nums">{pct(o.receiptCoverageBp)}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-2">
                  <Badge variant={o.status === "active" ? "success" : "danger"}>
                    {t(`settings.plan.${o.plan as "essai"}`)} ·{" "}
                    {t(`settings.status.${o.status as "active"}`)}
                  </Badge>
                  <ActionForm
                    action={subscriptionAction}
                    submitLabel={t("admin.apply")}
                    variant="secondary"
                    size="sm"
                    className="flex flex-wrap items-center gap-1"
                  >
                    <input type="hidden" name="organisationId" value={o.id} />
                    <NativeSelect
                      name="plan"
                      defaultValue={o.plan}
                      aria-label={t("admin.setPlan")}
                      className="h-9 w-32"
                    >
                      {Object.keys(PLANS).map((p) => (
                        <option key={p} value={p}>
                          {t(`settings.plan.${p as "essai"}`)}
                        </option>
                      ))}
                    </NativeSelect>
                    <NativeSelect
                      name="status"
                      defaultValue={o.status}
                      aria-label={t("admin.status")}
                      className="h-9 w-32"
                    >
                      <option value="active">{t("admin.reactivate")}</option>
                      <option value="suspendue">{t("admin.suspend")}</option>
                    </NativeSelect>
                  </ActionForm>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
