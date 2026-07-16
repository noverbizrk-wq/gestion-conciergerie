import Papa from "papaparse";
import Decimal from "decimal.js";

/**
 * Normalise un export CSV Airbnb ("Historique des transactions" ou "Réservations")
 * vers un format interne indépendant de la plateforme.
 *
 * Le CSV Airbnb réel varie selon la locale et le type d'export ; on tolère
 * plusieurs alias de colonnes courants et on lève une erreur explicite,
 * listant les colonnes manquantes, si le mapping échoue plutôt que de
 * silencieusement produire des montants à zéro.
 */

export interface NormalizedBookingRow {
  externalId: string;
  propertyNameRaw: string;
  checkIn: Date;
  checkOut: Date;
  grossAmount: Decimal;
  netRent: Decimal;
  cleaningFee: Decimal;
  touristTax: Decimal;
  platformCommission: Decimal;
  raw: Record<string, string>;
}

export interface ParseResult {
  rows: NormalizedBookingRow[];
  errors: { line: number; message: string }[];
}

// Alias de colonnes tolérés selon la langue/version de l'export Airbnb
const COLUMN_ALIASES: Record<string, string[]> = {
  confirmationCode: ["Code de confirmation", "Confirmation code", "Code confirmation"],
  listing: ["Annonce", "Listing"],
  startDate: ["Date de début", "Start date", "Arrivée"],
  endDate: ["Date de fin", "End date", "Départ"],
  grossEarnings: ["Montant brut voyageur", "Gross earnings", "Montant"],
  hostPayout: ["Revenus bruts", "Montant net", "Payout"],
  cleaningFee: ["Frais de ménage", "Cleaning fee"],
  occupancyTax: ["Taxe de séjour", "Occupancy taxes", "Taxes"],
  serviceFee: ["Frais de service", "Service fee", "Commission Airbnb"],
};

function resolveColumn(headers: string[], key: keyof typeof COLUMN_ALIASES): string | null {
  const aliases = COLUMN_ALIASES[key];
  return headers.find((h) => aliases.some((a) => a.toLowerCase() === h.trim().toLowerCase())) ?? null;
}

function toDecimal(value: string | undefined): Decimal {
  if (!value) return new Decimal(0);
  // Gère les formats "1 234,56 €" et "1234.56"
  const cleaned = value
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3},)/g, "") // sépare milliers si présents avant une virgule décimale
    .replace(",", ".");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? new Decimal(parsed) : new Decimal(0);
}

export function parseAirbnbCsv(fileContent: string): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(fileContent, {
    header: true,
    skipEmptyLines: true,
  });

  const headers = parsed.meta.fields ?? [];
  const requiredKeys: (keyof typeof COLUMN_ALIASES)[] = [
    "confirmationCode",
    "listing",
    "startDate",
    "endDate",
    "hostPayout",
  ];

  const columnMap = Object.fromEntries(
    Object.keys(COLUMN_ALIASES).map((key) => [
      key,
      resolveColumn(headers, key as keyof typeof COLUMN_ALIASES),
    ])
  ) as Record<keyof typeof COLUMN_ALIASES, string | null>;

  const missing = requiredKeys.filter((key) => !columnMap[key]);
  if (missing.length > 0) {
    return {
      rows: [],
      errors: [
        {
          line: 0,
          message: `Colonnes obligatoires introuvables dans le CSV : ${missing.join(", ")}. Colonnes détectées : ${headers.join(", ")}`,
        },
      ],
    };
  }

  const rows: NormalizedBookingRow[] = [];
  const errors: ParseResult["errors"] = [];

  parsed.data.forEach((row, index) => {
    try {
      const checkIn = new Date(row[columnMap.startDate!]);
      const checkOut = new Date(row[columnMap.endDate!]);
      if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
        throw new Error("Dates d'arrivée/départ invalides");
      }

      const netRent = toDecimal(row[columnMap.hostPayout!]);
      const cleaningFee = columnMap.cleaningFee ? toDecimal(row[columnMap.cleaningFee]) : new Decimal(0);
      const touristTax = columnMap.occupancyTax ? toDecimal(row[columnMap.occupancyTax]) : new Decimal(0);
      const platformCommission = columnMap.serviceFee ? toDecimal(row[columnMap.serviceFee]) : new Decimal(0);
      const grossAmount = columnMap.grossEarnings
        ? toDecimal(row[columnMap.grossEarnings])
        : netRent.plus(cleaningFee).plus(touristTax);

      rows.push({
        externalId: row[columnMap.confirmationCode!]?.trim(),
        propertyNameRaw: row[columnMap.listing!]?.trim(),
        checkIn,
        checkOut,
        grossAmount,
        netRent,
        cleaningFee,
        touristTax,
        platformCommission,
        raw: row,
      });
    } catch (e) {
      errors.push({ line: index + 2, message: e instanceof Error ? e.message : "Ligne invalide" });
    }
  });

  return { rows, errors };
}
