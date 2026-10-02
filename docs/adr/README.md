# Décisions d'architecture (ADR)

Chaque décision structurante fait l'objet d'un fichier `ADR-00x.md`.

Les huit décisions structurantes sont listées dans la section 6.2 du
[plan](../plan.md) et ont été rédigées au fil des blocs concernés :

| ADR                                        | Sujet                                 | Bloc  |
| ------------------------------------------ | ------------------------------------- | ----- |
| [ADR-001](ADR-001-multi-tenant.md)         | Multi-tenant par colonne partagée     | B1.7  |
| [ADR-002](ADR-002-argent.md)               | L'argent (entier + devise, taux figé) | B3.1  |
| [ADR-003](ADR-003-hors-ligne.md)           | Hors ligne restreint aux créations    | B4.3  |
| [ADR-004](ADR-004-journal-audit.md)        | Journal d'audit en écriture seule     | B1.9  |
| [ADR-005](ADR-005-suppression-logique.md)  | Suppression logique généralisée       | B1.3  |
| [ADR-006](ADR-006-machine-a-etats.md)      | Machine à états explicite             | B2.2  |
| [ADR-007](ADR-007-photos.md)               | Les photos (compression client)       | B3.6  |
| [ADR-008](ADR-008-internationalisation.md) | Internationalisation dès le socle     | B1.11 |
