export * from "./locales";
export * from "./format";
export {
  createTranslator,
  translate,
  type MessageKey,
  type TranslateParams,
  type Translator,
} from "./translate";
export type { Messages } from "./messages/fr";
export { dictionaries } from "./messages";
export { I18nProvider, useI18n, useLocale, useT } from "./client";
