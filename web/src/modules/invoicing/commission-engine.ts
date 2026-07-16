import Decimal from "decimal.js";

/**
 * Moteur de calcul de la commission de gestion Airbnb.
 *
 * Règle métier actée avec l'utilisateur :
 * la commission se calcule UNIQUEMENT sur le loyer net (netRent),
 * à l'exclusion des frais de ménage et de la taxe de séjour.
 * (grossAmount = netRent + cleaningFee + touristTax, à titre indicatif/traçabilité)
 */

export type CommissionMode = "FIXED_PERCENT" | "VARIABLE_TIERS";

export interface CommissionTier {
  /** Borne basse du palier de CA mensuel net (inclusive) */
  from: number;
  /** Borne haute du palier, null = pas de plafond */
  to: number | null;
  /** Taux de commission applicable à la tranche, en % */
  rate: number;
}

export interface CommissionConfig {
  mode: CommissionMode;
  fixedRate?: Decimal.Value | null;
  tiers?: CommissionTier[] | null;
}

export interface BookingForCommission {
  id: string;
  netRent: Decimal.Value;
}

export interface CommissionLineResult {
  bookingId: string;
  netRent: Decimal;
  appliedRate: Decimal;
  commissionAmountHT: Decimal;
}

/**
 * Calcule la commission pour un ensemble de réservations d'un même logement
 * sur une période donnée (typiquement un mois).
 *
 * En mode FIXED_PERCENT : le même taux s'applique à chaque réservation.
 * En mode VARIABLE_TIERS : le taux dépend du cumul du loyer net déjà atteint
 * sur la période (barème progressif par palier de CA net mensuel).
 */
export function computeMonthlyCommission(
  bookings: BookingForCommission[],
  config: CommissionConfig
): { lines: CommissionLineResult[]; totalCommissionHT: Decimal; totalNetRent: Decimal } {
  if (config.mode === "FIXED_PERCENT") {
    if (config.fixedRate === null || config.fixedRate === undefined) {
      throw new Error("commissionRate manquant pour un logement en mode FIXED_PERCENT");
    }
    const rate = new Decimal(config.fixedRate);
    const lines = bookings.map((b) => {
      const netRent = new Decimal(b.netRent);
      return {
        bookingId: b.id,
        netRent,
        appliedRate: rate,
        commissionAmountHT: netRent.mul(rate).div(100),
      };
    });
    return sumUp(lines);
  }

  // VARIABLE_TIERS : barème progressif appliqué au cumul du loyer net du mois
  if (!config.tiers || config.tiers.length === 0) {
    throw new Error("commissionTiers manquant pour un logement en mode VARIABLE_TIERS");
  }
  const sortedTiers = [...config.tiers].sort((a, b) => a.from - b.from);
  let cumulative = new Decimal(0);
  const lines: CommissionLineResult[] = [];

  for (const b of bookings) {
    const netRent = new Decimal(b.netRent);
    const tier = sortedTiers.find(
      (t) => cumulative.gte(t.from) && (t.to === null || cumulative.lt(t.to))
    );
    if (!tier) {
      throw new Error(
        `Aucun palier de commission ne couvre le cumul actuel (${cumulative.toString()} €) — vérifier la configuration des paliers du logement.`
      );
    }
    const rate = new Decimal(tier.rate);
    lines.push({
      bookingId: b.id,
      netRent,
      appliedRate: rate,
      commissionAmountHT: netRent.mul(rate).div(100),
    });
    cumulative = cumulative.plus(netRent);
  }

  return sumUp(lines);
}

function sumUp(lines: CommissionLineResult[]) {
  const totalCommissionHT = lines.reduce((acc, l) => acc.plus(l.commissionAmountHT), new Decimal(0));
  const totalNetRent = lines.reduce((acc, l) => acc.plus(l.netRent), new Decimal(0));
  return { lines, totalCommissionHT, totalNetRent };
}
