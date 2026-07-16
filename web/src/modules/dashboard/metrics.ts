import { prisma } from "@/lib/prisma";

export async function getDashboardMetrics(companyId: string) {
  const [invoiceAgg, paidCount, pendingCount, overdueCount, ownerCount, propertyCount, cleaningCount] =
    await Promise.all([
      prisma.invoice.aggregate({
        where: { companyId },
        _sum: { subtotalHT: true, vatAmount: true, totalTTC: true },
      }),
      prisma.invoice.count({ where: { companyId, status: "PAID" } }),
      prisma.invoice.count({ where: { companyId, status: { in: ["SENT", "DRAFT"] } } }),
      prisma.invoice.count({ where: { companyId, status: "OVERDUE" } }),
      prisma.owner.count({ where: { companyId } }),
      prisma.property.count({ where: { companyId } }),
      prisma.cleaningTask.count({ where: { companyId } }),
    ]);

  const paidVat = await prisma.invoice.aggregate({
    where: { companyId, status: "PAID" },
    _sum: { vatAmount: true },
  });

  const revenueByMonth = await prisma.$queryRaw<{ month: string; total: number }[]>`
    SELECT to_char(date_trunc('month', "issueDate"), 'YYYY-MM') as month,
           SUM("totalTTC")::float as total
    FROM invoices
    WHERE "companyId" = ${companyId}
    GROUP BY 1
    ORDER BY 1 DESC
    LIMIT 12
  `;

  return {
    chiffreAffairesHT: Number(invoiceAgg._sum.subtotalHT ?? 0),
    tvaCollectee: Number(invoiceAgg._sum.vatAmount ?? 0),
    tvaRestante: Number(invoiceAgg._sum.vatAmount ?? 0) - Number(paidVat._sum.vatAmount ?? 0),
    facturesPayees: paidCount,
    facturesEnAttente: pendingCount,
    facturesEnRetard: overdueCount,
    nombreProprietaires: ownerCount,
    nombreLogements: propertyCount,
    nombrePrestationsMenage: cleaningCount,
    revenueByMonth: revenueByMonth.reverse(),
  };
}
