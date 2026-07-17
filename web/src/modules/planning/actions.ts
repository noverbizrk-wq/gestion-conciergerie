"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import { startOfWeek, endOfWeek, addDays } from "date-fns";

export type PlanningEvent = {
  id: string;
  date: Date;
  kind: "CHECKIN" | "CHECKOUT" | "CLEANING" | "MISSION";
  label: string;
  propertyName: string;
  propertyId: string;
  durationMinutes?: number;
  missionId?: string;
  missionStatus?: string;
  employeeId?: string | null;
  employeeName?: string | null;
};

export type PlanningFilters = {
  propertyId?: string;
  employeeId?: string;
};

/**
 * Récupère les événements de la période (check-in/check-out de réservations,
 * ménages facturés historiques + missions du moteur d'automatisation) pour
 * alimenter la vue planning. Filtrable par logement et par intervenant —
 * l'affectation d'une mission à un intervenant reste toujours modifiable
 * manuellement depuis la fiche mission (lien direct depuis chaque événement).
 */
export async function getWeekPlanningAction(
  companyId: string,
  referenceDate: Date,
  filters?: PlanningFilters
) {
  await requireRole(companyId, ["ADMIN", "SUPER_ADMIN", "OPERATIONAL_MANAGER", "ACCOUNTANT", "EMPLOYEE", "READONLY", "AGENT"]);

  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 });

  const propertyFilter = filters?.propertyId ? { propertyId: filters.propertyId } : {};

  const [bookings, cleaningTasks, missions] = await Promise.all([
    prisma.booking.findMany({
      where: {
        companyId,
        ...propertyFilter,
        OR: [
          { checkIn: { gte: weekStart, lte: weekEnd } },
          { checkOut: { gte: weekStart, lte: weekEnd } },
        ],
      },
      include: { property: true },
    }),
    prisma.cleaningTask.findMany({
      where: { companyId, ...propertyFilter, date: { gte: weekStart, lte: weekEnd } },
      include: { property: true },
    }),
    prisma.mission.findMany({
      where: {
        companyId,
        ...propertyFilter,
        ...(filters?.employeeId ? { employeeId: filters.employeeId } : {}),
        scheduledDate: { gte: weekStart, lte: weekEnd },
      },
      include: { property: true, employee: true },
    }),
  ]);

  const events: PlanningEvent[] = [];

  for (const booking of bookings) {
    if (booking.checkIn >= weekStart && booking.checkIn <= weekEnd) {
      events.push({
        id: `${booking.id}-checkin`,
        date: booking.checkIn,
        kind: "CHECKIN",
        label: `Arrivée voyageur — ${booking.property.name}`,
        propertyName: booking.property.name,
        propertyId: booking.propertyId,
      });
    }
    if (booking.checkOut >= weekStart && booking.checkOut <= weekEnd) {
      events.push({
        id: `${booking.id}-checkout`,
        date: booking.checkOut,
        kind: "CHECKOUT",
        label: `Départ voyageur — ${booking.property.name}`,
        propertyName: booking.property.name,
        propertyId: booking.propertyId,
      });
    }
  }

  for (const task of cleaningTasks) {
    events.push({
      id: task.id,
      date: task.date,
      kind: "CLEANING",
      label: `Ménage facturé — ${task.property.name}`,
      propertyName: task.property.name,
      propertyId: task.propertyId,
      durationMinutes: task.durationMinutes,
    });
  }

  const MISSION_TYPE_LABELS: Record<string, string> = {
    CLEANING: "Ménage",
    QUALITY_CONTROL: "Contrôle qualité",
    LAUNDRY: "Blanchisserie",
    MAINTENANCE: "Maintenance",
    CHECKIN_PREP: "Préparation check-in",
  };

  for (const mission of missions) {
    events.push({
      id: mission.id,
      date: mission.scheduledDate,
      kind: "MISSION",
      label: `${MISSION_TYPE_LABELS[mission.type] ?? mission.type} — ${mission.property.name}`,
      propertyName: mission.property.name,
      propertyId: mission.propertyId,
      durationMinutes: mission.estimatedDurationMinutes ?? undefined,
      missionId: mission.id,
      missionStatus: mission.status,
      employeeId: mission.employeeId,
      employeeName: mission.employee ? `${mission.employee.firstName} ${mission.employee.lastName}` : null,
    });
  }

  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return { weekStart, weekEnd, days, events };
}
