import type { Locale } from "../locales";
import { en } from "./en";
import { fr } from "./fr";
import type { Messages } from "./fr";

export type { Messages };

/** Catalogues indexés par langue. */
export const dictionaries: Record<Locale, Messages> = { fr, en };
