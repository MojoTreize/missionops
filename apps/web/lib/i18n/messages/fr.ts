/**
 * Catalogue de traduction français (B1.11) — source unique de vérité.
 *
 * La forme de cet objet définit le type `Messages` : le catalogue anglais
 * (`en.ts`) doit avoir exactement les mêmes clés, ce que TypeScript vérifie à la
 * compilation et le test de parité vérifie à l'exécution.
 */
import { domainFr } from "./domain.fr";

export const fr = {
  ...domainFr,
  app: {
    name: "MissionOps",
    tagline: "Le système d'exploitation des missions terrain",
  },
  common: {
    retry: "Réessayer",
    backToDashboard: "Retour au tableau de bord",
    loading: "Chargement…",
  },
  nav: {
    help: "Aide",
    dashboard: "Tableau de bord",
    missions: "Missions",
    expenses: "Dépenses",
    reports: "Rapports",
    terrain: "Terrain",
    approvals: "À valider",
    finance: "Finance",
    notifications: "Notifications",
    locations: "Lieux",
    approvalFlow: "Circuit de validation",
    audit: "Journal d'audit",
    settings: "Paramètres",
    admin: "Administration",
  },
  routes: {
    detail: "Fiche",
    organization: "Organisation",
    newOrganization: "Nouvelle organisation",
    members: "Membres",
    forbidden: "Accès refusé",
    profile: "Profil",
  },
  shell: {
    groupOperations: "Opérations",
    groupManagement: "Pilotage",
    notifications: "Notifications",
    skipToContent: "Aller au contenu",
    mainNav: "Navigation principale",
    breadcrumb: "Fil d'Ariane",
    searchLabel: "Recherche globale",
    searchPlaceholder: "Rechercher une mission, une dépense, un membre…",
    searchButton: "Rechercher…",
    searchTerm: "Terme de recherche",
    searchEmptyTitle: "Rien à rechercher pour l'instant",
    searchEmptyDescription:
      "La recherche portera sur les missions, les dépenses et les membres dès que des données existeront.",
    account: "Compte",
    accountMenu: "Compte et organisation",
    organization: "Organisation",
    members: "Membres",
    logout: "Se déconnecter",
    createOrganization: "Créer une organisation",
  },
  roles: {
    collaborateur: "Collaborateur",
    manager: "Manager",
    logisticien: "Logisticien",
    finance: "Finance",
    directeur_pays: "Directeur pays",
    admin: "Administrateur",
  },
  auth: {
    tagline: "Le système d'exploitation des missions terrain",
    emailLabel: "Adresse e-mail",
    emailPlaceholder: "vous@organisation.org",
    login: {
      title: "Se connecter",
      magicSubmit: "Recevoir un lien de connexion",
      magicSending: "Envoi…",
      divider: "ou avec un mot de passe",
      passwordLabel: "Mot de passe",
      forgot: "Oublié ?",
      passwordSubmit: "Se connecter",
      passwordSigning: "Connexion…",
      linkInvalid: "Ce lien de connexion est invalide ou a expiré. Demandez-en un nouveau.",
    },
    forgot: {
      title: "Mot de passe oublié",
      description: "Indiquez votre adresse : nous vous enverrons un lien de réinitialisation.",
      submit: "Envoyer le lien",
      sending: "Envoi…",
      back: "Retour à la connexion",
    },
    reset: {
      title: "Nouveau mot de passe",
      hint: "Au moins 8 caractères.",
      passwordLabel: "Mot de passe",
      confirmLabel: "Confirmer le mot de passe",
      submit: "Définir le mot de passe",
      saving: "Enregistrement…",
      incomplete: "Lien de réinitialisation incomplet ou expiré.",
      redo: "Refaire une demande",
    },
    messages: {
      genericSent: "Si un compte correspond à cette adresse, un e-mail vient d'être envoyé.",
      emailInvalid: "Adresse e-mail invalide.",
      credentialsInvalid: "Adresse e-mail ou mot de passe invalide.",
      rateLimited: "Trop de tentatives. Réessayez dans quelques minutes.",
      credentialsIncorrect: "Adresse e-mail ou mot de passe incorrect.",
      passwordTooShort: "Le mot de passe doit faire au moins 8 caractères.",
      passwordMismatch: "Les deux mots de passe ne correspondent pas.",
      resetLinkInvalid: "Lien invalide ou expiré. Refaites une demande.",
    },
  },
  dashboard: {
    greeting: "Bonjour {name}",
    activeOrganization: "Organisation active : {name}.",
    missionsSoon: "Les missions apparaîtront ici bientôt.",
    manageMembers: "Gérer les membres",
  },
  organizations: {
    new: {
      title: "Nouvelle organisation",
      description:
        "Créez votre espace de travail. Vous en serez l'administrateur et pourrez inviter votre équipe.",
      nameLabel: "Nom de l'organisation",
      namePlaceholder: "Croix-Rouge Guinée",
      countryLabel: "Pays (facultatif)",
      countryPlaceholder: "Guinée",
      submit: "Créer l'organisation",
      creating: "Création…",
      nameTooShort: "Le nom de l'organisation est trop court.",
    },
    switcher: {
      label: "Organisation active",
    },
    members: {
      title: "Membres — {name}",
      subtitle: "Gérez les personnes ayant accès à cette organisation.",
      activeMembers: "Membres actifs",
      memberColumn: "Membre",
      roleColumn: "Rôle",
      pendingInvitations: "Invitations en attente",
      emailColumn: "E-mail",
      inviteTitle: "Inviter un membre",
      inviteEmailPlaceholder: "collegue@organisation.org",
      roleLabel: "Rôle",
      inviteSubmit: "Inviter",
      inviteSending: "Envoi…",
    },
    invite: {
      denied: "Votre rôle ne permet pas d'inviter des membres.",
      sent: "Invitation envoyée à {email}.",
    },
  },
  sections: {
    missions: {
      title: "Missions",
      emptyTitle: "Aucune mission pour l'instant",
      emptyDescription: "La création et le suivi des missions arriveront dans un prochain bloc.",
    },
    expenses: {
      title: "Dépenses",
      emptyTitle: "Aucune dépense pour l'instant",
      emptyDescription: "La saisie et la validation des dépenses arriveront dans un prochain bloc.",
    },
    reports: {
      title: "Rapports",
      emptyTitle: "Aucun rapport pour l'instant",
      emptyDescription: "Les tableaux de bord et exports arriveront une fois les données en place.",
    },
  },
  forbidden: {
    title: "Accès refusé",
    description:
      "Votre rôle ne vous autorise pas à consulter cette page. Rapprochez-vous d'un administrateur de votre organisation si vous pensez qu'il s'agit d'une erreur.",
  },
  notFound: {
    title: "Page introuvable",
    description: "La page que vous cherchez n'existe pas ou a été déplacée.",
  },
  error: {
    title: "Une erreur est survenue",
    description: "Quelque chose s'est mal passé de notre côté. Vous pouvez réessayer.",
  },
  profile: {
    title: "Profil",
    languageTitle: "Langue",
    languageDescription: "Choisissez la langue de l'interface.",
    languageLabel: "Langue de l'interface",
  },
  meta: {
    login: "Connexion",
    forgot: "Mot de passe oublié",
    reset: "Réinitialisation",
    dashboard: "Tableau de bord",
    members: "Membres",
    missions: "Missions",
    expenses: "Dépenses",
    reports: "Rapports",
    forbidden: "Accès refusé",
    notFound: "Page introuvable",
    profile: "Profil",
  },
} satisfies Record<string, unknown>;

export type Messages = typeof fr;
