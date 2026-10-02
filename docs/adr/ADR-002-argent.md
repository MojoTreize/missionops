# ADR-002 — L'argent (entier + devise, taux figé)

- **Statut** : acceptée
- **Bloc** : B3.1 (le type Money), complétée en B3.2 (taux de change)
- **Date** : rédigée a posteriori, après fusion de la Phase 3

## Contexte

MissionOps manipule des avances, des dépenses et des budgets en francs
guinéens, en euros et en dollars, souvent dans la même mission. Un client qui
trouve une erreur de solde d'un franc ne fait plus jamais confiance à l'outil,
et un auditeur refuse tout historique recalculé au taux du jour.

Deux pièges classiques :

1. les flottants (`0.1 + 0.2 !== 0.3`), et au-delà de 2^53 la perte de
   précision sur de gros montants en GNF ;
2. un nombre de décimales global, alors que le GNF n'a pas de sous-unité en
   usage réel et que l'EUR et l'USD en ont deux.

## Décision

1. **Un montant est `Money = { amountMinor: bigint, currency: Currency }`**
   (`packages/core/src/money`). `Currency` vaut `GNF`, `EUR` ou `USD`. Le nombre
   de décimales est une propriété de la devise (`CURRENCY_DECIMALS` : GNF 0,
   EUR 2, USD 2), jamais une constante globale.
2. **Toute opération passe par ce module** : `add`, `subtract`, `sum`,
   `multiply`, `percentOf` (points de base), `allocate` (répartition sans perte
   d'unité mineure), `compare`, `parseMoney`, `formatMoney`, `toJson` /
   `fromJson`. Additionner deux devises différentes lève
   `CurrencyMismatchError` : il faut convertir explicitement.
3. **Une seule règle d'arrondi** : `divRound`, au plus proche, demi-unité
   éloignée de zéro (arrondi commercial).
4. **Un taux de change est un décimal exact** : `FxRate = { from, to, scaled }`
   où `scaled` est un `bigint` égal au taux multiplié par 10^`RATE_SCALE`
   (`RATE_SCALE = 10`). `parseRate` refuse plus de dix décimales, un taux nul ou
   négatif. `convert(montant, taux)` calcule
   `source_mineur × taux × 10^déc(cible) / (10^déc(source) × 10^10)` avec
   `divRound`.
5. **Le taux est figé dans la ligne.** Chaque avance, dépense et ligne de budget
   stocke, en plus du montant d'origine (`*_minor` + devise) :
   `fx_rate_to_base` (`numeric(30,10)`), `fx_rate_date` (`date`) et le montant
   converti dans la devise de base de l'organisation (`amount_base_minor` ou
   `total_base_minor`, `bigint`). Ces trois valeurs sont calculées une fois, à
   la saisie, et ne sont jamais recalculées.
6. **Résolution du taux datée** (`packages/services/src/fx.ts`) : le taux
   applicable est le plus récent de `exchange_rates` dont la date d'effet est
   antérieure ou égale à la date de l'opération ; à défaut, l'inverse du taux
   réciproque. Sans taux, le service lève `rate_missing` : jamais de valeur
   par défaut silencieuse.

## Conséquences

- **Rapports, réconciliation et Closure Pack additionnent des
  `amount_base_minor`**, déjà convertis au taux figé de chaque ligne. Aucun
  calcul ne relit le taux du jour.
- **Sérialisation** : les montants circulent en chaînes (`toJson`), jamais en
  `number` JSON. L'export intégral et l'export comptable suivent la même règle.
- **Saisie** : `parseMoney` accepte « 1 250 000 », « 12,50 » ou « 12.5 » et
  refuse des décimales en GNF. Les schémas Zod de `packages/contracts`
  s'appuient dessus.
- **Base de données** : `bigint` pour les montants, `numeric(30,10)` pour les
  taux. Drizzle lit les `bigint` en mode `bigint`, sans passage par `number`.
- **Dette** : la règle ESLint interdisant `number` pour les identifiants
  contenant `amount`, `price`, `budget` ou `cost` (critère de fin de B3.1)
  n'est pas encore en place. La revue de code compense en attendant.

## Alternatives écartées

- **Flottants (`number`)** : imprécis, et faux au-delà de 2^53 unités mineures.
- **Bibliothèque décimale tierce** (decimal.js, dinero.js) : une dépendance de
  plus pour un besoin que `bigint` couvre nativement, sans contrôle de
  l'arrondi.
- **Conversion à la volée au taux du jour** : rend les historiques instables et
  inauditables.
- **Taux stocké en flottant ou en texte libre** : perte de précision, ou
  comparaison impossible en SQL.
