"use client";

import { useActionState } from "react";

import { TRANSPORT_MODES } from "@missionops/core";

import { NativeSelect, Textarea } from "@/components/forms/controls";
import { Field } from "@/components/forms/field";
import { FormStatus } from "@/components/forms/form-status";
import { LocationPicker, type PickerLocation } from "@/components/mission/location-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n/client";
import { idleState, type FormState } from "@/lib/server/form-state";

export interface MissionFormValues {
  title: string;
  purpose: string;
  destinationId: string | null;
  startDate: string;
  endDate: string;
  transportMode: string;
  notes: string;
}

/** Demande de mission (B2.3) — création et modification (B2.8). */
export function MissionForm({
  action,
  locations,
  initial,
  mode,
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  locations: PickerLocation[];
  initial?: MissionFormValues;
  mode: "create" | "edit";
}) {
  const t = useT();
  const [state, formAction, pending] = useActionState(action, idleState);
  const err = (field: string) => state.fields?.[field];

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <Field id="title" label={t("missions.form.title")} error={err("title")}>
        <Input
          id="title"
          name="title"
          required
          maxLength={160}
          defaultValue={initial?.title}
          placeholder={t("missions.form.titlePlaceholder")}
          aria-invalid={err("title") ? true : undefined}
        />
      </Field>
      <Field id="purpose" label={t("missions.form.purpose")} error={err("purpose")}>
        <Textarea
          id="purpose"
          name="purpose"
          required
          rows={4}
          defaultValue={initial?.purpose}
          placeholder={t("missions.form.purposePlaceholder")}
          aria-invalid={err("purpose") ? true : undefined}
        />
      </Field>
      <LocationPicker
        locations={locations}
        defaultId={initial?.destinationId}
        error={err("destinationCode") ?? err("destinationLocationId")}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field id="startDate" label={t("missions.form.startDate")} error={err("startDate")}>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            required
            defaultValue={initial?.startDate}
          />
        </Field>
        <Field id="endDate" label={t("missions.form.endDate")} error={err("endDate")}>
          <Input id="endDate" name="endDate" type="date" required defaultValue={initial?.endDate} />
        </Field>
      </div>
      <Field id="transportMode" label={t("missions.form.transport")} error={err("transportMode")}>
        <NativeSelect
          id="transportMode"
          name="transportMode"
          required
          defaultValue={initial?.transportMode ?? ""}
        >
          <option value="" disabled>
            {t("missions.form.transportPlaceholder")}
          </option>
          {TRANSPORT_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {t(`transport.${mode}`)}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field id="notes" label={t("missions.form.notes")}>
        <Textarea id="notes" name="notes" rows={2} defaultValue={initial?.notes} />
      </Field>
      <Button type="submit" disabled={pending}>
        {mode === "create"
          ? pending
            ? t("missions.form.creating")
            : t("missions.form.create")
          : pending
            ? t("missions.form.saving")
            : t("missions.form.save")}
      </Button>
      <FormStatus state={state} />
    </form>
  );
}
