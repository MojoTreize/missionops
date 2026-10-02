import type { Metadata } from "next";

import { CURRENCIES } from "@missionops/core";
import { listRates } from "@missionops/services";

import { NativeSelect } from "@/components/forms/controls";
import { ActionForm } from "@/components/forms/action-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDb } from "@/lib/db";
import { formatDate } from "@/lib/i18n/format";
import { getT } from "@/lib/i18n/server";
import { can } from "@/lib/policy";
import { serviceContext } from "@/lib/server/context";

import { addRateAction } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t("rates.title")} — MissionOps` };
}

/** Taux de change datés (B3.2). */
export default async function RatesPage() {
  const ctx = await serviceContext();
  const { t, locale } = await getT();
  const [rates, canAdd] = await Promise.all([listRates(getDb(), ctx), can("create", "fxRate")]);
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{t("rates.title")}</h1>
        <p className="text-sm text-muted">{t("rates.subtitle")}</p>
      </div>
      {canAdd ? (
        <ActionForm
          action={addRateAction}
          submitLabel={t("rates.add")}
          className="grid grid-cols-2 items-end gap-2 rounded-lg border border-border bg-surface p-4 sm:grid-cols-5"
        >
          <div className="flex flex-col gap-1">
            <Label htmlFor="fx-from">{t("rates.from")}</Label>
            <NativeSelect id="fx-from" name="fromCurrency" defaultValue="EUR">
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="fx-to">{t("rates.to")}</Label>
            <NativeSelect id="fx-to" name="toCurrency" defaultValue="GNF">
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </NativeSelect>
          </div>
          <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
            <Label htmlFor="fx-rate">{t("rates.rate")}</Label>
            <Input id="fx-rate" name="rate" required inputMode="decimal" placeholder="9350" />
          </div>
          <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
            <Label htmlFor="fx-date">{t("rates.effectiveOn")}</Label>
            <Input
              id="fx-date"
              name="effectiveOn"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
          </div>
        </ActionForm>
      ) : null}
      {rates.length === 0 ? (
        <p className="text-sm text-muted">{t("rates.empty")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("rates.effectiveOn")}</TableHead>
              <TableHead>{t("rates.from")}</TableHead>
              <TableHead>{t("rates.to")}</TableHead>
              <TableHead className="text-right">{t("rates.rate")}</TableHead>
              <TableHead>{t("rates.source")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rates.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{formatDate(r.effectiveOn, locale)}</TableCell>
                <TableCell>{r.fromCurrency}</TableCell>
                <TableCell>{r.toCurrency}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{r.rate}</TableCell>
                <TableCell>{r.source}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
