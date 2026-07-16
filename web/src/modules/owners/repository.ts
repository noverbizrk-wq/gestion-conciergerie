import { prisma } from "@/lib/prisma";
import type { CreateOwnerInput, UpdateOwnerInput } from "./dto";

export const ownersRepository = {
  create(input: CreateOwnerInput) {
    return prisma.owner.create({ data: input });
  },

  update({ id, ...data }: UpdateOwnerInput) {
    return prisma.owner.update({ where: { id }, data });
  },

  findById(id: string, companyId: string) {
    return prisma.owner.findFirst({
      where: { id, companyId },
      include: { properties: true, documents: true },
    });
  },

  list(companyId: string, search?: string) {
    return prisma.owner.findMany({
      where: {
        companyId,
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { companyName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { lastName: "asc" },
      include: { properties: { select: { id: true, name: true } } },
    });
  },

  delete(id: string, companyId: string) {
    // Vérification d'appartenance avant suppression (defense in depth en plus du RBAC)
    return prisma.owner.deleteMany({ where: { id, companyId } });
  },
};
