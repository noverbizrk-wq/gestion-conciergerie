import { prisma } from "@/lib/prisma";
import type { NormalizedBookingRow } from "./airbnb-csv-parser";

/** Rapproche un nom d'annonce Airbnb brut avec un Property existant (par similarité simple). */
export async function matchPropertyByName(companyId: string, rawName: string) {
  const properties = await prisma.property.findMany({ where: { companyId } });
  const normalized = rawName.trim().toLowerCase();

  // 1. correspondance exacte
  let match = properties.find((p) => p.name.trim().toLowerCase() === normalized);
  if (match) return match;

  // 2. correspondance par inclusion (l'un contient l'autre)
  match = properties.find(
    (p) =>
      normalized.includes(p.name.trim().toLowerCase()) ||
      p.name.trim().toLowerCase().includes(normalized)
  );
  return match ?? null;
}

export async function persistBookings(
  companyId: string,
  rows: (NormalizedBookingRow & { propertyId: string })[]
) {
  const results = await Promise.allSettled(
    rows.map((row) =>
      prisma.booking.upsert({
        where: {
          propertyId_source_externalId: {
            propertyId: row.propertyId,
            source: "AIRBNB",
            externalId: row.externalId,
          },
        },
        create: {
          companyId,
          propertyId: row.propertyId,
          source: "AIRBNB",
          externalId: row.externalId,
          checkIn: row.checkIn,
          checkOut: row.checkOut,
          grossAmount: row.grossAmount.toNumber(),
          netRent: row.netRent.toNumber(),
          cleaningFee: row.cleaningFee.toNumber(),
          touristTax: row.touristTax.toNumber(),
          platformCommission: row.platformCommission.toNumber(),
          rawImportPayload: row.raw,
        },
        update: {
          checkIn: row.checkIn,
          checkOut: row.checkOut,
          grossAmount: row.grossAmount.toNumber(),
          netRent: row.netRent.toNumber(),
          cleaningFee: row.cleaningFee.toNumber(),
          touristTax: row.touristTax.toNumber(),
          platformCommission: row.platformCommission.toNumber(),
          rawImportPayload: row.raw,
        },
      })
    )
  );

  const failed = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
  const succeeded = results.filter(
    (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof prisma.booking.upsert>>> => r.status === "fulfilled"
  );
  return {
    createdOrUpdated: results.length - failed.length,
    failed: failed.map((f) => String(f.reason)),
    bookingIds: succeeded.map((r) => r.value.id),
  };
}
