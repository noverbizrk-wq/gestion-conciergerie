"use server";

import { requireRole } from "@/lib/auth-guard";
import { writeAuditLog } from "@/lib/audit-log";
import { parseAirbnbCsv } from "./airbnb-csv-parser";
import { matchPropertyByName, persistBookings } from "./repository";
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
