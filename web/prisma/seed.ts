import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = "amira.douira@noverclean.fr";
const ADMIN_PASSWORD = "NoverClean2026!";

/**
 * Seed de démonstration : une société, un propriétaire, un logement, deux réservations.
 * Usage : npm run prisma:seed (nécessite DATABASE_URL configuré et migrations appliquées).
 */
async function main() {
  const company = await prisma.company.create({
    data: {
      name: "Nover Clean",
      siret: "12345678900012",
      address: "10 rue de la Conciergerie, 92000 Nanterre",
      iban: "FR7630006000011234567890189",
      defaultVatRate: 20,
      defaultVatRegime: "REEL",
    },
  });

  const owner = await prisma.owner.create({
    data: {
      companyId: company.id,
      firstName: "Amira",
      lastName: "Douira Khaskhoussy",
      vatRegime: "INHERIT_COMPANY",
      paymentMethod: "VIREMENT",
      iban: "FR7630006000011234567890200",
      email: "amira@example.com",
    },
  });

  const property = await prisma.property.create({
    data: {
      companyId: company.id,
      ownerId: owner.id,
      name: "Studio Nanterre Université",
      address: "5 avenue de la République",
      city: "Nanterre",
      postalCode: "92000",
      type: "STUDIO",
      commissionMode: "FIXED_PERCENT",
      commissionRate: 14,
      cleaningBilledTo: "OWNER",
      cleaningFlatRate: 45,
    },
  });

  await prisma.booking.createMany({
    data: [
      {
        companyId: company.id,
        propertyId: property.id,
        source: "AIRBNB",
        externalId: "HMABCD1234",
        checkIn: new Date("2026-07-02"),
        checkOut: new Date("2026-07-06"),
        grossAmount: 480,
        netRent: 400,
        cleaningFee: 45,
        touristTax: 8,
        platformCommission: 27,
        status: "IMPORTED",
      },
      {
        companyId: company.id,
        propertyId: property.id,
        source: "AIRBNB",
        externalId: "HMEFGH5678",
        checkIn: new Date("2026-07-15"),
        checkOut: new Date("2026-07-20"),
        grossAmount: 600,
        netRent: 500,
        cleaningFee: 45,
        touristTax: 10,
        platformCommission: 34,
        status: "IMPORTED",
      },
    ],
  });

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const adminUser = await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      name: "Amira Douira",
      passwordHash,
    },
  });

  await prisma.membership.create({
    data: {
      userId: adminUser.id,
      companyId: company.id,
      role: "ADMIN",
    },
  });

  console.log("Seed terminé.");
  console.log("  companyId :", company.id);
  console.log("  Connexion : ", ADMIN_EMAIL, "/", ADMIN_PASSWORD, "(à changer après premier login)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
