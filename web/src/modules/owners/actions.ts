"use server";

import { requireRole } from "@/lib/auth-guard";
import { writeAuditLog } from "@/lib/audit-log";
import { createOwnerSchema, updateOwnerSchema } from "./dto";
import { ownersRepository } from "./repository";
import { revalidatePath } from "next/cache";

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
