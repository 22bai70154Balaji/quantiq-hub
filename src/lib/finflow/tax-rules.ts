import type { Country } from "./countries";

export type TaxBracket = { from: number; to: number | null; rate: number; note?: string };
export type TaxRules = {
  country: Country;
  regime: string;
  currency: string;
  brackets: TaxBracket[];
  standardDeduction?: { amount: number; label: string };
  notes: string[];
  effectiveFrom: string;
};

// India — New Regime, FY 2024–25 (individual < 60)
export const INDIA_NEW_REGIME_FY25: TaxRules = {
  country: "IN",
  regime: "India · New Regime FY 2024–25",
  currency: "INR",
  brackets: [
    { from: 0, to: 300000, rate: 0 },
    { from: 300000, to: 700000, rate: 5 },
    { from: 700000, to: 1000000, rate: 10 },
    { from: 1000000, to: 1200000, rate: 15 },
    { from: 1200000, to: 1500000, rate: 20 },
    { from: 1500000, to: null, rate: 30 },
  ],
  standardDeduction: { amount: 75000, label: "Standard deduction (salaried)" },
  notes: [
    "Rebate under §87A: full rebate if total income ≤ ₹7L (nil tax).",
    "Health & education cess 4% is applied on tax + surcharge.",
    "Old regime not shown here; if you claim 80C/80D/HRA, compare separately.",
  ],
  effectiveFrom: "2024-04-01",
};

// USA — Federal, Single filer, 2024
export const USA_FEDERAL_SINGLE_2024: TaxRules = {
  country: "US",
  regime: "USA · Federal (Single, 2024)",
  currency: "USD",
  brackets: [
    { from: 0, to: 11600, rate: 10 },
    { from: 11600, to: 47150, rate: 12 },
    { from: 47150, to: 100525, rate: 22 },
    { from: 100525, to: 191950, rate: 24 },
    { from: 191950, to: 243725, rate: 32 },
    { from: 243725, to: 609350, rate: 35 },
    { from: 609350, to: null, rate: 37 },
  ],
  standardDeduction: { amount: 14600, label: "Standard deduction (single)" },
  notes: [
    "State/local taxes are not included — they can add 0%–13% depending on the state.",
    "FICA (Social Security 6.2% + Medicare 1.45%) is separate from federal income tax.",
    "Additional Medicare 0.9% may apply on wages above $200,000.",
  ],
  effectiveFrom: "2024-01-01",
};

// UAE — Nil personal income tax
export const UAE_NIL: TaxRules = {
  country: "AE",
  regime: "UAE · No personal income tax",
  currency: "AED",
  brackets: [{ from: 0, to: null, rate: 0 }],
  notes: [
    "The UAE levies no personal income tax on salaries or wages.",
    "Federal Corporate Tax of 9% applies to business profits above AED 375,000.",
    "VAT of 5% applies on most goods and services.",
  ],
  effectiveFrom: "2024-01-01",
};

export function taxRulesFor(country: Country): TaxRules {
  if (country === "IN") return INDIA_NEW_REGIME_FY25;
  if (country === "US") return USA_FEDERAL_SINGLE_2024;
  return UAE_NIL;
}
