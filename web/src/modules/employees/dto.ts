import { z } from "zod";

export const employeeTypeSchema = z.enum(["SALARIE", "PRESTATAIRE"]);

export const createEmployeeSchema = z.object({
  companyId: z.string().cuid(),
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  type: employeeTypeSchema.default("SALARIE"),
  skills: z.array(z.string()).default([]),
  zone: z.string().optional(),
  hourlyRate: z.number().min(0).optional(),
  perMissionRate: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().extend({
  id: z.string().cuid(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
