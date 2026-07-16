import Decimal from "decimal.js";

/**
 * Moteur de résolution du taux de TVA applicable à une ligne de facture.
 *
 * Règle métier actée avec l'utilisateur :
 * le régime de TVA est MIXTE et paramétrable à deux niveaux :
 *   1. Property.vatRateOverride  -> priorité la plus haute (cas particulier du logement)
 *   2. Owner.vatRegime / vatRate -> réglage propre au propriétaire
 *   3. Company.defaultVatRegime / defaultVatRate -> valeur par défaut de la société
 *
 * Chaque résolution renvoie AUSSI la source utilisée, pour traçabilité
 * en cas de contrôle fiscal (stockée sur InvoiceLine.vatRateSource).
 */

export type VatRegime = "REEL" | "FRANCHISE" | "INHERIT_COMPANY";

export interface VatResolutionInput {
  company: {
    defaultVatRate: Decimal.Value;
    defaultVatRegime: VatRegime;
  };
  owner: {
    vatRegime: VatRegime;
    vatRate: Decimal.Value | null;
  };
  property?: {
    vatRateOverride: Decimal.Value | null;
  } | null;
}

export interface VatResolutionResult {
  /** Taux de TVA à appliquer, ex: 20, 10, 5.5, 0 */
  rate: Decimal;
  /** Origine de la résolution, pour audit/traçabilité */
  source: "PROPERTY_OVERRIDE" | "OWNER_FRANCHISE" | "OWNER_REEL" | "COMPANY_DEFAULT";
}

export function resolveVatRate(input: VatResolutionInput): VatResolutionResult {
  const { company, owner, property } = input;

  // 1. Override logement : priorité absolue
  if (property?.vatRateOverride !== null && property?.vatRateOverride !== undefined) {
    return {
      rate: new Decimal(property.vatRateOverride),
      source: "PROPERTY_OVERRIDE",
    };
  }

  // 2. Réglage propriétaire
  if (owner.vatRegime === "FRANCHISE") {
    return { rate: new Decimal(0), source: "OWNER_FRANCHISE" };
  }

  if (owner.vatRegime === "REEL" && owner.vatRate !== null && owner.vatRate !== undefined) {
    return { rate: new Decimal(owner.vatRate), source: "OWNER_REEL" };
  }

  // 3. Défaut société (couvre aussi owner.vatRegime === "INHERIT_COMPANY")
  if (company.defaultVatRegime === "FRANCHISE") {
    return { rate: new Decimal(0), source: "COMPANY_DEFAULT" };
  }

  return { rate: new Decimal(company.defaultVatRate), source: "COMPANY_DEFAULT" };
}

/** Mention légale à faire apparaître sur la facture lorsque le taux résolu est 0 (franchise). */
export const FRANCHISE_LEGAL_MENTION =
  "TVA non applicable, art. 293 B du CGI";
