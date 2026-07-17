import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

/**
 * Chiffrement symétrique AES-256-GCM pour les données sensibles stockées en base
 * (codes d'accès logement : porte, boîte à clés, serrure connectée, wifi...).
 *
 * ATTENTION : ce n'est pas un hash à sens unique (comme les mots de passe) — on doit
 * pouvoir retrouver la valeur en clair pour l'afficher à un utilisateur autorisé.
 * La clé est dérivée de la variable d'environnement ACCESS_CODE_SECRET (jamais commitée).
 *
 * Format stocké : "<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 */

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const secret = process.env.ACCESS_CODE_SECRET;
  if (!secret) {
    throw new Error(
      "ACCESS_CODE_SECRET manquant dans les variables d'environnement (requis pour chiffrer/déchiffrer les codes d'accès)."
    );
  }
  // Dérivation déterministe d'une clé 32 octets à partir du secret fourni.
  return scryptSync(secret, "noverclean-access-codes", 32);
}

export function encryptSecret(plainText: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptSecret(payload: string): string {
  const key = getKey();
  const [ivHex, authTagHex, dataHex] = payload.split(":");
  if (!ivHex || !authTagHex || !dataHex) {
    throw new Error("Format de valeur chiffrée invalide.");
  }
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
