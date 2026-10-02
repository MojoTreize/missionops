import type { Metadata } from "next";

import { NATIONAL_LOCATIONS, ORG_LOCATION_KINDS } from "@missionops/core";
import { listOrgLocations } from "@missionops/services";

import { NativeSelect } from "@/components/forms/controls";
import { ActionForm } from "@/components/forms/action-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDb } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { can, requireCan } from "@/lib/policy";
import { serviceContext } from "@/lib/server/context";

import { addLocationAction, removeLocationAction } from "../settings-actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t("locations.title")} — MissionOps` };
}

/** Lieux propres à l'organisation (B2.1). */
export default async function LocationsPage() {
  await requireCan("read", "location");
  const ctx = await serviceContext();
  const { t } = await getT();
  const [items, canCreate, canDelete] = await Promise.all([
    listOrgLocations(getDb(), ctx),
    can("create", "location"),
    can("delete", "location"),
  ]);
  const parents = NATIONAL_LOCATIONS.filter((l) => l.level !== "region" || l.code === "GN-C");
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div>
        <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
          {t("locations.title")}
        </h1>
        <p className="mt-1.5 text-[0.95rem] text-muted">{t("locations.subtitle")}</p>
      </div>
      {canCreate ? (
        <ActionForm
          action={addLocationAction}
          submitLabel={t("locations.add")}
          className="grid grid-cols-1 items-end gap-2 rounded-xl border border-border bg-surface shadow-xs p-4 sm:grid-cols-3"
        >
          <div className="flex flex-col gap-1">
            <Label htmlFor="l-name">{t("locations.name")}</Label>
            <Input id="l-name" name="name" required placeholder={t("locations.namePlaceholder")} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="l-parent">{t("locations.parent")}</Label>
            <NativeSelect id="l-parent" name="parentCode" defaultValue="GN-KD">
              {parents.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name} ({t(`locationLevel.${l.level}`)})
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="l-kind">{t("locations.kind")}</Label>
            <NativeSelect id="l-kind" name="kind" defaultValue="site">
              {ORG_LOCATION_KINDS.map((k) => (
                <option key={k} value={k}>
                  {t(`locationKind.${k}`)}
                </option>
              ))}
            </NativeSelect>
          </div>
        </ActionForm>
      ) : null}
      {items.length === 0 ? (
        <p className="text-sm text-muted">{t("locations.empty")}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface shadow-xs">
          {items.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-2 px-4 py-2 text-sm">
              <span>
                <span className="font-medium">{l.name}</span>{" "}
                <span className="text-muted">
                  · {l.parentLabel} · {t(`locationKind.${l.kind as "site"}`)}
                </span>
              </span>
              {canDelete ? (
                <ActionForm
                  action={removeLocationAction}
                  submitLabel={t("locations.remove")}
                  variant="ghost"
                  size="sm"
                >
                  <input type="hidden" name="locationId" value={l.id} />
                </ActionForm>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
