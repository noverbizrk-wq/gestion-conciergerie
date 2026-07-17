"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import { writeAuditLog } from "@/lib/audit-log";
import { revalidatePath } from "next/cache";
import Decimal from "decimal.js";
import { persistQuotation, type QuotationLineDraft } from "./repository";
import { persistInvoice } from "@/modules/invoicing/repository";

export async function listQuotationsAction(companyId: string) {
  await requireRole(companyId, ["ADMIN", "ACCOUNTANT", "EMPLOYEE", "READONLY"]);
  return prisma.quotation.findMany({
    where: { companyId },
    include: { owner: true, property: true, lines: true },
    orderBy: { issueDate: "desc" },
  });
}

export async function getQuotationAction(quotationId: string, companyId: string) {
  await requireRole(companyId, ["ADMIN", "ACCOUNTANT", "EMPLOYEE", "READONLY"]);
  return prisma.quotation.findFirst({
    where: { id: quotationId, companyId },
    include: { owner: true, property: true, lines: true },
  });
}

export async function createQuotationAction(params: {
  companyId: string;
  ownerId: string;
  propertyId?: string;
  validUntil: string;
  lines: QuotationLineDraft[];
}) {
  const auth = await requireRole(params.companyId, ["ADMIN", "ACCOUNTANT"]);

  if (params.lines.length === 0) {
    throw new Error("Un devis doit contenir au moins une ligne.");
  }

  const quotation = await persistQuotation({
    companyId: params.companyId,
    ownerId: params.ownerId,
    propertyId: params.propertyId,
    validUntil: new Date(params.validUntil),
    lines: params.lines,
  });

  await writeAuditLog({
    companyId: auth.companyId,
    userId: auth.userId,
    action: "QUOTATION_CREATED",
    entityType: "Quotation",
    entityId: quotation.id,
  });

  revalidatePath("/quotes");
  return quotation;
}

const TRANSITIONS: Record<string, string[]> = {
  PROPOSED: ["ACCEPTED", "REFUSED", "EXPIRED", "ARCHIVED"],
  ACCEPTED: ["INVOICED", "ARCHIVED"],
  REFUSED: ["ARCHIVED"],
  EXPIRED: ["ARCHIVED"],
  INVOICED: [],
  ARCHIVED: [],
};

export async function updateQuotationStatusAction(
  quotationId: string,
  companyId: string,
  status: "PROPOSED" | "EXPIRED" | "REFUSED" | "ACCEPTED" | "ARCHIVED"
) {
  const auth = await requireRole(companyId, ["ADMIN", "ACCOUNTANT"]);

  const existing = await prisma.quotation.findFirst({ where: { id: quotationId, companyId } });
  if (!existing) throw new Error("Devis introuvable");

  if (!TRANSITIONS[existing.status]?.includes(status)) {
    throw new Error(`Transition de statut invalide : ${existing.status} -> ${status}`);
  }

  const updated = await prisma.quotation.update({
    where: { id: quotationId },
    data: { status },
  });

  await writeAuditLog({
    companyId: auth.companyId,
    userId: auth.userId,
    action: "QUOTATION_STATUS_CHANGED",
    entityType: "Quotation",
    entityId: quotationId,
    diff: { from: existing.status, to: status },
  });

  revalidatePath("/quotes");
  revalidatePath(`/quotes/${quotationId}`);
  return updated;
}

/**
 * Transforme un devis accepté en facture (brouillon), sur le modèle du
 * statut "Facturé" observé côté Devis du back-office de référence (Ogustine).
 */
export async function convertQuotationToInvoiceAction(quotationId: string, companyId: string) {
  const auth = await requireRole(companyId, ["ADMIN", "ACCOUNTANT"]);

  const quotation = await prisma.quotation.findFirst({
    where: { id: quotationId, companyId },
    include: { lines: true },
  });
  if (!quotation) throw new Error("Devis introuvable");
  if (quotation.status !== "ACCEPTED") {
    throw new Error("Seul un devis accepté peut être converti en facture.");
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  const invoice = await persistInvoice({
    companyId,
    ownerId: quotation.ownerId,
    propertyId: quotation.propertyId ?? undefined,
    type: "MIXED",
    dueDate,
    lines: quotation.lines.map((l) => ({
      description: l.description,
      quantity: Number(l.quantity),
      unitPriceHT: new Decimal(l.unitPriceHT),
      vatRate: new Decimal(l.vatRate),
      vatRateSource: "QUOTATION",
    })),
  });

  await prisma.quotation.update({ where: { id: quotationId }, data: { status: "INVOICED" } });

  await writeAuditLog({
    companyId: auth.companyId,
    userId: auth.userId,
    action: "QUOTATION_CONVERTED_TO_INVOICE",
    entityType: "Quotation",
    entityId: quotationId,
    diff: { invoiceId: invoice.id },
  });

  revalidatePath("/quotes");
  revalidatePath(`/quotes/${quotationId}`);
  revalidatePath("/invoices");
  return invoice;
}
