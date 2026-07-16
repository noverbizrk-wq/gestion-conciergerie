import { describe, expect, it } from "vitest";
import { resolveVatRate } from "./resolve-vat";

const baseCompany = { defaultVatRate: 20, defaultVatRegime: "REEL" as const };

describe("resolveVatRate", () => {
  it("priorise l'override logement sur tout le reste", () => {
    const result = resolveVatRate({
      company: baseCompany,
      owner: { vatRegime: "FRANCHISE", vatRate: null },
      property: { vatRateOverride: 10 },
    });
    expect(result.rate.toNumber()).toBe(10);
    expect(result.source).toBe("PROPERTY_OVERRIDE");
  });

  it("applique la franchise en base du propriétaire (0%) si pas d'override logement", () => {
    const result = resolveVatRate({
      company: baseCompany,
      owner: { vatRegime: "FRANCHISE", vatRate: null },
      property: { vatRateOverride: null },
    });
    expect(result.rate.toNumber()).toBe(0);
    expect(result.source).toBe("OWNER_FRANCHISE");
  });

  it("applique le taux réel propre au propriétaire si défini", () => {
    const result = resolveVatRate({
      company: baseCompany,
      owner: { vatRegime: "REEL", vatRate: 5.5 },
      property: { vatRateOverride: null },
    });
    expect(result.rate.toNumber()).toBe(5.5);
    expect(result.source).toBe("OWNER_REEL");
  });

  it("retombe sur le défaut société si le propriétaire hérite (INHERIT_COMPANY)", () => {
    const result = resolveVatRate({
      company: baseCompany,
      owner: { vatRegime: "INHERIT_COMPANY", vatRate: null },
      property: { vatRateOverride: null },
    });
    expect(result.rate.toNumber()).toBe(20);
    expect(result.source).toBe("COMPANY_DEFAULT");
  });

  it("gère le cas société elle-même en franchise", () => {
    const result = resolveVatRate({
      company: { defaultVatRate: 20, defaultVatRegime: "FRANCHISE" },
      owner: { vatRegime: "INHERIT_COMPANY", vatRate: null },
      property: { vatRateOverride: null },
    });
    expect(result.rate.toNumber()).toBe(0);
    expect(result.source).toBe("COMPANY_DEFAULT");
  });

  it("gère l'absence totale de logement (facture non rattachée à une property)", () => {
    const result = resolveVatRate({
      company: baseCompany,
      owner: { vatRegime: "REEL", vatRate: 20 },
      property: undefined,
    });
    expect(result.rate.toNumber()).toBe(20);
    expect(result.source).toBe("OWNER_REEL");
  });
});
