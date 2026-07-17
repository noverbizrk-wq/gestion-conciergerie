"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";

/**
 * KPI encaissements — sur le modèle de la page "Encaissements" du back-office
 * de référence (Ogustine) : total brut, nombre de transactions confirmées,
 * nombre de clients distincts encaissés, sur une période donnée.
 */
export async function getPaymentsAction(companyId: string) {
  await requireRole(companyId, ["ADMIN", "ACCOUNTANT", "EMPLOYEE", "READONLY"]);

  const payments = await prisma.payment.findMany({
    where: { invoice: { companyId } },
    include: { invoice: { include: { owner: true } } },
    orderBy: { createdAt: "desc" },
  });

  const confirmed = payments.filter((p) => p.status === "CONFIRMED");
  const totalBrut = confirmed.reduce((acc, p) => acc + Number(p.amount), 0);
  const distinctOwners = new Set(confirmed.map((p) => p.invoice.ownerId));

  return {
    payments,
    kpis: {
      totalBrut,
      transactionsConfirmees: confirmed.length,
      transactionsEnAttente: payments.filter((p) => p.status === "PENDING").length,
      transactionsEchouees: payments.filter((p) => p.status === "FAILED").length,
      clientsEncaisses: distinctOwners.size,
    },
  };
}
