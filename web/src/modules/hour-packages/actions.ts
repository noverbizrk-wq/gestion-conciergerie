"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import { writeAuditLog } from "@/lib/audit-log";
import { revalidatePath } from "next/cache";
import Decimal from "decimal.js";

export async function listHourPackagesAction(companyId: string) {
  await requireRole(companyId, ["ADMIN", "ACCOUNTANT", "EMPLOYEE", "READONLY"]);
  return prisma.hourPackage.findMany({
    where: { companyId },
    include: { owner: true },
    orderBy: { purchasedAt: "desc" },
  });
}

export async function createHourPackageAction(params: {
  companyId: string;
  ownerId: string;
  totalHours: number;
  pricePerHour: number;
  expiresAt?: string;
}) {
  const auth = await requireRole(params.companyId, ["ADMIN", "ACCOUNTANT"]);

  if (params.totalHours <= 0) {
    throw new Error("Le nombre d'heures doit être positif.");
  }

  const pack = await prisma.hourPackage.create({
    data: {
      companyId: params.companyId,
      ownerId: params.ownerId,
      totalHours: params.totalHours,
      pricePerHour: params.pricePerHour,
      expiresAt: params.expiresAt ? new Date(params.expiresAt) : null,
      status: "ACTIVE",
    },
  });

  await writeAuditLog({
    companyId: auth.companyId,
    userId: auth.userId,
    action: "HOUR_PACKAGE_CREATED",
    entityType: "HourPackage",
    entityId: pack.id,
  });

  revalidatePath("/hour-packages");
  return pack;
}

/**
 * Consomme des heures d'un pack (ex. après un ménage réalisé). Passe le pack
 * en CONSUMED dès que le solde restant atteint zéro.
 */
export async function consumeHourPackageAction(packageId: string, companyId: string, hours: number) {
  const auth = await requireRole(companyId, ["ADMIN", "ACCOUNTANT", "EMPLOYEE"]);

  const pack = await prisma.hourPackage.findFirst({ where: { id: packageId, companyId } });
  if (!pack) throw new Error("Pack introuvable");
  if (pack.status !== "ACTIVE") throw new Error("Ce pack n'est plus actif.");

  const remaining = new Decimal(pack.totalHours).minus(pack.usedHours);
  if (new Decimal(hours).gt(remaining)) {
    throw new Error(
      `Solde insuffisant : ${remaining.toString()}h restantes, ${hours}h demandées.`
    );
  }

  const newUsed = new Decimal(pack.usedHours).plus(hours);
  const isExhausted = newUsed.gte(pack.totalHours);

  const updated = await prisma.hourPackage.update({
    where: { id: packageId },
    data: {
      usedHours: newUsed.toNumber(),
      status: isExhausted ? "CONSUMED" : "ACTIVE",
    },
  });

  await writeAuditLog({
    companyId: auth.companyId,
    userId: auth.userId,
    action: "HOUR_PACKAGE_CONSUMED",
    entityType: "HourPackage",
    entityId: packageId,
    diff: { hours },
  });

  revalidatePath("/hour-packages");
  return updated;
}
