"use server";

import { requireRole } from "@/lib/auth-guard";
import { writeAuditLog } from "@/lib/audit-log";
import {
  generateMonthlyInvoiceForProperty,
  generateMonthlyInvoicesForCompany,
} from "./generate-monthly-invoice";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function generateInvoiceAction(
  companyId: string,
  propertyId: string,
  year: number,
  month: number
) {
  const auth = await requireRole(companyId, ["ADMIN", "ACCOUNTANT"]);
  const result = await generateMonthlyInvoiceForProperty(companyId, propertyId, { year, month });

  if (!result.skipped) {
    await writeAuditLog({
      companyId: auth.companyId,
      userId: auth.userId,
      action: "INVOICE_GENERATED",
      entityType: "Invoice",
      entityId: result.invoice.id,
    });
  }

  revalidatePath("/invoices");
  return result;
}

export async function generateAllMonthlyInvoicesAction(companyId: string, year: number, month: number) {
  const auth = await requireRole(companyId, ["ADMIN", "ACCOUNTANT"]);
  const results = await generateMonthlyInvoicesForCompany(companyId, { year, month });

  await writeAuditLog({
    companyId: auth.companyId,
    userId: auth.userId,
    action: "BULK_INVOICES_GENERATED",
    entityType: "Invoice",
    entityId: "bulk",
    diff: { period: `${year}-${month}`, count: results.filter((r) => !r.skipped).length },
  });

  revalidatePath("/invoices");
  return results;
}

export async function markInvoicePaidAction(
  invoiceId: string,
  companyId: string,
  payment: { amount: number; method: string; paidAt: string }
) {
  const auth = await requireRole(companyId, ["ADMIN", "ACCOUNTANT"]);

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        invoiceId,
        amount: payment.amount,
        method: payment.method as never,
        paidAt: new Date(payment.paidAt),
        status: "CONFIRMED",
      },
    }),
    prisma.invoice.update({ where: { id: invoiceId }, data: { status: "PAID" } }),
  ]);

  await writeAuditLog({
    companyId: auth.companyId,
    userId: auth.userId,
    action: "INVOICE_MARKED_PAID",
    entityType: "Invoice",
    entityId: invoiceId,
    diff: payment,
  });

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
}

export async function listInvoicesAction(companyId: string) {
  await requireRole(companyId, ["ADMIN", "ACCOUNTANT", "EMPLOYEE", "READONLY"]);
  return prisma.invoice.findMany({
    where: { companyId },
    include: { owner: true, property: true, lines: true, payments: true },
    orderBy: { issueDate: "desc" },
  });
}

export async function getInvoiceAction(invoiceId: string, companyId: string) {
  await requireRole(companyId, ["ADMIN", "ACCOUNTANT", "EMPLOYEE", "READONLY"]);
  return prisma.invoice.findFirst({
    where: { id: invoiceId, companyId },
    include: { owner: true, property: true, company: true, lines: true, payments: true },
  });
}

/**
 * Fait passer une facture de "Brouillon" (DRAFT) à "Envoyée / validée" (SENT).
 * Équivalent du bouton "Valider" observé sur le back-office de référence
 * (Ogustine) : une fois validée, la facture est considérée comme définitive
 * (numérotée sans trou dès sa création — voir getNextInvoiceNumber) et prête
 * à être transmise au client.
 */
export async function validateInvoiceAction(invoiceId: string, companyId: string) {
  const auth = await requireRole(companyId, ["ADMIN", "ACCOUNTANT"]);

  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, companyId } });
  if (!invoice) throw new Error("Facture introuvable");
  if (invoice.status !== "DRAFT") {
    throw new Error("Seule une facture au statut Brouillon peut être validée");
  }

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "SENT" },
  });

  await writeAuditLog({
    companyId: auth.companyId,
    userId: auth.userId,
    action: "INVOICE_VALIDATED",
    entityType: "Invoice",
    entityId: invoiceId,
  });

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  return updated;
}
