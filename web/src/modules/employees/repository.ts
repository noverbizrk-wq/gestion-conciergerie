import { prisma } from "@/lib/prisma";
import type { CreateEmployeeInput, UpdateEmployeeInput } from "./dto";

export const employeesRepository = {
  create(input: CreateEmployeeInput) {
    return prisma.employee.create({ data: input });
  },

  update({ id, ...data }: UpdateEmployeeInput) {
    return prisma.employee.update({ where: { id }, data });
  },

  findById(id: string, companyId: string) {
    return prisma.employee.findFirst({
      where: { id, companyId },
      include: { documents: true, availabilities: true },
    });
  },

  list(companyId: string, search?: string) {
    return prisma.employee.findMany({
      where: {
        companyId,
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { lastName: "asc" },
    });
  },

  setActive(id: string, companyId: string, active: boolean) {
    return prisma.employee.updateMany({ where: { id, companyId }, data: { active } });
  },

  delete(id: string, companyId: string) {
    return prisma.employee.deleteMany({ where: { id, companyId } });
  },
};
