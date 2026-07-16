import { z } from "zod";

export const propertyTypeSchema = z.enum(["STUDIO", "T2", "T3", "T4_PLUS", "MAISON", "APPARTEMENT"]);
export const commissionModeSchema = z.enum(["FIXED_PERCENT", "VARIABLE_TIERS"]);
export const billedToSchema = z.enum(["OWNER", "GUEST"]);

export const commissionTierSchema = z.object({
  from: z.number().min(0),
  to: z.number().nullable(),
  rate: z.number().min(0).max(100),
});

const propertyBaseSchema = z.object({
  companyId: z.string().cuid(),
  ownerId: z.string().cuid(),
  name: z.string().min(1, "Nom du logement requis"),
  address: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().regex(/^\d{5}$/, "Code postal invalide"),
  photos: z.array(z.string().url()).default([]),
  type: propertyTypeSchema,
  commissionMode: commissionModeSchema.default("FIXED_PERCENT"),
  commissionRate: z.number().min(0).max(100).optional(),
  commissionTiers: z.array(commissionTierSchema).optional(),
  vatRateOverride: z.number().min(0).max(100).optional(),
  cleaningBilledTo: billedToSchema.default("OWNER"),
  cleaningFlatRate: z.number().min(0).optional(),
});

function refineCommissionConsistency<T extends typeof propertyBaseSchema>(schema: T) {
  return schema
    .refine(
      (data) => data.commissionMode !== "FIXED_PERCENT" || data.commissionRate !== undefined,
      { message: "commissionRate requis en mode FIXED_PERCENT", path: ["commissionRate"] }
    )
    .refine(
      (data) =>
        data.commissionMode !== "VARIABLE_TIERS" ||
        (data.commissionTiers && data.commissionTiers.length > 0),
      { message: "commissionTiers requis en mode VARIABLE_TIERS", path: ["commissionTiers"] }
    );
}

export const createPropertySchema = refineCommissionConsistency(propertyBaseSchema);

export const updatePropertySchema = z.object({
  id: z.string().cuid(),
  companyId: z.string().cuid(),
  data: propertyBaseSchema.partial().omit({ companyId: true, ownerId: true }),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
