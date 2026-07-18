"use server";

import { requireRole } from "@/lib/auth-guard";
import { writeAuditLog } from "@/lib/audit-log";
import { createPropertySchema, updatePropertySchema } from "./dto";
import { propertiesRepository } from "./repository";
import { revalidatePath } from "next/cache";

export async function createPropertyAction(rawInput: unknown) {
  const input = createPropertySchema.parse(rawInput);
  const auth = await requireRole(input.companyId, ["ADMIN", "ACCOUNTANT"]);

  const property = await propertiesRepository.create(input);

  await writeAuditLog({
    companyId: auth.companyId,
    userId: auth.userId,
    action: "PROPERTY_CREATED",
    entityType: "Property",
    entityId: property.id,
    diff: input,
  });

  revalidatePath("/properties");
  return property;
}

export async function updatePropertyAction(rawInput: unknown) {
  const input = updatePropertySchema.parse(rawInput);
  const auth = await requireRole(input.companyId, ["ADMIN", "ACCOUNTANT"]);

  await propertiesRepository.update(input.id, input.companyId, input.data);

  await writeAuditLog({
    companyId: auth.companyId,
    userId: auth.userId,
    action: "PROPERTY_UPDATED",
    entityType: "Property",
    entityId: input.id,
    diff: input.data,
  });

  revalidatePath("/properties");
}

export async function listPropertiesAction(companyId: string, ownerId?: string) {
  await requireRole(companyId, ["ADMIN", "SUPER_ADMIN", "OPERATIONAL_MANAGER", "ACCOUNTANT", "EMPLOYEE", "READONLY"]);
  return propertiesRepository.list(companyId, ownerId);
}

export async function getPropertyAction(id: string, companyId: string) {
  await requireRole(companyId, ["ADMIN", "SUPER_ADMIN", "OPERATIONAL_MANAGER", "ACCOUNTANT", "EMPLOYEE", "READONLY"]);
  return propertiesRepository.findById(id, companyId);
}

export async function deletePropertyAction(id: string, companyId: string) {
  const auth = await requireRole(companyId, ["ADMIN"]);
  await propertiesRepository.delete(id, companyId);

  await writeAuditLog({
    companyId: auth.companyId,
    userId: auth.userId,
    action: "PROPERTY_DELETED",
    entityType: "Property",
    entityId: id,
  });

  revalidatePath("/properties");
}
