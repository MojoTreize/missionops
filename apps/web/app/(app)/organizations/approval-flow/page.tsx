import type { Metadata } from "next";

import { ROLES, pow10, decimalsOf } from "@missionops/core";
import { getApprovalFlow, getOrganisation } from "@missionops/services";

import { NativeSelect } from "@/components/forms/controls";
import { ActionForm } from "@/components/forms/action-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDb } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { can, requireCan } from "@/lib/policy";
import { serviceContext } from "@/lib/server/context";

import { saveFlowAction } from "../settings-actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t("approvalFlow.title")} — MissionOps` };
}

const SLOTS = 4;

/** Circuit de validation configurable (B2.5). Jusqu'à quatre étapes. */
export default async function ApprovalFlowPage() {
  await requireCan("read", "approvalFlow");
  const ctx = await serviceContext();
  const db = getDb();
  const { t } = await getT();
  const [flow, org, canEdit] = await Promise.all([
    getApprovalFlow(db, ctx),
    getOrganisation(db, ctx.organisationId),
    can("update", "approvalFlow"),
  ]);
  const factor = pow10(decimalsOf(org.baseCurrency));
  const slots = Array.from({ length: SLOTS }, (_, i) => flow[i] ?? null);
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div>
        <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
          {t("approvalFlow.title")}
        </h1>
        <p className="mt-1.5 text-[0.95rem] text-muted">{t("approvalFlow.subtitle")}</p>
        <p className="mt-1 text-xs text-muted">{t("approvalFlow.default")}</p>
      </div>
      <ActionForm
        action={saveFlowAction}
        submitLabel={t("approvalFlow.save")}
        className="flex flex-col gap-3 rounded-xl border border-border bg-surface shadow-xs p-4"
      >
        {slots.map((step, i) => (
          <fieldset
            key={i}
            disabled={!canEdit}
            className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[6rem_1fr_1fr]"
          >
            <legend className="sr-only">{t("approvalFlow.step", { position: i + 1 })}</legend>
            <span className="text-sm font-medium">
              {t("approvalFlow.step", { position: i + 1 })}
            </span>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`f-role-${i}`}>{t("approvalFlow.role")}</Label>
              <NativeSelect id={`f-role-${i}`} name="role" defaultValue={step?.role ?? ""}>
                <option value="">—</option>
                {ROLES.filter((r) => r !== "collaborateur").map((r) => (
                  <option key={r} value={r}>
                    {t(`roles.${r}`)}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`f-min-${i}`}>
                {t("approvalFlow.threshold", { base: org.baseCurrency })}
              </Label>
              <Input
                id={`f-min-${i}`}
                name="minBudget"
                inputMode="numeric"
                defaultValue={
                  step?.minBudgetMinor != null ? String(step.minBudgetMinor / factor) : ""
                }
              />
            </div>
          </fieldset>
        ))}
      </ActionForm>
    </div>
  );
}
