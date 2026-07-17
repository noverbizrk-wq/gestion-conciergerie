"use server";

import { prisma } from "@/lib/prisma";
import { requireRole, type AppRole } from "@/lib/auth-guard";
import { writeAuditLog } from "@/lib/audit-log";
import { revalidatePath } from "next/cache";

const MANAGE_ROLES: AppRole[] = ["ADMIN", "SUPER_ADMIN", "OPERATIONAL_MANAGER"];
const REPORT_ROLES: AppRole[] = ["ADMIN", "SUPER_ADMIN", "OPERATIONAL_MANAGER", "AGENT"];

export async function listIncidentsAction(companyId: string, filters?: { status?: string; propertyId?: string }) {
  await requireRole(companyId, ["ADMIN", "SUPER_ADMIN", "OPERATIONAL_MANAGER", "ACCOUNTANT", "READONLY", "AGENT"]);
  return prisma.incident.findMany({
    where: {
      companyId,
      ...(filters?.status ? { status: filters.status as never } : {}),
      ...(filters?.propertyId ? { propertyId: filters.propertyId } : {}),
    },
    include: { property: true, responsibleEmployee: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getIncidentAction(id: string, companyId: string) {
  await requireRole(companyId, ["ADMIN", "SUPER_ADMIN", "OPERATIONAL_MANAGER", "ACCOUNTANT", "READONLY", "AGENT"]);
  return prisma.incident.findFirst({
    where: { id, companyId },
    include: { property: true, responsibleEmployee: true, booking: true, missions: true },
  });
}

/**
 * Signalement d'un incident — accessible aux agents de terrain (constat lors d'une
 * mission) comme aux responsables/admin (saisie directe).
 */
export async function createIncidentAction(params: {
  companyId: string;
  propertyId: string;
  bookingId?: string;
  category: string;
  description: string;
  priority?: string;
  estimatedCost?: number;
  photos?: string[];
}) {
  const auth = await requireRole(params.companyId, REPORT_ROLES);

  const incident = await prisma.incident.create({
    data: {
      companyId: params.companyId,
      propertyId: params.propertyId,
      bookingId: params.bookingId || null,
      category: params.category as never,
      description: params.description,
      priority: (params.priority as never) ?? "NORMAL",
      estimatedCost: params.estimatedCost,
      photos: params.photos ?? [],
      status: "OPEN",
    },
  });

  await writeAuditLog({
    companyId: auth.companyId,
    userId: auth.userId,
    action: "INCIDENT_CREATED",
    entityType: "Incident",
    entityId: incident.id,
    diff: { category: params.category, propertyId: params.propertyId },
  });

  revalidatePath("/incidents");
  return incident;
}

export async function updateIncidentStatusAction(
  incidentId: string,
  companyId: string,
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
) {
  const auth = await requireRole(companyId, MANAGE_ROLES);
  const existing = await prisma.incident.findFirst({ where: { id: incidentId, companyId } });
  if (!existing) throw new Error("Incident introuvable");

  const updated = await prisma.incident.update({
    where: { id: incidentId },
    data: {
      status,
      resolvedAt: status === "RESOLVED" || status === "CLOSED" ? new Date() : existing.resolvedAt,
    },
  });

  await writeAuditLog({
    companyId: auth.companyId,
    userId: auth.userId,
    action: "INCIDENT_STATUS_CHANGED",
    entityType: "Incident",
    entityId: incidentId,
    diff: { from: existing.status, to: status },
  });

  revalidatePath("/incidents");
  revalidatePath(`/incidents/${incidentId}`);
  return updated;
}

export async function assignIncidentAction(incidentId: string, companyId: string, employeeId: string | null) {
  const auth = await requireRole(companyId, MANAGE_ROLES);
  const existing = await prisma.incident.findFirst({ where: { id: incidentId, companyId } });
  if (!existing) throw new Error("Incident introuvable");

  const updated = await prisma.incident.update({
    where: { id: incidentId },
    data: { responsibleEmployeeId: employeeId },
  });

  await writeAuditLog({
    companyId: auth.companyId,
    userId: auth.userId,
    action: "INCIDENT_ASSIGNED",
    entityType: "Incident",
    entityId: incidentId,
    diff: { employeeId },
  });

  revalidatePath(`/incidents/${incidentId}`);
  return updated;
}

/**
 * Création automatique d'une mission de maintenance liée à l'incident — cf. section 16
 * du cahier des charges ("permettre la création automatique d'une mission de maintenance").
 */
export async function createMaintenanceMissionAction(incidentId: string, companyId: string) {
  const auth = await requireRole(companyId, MANAGE_ROLES);
  const incident = await prisma.incident.findFirst({ where: { id: incidentId, companyId } });
  if (!incident) throw new Error("Incident introuvable");

  const mission = await prisma.mission.create({
    data: {
      companyId,
      propertyId: incident.propertyId,
      incidentId: incident.id,
      type: "MAINTENANCE",
      status: "TO_PLAN",
      priority: incident.priority,
      scheduledDate: new Date(),
      instructions: incident.description,
    },
  });

  await prisma.incident.update({ where: { id: incidentId }, data: { status: "IN_PROGRESS" } });

  await writeAuditLog({
    companyId: auth.companyId,
    userId: auth.userId,
    action: "MAINTENANCE_MISSION_CREATED",
    entityType: "Incident",
    entityId: incidentId,
    diff: { missionId: mission.id },
  });

  revalidatePath("/incidents");
  revalidatePath(`/incidents/${incidentId}`);
  revalidatePath("/missions");
  return mission;
}
