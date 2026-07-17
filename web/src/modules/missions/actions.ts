"use server";

import { prisma } from "@/lib/prisma";
import { requireRole, type AppRole } from "@/lib/auth-guard";
import { writeAuditLog } from "@/lib/audit-log";
import { revalidatePath } from "next/cache";
import { generateMissionsForBooking } from "./generator";
import { MISSION_TRANSITIONS } from "./transitions";

const MANAGE_ROLES: AppRole[] = ["ADMIN", "SUPER_ADMIN", "OPERATIONAL_MANAGER"];
const MANAGE_AND_FIELD_ROLES: AppRole[] = ["ADMIN", "SUPER_ADMIN", "OPERATIONAL_MANAGER", "AGENT"];

export async function listMissionsAction(
  companyId: string,
  filters?: { propertyId?: string; employeeId?: string; status?: string; type?: string; bookingId?: string }
) {
  await requireRole(companyId, ["ADMIN", "SUPER_ADMIN", "OPERATIONAL_MANAGER", "ACCOUNTANT", "READONLY", "AGENT"]);
  return prisma.mission.findMany({
    where: {
      companyId,
      ...(filters?.propertyId ? { propertyId: filters.propertyId } : {}),
      ...(filters?.employeeId ? { employeeId: filters.employeeId } : {}),
      ...(filters?.status ? { status: filters.status as never } : {}),
      ...(filters?.type ? { type: filters.type as never } : {}),
      ...(filters?.bookingId ? { bookingId: filters.bookingId } : {}),
    },
    include: { property: true, employee: true, booking: true },
    orderBy: { scheduledDate: "asc" },
  });
}

export async function getMissionAction(id: string, companyId: string) {
  await requireRole(companyId, ["ADMIN", "SUPER_ADMIN", "OPERATIONAL_MANAGER", "ACCOUNTANT", "READONLY", "AGENT"]);
  return prisma.mission.findFirst({
    where: { id, companyId },
    include: {
      property: true,
      employee: true,
      booking: true,
      tasks: { orderBy: { order: "asc" } },
      photos: { orderBy: { takenAt: "desc" } },
    },
  });
}

export async function generateMissionsFromBookingAction(bookingId: string, companyId: string) {
  const auth = await requireRole(companyId, MANAGE_ROLES);
  const createdIds = await generateMissionsForBooking(bookingId, companyId);

  if (createdIds.length > 0) {
    await writeAuditLog({
      companyId: auth.companyId,
      userId: auth.userId,
      action: "MISSIONS_GENERATED",
      entityType: "Booking",
      entityId: bookingId,
      diff: { missionIds: createdIds },
    });
  }

  revalidatePath("/missions");
  revalidatePath(`/bookings/${bookingId}`);
  return createdIds;
}

export async function assignMissionAction(missionId: string, companyId: string, employeeId: string | null) {
  const auth = await requireRole(companyId, MANAGE_ROLES);
  const existing = await prisma.mission.findFirst({ where: { id: missionId, companyId } });
  if (!existing) throw new Error("Mission introuvable");

  const updated = await prisma.mission.update({
    where: { id: missionId },
    data: {
      employeeId,
      status: employeeId ? "ASSIGNED" : "PLANNED",
    },
  });

  await writeAuditLog({
    companyId: auth.companyId,
    userId: auth.userId,
    action: "MISSION_ASSIGNED",
    entityType: "Mission",
    entityId: missionId,
    diff: { employeeId },
  });

  revalidatePath("/missions");
  revalidatePath(`/missions/${missionId}`);
  return updated;
}

export async function updateMissionStatusAction(
  missionId: string,
  companyId: string,
  status: string,
  comment?: string
) {
  const auth = await requireRole(companyId, MANAGE_AND_FIELD_ROLES);
  const existing = await prisma.mission.findFirst({ where: { id: missionId, companyId } });
  if (!existing) throw new Error("Mission introuvable");

  const allowed = MISSION_TRANSITIONS[existing.status] ?? [];
  if (!allowed.includes(status)) {
    throw new Error(`Transition "${existing.status}" → "${status}" non autorisée.`);
  }

  const timestamps: Record<string, Date> = {};
  if (status === "ACCEPTED") timestamps.acceptedAt = new Date();
  if (status === "IN_PROGRESS" && !existing.startedAt) timestamps.startedAt = new Date();
  if (status === "DONE") timestamps.completedAt = new Date();
  if (status === "VALIDATED") timestamps.validatedAt = new Date();

  const updated = await prisma.mission.update({
    where: { id: missionId },
    data: { status: status as never, ...timestamps, ...(comment ? { comments: comment } : {}) },
  });

  await writeAuditLog({
    companyId: auth.companyId,
    userId: auth.userId,
    action: "MISSION_STATUS_CHANGED",
    entityType: "Mission",
    entityId: missionId,
    diff: { from: existing.status, to: status, comment },
  });

  revalidatePath("/missions");
  revalidatePath(`/missions/${missionId}`);
  return updated;
}

export async function toggleMissionTaskAction(taskId: string, missionId: string, companyId: string) {
  await requireRole(companyId, MANAGE_AND_FIELD_ROLES);
  const task = await prisma.missionTask.findFirst({
    where: { id: taskId, missionId, mission: { companyId } },
  });
  if (!task) throw new Error("Tâche introuvable");

  const updated = await prisma.missionTask.update({
    where: { id: taskId },
    data: { done: !task.done },
  });

  revalidatePath(`/missions/${missionId}`);
  return updated;
}

export async function addMissionPhotoAction(params: {
  missionId: string;
  companyId: string;
  phase: "BEFORE" | "AFTER";
  room?: string;
  storagePath: string;
}) {
  await requireRole(params.companyId, MANAGE_AND_FIELD_ROLES);
  const mission = await prisma.mission.findFirst({ where: { id: params.missionId, companyId: params.companyId } });
  if (!mission) throw new Error("Mission introuvable");

  const photo = await prisma.missionPhoto.create({
    data: {
      missionId: params.missionId,
      phase: params.phase,
      room: params.room || null,
      storagePath: params.storagePath,
    },
  });

  revalidatePath(`/missions/${params.missionId}`);
  return photo;
}
