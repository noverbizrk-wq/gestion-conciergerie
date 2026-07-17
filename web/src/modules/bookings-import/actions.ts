"use server";

import { requireRole } from "@/lib/auth-guard";
import { writeAuditLog } from "@/lib/audit-log";
import { parseAirbnbCsv } from "./airbnb-csv-parser";
import { matchPropertyByName, persistBookings } from "./repository";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface ImportPreviewRow {
  externalId: string;
  propertyNameRaw: string;
  matchedPropertyId: string | null;
  matchedPropertyName: string | null;
  checkIn: string;
  checkOut: string;
  netRent: number;
  cleaningFee: number;
  touristTax: number;
  grossAmount: number;
}

/**
 * Étape 1 : parse le CSV et tente le rapprochement automatique des logements.
 * Ne persiste RIEN — l'admin doit valider (ou corriger le rapprochement) avant confirmImportAction.
 */
export async function previewImportAction(companyId: string, fileContent: string) {
  await requireRole(companyId, ["ADMIN", "ACCOUNTANT"]);

  const { rows, errors } = parseAirbnbCsv(fileContent);

  const preview: ImportPreviewRow[] = await Promise.all(
    rows.map(async (row) => {
      const match = await matchPropertyByName(companyId, row.propertyNameRaw);
      return {
        externalId: row.externalId,
        propertyNameRaw: row.propertyNameRaw,
        matchedPropertyId: match?.id ?? null,
        matchedPropertyName: match?.name ?? null,
        checkIn: row.checkIn.toISOString(),
        checkOut: row.checkOut.toISOString(),
        netRent: row.netRent.toNumber(),
        cleaningFee: row.cleaningFee.toNumber(),
        touristTax: row.touristTax.toNumber(),
        grossAmount: row.grossAmount.toNumber(),
      };
    })
  );

  return { preview, parseErrors: errors, rawRows: rows };
}

/**
 * Étape 2 : persiste les réservations une fois le mapping logement validé/corrigé par l'utilisateur.
 * `resolvedMapping` permet de corriger manuellement les rapprochements ambigus détectés en preview.
 */
export async function confirmImportAction(
  companyId: string,
  fileContent: string,
  resolvedMapping: Record<string /* externalId */, string /* propertyId */>
) {
  const auth = await requireRole(companyId, ["ADMIN", "ACCOUNTANT"]);
  const { rows } = parseAirbnbCsv(fileContent);

  const unresolved = rows.filter((r) => !resolvedMapping[r.externalId]);
  if (unresolved.length > 0) {
    throw new Error(
      `${unresolved.length} réservation(s) sans logement rapproché — merci de compléter le mapping avant confirmation.`
    );
  }

  const rowsWithProperty = rows.map((r) => ({ ...r, propertyId: resolvedMapping[r.externalId] }));
  const result = await persistBookings(companyId, rowsWithProperty);

  await writeAuditLog({
    companyId: auth.companyId,
    userId: auth.userId,
    action: "BOOKINGS_IMPORTED",
    entityType: "Booking",
    entityId: "bulk",
    diff: { count: result.createdOrUpdated, failed: result.failed },
  });

  revalidatePath("/bookings");
  return result;
}


export async function listBookingsAction(companyId: string) {
  await requireRole(companyId, ["ADMIN", "ACCOUNTANT", "EMPLOYEE", "READONLY"]);
  return prisma.booking.findMany({
    where: { companyId },
    include: { property: true },
    orderBy: { checkIn: "desc" },
  });
}

export async function getBookingAction(bookingId: string, companyId: string) {
  await requireRole(companyId, ["ADMIN", "ACCOUNTANT", "EMPLOYEE", "READONLY"]);
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, companyId },
    include: { property: { include: { owner: true } } },
  });
  if (!booking) return null;

  const activity = await prisma.auditLog.findMany({
    where: { companyId, entityType: "Booking", entityId: bookingId },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return { booking, activity };
}

/**
 * Changement de statut manuel d'une réservation, avec journal d'activité —
 * équivalent de l'historique horodaté observé sur la page "Demande" du
 * back-office de référence (Ogustine).
 */
export async function updateBookingStatusAction(
  bookingId: string,
  companyId: string,
  status: "IMPORTED" | "INVOICED" | "IGNORED",
  note?: string
) {
  const auth = await requireRole(companyId, ["ADMIN", "ACCOUNTANT"]);

  const existing = await prisma.booking.findFirst({ where: { id: bookingId, companyId } });
  if (!existing) throw new Error("Réservation introuvable");

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status },
  });

  await writeAuditLog({
    companyId: auth.companyId,
    userId: auth.userId,
    action: "BOOKING_STATUS_CHANGED",
    entityType: "Booking",
    entityId: bookingId,
    diff: { from: existing.status, to: status, note },
  });

  revalidatePath("/bookings");
  revalidatePath(`/bookings/${bookingId}`);
  return updated;
}
