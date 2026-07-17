import { redirect } from "next/navigation";
import { getCurrentUserMembership, requireOwnerSession, getCurrentEmployeeProfileAnyCompany } from "@/lib/auth-guard";

/**
 * Point d'entrée après connexion : oriente vers le back-office (équipe/staff via
 * Membership), l'espace intervenant (Employee lié) ou le portail propriétaire
 * (Owner.userId), selon le compte connecté. Le back-office est prioritaire si un
 * compte cumule plusieurs accès.
 */
export default async function RootPage() {
  const membership = await getCurrentUserMembership();
  if (membership) redirect("/dashboard");

  const owner = await requireOwnerSession().catch(() => null);
  if (owner) redirect("/portal");

  const employee = await getCurrentEmployeeProfileAnyCompany();
  if (employee) redirect("/my-missions");

  redirect("/dashboard");
}
