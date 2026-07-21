"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import { writeAuditLog } from "@/lib/audit-log";
import { revalidatePath } from "next/cache";

export async function getCompanySettingsAction(companyId: string) {
  // EMPLOYEE exclu : les paramètres société exposent des données sensibles
  // (IBAN, SIRET, TVA) qui ne concernent que l'administration/comptabilité.
  await requireRole(companyId, ["ADMIN", "SUPER_ADMIN", "OPERATIONAL_MANAGER", "ACCOUNTANT", "READONLY"]);
  return prisma.company.findUniqueOrThrow({ where: { id: companyId } });
}

/**
 * Page "Paramètres & Services" self-service — sur le back-office de référence
 * (Ogustine), l'identité société, les coordonnées bancaires et les tarifs par
 * défaut sont éditables depuis l'UI plutôt que fixés en dur dans le seed.
 */
export async function updateCompanySettingsAction(
  companyId: string,
  data: {
    name: string;
    siret?: string;
    tvaIntracom?: string;
    address?: string;
    iban?: string;
    brandColor: string;
    defaultVatRate: number;
    defaultVatRegime: "REEL" | "FRANCHISE" | "INHERIT_COMPANY";
  }
) {
  const auth = await requireRole(companyId, ["ADMIN"]);

  const updated = await prisma.company.update({
    where: { id: companyId },
    data: {
      name: data.name,
      siret: data.siret || null,
      tvaIntracom: data.tvaIntracom || null,
      address: data.address || null,
      iban: data.iban || null,
      brandColor: data.brandColor,
      defaultVatRate: data.defaultVatRate,
      defaultVatRegime: data.defaultVatRegime,
    },
  });

  await writeAuditLog({
    companyId: auth.companyId,
    userId: auth.userId,
    action: "COMPANY_SETTINGS_UPDATED",
    entityType: "Company",
    entityId: companyId,
  });

  revalidatePath("/settings");
  return updated;
}
