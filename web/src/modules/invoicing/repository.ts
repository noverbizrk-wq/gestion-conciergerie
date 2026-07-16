import { prisma } from "@/lib/prisma";
import Decimal from "decimal.js";

/**
 * Génère le numéro de facture légal suivant pour une société.
 * Format : NC-{YYYY}-{séquence sur 5 chiffres}, séquence continue et jamais réutilisée
 * (exigence légale française de numérotation chronologique sans trou).
 *
 * Utilise une transaction pour éviter toute collision en cas de génération concurrente.
 */
export async function getNextInvoiceNumber(companyId: string): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const company = await tx.company.update({
      where: { id: companyId },
      data: { invoiceCounter: { increment: 1 } },
    });
    const year = new Date().getFullYear();
    return `NC-${year}-${String(company.invoiceCounter).padStart(5, "0")}`;
  });
}

export interface InvoiceLineDraft {
  description: string;
  quantity: number;
  unitPriceHT: Decimal;
  vatRate: Decimal;
  vatRateSource: string;
  sourceBookingId?: string;
}

export async function persistInvoice(params: {
  companyId: string;
  ownerId: string;
  propertyId?: string;
  type: "COMMISSION" | "CLEANING" | "MIXED";
  lines: InvoiceLineDraft[];
  dueDate: Date;
}) {
  const number = await getNextInvoiceNumber(params.companyId);

  const subtotalHT = params.lines.reduce(
    (acc, l) => acc.plus(l.unitPriceHT.mul(l.quantity)),
    new Decimal(0)
  );
  const vatAmount = params.lines.reduce(
    (acc, l) => acc.plus(l.unitPriceHT.mul(l.quantity).mul(l.vatRate).div(100)),
    new Decimal(0)
  );
  const totalTTC = subtotalHT.plus(vatAmount);

  return prisma.invoice.create({
    data: {
      companyId: params.companyId,
      ownerId: params.ownerId,
      propertyId: params.propertyId,
      type: params.type,
      number,
      dueDate: params.dueDate,
      status: "DRAFT",
      subtotalHT: subtotalHT.toNumber(),
      vatAmount: vatAmount.toNumber(),
      totalTTC: totalTTC.toNumber(),
      lines: {
        create: params.lines.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unitPriceHT: l.unitPriceHT.toNumber(),
          vatRate: l.vatRate.toNumber(),
          vatRateSource: l.vatRateSource,
          lineTotalHT: l.unitPriceHT.mul(l.quantity).toNumber(),
          sourceBookingId: l.sourceBookingId,
        })),
      },
    },
    include: { lines: true },
  });
}
