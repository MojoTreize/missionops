"use server";

import { revalidatePath } from "next/cache";

import { formDataToObject } from "@missionops/contracts";
import { addRate, decideExpense, explainMissingReceipt } from "@missionops/services";

import { getDb } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { errorState, serviceContext, type FormState } from "@/lib/server/context";

export async function addRateAction(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await serviceContext();
  try {
    await addRate(getDb(), ctx, formDataToObject(form));
  } catch (error) {
    return errorState(error);
  }
  revalidatePath("/finance/rates");
  const { t } = await getT();
  return { status: "success", message: t("rates.added") };
}

export async function decideExpenseAction(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await serviceContext();
  try {
    await decideExpense(getDb(), ctx, formDataToObject(form));
  } catch (error) {
    return errorState(error);
  }
  revalidatePath("/expenses");
  revalidatePath("/finance");
  return { status: "idle" };
}

export async function explainReceiptAction(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await serviceContext();
  try {
    await explainMissingReceipt(
      getDb(),
      ctx,
      String(form.get("expenseId") ?? ""),
      String(form.get("reason") ?? ""),
    );
  } catch (error) {
    return errorState(error);
  }
  revalidatePath("/expenses");
  return { status: "idle" };
}
