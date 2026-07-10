// Curated bank rates for home loans. Refreshed periodically.
// Source of truth is this file; a daily cron can be layered on later.

import type { Country } from "./countries";

export type Bank = {
  id: string;
  name: string;
  country: Country;
  logo: string;              // emoji as inline fallback
  minRate: number;           // % p.a.
  maxRate: number;
  processingFeePct: number;  // % of loan (min flat implied)
  processingFeeFlat?: number;
  processingFeeCap?: number;
  maxTenureYears: number;
  maxLtv: number;            // % of property value
  minCreditScore: number;
  website: string;
  apr?: number;              // effective, if available
};

export const BANKS: Bank[] = [
  // India
  { id: "sbi",   name: "State Bank of India", country: "IN", logo: "🏦", minRate: 8.50, maxRate: 9.65, processingFeePct: 0.35, processingFeeCap: 10000, maxTenureYears: 30, maxLtv: 90, minCreditScore: 700, website: "https://homeloans.sbi/" },
  { id: "hdfc",  name: "HDFC Bank",           country: "IN", logo: "🏛️", minRate: 8.75, maxRate: 9.95, processingFeePct: 0.50, processingFeeFlat: 3000, processingFeeCap: 12500, maxTenureYears: 30, maxLtv: 90, minCreditScore: 720, website: "https://www.hdfcbank.com/personal/borrow/popular-loans/home-loan" },
  { id: "icici", name: "ICICI Bank",          country: "IN", logo: "🏢", minRate: 8.75, maxRate: 10.10, processingFeePct: 0.50, processingFeeCap: 15000, maxTenureYears: 30, maxLtv: 85, minCreditScore: 720, website: "https://www.icicibank.com/personal-banking/loans/home-loan" },

  // USA (30-yr fixed indicative)
  { id: "boa",   name: "Bank of America",    country: "US", logo: "🇺🇸", minRate: 6.75, maxRate: 7.50, apr: 7.05, processingFeePct: 1.0, processingFeeFlat: 1200, maxTenureYears: 30, maxLtv: 97, minCreditScore: 620, website: "https://www.bankofamerica.com/mortgage/" },
  { id: "chase", name: "Chase",              country: "US", logo: "💳", minRate: 6.85, maxRate: 7.60, apr: 7.15, processingFeePct: 1.0, processingFeeFlat: 1099, maxTenureYears: 30, maxLtv: 97, minCreditScore: 620, website: "https://www.chase.com/personal/mortgage" },
  { id: "wells", name: "Wells Fargo",        country: "US", logo: "🐎", minRate: 6.90, maxRate: 7.70, apr: 7.20, processingFeePct: 1.0, processingFeeFlat: 995,  maxTenureYears: 30, maxLtv: 97, minCreditScore: 620, website: "https://www.wellsfargo.com/mortgage/" },

  // UAE
  { id: "enbd",   name: "Emirates NBD", country: "AE", logo: "🇦🇪", minRate: 4.24, maxRate: 5.49, processingFeePct: 1.0, processingFeeCap: 25000, maxTenureYears: 25, maxLtv: 80, minCreditScore: 650, website: "https://www.emiratesnbd.com/en/loans/mortgages" },
  { id: "adcb",   name: "ADCB",         country: "AE", logo: "🏙️", minRate: 4.49, maxRate: 5.75, processingFeePct: 1.0, processingFeeCap: 25000, maxTenureYears: 25, maxLtv: 80, minCreditScore: 650, website: "https://www.adcb.com/en/personal/loans/home-loans/" },
  { id: "mashreq",name: "Mashreq",      country: "AE", logo: "🏨", minRate: 4.75, maxRate: 6.00, processingFeePct: 1.0, processingFeeCap: 25000, maxTenureYears: 25, maxLtv: 75, minCreditScore: 650, website: "https://www.mashreqbank.com/uae/en/personal/loans/home-loan" },
];

export const RATES_LAST_UPDATED = "2026-07-10";

export function banksForCountry(c: Country): Bank[] {
  return BANKS.filter((b) => b.country === c);
}

export function processingFeeAmount(b: Bank, loanAmount: number): number {
  const pct = (loanAmount * b.processingFeePct) / 100;
  const flat = b.processingFeeFlat ?? 0;
  const raw = Math.max(pct, flat);
  return b.processingFeeCap ? Math.min(raw, b.processingFeeCap) : raw;
}
