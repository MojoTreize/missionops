import { ROLES } from "@missionops/core";
import { z } from "zod";

import { email, optionalText, text } from "./common";
import { currency } from "./money";

export const createOrganisationInput = z.object({
  name: text(2, 120),
  country: optionalText(2),
});

export const inviteMemberInput = z.object({
  email,
  role: z.enum(ROLES).catch("collaborateur"),
});

export const changeRoleInput = z.object({
  userId: z.string().uuid(),
  role: z.enum(ROLES),
});

export const loginInput = z.object({ email, password: z.string().min(1).max(200) });

export const magicLinkInput = z.object({ email });

export const resetPasswordInput = z
  .object({
    token: z.string().min(10),
    password: z.string().min(10, "password_too_short").max(200),
    passwordConfirm: z.string(),
  })
  .refine((v) => v.password === v.passwordConfirm, {
    message: "password_mismatch",
    path: ["passwordConfirm"],
  });

export const signupInput = z.object({
  fullName: text(2, 120),
  email,
  password: z.string().min(10, "password_too_short").max(200),
  organisationName: text(2, 120),
});

/** Paramétrage d'une organisation (B9.2). */
export const organisationSettingsInput = z.object({
  name: text(2, 120),
  baseCurrency: currency,
  timezone: text(3, 60),
  varianceFloor: z.string().trim().regex(/^\d*$/).optional(),
  documentHeader: optionalText(200),
  documentFooter: optionalText(400),
  signatureLabels: optionalText(400),
});

export const notificationPreferencesInput = z.object({
  email: z.boolean(),
  whatsapp: z.boolean(),
  sms: z.boolean(),
  whatsappNumber: optionalText(20),
});

export const localeInput = z.object({ locale: z.enum(["fr", "en"]) });

export const roleInput = z.enum(ROLES);
