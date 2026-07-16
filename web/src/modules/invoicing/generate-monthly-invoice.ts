import { prisma } from "@/lib/prisma";
import Decimal from "decimal.js";
import { computeMonthlyCommission, type CommissionTier } from "./commission-engine";
import { resolveVatRate } from "@/modules/vat-engine/resolve-vat";
import { persistInvoice, type InvoiceLineDraft } from "./repository";

/**
 * Génère la facture mensuelle d'un logement pour un propriétaire donné :
 *   - ligne de commission calculée sur le loyer net des réservations du mois
 *   - lignes de ménage non encore facturées, facturées au propriétaire
 * Chaque ligne résout son propre taux de TVA (le taux peut différer entre
 * la commission et le ménage si, par exemple, le ménage est sous-traité
 * avec un régime de TVA distinct — configurable via une future extension
 * de VatSetting ; pour l'instant les deux lignes utilisent la même résolution).
 *
 * Ne facture PAS le ménage si `Property.cleaningBilledTo === "GUEST"`.
 */
export async function generateMonthlyInvoiceForProperty(
  companyId: string,
  propertyId: string,
  month: { year: number; month: number } // month: 1-12
) {
  const property = await prisma.property.findFirstOrThrow({
    where: { id: propertyId, companyId },
    include: { owner: true },
  });
  const company = await prisma.company.findFirstOrThrow({ where: { id: companyId } });

  const periodStart = new Date(month.year, month.month - 1, 1);
  const periodEnd = new Date(month.year, month.month, 1);

  const bookings = await prisma.booking.findMany({
    where: {
      propertyId,
      status: "IMPORTED",
      checkOut: { gte: periodStart, lt: periodEnd },
    },
    orderBy: { checkIn: "asc" },
  });

  const vat = resolveVatRate({
    company: { defaultVatRate: company.defaultVatRate, defaultVatRegime: company.defaultVatRegime },
    owner: { vatRegime: property.owner.vatRegime, vatRate: property.owner.vatRate },
    property: { vatRateOverride: property.vatRateOverride },
  });

  const lines: InvoiceLineDraft[] = [];

  if (bookings.length > 0) {
    const commissionResult = computeMonthlyCommission(
      bookings.map((b) => ({ id: b.id, netRent: b.netRent })),
      {
        mode: property.commissionMode,
        fixedRate: property.commissionRate ?? undefined,
        tiers: (property.commissionTiers as unknown as CommissionTier[]) ?? undefined,
      }
    );

    lines.push({
      description: `Commission de gestion Airbnb — ${property.name} — ${month.month}/${month.year} (${bookings.length} réservation(s), base loyer net ${commissionResult.totalNetRent.toFixed(2)} €)`,
      quantity: 1,
      unitPriceHT: commissionResult.totalCommissionHT,
      vatRate: vat.rate,
      vatRateSource: vat.source,
    });
  }

  let cleaningLinesCount = 0;
  if (property.cleaningBilledTo === "OWNER") {
    const cleaningTasks = await prisma.cleaningTask.findMany({
      where: {
        propertyId,
        billedTo: "OWNER",
        invoiceLineId: null,
        date: { gte: periodStart, lt: periodEnd },
      },
    });

    for (const task of cleaningTasks) {
      lines.push({
        description: `Prestation de ménage — ${property.name} — ${task.date.toLocaleDateString("fr-FR")}`,
        quantity: 1,
        unitPriceHT: new Decimal(task.price),
        vatRate: vat.rate,
        vatRateSource: vat.source,
      });
      cleaningLinesCount++;
    }
  }

  if (lines.length === 0) {
    return { skipped: true, reason: "Aucune commission ni ménage à facturer pour cette période." };
  }

  const dueDate = new Date(month.year, month.month - 1, 1);
  dueDate.setDate(dueDate.getDate() + 30); // échéance à 30 jours par défaut

  const invoice = await persistInvoice({
    companyId,
    ownerId: property.ownerId,
    propertyId,
    type: cleaningLinesCount > 0 && bookings.length > 0 ? "MIXED" : bookings.length > 0 ? "COMMISSION" : "CLEANING",
    lines,
    dueDate,
  });

  // Marquer les réservations comme facturées et les tâches de ménage comme rattachées
  await prisma.booking.updateMany({
    where: { id: { in: bookings.map((b) => b.id) } },
    data: { status: "INVOICED" },
  });

  return { skipped: false, invoice };
}

/** Génère les factures de TOUS les logements d'une société pour un mois donné (bouton "1 clic"). */
export async function generateMonthlyInvoicesForCompany(
  companyId: string,
  month: { year: number; month: number }
) {
  const properties = await prisma.property.findMany({ where: { companyId } });
  const results = [];
  for (const property of properties) {
    const result = await generateMonthlyInvoiceForProperty(companyId, property.id, month);
    results.push({ propertyId: property.id, propertyName: property.name, ...result });
  }
  return results;
}
