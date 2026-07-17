"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import { writeAuditLog } from "@/lib/audit-log";
import { revalidatePath } from "next/cache";

export type DocumentType = "CONTRAT" | "RIB" | "PIECE_IDENTITE" | "AUTRE";

/**
 * Documents rattachés à un propriétaire (contrat, RIB, pièce d'identité...).
 * Aucun stockage de fichiers n'est câblé (pas de bucket S3/blob configuré) :
 * storagePath contient un lien externe (Drive, Dropbox...) saisi par
 * l'utilisateur, à l'image du reste des modules "manuels" de l'app.
 */
export async function createDocumentAction(params: {
  ownerId: string;
  companyId: string;
  type: DocumentType;
  storagePath: string;
}) {
  const auth = await requireRole(params.companyId, ["ADMIN", "ACCOUNTANT"]);

  const owner = await prisma.owner.findFirst({ where: { id: params.ownerId, companyId: params.companyId } });
  if (!owner) throw new Error("Propriétaire introuvable");

  const document = await prisma.document.create({
    data: { ownerId: params.ownerId, type: params.type, storagePath: params.storagePath },
  });

  await writeAuditLog({
    companyId: auth.companyId,
    userId: auth.userId,
    action: "DOCUMENT_CREATED",
    entityType: "Document",
    entityId: document.id,
    diff: { ownerId: params.ownerId, type: params.type },
  });

  revalidatePath(`/owners/${params.ownerId}`);
  return document;
}

export async function deleteDocumentAction(documentId: string, ownerId: string, companyId: string) {
  const auth = await requireRole(companyId, ["ADMIN", "ACCOUNTANT"]);

  const document = await prisma.document.findFirst({ where: { id: documentId, ownerId } });
  if (!document) throw new Error("Document introuvable");

  await prisma.document.delete({ where: { id: documentId } });

  await writeAuditLog({
    companyId: auth.companyId,
    userId: auth.userId,
    action: "DOCUMENT_DELETED",
    entityType: "Document",
    entityId: documentId,
  });

  revalidatePath(`/owners/${ownerId}`);
}
