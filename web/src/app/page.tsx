import { redirect } from "next/navigation";
import { getCurrentUserMembership, requireOwnerSession } from "@/lib/auth-guard";

/**
 * Point d'entrée après connexion : oriente vers le back-office (équipe/staff via
 * Membership) ou le portail propriétaire (Owner.userId), selon le compte connecté.
 * Un compte peut en théorie avoir les deux ; le back-office est prioritaire.
 */
export default async function RootPage() {
  const membership = await getCurrentUserMembership();
  if (membership) redirect("/dashboard");

  const owner = await requireOwnerSession().catch(() => null);
  if (owner) redirect("/portal");

  redirect("/dashboard");
}
