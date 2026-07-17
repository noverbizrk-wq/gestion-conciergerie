import { prisma } from "@/lib/prisma";
import Decimal from "decimal.js";

/**
 * Numéro de devis séquentiel par société (même logique que les factures,
 * compteur dédié pour ne pas mélanger les deux numérotations).
 */
export async function getNextQuotationNumber(companyId: string): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const company = await tx.company.update({
      where: { id: companyId },
      data: { quotationCounter: { increment: 1 } },
    });
    const year = new Date().getFullYear();
    return `DEV-${year}-${String(company.quotationCounter).padStart(5, "0")}`;
  });
}

export interface QuotationLineDraft {
  description: string;
  quantity: number;
  unitPriceHT: number;
  vatRate: number;
}

export async function persistQuotation(params: {
  companyId: string;
  ownerId: string;
  propertyId?: string;
  validUntil: Date;
  lines: QuotationLineDraft[];
}) {
  const number = await getNextQuotationNumber(params.companyId);

  const subtotalHT = params.lines.reduce(
    (acc, l) => acc.plus(new Decimal(l.unitPriceHT).mul(l.quantity)),
    new Decimal(0)
  );
  const vatAmount = params.lines.reduce(
    (acc, l) => acc.plus(new Decimal(l.unitPriceHT).mul(l.quantity).mul(l.vatRate).div(100)),
    new Decimal(0)
  );
  const totalTTC = subtotalHT.plus(vatAmount);

  return prisma.quotation.create({
    data: {
      companyId: params.companyId,
      ownerId: params.ownerId,
      propertyId: params.propertyId,
      number,
      validUntil: params.validUntil,
      status: "PROPOSED",
      subtotalHT: subtotalHT.toNumber(),
      vatAmount: vatAmount.toNumber(),
      totalTTC: totalTTC.toNumber(),
      lines: {
        create: params.lines.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unitPriceHT: l.unitPriceHT,
          vatRate: l.vatRate,
          lineTotalHT: new Decimal(l.unitPriceHT).mul(l.quantity).toNumber(),
        })),
      },
    },
    include: { lines: true },
  });
}
