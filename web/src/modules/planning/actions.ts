"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import { startOfWeek, endOfWeek, addDays } from "date-fns";

export type PlanningEvent = {
  id: string;
  date: Date;
  kind: "CHECKIN" | "CHECKOUT" | "CLEANING";
  label: string;
  propertyName: string;
  propertyId: string;
  durationMinutes?: number;
};

/**
 * Récupère les événements de la semaine (check-in/check-out de réservations +
 * ménages planifiés) pour alimenter la vue planning, sur le modèle de la page
 * "Interventions" du back-office de référence (Ogustine) : vue calendrier
 * semaine, un jour par colonne.
 */
export async function getWeekPlanningAction(companyId: string, referenceDate: Date) {
  await requireRole(companyId, ["ADMIN", "ACCOUNTANT", "EMPLOYEE", "READONLY"]);

  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 });

  const [bookings, cleaningTasks] = await Promise.all([
    prisma.booking.findMany({
      where: {
        companyId,
        OR: [
          { checkIn: { gte: weekStart, lte: weekEnd } },
          { checkOut: { gte: weekStart, lte: weekEnd } },
        ],
      },
      include: { property: true },
    }),
    prisma.cleaningTask.findMany({
      where: { companyId, date: { gte: weekStart, lte: weekEnd } },
      include: { property: true },
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
      label: `Ménage — ${task.property.name}`,
      propertyName: task.property.name,
      propertyId: task.propertyId,
      durationMinutes: task.durationMinutes,
    });
  }

  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return { weekStart, weekEnd, days, events };
}
