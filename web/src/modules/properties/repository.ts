import { prisma } from "@/lib/prisma";
import type { CreatePropertyInput } from "./dto";

export const propertiesRepository = {
  create(input: CreatePropertyInput) {
    return prisma.property.create({
      data: {
        ...input,
        commissionTiers: input.commissionTiers ?? undefined,
      },
    });
  },

  update(id: string, companyId: string, data: Record<string, unknown>) {
    return prisma.property.updateMany({ where: { id, companyId }, data });
  },

  findById(id: string, companyId: string) {
    return prisma.property.findFirst({
      where: { id, companyId },
      include: { owner: true, bookings: { orderBy: { checkIn: "desc" }, take: 20 } },
    });
  },

  list(companyId: string, ownerId?: string) {
    return prisma.property.findMany({
      where: { companyId, ...(ownerId ? { ownerId } : {}) },
      include: { owner: { select: { firstName: true, lastName: true } } },
      orderBy: { name: "asc" },
    });
  },
};
