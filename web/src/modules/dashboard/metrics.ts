import { prisma } from "@/lib/prisma";

function nightsBetween(checkIn: Date, checkOut: Date) {
  const ms = checkOut.getTime() - checkIn.getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export async function getDashboardMetrics(companyId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const daysInMonth = monthEnd.getDate();

  const [
    invoiceAgg,
    paidCount,
    pendingCount,
    overdueCount,
    ownerCount,
    propertyCount,
    cleaningCount,
    missionsAVenirCount,
    missionsEnRetardCount,
    incidentsOuvertsCount,
    bookingsThisMonth,
    bookingsAll,
    reviewAgg,
  ] = await Promise.all([
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
    prisma.mission.count({
      where: {
        companyId,
        scheduledDate: { gte: now },
        status: { notIn: ["VALIDATED", "CANCELLED", "REFUSED"] },
      },
    }),
    prisma.mission.count({
      where: {
        companyId,
        scheduledDate: { lt: now },
        status: { notIn: ["VALIDATED", "CANCELLED", "REFUSED", "DONE"] },
      },
    }),
    prisma.incident.count({ where: { companyId, status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.booking.findMany({
      where: { companyId, checkIn: { lte: monthEnd }, checkOut: { gte: monthStart } },
      select: { checkIn: true, checkOut: true },
    }),
    prisma.booking.findMany({
      where: { companyId },
      select: { grossAmount: true, netRent: true, cleaningFee: true, platformCommission: true, checkIn: true, checkOut: true, propertyId: true, property: { select: { name: true } } },
    }),
    prisma.review.aggregate({
      where: { companyId, status: "PUBLISHED" },
      _avg: { rating: true },
      _count: true,
    }),
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

  // Taux d'occupation du mois en cours : nuits réservées (bornées au mois) / (nb logements * jours du mois)
  const nightsThisMonth = bookingsThisMonth.reduce((sum, b) => {
    const start = b.checkIn < monthStart ? monthStart : b.checkIn;
    const end = b.checkOut > monthEnd ? monthEnd : b.checkOut;
    return sum + nightsBetween(start, end);
  }, 0);
  const capaciteNuits = propertyCount * daysInMonth;
  const tauxOccupation = capaciteNuits > 0 ? Math.min(100, (nightsThisMonth / capaciteNuits) * 100) : 0;

  // Revenu moyen par réservation / par nuit, calculés sur l'ensemble des réservations importées.
  const totalNights = bookingsAll.reduce((sum, b) => sum + nightsBetween(b.checkIn, b.checkOut), 0);
  const totalGross = bookingsAll.reduce((sum, b) => sum + Number(b.grossAmount), 0);
  const revenuMoyenParReservation = bookingsAll.length > 0 ? totalGross / bookingsAll.length : 0;
  const revenuMoyenParNuit = totalNights > 0 ? totalGross / totalNights : 0;

  // Rentabilité par logement : CA net estimé (loyer net - commission plateforme - ménage), top 5.
  const parLogement = new Map<string, { name: string; net: number }>();
  for (const b of bookingsAll) {
    const net = Number(b.netRent) - Number(b.platformCommission) - Number(b.cleaningFee);
    const existing = parLogement.get(b.propertyId);
    if (existing) {
      existing.net += net;
    } else {
      parLogement.set(b.propertyId, { name: b.property.name, net });
    }
  }
  const rentabiliteParLogement = Array.from(parLogement.values())
    .sort((a, b) => b.net - a.net)
    .slice(0, 5);

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
    missionsAVenir: missionsAVenirCount,
    missionsEnRetard: missionsEnRetardCount,
    incidentsOuverts: incidentsOuvertsCount,
    tauxOccupation,
    revenuMoyenParReservation,
    revenuMoyenParNuit,
    rentabiliteParLogement,
    satisfactionMoyenne: reviewAgg._avg.rating ?? null,
    nombreAvis: reviewAgg._count,
    revenueByMonth: revenueByMonth.reverse(),
  };
}
