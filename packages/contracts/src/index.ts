/**
 * Schémas Zod partagés client ↔ serveur. Le formulaire du téléphone et l'action
 * serveur valident avec le même schéma : ils ne peuvent pas diverger.
 *
 * Les schémas lisent des chaînes (FormData, JSON) et produisent des valeurs
 * typées du domaine. Les messages d'erreur sont des clés stables (`code`),
 * traduites par l'interface.
 */
export * from "./common";
export * from "./location";
export * from "./mission";
export * from "./money";
export * from "./expense";
export * from "./organisation";
export * from "./sync";
