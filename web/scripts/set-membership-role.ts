import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Utilitaire de secours : change le rôle d'un Membership existant par email.
 * Usage : npx tsx scripts/set-membership-role.ts <email> <ROLE>
 * ROLE doit être une valeur valide de l'enum Role (ADMIN, ACCOUNTANT, EMPLOYEE,
 * READONLY, SUPER_ADMIN, OPERATIONAL_MANAGER, AGENT). Ne crée rien : l'utilisateur
 * doit déjà avoir un Membership existant.
 */
async function main() {
  const [email, role] = process.argv.slice(2);
  if (!email || !role) {
    console.error("Usage: npx tsx scripts/set-membership-role.ts <email> <ROLE>");
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) {
    console.error(`Aucun compte trouvé pour ${email}`);
    process.exit(1);
  }

  const memberships = await prisma.membership.findMany({ where: { userId: user.id } });
  if (memberships.length === 0) {
    console.error(`Aucun Membership existant pour ${email} — rien à modifier.`);
    process.exit(1);
  }

  for (const m of memberships) {
    await prisma.membership.update({
      where: { id: m.id },
      data: { role: role as never },
    });
    console.log(`Membership ${m.id} (companyId=${m.companyId}) -> rôle ${role}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
