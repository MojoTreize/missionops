import type { Messages } from "./messages/fr";

/**
 * Traducteur minimal (B1.11) : résolution d'une clé « à points » dans l'arbre de
 * messages, avec interpolation `{param}`. Zéro dépendance externe.
 */

/** Toutes les clés possibles sous forme `namespace.cle`, dérivées de `fr`. */
export type MessageKey = DotPaths<Messages>;

type DotPaths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${DotPaths<T[K]>}`;
}[keyof T & string];

export type TranslateParams = Record<string, string | number>;

export type Translator = (key: MessageKey, params?: TranslateParams) => string;

export function translate(messages: Messages, key: MessageKey, params?: TranslateParams): string {
  const value = key.split(".").reduce<unknown>((accumulator, part) => {
    if (accumulator && typeof accumulator === "object" && part in accumulator) {
      return (accumulator as Record<string, unknown>)[part];
    }
    return undefined;
  }, messages);

  // Clé absente ou intermédiaire : on renvoie la clé, visible et repérable.
  if (typeof value !== "string") {
    return key;
  }
  if (!params) {
    return value;
  }
  return value.replace(/\{(\w+)\}/g, (_match, name: string) =>
    name in params ? String(params[name]) : `{${name}}`,
  );
}

export function createTranslator(messages: Messages): Translator {
  return (key, params) => translate(messages, key, params);
}
