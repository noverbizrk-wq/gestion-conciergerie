"use server";

import { prisma } from "@/lib/prisma";
import { requireOwnerSession } from "@/lib/auth-guard";

/**
 * Portail propriétaire — toutes les actions ici sont scopées à `owner.id` résolu
 * depuis la session (jamais un ownerId/companyId passé par le client). Un
 * propriétaire n'a accès qu'à ses propres logements, réservations et factures.
 */
export async function getPortalOwnerAction() {
  const owner = await requireOwnerSession();
  return prisma.owner.findUnique({
    where: { id: owner.id },
    include: { company: { select: { name: true, brandColor: true } } },
  });
}

export async function getPortalPropertiesAction() {
  const owner = await requireOwnerSession();
  return prisma.property.findMany({
    where: { ownerId: owner.id },
    orderBy: { name: "asc" },
  });
}

export async function getPortalBookingsAction() {
  const owner = await requireOwnerSession();
  return prisma.booking.findMany({
    where: { property: { ownerId: owner.id } },
    include: { property: { select: { name: true } } },
    orderBy: { checkIn: "desc" },
    take: 50,
  });
}

export async function getPortalInvoicesAction() {
  const owner = await requireOwnerSession();
  return prisma.invoice.findMany({
    where: { ownerId: owner.id },
    orderBy: { issueDate: "desc" },
  });
}

export async function getPortalIncidentsAction() {
  const owner = await requireOwnerSession();
  return prisma.incident.findMany({
    where: { property: { ownerId: owner.id } },
    include: { property: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
