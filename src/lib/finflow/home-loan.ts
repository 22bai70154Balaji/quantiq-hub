// Home-loan affordability & country-specific cost engine
import { calcEmi, amortizationSchedule } from "./calculators";
import type { Country } from "./countries";

export type PropertyType = "apartment" | "villa" | "independent" | "commercial" | "land";
export type EmploymentType = "salaried" | "self_employed" | "business" | "professional";
export type RateType = "fixed" | "floating";

export type HomeLoanInputs = {
  // Property
  country: Country;
  state: string;
  city: string;
  propertyType: PropertyType;
  propertyPrice: number;
  downPayment: number;
  additionalInitialCosts: number;
  areaSqft?: number;

  // Loan
  interestRate: number;
  tenureYears: number;
  rateType: RateType;
  existingLoans: number;      // outstanding principal on existing loans
  processingFee: number;      // override; if 0 auto-calc from country
  insuranceCost: number;

  // Applicant
  monthlyIncome: number;
  coApplicantIncome: number;
  existingEmis: number;
  creditScore: number;
  employmentType: EmploymentType;
  age: number;
};

export type CountryCharges = {
  stampDuty: number;
  registration: number;
  gst: number;
  legal: number;
  government: number;
  hoa: number;            // US
  pmi: number;            // US
  dld: number;            // UAE
  agencyCommission: number; // UAE
  mortgageRegistration: number; // UAE
  propertyInsurance: number;
  yearlyPropertyTax: number;
};

export function computeCountryCharges(i: HomeLoanInputs): CountryCharges {
  const { country, propertyPrice: p } = i;
  const z: CountryCharges = {
    stampDuty: 0, registration: 0, gst: 0, legal: 0, government: 0,
    hoa: 0, pmi: 0, dld: 0, agencyCommission: 0, mortgageRegistration: 0,
    propertyInsurance: 0, yearlyPropertyTax: 0,
  };
  if (country === "IN") {
    z.stampDuty = p * 0.06;
    z.registration = p * 0.01;
    // GST only for under-construction; assume apartment 5%
    z.gst = i.propertyType === "apartment" ? p * 0.05 : 0;
    z.legal = Math.min(25000, p * 0.001);
    z.government = 0;
    z.yearlyPropertyTax = p * 0.001;
    z.propertyInsurance = p * 0.0005;
  } else if (country === "US") {
    z.stampDuty = p * 0.011;             // transfer + recording
    z.registration = 500;
    z.legal = 1500;
    z.government = p * 0.002;
    z.hoa = 300 * 12;                     // annual
    const loan = Math.max(0, p - i.downPayment);
    z.pmi = (i.downPayment / p) < 0.20 ? loan * 0.006 : 0;  // annual PMI
    z.yearlyPropertyTax = p * 0.011;
    z.propertyInsurance = p * 0.0035;
  } else {
    z.dld = p * 0.04;
    z.registration = 4000;
    z.agencyCommission = p * 0.02;
    z.mortgageRegistration = Math.max(2000, Math.min(loanFromInputs(i) * 0.0025 + 290, 500000));
    z.legal = 6000;
    z.government = 580; // trustee office
    z.yearlyPropertyTax = 0;
    z.propertyInsurance = p * 0.001;
  }
  return z;
}

function loanFromInputs(i: HomeLoanInputs) {
  return Math.max(0, i.propertyPrice - i.downPayment);
}

export type HomeLoanResults = {
  loanAmount: number;
  ltv: number;
  emi: number;
  totalInterest: number;
  totalPayable: number;
  processingFee: number;
  charges: CountryCharges;
  totalUpfrontCost: number;
  totalCostOfOwnership: number;
  dti: number;
  totalMonthlyIncome: number;
  maxEligibleLoan: number;
  recommendedDownPayment: number;
  affordabilityScore: number;
  monthlyBudgetRemaining: number;
  costPerSqft: number;
  eligible: boolean;
  eligibilityReasons: string[];
  amortization: ReturnType<typeof amortizationSchedule>;
  prepaymentSavings: number;
};

export function computeHomeLoan(i: HomeLoanInputs): HomeLoanResults {
  const loanAmount = loanFromInputs(i);
  const ltv = i.propertyPrice > 0 ? (loanAmount / i.propertyPrice) * 100 : 0;
  const emiRes = calcEmi({ principal: loanAmount, annualRate: i.interestRate, years: i.tenureYears });
  const emi = emiRes.emi;
  const totalInterest = emiRes.interest;
  const totalPayable = emiRes.total;

  const charges = computeCountryCharges(i);
  const autoProcessing = loanAmount * (i.country === "IN" ? 0.005 : 0.01);
  const processingFee = i.processingFee > 0 ? i.processingFee : autoProcessing;

  const closing = charges.stampDuty + charges.registration + charges.gst + charges.legal +
    charges.government + charges.dld + charges.agencyCommission + charges.mortgageRegistration;

  const totalUpfrontCost = i.downPayment + processingFee + closing + i.additionalInitialCosts;

  const ownershipYears = i.tenureYears;
  const totalCostOfOwnership = totalUpfrontCost + totalPayable
    + (charges.yearlyPropertyTax + charges.propertyInsurance + charges.hoa + charges.pmi) * ownershipYears
    - loanAmount; // don't double-count loan principal (it's inside totalPayable & downpayment covers rest)

  const totalMonthlyIncome = i.monthlyIncome + i.coApplicantIncome;
  const dti = totalMonthlyIncome > 0 ? ((emi + i.existingEmis) / totalMonthlyIncome) * 100 : 100;

  // Max eligible loan: 45% of income can go to EMI (industry standard)
  const dtiCap = 0.45;
  const availableForEmi = Math.max(0, totalMonthlyIncome * dtiCap - i.existingEmis);
  const n = i.tenureYears * 12;
  const r = i.interestRate / 12 / 100;
  const maxEligibleLoan = r === 0
    ? availableForEmi * n
    : (availableForEmi * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n));

  const recommendedDownPayment = Math.max(i.propertyPrice * 0.25, i.propertyPrice - maxEligibleLoan);

  const eligibilityReasons: string[] = [];
  if (dti > 50) eligibilityReasons.push("DTI ratio exceeds 50%");
  if (i.creditScore < 650) eligibilityReasons.push(`Credit score ${i.creditScore} is below typical minimum 650`);
  if (i.age + i.tenureYears > 70) eligibilityReasons.push("Loan tenure extends past age 70");
  if (loanAmount > maxEligibleLoan * 1.05) eligibilityReasons.push("Loan amount exceeds income-based eligibility");
  if (ltv > 90) eligibilityReasons.push("LTV above 90% typically requires higher premium");
  const eligible = eligibilityReasons.length === 0;

  // Affordability score 0-100
  let score = 100;
  score -= Math.max(0, dti - 30) * 1.5;          // penalize DTI over 30%
  score -= Math.max(0, ltv - 75) * 0.5;           // penalize LTV over 75%
  score -= Math.max(0, 750 - i.creditScore) * 0.15;
  score -= Math.max(0, (i.age + i.tenureYears) - 60) * 1.2;
  score = Math.max(0, Math.min(100, Math.round(score)));

  const monthlyBudgetRemaining = totalMonthlyIncome - emi - i.existingEmis;
  const costPerSqft = i.areaSqft && i.areaSqft > 0 ? i.propertyPrice / i.areaSqft : 0;
  const amortization = amortizationSchedule({ principal: loanAmount, annualRate: i.interestRate, years: i.tenureYears });

  // Prepayment savings: extra 10% of EMI monthly
  const prepaySchedule = simulatePrepayment(loanAmount, i.interestRate, i.tenureYears, emi * 0.1);
  const prepaymentSavings = totalInterest - prepaySchedule.totalInterest;

  return {
    loanAmount, ltv, emi, totalInterest, totalPayable, processingFee, charges,
    totalUpfrontCost, totalCostOfOwnership, dti, totalMonthlyIncome,
    maxEligibleLoan, recommendedDownPayment, affordabilityScore: score,
    monthlyBudgetRemaining, costPerSqft, eligible, eligibilityReasons,
    amortization, prepaymentSavings,
  };
}

export function simulatePrepayment(principal: number, annualRate: number, years: number, extraPerMonth: number) {
  const r = annualRate / 12 / 100;
  const n = years * 12;
  const emi = r === 0 ? principal / n : (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  let bal = principal;
  let totalInterest = 0;
  let months = 0;
  for (let m = 0; m < n * 2 && bal > 0.01; m++) {
    const i = bal * r;
    let p = emi - i + extraPerMonth;
    if (p > bal) p = bal;
    bal -= p;
    totalInterest += i;
    months++;
  }
  return { totalInterest, months };
}
