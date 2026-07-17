"use server";

import { requireRole } from "@/lib/auth-guard";
import { writeAuditLog } from "@/lib/audit-log";
import { createOwnerSchema, updateOwnerSchema } from "./dto";
import { ownersRepository } from "./repository";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function createOwnerAction(rawInput: unknown) {
  const input = createOwnerSchema.parse(rawInput);
  const auth = await requireRole(input.companyId, ["ADMIN", "ACCOUNTANT"]);

  const owner = await ownersRepository.create(input);

  await writeAuditLog({
    companyId: auth.companyId,
    userId: auth.userId,
    action: "OWNER_CREATED",
    entityType: "Owner",
    entityId: owner.id,
    diff: input,
  });

  revalidatePath("/owners");
  return owner;
}

export async function updateOwnerAction(rawInput: unknown) {
  const input = updateOwnerSchema.parse(rawInput);
  const existing = await ownersRepository.findById(input.id, input.companyId ?? "");
  if (!existing) throw new Error("Propriétaire introuvable");

  const auth = await requireRole(existing.companyId, ["ADMIN", "ACCOUNTANT"]);
  const owner = await ownersRepository.update(input);

  await writeAuditLog({
    companyId: auth.companyId,
    userId: auth.userId,
    action: "OWNER_UPDATED",
    entityType: "Owner",
    entityId: owner.id,
    diff: input,
  });

  revalidatePath("/owners");
  return owner;
}

export async function listOwnersAction(companyId: string, search?: string) {
  await requireRole(companyId, ["ADMIN", "ACCOUNTANT", "EMPLOYEE", "READONLY"]);
  return ownersRepository.list(companyId, search);
}

export async function getOwnerAction(id: string, companyId: string) {
  await requireRole(companyId, ["ADMIN", "ACCOUNTANT", "EMPLOYEE", "READONLY"]);
  return ownersRepository.findById(id, companyId);
}

/**
 * Active l'accès "portail propriétaire" pour ce propriétaire : crée (ou réutilise)
 * un compte User lié à son email et l'associe à l'Owner via Owner.userId. Comme
 * pour l'invitation d'équipe, aucun envoi d'email n'est câblé — le mot de passe
 * temporaire généré pour un nouveau compte est renvoyé une seule fois à
 * l'administrateur, à transmettre lui-même au propriétaire.
 */
export async function inviteOwnerToPortalAction(ownerId: string, companyId: string) {
  const auth = await requireRole(companyId, ["ADMIN"]);

  const owner = await prisma.owner.findFirst({ where: { id: ownerId, companyId } });
  if (!owner) throw new Error("Propriétaire introuvable");
  if (owner.userId) throw new Error("Ce propriétaire a déjà accès au portail.");
  if (!owner.email) throw new Error("Le propriétaire doit avoir un email renseigné.");

  const email = owner.email.toLowerCase().trim();
  let user = await prisma.user.findUnique({ where: { email } });
  let tempPassword: string | null = null;

  if (!user) {
    tempPassword = crypto.randomBytes(9).toString("base64url");
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    user = await prisma.user.create({
      data: { email, name: `${owner.firstName} ${owner.lastName}`, passwordHash },
    });
  }

  const alreadyLinked = await prisma.owner.findUnique({ where: { userId: user.id } });
  if (alreadyLinked) {
    throw new Error("Ce compte est déjà lié à un autre propriétaire.");
  }

  await prisma.owner.update({ where: { id: ownerId }, data: { userId: user.id } });

  await writeAuditLog({
    companyId: auth.companyId,
    userId: auth.userId,
    action: "OWNER_PORTAL_ACCESS_GRANTED",
    entityType: "Owner",
    entityId: ownerId,
    diff: { email, newAccount: Boolean(tempPassword) },
  });

  revalidatePath(`/owners/${ownerId}`);
  return { email, tempPassword };
}

export async function deleteOwnerAction(id: string, companyId: string) {
  const auth = await requireRole(companyId, ["ADMIN"]);
  await ownersRepository.delete(id, companyId);

  await writeAuditLog({
    companyId: auth.companyId,
    userId: auth.userId,
    action: "OWNER_DELETED",
    entityType: "Owner",
    entityId: id,
  });

  revalidatePath("/owners");
}
