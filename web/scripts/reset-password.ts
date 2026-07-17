import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

/**
 * Utilitaire de secours : réinitialise le mot de passe d'un compte User par email.
 * Usage : npx tsx scripts/reset-password.ts <email> <nouveau_mot_de_passe>
 * Ne touche à rien d'autre (rôles, Membership, Owner/Employee liés restent inchangés).
 */
async function main() {
  const [email, newPassword] = process.argv.slice(2);
  if (!email || !newPassword) {
    console.error("Usage: npx tsx scripts/reset-password.ts <email> <nouveau_mot_de_passe>");
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) {
    console.error(`Aucun compte trouvé pour ${email}`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  console.log(`Mot de passe réinitialisé pour ${email}.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
