"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import { writeAuditLog } from "@/lib/audit-log";
import { revalidatePath } from "next/cache";

export async function listReviewsAction(companyId: string) {
  await requireRole(companyId, ["ADMIN", "ACCOUNTANT", "EMPLOYEE", "READONLY"]);
  return prisma.review.findMany({
    where: { companyId },
    include: { property: true },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Saisie manuelle d'un avis client — équivalent du bouton "Enregistrer
 * manuellement un avis client" observé sur le back-office de référence
 * (Ogustine).
 */
export async function createReviewAction(params: {
  companyId: string;
  propertyId: string;
  authorName?: string;
  rating: number;
  comment?: string;
}) {
  const auth = await requireRole(params.companyId, ["ADMIN", "ACCOUNTANT", "EMPLOYEE"]);

  if (params.rating < 1 || params.rating > 5) {
    throw new Error("La note doit être comprise entre 1 et 5.");
  }

  const review = await prisma.review.create({
    data: {
      companyId: params.companyId,
      propertyId: params.propertyId,
      authorName: params.authorName || null,
      rating: params.rating,
      comment: params.comment || null,
      status: "PENDING",
    },
  });

  await writeAuditLog({
    companyId: auth.companyId,
    userId: auth.userId,
    action: "REVIEW_CREATED",
    entityType: "Review",
    entityId: review.id,
  });

  revalidatePath("/reviews");
  return review;
}

export async function updateReviewStatusAction(
  reviewId: string,
  companyId: string,
  status: "PUBLISHED" | "REJECTED"
) {
  const auth = await requireRole(companyId, ["ADMIN", "ACCOUNTANT"]);

  const existing = await prisma.review.findFirst({ where: { id: reviewId, companyId } });
  if (!existing) throw new Error("Avis introuvable");

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: { status, publishedAt: status === "PUBLISHED" ? new Date() : null },
  });

  await writeAuditLog({
    companyId: auth.companyId,
    userId: auth.userId,
    action: "REVIEW_STATUS_CHANGED",
    entityType: "Review",
    entityId: reviewId,
    diff: { from: existing.status, to: status },
  });

  revalidatePath("/reviews");
  return updated;
}
