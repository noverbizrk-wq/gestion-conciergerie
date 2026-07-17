"use server";

import { requireRole, getCurrentEmployeeProfile } from "@/lib/auth-guard";
import { writeAuditLog } from "@/lib/audit-log";
import { createEmployeeSchema, updateEmployeeSchema } from "./dto";
import { employeesRepository } from "./repository";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const MANAGE_ROLES = ["ADMIN", "SUPER_ADMIN", "OPERATIONAL_MANAGER"] as const;

export async function createEmployeeAction(rawInput: unknown) {
  const input = createEmployeeSchema.parse(rawInput);
  const auth = await requireRole(input.companyId, [...MANAGE_ROLES]);

  const employee = await employeesRepository.create(input);

  await writeAuditLog({
    companyId: auth.companyId,
    userId: auth.userId,
    action: "EMPLOYEE_CREATED",
    entityType: "Employee",
    entityId: employee.id,
    diff: input,
  });

  revalidatePath("/employees");
  return employee;
}

export async function updateEmployeeAction(rawInput: unknown) {
  const input = updateEmployeeSchema.parse(rawInput);
  if (!input.companyId) throw new Error("companyId requis");

  const auth = await requireRole(input.companyId, [...MANAGE_ROLES]);
  const employee = await employeesRepository.update(input);

  await writeAuditLog({
    companyId: auth.companyId,
    userId: auth.userId,
    action: "EMPLOYEE_UPDATED",
    entityType: "Employee",
    entityId: employee.id,
    diff: input,
  });

  revalidatePath("/employees");
  revalidatePath(`/employees/${employee.id}`);
  return employee;
}

export async function listEmployeesAction(companyId: string, search?: string) {
  await requireRole(companyId, ["ADMIN", "SUPER_ADMIN", "OPERATIONAL_MANAGER", "ACCOUNTANT", "READONLY"]);
  return employeesRepository.list(companyId, search);
}

export async function getEmployeeAction(id: string, companyId: string) {
  await requireRole(companyId, ["ADMIN", "SUPER_ADMIN", "OPERATIONAL_MANAGER", "ACCOUNTANT", "READONLY"]);
  return employeesRepository.findById(id, companyId);
}

export async function setEmployeeActiveAction(id: string, companyId: string, active: boolean) {
  const auth = await requireRole(companyId, [...MANAGE_ROLES]);
  await employeesRepository.setActive(id, companyId, active);

  await writeAuditLog({
    companyId: auth.companyId,
    userId: auth.userId,
    action: active ? "EMPLOYEE_REACTIVATED" : "EMPLOYEE_DEACTIVATED",
    entityType: "Employee",
    entityId: id,
  });

  revalidatePath("/employees");
}

export async function getMyEmployeeProfileAction(companyId: string) {
  return getCurrentEmployeeProfile(companyId);
}

/**
 * Active l'accès "Mes missions" (interface mobile intervenant) pour cet
 * intervenant : crée (ou réutilise) un compte User lié à son email et
 * l'associe via Employee.userId. Même pattern que l'invitation d'équipe et
 * l'activation du portail propriétaire — mot de passe temporaire affiché une
 * seule fois, aucun envoi d'email (pas de fournisseur configuré).
 */
export async function inviteEmployeeToAppAction(employeeId: string, companyId: string) {
  const auth = await requireRole(companyId, [...MANAGE_ROLES]);

  const employee = await prisma.employee.findFirst({ where: { id: employeeId, companyId } });
  if (!employee) throw new Error("Intervenant introuvable");
  if (employee.userId) throw new Error("Cet intervenant a déjà un accès.");
  if (!employee.email) throw new Error("L'intervenant doit avoir un email renseigné.");

  const email = employee.email.toLowerCase().trim();
  let user = await prisma.user.findUnique({ where: { email } });
  let tempPassword: string | null = null;

  if (!user) {
    tempPassword = crypto.randomBytes(9).toString("base64url");
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    user = await prisma.user.create({
      data: { email, name: `${employee.firstName} ${employee.lastName}`, passwordHash },
    });
  }

  const alreadyLinked = await prisma.employee.findUnique({ where: { userId: user.id } });
  if (alreadyLinked) {
    throw new Error("Ce compte est déjà lié à un autre intervenant.");
  }

  await prisma.employee.update({ where: { id: employeeId }, data: { userId: user.id } });

  // Un Membership (rôle AGENT) est nécessaire pour que les server actions déjà
  // protégées par requireRole (missions, checklist, photos, incidents...) acceptent
  // ce compte. Ne remplace jamais un rôle existant si la personne a déjà un accès
  // back-office plus large (ex. un responsable qui est aussi intervenant).
  const existingMembership = await prisma.membership.findUnique({
    where: { userId_companyId: { userId: user.id, companyId } },
  });
  if (!existingMembership) {
    await prisma.membership.create({ data: { userId: user.id, companyId, role: "AGENT" } });
  }

  await writeAuditLog({
    companyId: auth.companyId,
    userId: auth.userId,
    action: "EMPLOYEE_APP_ACCESS_GRANTED",
    entityType: "Employee",
    entityId: employeeId,
    diff: { email, newAccount: Boolean(tempPassword) },
  });

  revalidatePath(`/employees/${employeeId}`);
  return { email, tempPassword };
}

export async function deleteEmployeeAction(id: string, companyId: string) {
  const auth = await requireRole(companyId, ["ADMIN", "SUPER_ADMIN"]);
  await employeesRepository.delete(id, companyId);

  await writeAuditLog({
    companyId: auth.companyId,
    userId: auth.userId,
    action: "EMPLOYEE_DELETED",
    entityType: "Employee",
    entityId: id,
  });

  revalidatePath("/employees");
}
