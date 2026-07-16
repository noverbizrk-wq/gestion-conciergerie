import { z } from "zod";

export const vatRegimeSchema = z.enum(["REEL", "FRANCHISE", "INHERIT_COMPANY"]);
export const paymentMethodSchema = z.enum(["VIREMENT", "CB", "ESPECES", "STRIPE", "GOCARDLESS"]);

export const createOwnerSchema = z.object({
  companyId: z.string().cuid(),
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  companyName: z.string().optional(),
  siret: z
    .string()
    .regex(/^\d{14}$/, "Le SIRET doit contenir 14 chiffres")
    .optional()
    .or(z.literal("")),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  vatRegime: vatRegimeSchema.default("INHERIT_COMPANY"),
  vatRate: z.number().min(0).max(100).optional(),
  paymentMethod: paymentMethodSchema.default("VIREMENT"),
  iban: z
    .string()
    .regex(/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/, "IBAN invalide")
    .optional()
    .or(z.literal("")),
  notes: z.string().optional(),
});

export const updateOwnerSchema = createOwnerSchema.partial().extend({
  id: z.string().cuid(),
});

export type CreateOwnerInput = z.infer<typeof createOwnerSchema>;
export type UpdateOwnerInput = z.infer<typeof updateOwnerSchema>;
