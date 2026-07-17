import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export type AppRole =
  | "ADMIN"
  | "ACCOUNTANT"
  | "EMPLOYEE"
  | "READONLY"
  | "SUPER_ADMIN"
  | "OPERATIONAL_MANAGER"
  | "AGENT";

export class UnauthorizedError extends Error {
  constructor(message = "Accès non autorisé") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export interface AuthContext {
  userId: string;
  companyId: string;
  role: AppRole;
}

/**
 * À appeler en tête de chaque server action.
 * Vérifie la session (NextAuth), résout l'appartenance (Membership) à la société
 * ciblée, et s'assure que le rôle de l'utilisateur fait partie des rôles autorisés.
 *
 * Toute requête Prisma déclenchée ensuite doit filtrer explicitement par
 * `companyId` renvoyé ici — jamais faire confiance à un companyId venu du client.
 */
export async function requireRole(
  companyId: string,
  allowedRoles: AppRole[]
): Promise<AuthContext> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new UnauthorizedError("Session invalide ou expirée");
  }

  const membership = await prisma.membership.findUnique({
    where: { userId_companyId: { userId, companyId } },
  });

  if (!membership) {
    throw new UnauthorizedError("Aucun accès à cette société");
  }

  if (!allowedRoles.includes(membership.role as AppRole)) {
    throw new UnauthorizedError(
      `Rôle "${membership.role}" insuffisant pour cette action (requis: ${allowedRoles.join(", ")})`
    );
  }

  return { userId, companyId, role: membership.role as AppRole };
}

/**
 * Résout la société "courante" de l'utilisateur connecté : la première société
 * dont il est membre (triée par ancienneté du membership). Suffisant tant que
 * l'app ne gère qu'une société par utilisateur ; à faire évoluer vers un vrai
 * sélecteur multi-société si besoin plus tard.
 */
export async function getCurrentUserMembership() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const membership = await prisma.membership.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { company: true, user: true },
  });

  return membership;
}

/**
 * Résout le profil intervenant (Employee) lié au compte connecté, pour la vue
 * "Mes missions" (interface mobile intervenant). Un même User peut avoir un
 * Membership (accès back-office) ET/OU un Employee lié (missions terrain) —
 * les deux sont indépendants.
 */
export async function getCurrentEmployeeProfile(companyId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  return prisma.employee.findFirst({ where: { userId, companyId } });
}

/**
 * Résout l'accès "portail propriétaire" : un Owner peut être lié à un compte
 * User (Owner.userId) pour se connecter en lecture seule à ses logements,
 * réservations et factures. Volontairement indépendant du système de
 * Membership/rôles back-office — un propriétaire n'a jamais accès aux données
 * des autres propriétaires ni aux fonctions d'administration.
 */
export async function requireOwnerSession() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new UnauthorizedError("Session invalide ou expirée");
  }

  const owner = await prisma.owner.findFirst({ where: { userId } });
  if (!owner) {
    throw new UnauthorizedError("Aucun accès propriétaire pour ce compte");
  }

  return owner;
}
