import { prisma } from "@/lib/prisma";
import { DEFAULT_CLEANING_CHECKLIST } from "./checklist-templates";

/**
 * Moteur de génération automatique de missions à la clôture d'une réservation
 * (import ou création manuelle). Idempotent : une contrainte unique (bookingId, type)
 * empêche la duplication si la génération est relancée (ré-import CSV par exemple).
 *
 * Génère pour chaque réservation :
 *  - une mission de ménage (CLEANING), au jour du check-out, avec la checklist par défaut ;
 *  - une mission de contrôle qualité (QUALITY_CONTROL), à suivre juste après.
 *
 * Les missions de blanchisserie/maintenance ne sont pas générées automatiquement pour
 * l'instant (pas encore de règle métier fiable sans les informations logement du lot 3) —
 * elles pourront être ajoutées manuellement ou créées automatiquement plus tard.
 */
export async function generateMissionsForBooking(bookingId: string, companyId: string) {
  const booking = await prisma.booking.findFirst({ where: { id: bookingId, companyId } });
  if (!booking) throw new Error("Réservation introuvable");

  const created: string[] = [];

  const existingCleaning = await prisma.mission.findUnique({
    where: { bookingId_type: { bookingId, type: "CLEANING" } },
  });

  if (!existingCleaning) {
    const cleaningMission = await prisma.mission.create({
      data: {
        companyId,
        propertyId: booking.propertyId,
        bookingId: booking.id,
        type: "CLEANING",
        status: "TO_PLAN",
        priority: "NORMAL",
        scheduledDate: booking.checkOut,
        estimatedDurationMinutes: 120,
        tasks: {
          create: DEFAULT_CLEANING_CHECKLIST.map((task, index) => ({
            category: task.category,
            label: task.label,
            required: task.required,
            photoRequired: task.photoRequired,
            order: index,
          })),
        },
      },
    });
    created.push(cleaningMission.id);
  }

  const existingQualityControl = await prisma.mission.findUnique({
    where: { bookingId_type: { bookingId, type: "QUALITY_CONTROL" } },
  });

  if (!existingQualityControl) {
    const qcMission = await prisma.mission.create({
      data: {
        companyId,
        propertyId: booking.propertyId,
        bookingId: booking.id,
        type: "QUALITY_CONTROL",
        status: "TO_PLAN",
        priority: "NORMAL",
        scheduledDate: booking.checkOut,
        estimatedDurationMinutes: 20,
        instructions: "Vérifier la mission de ménage avant le prochain check-in.",
      },
    });
    created.push(qcMission.id);
  }

  return created;
}

export async function generateMissionsForBookings(bookingIds: string[], companyId: string) {
  const results = await Promise.allSettled(
    bookingIds.map((id) => generateMissionsForBooking(id, companyId))
  );
  const created = results
    .filter((r): r is PromiseFulfilledResult<string[]> => r.status === "fulfilled")
    .flatMap((r) => r.value);
  const failed = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
  return { created, failed: failed.map((f) => String(f.reason)) };
}
