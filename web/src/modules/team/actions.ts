"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import { writeAuditLog } from "@/lib/audit-log";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export type AppRole = "ADMIN" | "ACCOUNTANT" | "EMPLOYEE" | "READONLY";

export async function listMembersAction(companyId: string) {
  await requireRole(companyId, ["ADMIN", "ACCOUNTANT", "EMPLOYEE", "READONLY"]);
  return prisma.membership.findMany({
    where: { companyId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
}

function generateTempPassword() {
  return crypto.randomBytes(9).toString("base64url"); // ~12 caractères lisibles
}

/**
 * Invite un membre dans l'équipe — équivalent de la section "Conseillers"
 * du back-office de référence (Ogustine). Aucun envoi d'email n'est câblé
 * (pas de fournisseur transactionnel configuré) : si le compte est
 * nouveau, un mot de passe temporaire est généré et renvoyé une seule fois
 * à l'administrateur, à transmettre lui-même au nouveau membre.
 */
export async function inviteMemberAction(params: {
  companyId: string;
  email: string;
  name: string;
  role: AppRole;
}) {
  const auth = await requireRole(params.companyId, ["ADMIN"]);
  const email = params.email.toLowerCase().trim();

  let user = await prisma.user.findUnique({ where: { email } });
  let tempPassword: string | null = null;

  if (!user) {
    tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    user = await prisma.user.create({
      data: { email, name: params.name || null, passwordHash },
    });
  }

  const existingMembership = await prisma.membership.findUnique({
    where: { userId_companyId: { userId: user.id, companyId: params.companyId } },
  });
  if (existingMembership) {
    throw new Error("Cette personne fait déjà partie de l'équipe.");
  }

  const membership = await prisma.membership.create({
    data: { userId: user.id, companyId: params.companyId, role: params.role },
    include: { user: true },
  });

  await writeAuditLog({
    companyId: auth.companyId,
    userId: auth.userId,
    action: "MEMBER_INVITED",
    entityType: "Membership",
    entityId: membership.id,
    diff: { email, role: params.role, newAccount: Boolean(tempPassword) },
  });

  revalidatePath("/team");
  return { membership, tempPassword };
}

export async function updateMemberRoleAction(membershipId: string, companyId: string, role: AppRole) {
  const auth = await requireRole(companyId, ["ADMIN"]);

  const existing = await prisma.membership.findFirst({ where: { id: membershipId, companyId } });
  if (!existing) throw new Error("Membre introuvable");

  if (existing.role === "ADMIN" && role !== "ADMIN") {
    const otherAdmins = await prisma.membership.count({
      where: { companyId, role: "ADMIN", id: { not: membershipId } },
    });
    if (otherAdmins === 0) {
      throw new Error("Impossible de rétrograder le dernier administrateur de la société.");
    }
  }

  const updated = await prisma.membership.update({ where: { id: membershipId }, data: { role } });

  await writeAuditLog({
    companyId: auth.companyId,
    userId: auth.userId,
    action: "MEMBER_ROLE_CHANGED",
    entityType: "Membership",
    entityId: membershipId,
    diff: { from: existing.role, to: role },
  });

  revalidatePath("/team");
  return updated;
}

export async function removeMemberAction(membershipId: string, companyId: string) {
  const auth = await requireRole(companyId, ["ADMIN"]);

  const existing = await prisma.membership.findFirst({ where: { id: membershipId, companyId } });
  if (!existing) throw new Error("Membre introuvable");

  if (existing.userId === auth.userId) {
    throw new Error("Impossible de te retirer toi-même de l'équipe.");
  }

  if (existing.role === "ADMIN") {
    const otherAdmins = await prisma.membership.count({
      where: { companyId, role: "ADMIN", id: { not: membershipId } },
    });
    if (otherAdmins === 0) {
      throw new Error("Impossible de retirer le dernier administrateur de la société.");
    }
  }

  await prisma.membership.delete({ where: { id: membershipId } });

  await writeAuditLog({
    companyId: auth.companyId,
    userId: auth.userId,
    action: "MEMBER_REMOVED",
    entityType: "Membership",
    entityId: membershipId,
  });

  revalidatePath("/team");
}
