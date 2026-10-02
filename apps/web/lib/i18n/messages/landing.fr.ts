/**
 * Catalogue français de la page d'accueil publique (landing). Fusionné dans
 * `fr.ts` sous l'espace de noms `landing`.
 */
const raw = {
  meta: {
    title: "MissionOps — missions terrain, avances et dépenses sous contrôle",
    description:
      "La plateforme des missions terrain pour ONG, ambassades et entreprises en Guinée : demande, validation, avance, dépenses hors ligne, réconciliation et dossier de clôture auditable.",
  },
  nav: {
    product: "Produit",
    loop: "Fonctionnement",
    audiences: "Pour qui",
    security: "Sécurité",
    pricing: "Tarifs",
    faq: "Questions",
    login: "Se connecter",
    start: "Essai gratuit",
    openApp: "Ouvrir l'application",
    language: "English",
    languageLabel: "Switch to English",
    menu: "Menu",
  },
  hero: {
    badge: "Conçu en Guinée · fonctionne sans réseau",
    title: "Chaque mission terrain, de la demande au dossier de clôture.",
    subtitle:
      "MissionOps remplace les fichiers Excel, les reçus perdus et les relances WhatsApp. Vos équipes saisissent leurs dépenses hors ligne, la finance réconcilie en quelques minutes, l'audit trouve tout.",
    primary: "Démarrer l'essai gratuit",
    secondary: "Se connecter",
    note: "30 jours gratuits · sans carte bancaire · français et anglais",
  },
  mock: {
    reference: "MSN-2026-0142",
    mission: "Évaluation des besoins — Nzérékoré",
    agent: "Alpha Diakité · 6 jours",
    status: "En cours",
    advance: "Avance versée",
    spent: "Dépensé",
    balance: "Solde à justifier",
    expenses: "Dernières dépenses",
    e1: "Carburant Conakry → Kindia",
    e2: "Hébergement, 2 nuits",
    e3: "Atelier communautaire",
    rate: "taux figé 1 € = 9 350 GNF",
    offline: "Hors ligne · 3 saisies en attente",
    synced: "Synchronisé",
    steps: {
      request: "Demande",
      approval: "Validation",
      advance: "Avance",
      field: "Terrain",
      reconciliation: "Réconciliation",
      closure: "Clôture",
    },
  },
  proof: {
    offline: "100 % hors ligne",
    offlineHint: "sur le terrain",
    currencies: "GNF · EUR · USD",
    currenciesHint: "taux figé à la transaction",
    audit: "0 suppression",
    auditHint: "tout est historisé",
    mobile: "3G · 375 px",
    mobileHint: "Android d'entrée de gamme",
  },
  loop: {
    eyebrow: "La boucle complète",
    title: "Un seul fil, de la première demande au dernier reçu.",
    subtitle:
      "Chaque mission suit la même bande de six étapes. Chacun sait où elle en est, qui doit agir, et ce qui reste à justifier.",
    request: {
      title: "Demande",
      text: "Objet, dates, destination en deux touches et budget prévisionnel par catégorie.",
    },
    approval: {
      title: "Validation",
      text: "Circuit configurable par montant, validation par lot, délégation pendant les absences.",
    },
    advance: {
      title: "Avance",
      text: "Versement en espèces, mobile money ou virement, tracé dans la devise d'origine.",
    },
    field: {
      title: "Dépenses terrain",
      text: "Photo du reçu, montant, catégorie : saisi sans réseau, envoyé dès que possible.",
    },
    reconciliation: {
      title: "Réconciliation",
      text: "Solde calculé automatiquement, écarts justifiés, sens du règlement explicite.",
    },
    closure: {
      title: "Dossier de clôture",
      text: "Un PDF signé numériquement, prêt pour le bailleur ou l'auditeur.",
    },
  },
  features: {
    eyebrow: "Produit",
    title: "Pensé pour le terrain, exigeant comme un auditeur.",
    subtitle:
      "Chaque fonctionnalité répond à une situation vécue : une route sans réseau, une facture en dollars, un contrôle du bailleur.",
    offline: {
      title: "Hors ligne d'abord",
      text: "L'écran Terrain fonctionne sans connexion. Les saisies sont gardées sur le téléphone et envoyées sans doublon au retour du réseau.",
    },
    currencies: {
      title: "Multi-devises à taux figé",
      text: "GNF, EUR et USD. Le taux est figé au moment de la dépense : vos rapports ne bougent plus après coup.",
    },
    closure: {
      title: "Closure Pack auditable",
      text: "Réconciliation, dépenses, justificatifs, validations et historique réunis dans un dossier PDF avec empreintes SHA-256.",
    },
    approvals: {
      title: "Validations sans relance",
      text: "Circuits par seuil, notifications e-mail et WhatsApp, validation par lot pour les petites missions.",
    },
    budget: {
      title: "Suivi budgétaire en direct",
      text: "Prévu, engagé, réalisé : par mission, catégorie, destination et mois, avec export comptable CSV.",
    },
    audit: {
      title: "Traçabilité totale",
      text: "Aucune donnée n'est jamais effacée. Chaque modification est journalisée : qui, quoi, quand, avant et après.",
    },
  },
  showcase: {
    eyebrow: "Au bureau comme sur le terrain",
    title: "La finance voit tout, l'agent ne saisit qu'une fois.",
    point1: "Tableau de bord par rôle : à valider, avances ouvertes, dépenses à contrôler.",
    point2: "Réconciliation en un écran, avec le solde et le sens du règlement.",
    point3: "Calendrier des missions et rapports de coûts prêts à présenter.",
    queue: "À valider",
    queueCount: "4 demandes",
    advances: "Avances ouvertes",
    month: "Dépenses du mois",
    byCategory: "Coûts par catégorie",
    transport: "Transport",
    lodging: "Hébergement",
    perDiem: "Per diem",
    activities: "Activités",
  },
  audiences: {
    eyebrow: "Pour qui",
    title: "Fait pour les organisations qui rendent des comptes.",
    ngo: {
      title: "ONG et projets financés",
      text: "Justifiez chaque franc auprès des bailleurs, par projet et par ligne budgétaire, sans reconstituer les dossiers à la main.",
    },
    embassy: {
      title: "Ambassades et coopération",
      text: "Missions intérieures, ordres de mission, per diem et contrôle interne : une procédure unique, appliquée partout.",
    },
    company: {
      title: "Entreprises et sites",
      text: "Mines, BTP, distribution : déplacements d'équipes, avances et notes de frais réconciliées sans fin de mois difficile.",
    },
  },
  security: {
    eyebrow: "Sécurité et conformité",
    title: "Vos données restent les vôtres, et elles restent intactes.",
    subtitle: "MissionOps est construit pour passer un audit, pas seulement pour le survivre.",
    hosting: {
      title: "Hébergement en Europe",
      text: "Base de données et fichiers hébergés dans l'Union européenne, sauvegardes chiffrées quotidiennes.",
    },
    isolation: {
      title: "Cloisonnement par organisation",
      text: "Chaque requête est filtrée par organisation, jusque dans la base de données (sécurité au niveau des lignes).",
    },
    roles: {
      title: "Rôles et droits précis",
      text: "Collaborateur, manager, finance, directeur, administrateur : chacun voit et fait uniquement ce qui le concerne.",
    },
    integrity: {
      title: "Intégrité prouvée",
      text: "Journal d'audit immuable et empreintes cryptographiques sur chaque dossier de clôture.",
    },
  },
  pricing: {
    eyebrow: "Tarifs",
    title: "Commencez gratuitement, passez à l'échelle sur devis.",
    subtitle:
      "Facturation sur devis et facture, en GNF, EUR ou USD. Pas de carte bancaire nécessaire.",
    popular: "Le plus choisi",
    trial: {
      name: "Essai",
      price: "Gratuit",
      period: "30 jours",
      text: "Pour tester la boucle complète avec une équipe pilote.",
      f1: "Jusqu'à 10 utilisateurs",
      f2: "Toutes les fonctionnalités",
      f3: "Données de démonstration",
      cta: "Démarrer l'essai",
    },
    essential: {
      name: "Essentiel",
      price: "Sur devis",
      period: "par an",
      text: "Pour une organisation pays avec plusieurs équipes terrain.",
      f1: "Jusqu'à 25 utilisateurs",
      f2: "Circuits de validation et notifications",
      f3: "Closure Pack et export comptable",
      cta: "Nous contacter",
    },
    organisation: {
      name: "Organisation",
      price: "Sur devis",
      period: "par an",
      text: "Pour les réseaux multi-sites et les exigences d'audit élevées.",
      f1: "Jusqu'à 200 utilisateurs",
      f2: "Imports, référentiels et paramétrage avancé",
      f3: "Accompagnement au déploiement",
      cta: "Nous contacter",
    },
  },
  faq: {
    eyebrow: "Questions fréquentes",
    title: "Ce qu'on nous demande le plus souvent.",
    q1: "Que se passe-t-il si l'agent n'a pas de réseau pendant plusieurs jours ?",
    a1: "Rien n'est perdu. Les dépenses, photos de reçus et événements de mission restent sur le téléphone et partent automatiquement, dans l'ordre et sans doublon, dès qu'une connexion revient.",
    q2: "Comment sont gérées les dépenses en euros ou en dollars ?",
    a2: "Chaque montant est enregistré dans sa devise d'origine avec le taux du jour figé. Les rapports sont établis dans la devise de base de votre organisation, sans recalcul a posteriori.",
    q3: "Faut-il installer une application ?",
    a3: "Non. MissionOps s'ouvre dans le navigateur et peut être ajouté à l'écran d'accueil du téléphone. Il est optimisé pour les Android d'entrée de gamme et la 3G.",
    q4: "Peut-on supprimer une dépense saisie par erreur ?",
    a4: "Elle peut être annulée, jamais effacée : l'historique garde la trace de l'annulation et de son auteur. C'est ce qui rend vos dossiers opposables lors d'un audit.",
    q5: "Combien de temps pour démarrer ?",
    a5: "Une journée suffit pour une équipe pilote : création de l'organisation, import des lieux et des membres, configuration du circuit de validation.",
  },
  cta: {
    title: "Votre prochaine mission mérite mieux qu'un tableur.",
    subtitle: "Créez votre organisation en deux minutes et invitez votre équipe pilote.",
    primary: "Démarrer l'essai gratuit",
    secondary: "J'ai déjà un compte",
  },
  footer: {
    tagline: "Le système d'exploitation des missions terrain, conçu à Conakry.",
    product: "Produit",
    company: "Ressources",
    help: "Centre d'aide",
    contact: "Contact",
    contactEmail: "contact@missionops.app",
    rights: "© 2026 MissionOps. Tous droits réservés.",
    hosted: "Hébergé dans l'Union européenne",
  },
} as const;

type Widen<T> = { -readonly [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };
export type LandingMessages = Widen<typeof raw>;

export const landingFr: LandingMessages = raw;
