import type { Messages } from "./fr";

/**
 * Catalogue de traduction anglais (B1.11). Typé `Messages` : toute clé
 * manquante ou en trop par rapport au français provoque une erreur de
 * compilation.
 */
export const en: Messages = {
  app: {
    name: "MissionOps",
    tagline: "The operating system for field missions",
  },
  common: {
    retry: "Try again",
    backToDashboard: "Back to dashboard",
    loading: "Loading…",
  },
  nav: {
    dashboard: "Dashboard",
    missions: "Missions",
    expenses: "Expenses",
    reports: "Reports",
  },
  routes: {
    organization: "Organization",
    newOrganization: "New organization",
    members: "Members",
    forbidden: "Access denied",
    profile: "Profile",
  },
  shell: {
    mainNav: "Main navigation",
    breadcrumb: "Breadcrumb",
    searchLabel: "Global search",
    searchPlaceholder: "Search a mission, an expense, a member…",
    searchButton: "Search…",
    searchTerm: "Search term",
    searchEmptyTitle: "Nothing to search yet",
    searchEmptyDescription:
      "Search will cover missions, expenses and members as soon as data exists.",
    account: "Account",
    accountMenu: "Account and organization",
    organization: "Organization",
    members: "Members",
    logout: "Sign out",
    createOrganization: "Create an organization",
  },
  roles: {
    collaborateur: "Collaborator",
    manager: "Manager",
    logisticien: "Logistician",
    finance: "Finance",
    directeur_pays: "Country director",
    admin: "Administrator",
  },
  auth: {
    tagline: "The operating system for field missions",
    emailLabel: "Email address",
    emailPlaceholder: "you@organization.org",
    login: {
      title: "Sign in",
      magicSubmit: "Get a sign-in link",
      magicSending: "Sending…",
      divider: "or with a password",
      passwordLabel: "Password",
      forgot: "Forgot?",
      passwordSubmit: "Sign in",
      passwordSigning: "Signing in…",
      linkInvalid: "This sign-in link is invalid or has expired. Request a new one.",
    },
    forgot: {
      title: "Forgot password",
      description: "Enter your address: we will send you a reset link.",
      submit: "Send the link",
      sending: "Sending…",
      back: "Back to sign in",
    },
    reset: {
      title: "New password",
      hint: "At least 8 characters.",
      passwordLabel: "Password",
      confirmLabel: "Confirm password",
      submit: "Set the password",
      saving: "Saving…",
      incomplete: "Reset link incomplete or expired.",
      redo: "Request again",
    },
    messages: {
      genericSent: "If an account matches this address, an email has just been sent.",
      emailInvalid: "Invalid email address.",
      credentialsInvalid: "Invalid email address or password.",
      rateLimited: "Too many attempts. Try again in a few minutes.",
      credentialsIncorrect: "Incorrect email address or password.",
      passwordTooShort: "The password must be at least 8 characters.",
      passwordMismatch: "The two passwords do not match.",
      resetLinkInvalid: "Invalid or expired link. Request a new one.",
    },
  },
  dashboard: {
    greeting: "Hello {name}",
    activeOrganization: "Active organization: {name}.",
    missionsSoon: "Missions will appear here soon.",
    manageMembers: "Manage members",
  },
  organizations: {
    new: {
      title: "New organization",
      description:
        "Create your workspace. You will be its administrator and will be able to invite your team.",
      nameLabel: "Organization name",
      namePlaceholder: "Red Cross Guinea",
      countryLabel: "Country (optional)",
      countryPlaceholder: "Guinea",
      submit: "Create the organization",
      creating: "Creating…",
      nameTooShort: "The organization name is too short.",
    },
    switcher: {
      label: "Active organization",
    },
    members: {
      title: "Members — {name}",
      subtitle: "Manage the people who can access this organization.",
      activeMembers: "Active members",
      memberColumn: "Member",
      roleColumn: "Role",
      pendingInvitations: "Pending invitations",
      emailColumn: "Email",
      inviteTitle: "Invite a member",
      inviteEmailPlaceholder: "colleague@organization.org",
      roleLabel: "Role",
      inviteSubmit: "Invite",
      inviteSending: "Sending…",
    },
    invite: {
      denied: "Your role does not allow you to invite members.",
      sent: "Invitation sent to {email}.",
    },
  },
  sections: {
    missions: {
      title: "Missions",
      emptyTitle: "No missions yet",
      emptyDescription: "Creating and tracking missions will come in a future block.",
    },
    expenses: {
      title: "Expenses",
      emptyTitle: "No expenses yet",
      emptyDescription: "Entering and approving expenses will come in a future block.",
    },
    reports: {
      title: "Reports",
      emptyTitle: "No reports yet",
      emptyDescription: "Dashboards and exports will come once data is in place.",
    },
  },
  forbidden: {
    title: "Access denied",
    description:
      "Your role does not allow you to view this page. Reach out to an administrator of your organization if you think this is a mistake.",
  },
  notFound: {
    title: "Page not found",
    description: "The page you are looking for does not exist or has been moved.",
  },
  error: {
    title: "Something went wrong",
    description: "Something went wrong on our side. You can try again.",
  },
  profile: {
    title: "Profile",
    languageTitle: "Language",
    languageDescription: "Choose the interface language.",
    languageLabel: "Interface language",
  },
  meta: {
    login: "Sign in",
    forgot: "Forgot password",
    reset: "Reset",
    dashboard: "Dashboard",
    members: "Members",
    missions: "Missions",
    expenses: "Expenses",
    reports: "Reports",
    forbidden: "Access denied",
    notFound: "Page not found",
    profile: "Profile",
  },
};
