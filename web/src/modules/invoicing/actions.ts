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
}

export async function listInvoicesAction(companyId: string) {
  await requireRole(companyId, ["ADMIN", "ACCOUNTANT", "EMPLOYEE", "READONLY"]);
  return prisma.invoice.findMany({
    where: { companyId },
    include: { owner: true, property: true, lines: true, payments: true },
    orderBy: { issueDate: "desc" },
  });
}
