"use server";

import { requireRole, getCurrentEmployeeProfile } from "@/lib/auth-guard";
import { writeAuditLog } from "@/lib/audit-log";
import { createEmployeeSchema, updateEmployeeSchema } from "./dto";
import { employeesRepository } from "./repository";
import { revalidatePath } from "next/cache";

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
