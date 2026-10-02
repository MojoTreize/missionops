import { redirect } from "next/navigation";

/**
 * `/organizations` n'a pas d'écran propre : le fil d'Ariane y pointe depuis les
 * pages de l'organisation (membres, lieux, circuit, paramètres). On oriente
 * vers la liste des membres plutôt que de renvoyer une 404.
 */
export default function OrganizationsIndex() {
  redirect("/organizations/members");
}
