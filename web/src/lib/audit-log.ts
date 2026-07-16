import { prisma } from "@/lib/prisma";

export async function writeAuditLog(params: {
  companyId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  diff?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      companyId: params.companyId,
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      diff: params.diff ? JSON.parse(JSON.stringify(params.diff)) : undefined,
    },
  });
}
