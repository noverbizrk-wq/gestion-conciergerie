import { describe, expect, it } from "vitest";
import { computeMonthlyCommission } from "./commission-engine";

describe("computeMonthlyCommission", () => {
  it("calcule une commission fixe sur le loyer net uniquement (hors ménage/taxes)", () => {
    // Exemple repris du prompt initial : CA logement 3000€, commission 18% => 540€
    // Ici on modélise 3000€ de LOYER NET (pas le brut), conformément à la règle actée.
    const { totalCommissionHT, lines } = computeMonthlyCommission(
      [{ id: "b1", netRent: 3000 }],
      { mode: "FIXED_PERCENT", fixedRate: 18 }
    );
    expect(totalCommissionHT.toNumber()).toBe(540);
    expect(lines[0].appliedRate.toNumber()).toBe(18);
  });

  it("ignore les frais de ménage et taxes puisqu'ils ne sont pas dans netRent", () => {
    // netRent est déjà expurgé en amont (au niveau du Booking), le moteur ne voit que ça.
    const { totalCommissionHT } = computeMonthlyCommission(
      [{ id: "b1", netRent: 1000 }],
      { mode: "FIXED_PERCENT", fixedRate: 20 }
    );
    expect(totalCommissionHT.toNumber()).toBe(200);
  });

  it("applique un barème progressif (VARIABLE_TIERS) selon le cumul mensuel AVANT chaque réservation", () => {
    const { lines, totalCommissionHT } = computeMonthlyCommission(
      [
        { id: "b1", netRent: 1000 }, // cumul avant = 0    -> tranche 0-1500 (20%)
        { id: "b2", netRent: 1000 }, // cumul avant = 1000 -> encore tranche 0-1500 (20%)
        { id: "b3", netRent: 1000 }, // cumul avant = 2000 -> tranche 1500+ (15%)
      ],
      {
        mode: "VARIABLE_TIERS",
        tiers: [
          { from: 0, to: 1500, rate: 20 },
          { from: 1500, to: null, rate: 15 },
        ],
      }
    );
    expect(lines[0].appliedRate.toNumber()).toBe(20);
    expect(lines[1].appliedRate.toNumber()).toBe(20);
    expect(lines[2].appliedRate.toNumber()).toBe(15);
    expect(totalCommissionHT.toNumber()).toBe(1000 * 0.2 + 1000 * 0.2 + 1000 * 0.15);
  });

  it("lève une erreur explicite si le mode FIXED_PERCENT n'a pas de taux configuré", () => {
    expect(() =>
      computeMonthlyCommission([{ id: "b1", netRent: 1000 }], { mode: "FIXED_PERCENT" })
    ).toThrow(/commissionRate manquant/);
  });

  it("lève une erreur explicite si aucun palier ne couvre le cumul", () => {
    expect(() =>
      computeMonthlyCommission([{ id: "b1", netRent: 1000 }], {
        mode: "VARIABLE_TIERS",
        tiers: [{ from: 2000, to: null, rate: 10 }],
      })
    ).toThrow(/Aucun palier/);
  });
});
