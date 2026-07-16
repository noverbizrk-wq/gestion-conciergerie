import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export type AppRole = "ADMIN" | "ACCOUNTANT" | "EMPLOYEE" | "READONLY";

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
 * Vérifie la session Supabase, résout l'appartenance (Membership) à la société
 * ciblée, et s'assure que le rôle de l'utilisateur fait partie des rôles autorisés.
 *
 * Toute requête Prisma déclenchée ensuite doit filtrer explicitement par
 * `companyId` renvoyé ici — jamais faire confiance à un companyId venu du client.
 */
export async function requireRole(
  companyId: string,
  allowedRoles: AppRole[]
): Promise<AuthContext> {
  // ⚠️ Court-circuit DEV UNIQUEMENT : tant que l'auth Supabase réelle n'est pas
  // branchée (voir README, section "Limitations connues"), on autorise l'accès
  // en local avec le rôle ADMIN dès lors qu'aucun projet Supabase n'est configuré.
  // Ne JAMAIS activer en production (NODE_ENV === "production" désactive ce chemin).
  if (
    process.env.NODE_ENV !== "production" &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL
  ) {
    return { userId: "local-dev-user", companyId, role: "ADMIN" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new UnauthorizedError("Session invalide ou expirée");
  }

  const dbUser = await prisma.user.findUnique({ where: { supabaseAuthId: user.id } });
  if (!dbUser) {
    throw new UnauthorizedError("Utilisateur inconnu en base");
  }

  const membership = await prisma.membership.findUnique({
    where: { userId_companyId: { userId: dbUser.id, companyId } },
  });

  if (!membership) {
    throw new UnauthorizedError("Aucun accès à cette société");
  }

  if (!allowedRoles.includes(membership.role as AppRole)) {
    throw new UnauthorizedError(
      `Rôle "${membership.role}" insuffisant pour cette action (requis: ${allowedRoles.join(", ")})`
    );
  }

  return { userId: dbUser.id, companyId, role: membership.role as AppRole };
}
