/**
 * L'argent vit dans le domaine (`@missionops/core/money`, ADR-002). Ce module
 * ne fait que le réexposer à l'interface : aucun calcul monétaire ici.
 */
export {
  formatMoney,
  toDecimalString,
  fromJson,
  toJson,
  type Money,
  type MoneyJson,
  type Currency,
} from "@missionops/core";
