"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import { expenseInput, missionEventInput } from "@missionops/contracts";
import { CURRENCIES, EXPENSE_CATEGORIES, parseMoney, type Currency } from "@missionops/core";

import { NetworkStatus } from "@/components/offline/network-status";
import { useSync } from "@/components/offline/use-sync";
import { NativeSelect, Textarea } from "@/components/forms/controls";
import { Field } from "@/components/forms/field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale, useT } from "@/lib/i18n/client";
import { formatDate } from "@/lib/i18n/format";
import { fieldDb, type BootstrapRecord } from "@/lib/offline/db";
import { compressPhoto, type CompressedPhoto } from "@/lib/offline/photo";
import { discard, refreshBootstrap, retryRejected, syncNow } from "@/lib/offline/sync";

type EventKind = "depart" | "arrivee" | "checkin" | "incident" | "retour";
const EVENT_KINDS: EventKind[] = ["depart", "arrivee", "checkin", "incident", "retour"];

function today(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

/**
 * Application terrain (Phase 4) : fonctionne sans réseau. Les saisies sont des
 * créations (ADR-003) écrites dans IndexedDB avec un UUID client, puis envoyées
 * par la file de synchronisation dès que le réseau revient.
 */
export function TerrainApp({
  initial,
  preselectedMission,
}: {
  initial: BootstrapRecord | null;
  preselectedMission: string | null;
}) {
  const t = useT();
  const locale = useLocale();
  const [data, setData] = useState<BootstrapRecord | null>(initial);
  const organisationId = data?.organisationId ?? null;
  const sync = useSync(organisationId);

  // Données : version serveur si disponible, sinon dernière copie locale.
  useEffect(() => {
    void (async () => {
      if (initial) {
        await fieldDb().bootstrap.put(initial);
      } else {
        const cached = await fieldDb().bootstrap.get("terrain");
        if (cached) setData(cached);
        const fresh = await refreshBootstrap();
        if (fresh) setData(fresh);
      }
    })();
  }, [initial]);

  const missions = data?.missions ?? [];
  const [missionId, setMissionId] = useState<string>(
    () => preselectedMission ?? initial?.missions[0]?.id ?? "",
  );
  useEffect(() => {
    if (!missionId && missions[0]) setMissionId(missions[0].id);
  }, [missionId, missions]);
  const mission = useMemo(() => missions.find((m) => m.id === missionId), [missions, missionId]);

  // ---------------------------------------------------------- Dépense
  const [currency, setCurrency] = useState<Currency>((data?.baseCurrency as Currency) ?? "GNF");
  const [photo, setPhoto] = useState<CompressedPhoto | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onPhoto(file: File | undefined) {
    setPhoto(file ? await compressPhoto(file) : null);
  }

  async function submitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!organisationId || !mission) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const id = crypto.randomUUID();
    const payload = {
      id,
      missionId: mission.id,
      category: String(form.get("category") ?? ""),
      description: String(form.get("description") ?? ""),
      amount: String(form.get("amount") ?? ""),
      currency,
      spentOn: String(form.get("spentOn") ?? ""),
      receiptMissingReason: photo ? null : String(form.get("receiptMissingReason") ?? "") || null,
      clientCreatedAt: new Date().toISOString(),
    };
    const parsed = expenseInput.safeParse(payload);
    const nextErrors: Record<string, string> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues)
        nextErrors[String(issue.path[0])] ??= t("terrain.required");
    }
    try {
      if (parseMoney(payload.amount, currency).amountMinor <= 0n) throw new Error();
    } catch {
      nextErrors.amount = t("terrain.invalidAmount");
    }
    if (!photo && !payload.receiptMissingReason && payload.category !== "perdiem") {
      nextErrors.receiptMissingReason = t("errors.receipt_or_reason");
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setBusy(true);
    const db = fieldDb();
    const now = Date.now();
    await db.transaction("rw", db.outbox, db.photos, async () => {
      await db.outbox.add({
        id,
        type: "expense",
        payload,
        label: `${payload.description} — ${payload.amount} ${currency}`,
        organisationId,
        status: "pending",
        attempts: 0,
        lastAttemptAt: null,
        error: null,
        createdAt: now,
      });
      if (photo) {
        await db.photos.add({
          id: crypto.randomUUID(),
          expenseId: id,
          organisationId,
          blob: photo.blob,
          mimeType: photo.blob.type || "image/jpeg",
          sizeBytes: photo.blob.size,
          sha256: photo.sha256,
          width: photo.width,
          height: photo.height,
          status: "pending",
          attempts: 0,
          lastAttemptAt: null,
          error: null,
          createdAt: now,
        });
      }
    });
    formElement.reset();
    setPhoto(null);
    setBusy(false);
    setMessage(t("terrain.saved"));
    await sync.reload();
    sync.trigger();
  }

  // ---------------------------------------------------------- Événement
  const [withPosition, setWithPosition] = useState(false);

  async function submitEvent(kind: EventKind, note: string) {
    if (!organisationId || !mission) return;
    let latitude: number | null = null;
    let longitude: number | null = null;
    if (withPosition && "geolocation" in navigator) {
      await new Promise<void>((resolve) =>
        navigator.geolocation.getCurrentPosition(
          (p) => {
            latitude = p.coords.latitude;
            longitude = p.coords.longitude;
            resolve();
          },
          () => resolve(),
          { timeout: 10_000, maximumAge: 300_000 },
        ),
      );
    }
    const payload = {
      id: crypto.randomUUID(),
      missionId: mission.id,
      kind,
      note: note || null,
      occurredAt: new Date().toISOString(),
      latitude,
      longitude,
    };
    if (!missionEventInput.safeParse(payload).success) return;
    await fieldDb().outbox.add({
      id: payload.id,
      type: "missionEvent",
      payload,
      label: t(`eventKind.${kind}`),
      organisationId,
      status: "pending",
      attempts: 0,
      lastAttemptAt: null,
      error: null,
      createdAt: Date.now(),
    });
    setMessage(t("terrain.saved"));
    await sync.reload();
    sync.trigger();
  }

  const photosByExpense = new Map(sync.photos.map((p) => [p.expenseId, p.status]));

  if (!data) {
    return (
      <p className="rounded-md bg-warning-soft p-3 text-sm text-warning">{t("terrain.noData")}</p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <NetworkStatus
        state={sync.state}
        summary={sync.summary}
        onSync={() => organisationId && void syncNow(organisationId)}
      />
      <p className="text-xs text-muted">
        {t("terrain.lastSync", {
          date: formatDate(data.fetchedAt, locale, { dateStyle: "short", timeStyle: "short" }),
        })}
      </p>

      {missions.length === 0 ? (
        <p className="text-sm text-muted">{t("terrain.noMission")}</p>
      ) : (
        <>
          <Field id="t-mission" label={t("terrain.mission")}>
            <NativeSelect
              id="t-mission"
              value={missionId}
              onChange={(e) => setMissionId(e.target.value)}
            >
              {missions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.reference} — {m.title}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <form
            onSubmit={submitExpense}
            className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
            noValidate
          >
            <h2 className="font-semibold">{t("terrain.expenseTitle")}</h2>
            <div className="grid grid-cols-[1fr_6rem] gap-2">
              <Field id="t-amount" label={t("expenses.amount")} error={errors.amount}>
                <Input
                  id="t-amount"
                  name="amount"
                  inputMode="decimal"
                  required
                  autoComplete="off"
                />
              </Field>
              <Field id="t-currency" label={t("budget.currency")}>
                <NativeSelect
                  id="t-currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
            <Field id="t-category" label={t("expenses.category")} error={errors.category}>
              <NativeSelect id="t-category" name="category" defaultValue="transport">
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t(`category.${c}`)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field id="t-description" label={t("expenses.description")} error={errors.description}>
              <Input
                id="t-description"
                name="description"
                required
                placeholder={t("expenses.descriptionPlaceholder")}
              />
            </Field>
            <Field id="t-date" label={t("expenses.spentOn")} error={errors.spentOn}>
              <Input id="t-date" name="spentOn" type="date" defaultValue={today()} required />
            </Field>
            <Field
              id="t-photo"
              label={t("terrain.photo")}
              hint={
                photo
                  ? t("terrain.photoReady", { size: Math.round(photo.blob.size / 1024) })
                  : t("terrain.photoHint")
              }
            >
              <Input
                id="t-photo"
                type="file"
                accept="image/*,application/pdf"
                capture="environment"
                onChange={(e) => void onPhoto(e.target.files?.[0])}
                className="h-auto py-2"
              />
            </Field>
            {!photo ? (
              <Field
                id="t-missing"
                label={t("expenses.receiptMissing")}
                error={errors.receiptMissingReason}
              >
                <Input
                  id="t-missing"
                  name="receiptMissingReason"
                  placeholder={t("expenses.receiptMissingPlaceholder")}
                />
              </Field>
            ) : null}
            <Button type="submit" disabled={busy}>
              {t("terrain.record")}
            </Button>
            {message ? (
              <p role="status" className="text-sm text-success">
                {message}
              </p>
            ) : null}
          </form>

          <EventForm
            onSubmit={submitEvent}
            withPosition={withPosition}
            setWithPosition={setWithPosition}
          />
        </>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">{t("terrain.queue")}</h2>
        {sync.outbox.length === 0 ? (
          <p className="text-sm text-muted">{t("terrain.queueEmpty")}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface">
            {sync.outbox.map((item) => (
              <li key={item.id} className="flex flex-col gap-1 px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">{item.label}</span>
                  <Badge
                    variant={
                      item.status === "synced"
                        ? "success"
                        : item.status === "rejected"
                          ? "danger"
                          : "muted"
                    }
                  >
                    {t(`terrain.status.${item.status}`)}
                  </Badge>
                </div>
                {item.type === "expense" && photosByExpense.has(item.id) ? (
                  <span className="text-xs text-muted">
                    {t("terrain.photo")} · {t(`terrain.status.${photosByExpense.get(item.id)!}`)}
                  </span>
                ) : null}
                {item.status === "rejected" ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-danger">
                      {t(`errors.${item.error ?? "generic"}` as "errors.generic")}
                    </span>
                    <button
                      type="button"
                      className="text-xs underline"
                      onClick={() => void retryRejected(item.id)}
                    >
                      {t("terrain.retry")}
                    </button>
                    <button
                      type="button"
                      className="text-xs underline"
                      onClick={() => void discard(item.id)}
                    >
                      {t("terrain.discard")}
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function EventForm({
  onSubmit,
  withPosition,
  setWithPosition,
}: {
  onSubmit: (kind: EventKind, note: string) => Promise<void>;
  withPosition: boolean;
  setWithPosition: (value: boolean) => void;
}) {
  const t = useT();
  const [note, setNote] = useState("");
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <h2 className="font-semibold">{t("terrain.eventTitle")}</h2>
      <p className="rounded-md bg-paper p-2 text-xs text-muted">{t("terrain.noTracking")}</p>
      <Field id="t-note" label={t("terrain.eventNote")}>
        <Textarea id="t-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={withPosition}
          onChange={(e) => setWithPosition(e.target.checked)}
        />
        {t("terrain.addPosition")}
      </label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {EVENT_KINDS.map((kind) => (
          <Button
            key={kind}
            type="button"
            variant={kind === "incident" ? "danger" : "secondary"}
            size="sm"
            onClick={() => {
              void onSubmit(kind, note).then(() => setNote(""));
            }}
          >
            {t(`eventKind.${kind}`)}
          </Button>
        ))}
      </div>
    </div>
  );
}
