import { z } from "zod";

/** Texte nettoyé (espaces de bord retirés), avec bornes de longueur. */
export const text = (min: number, max: number) => z.string().trim().min(min).max(max);

/** Texte facultatif : chaîne vide → `null`. */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const d = new Date(`${v}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
  }, "invalid_date");

export const uuid = z.string().uuid();

export const optionalUuid = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v ? v : null))
  .pipe(z.string().uuid().nullable());

export const email = z.string().trim().toLowerCase().email().max(254);

/** Case à cocher HTML : « on » / « true » / « 1 » → vrai. */
export const checkbox = z
  .union([z.string(), z.boolean()])
  .optional()
  .nullable()
  .transform((v) => v === true || v === "on" || v === "true" || v === "1");

/** Convertit un `FormData` en objet simple (dernière valeur pour chaque clé). */
export function formDataToObject(form: FormData): Record<string, string> {
  const result: Record<string, string> = {};
  form.forEach((value, key) => {
    if (typeof value === "string") result[key] = value;
  });
  return result;
}

/** Premier code d'erreur par champ, pour l'affichage. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!(key in result)) result[key] = issue.message;
  }
  return result;
}
