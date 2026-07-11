// Pure calculation utilities

export type EmiInputs = { principal: number; annualRate: number; years: number };
export function calcEmi({ principal, annualRate, years }: EmiInputs) {
  const n = Math.max(1, Math.round(years * 12));
  const r = annualRate / 12 / 100;
  const emi = r === 0 ? principal / n : (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const total = emi * n;
  const interest = total - principal;
  return { emi, total, interest, months: n };
}

export function amortizationSchedule({ principal, annualRate, years }: EmiInputs) {
  const n = Math.max(1, Math.round(years * 12));
  const r = annualRate / 12 / 100;
  const emi = r === 0 ? principal / n : (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  let balance = principal;
  const yearly: { year: number; principal: number; interest: number; balance: number }[] = [];
  for (let y = 1; y <= Math.ceil(n / 12); y++) {
    let yP = 0, yI = 0;
    for (let m = 0; m < 12 && (y - 1) * 12 + m < n; m++) {
      const i = balance * r;
      const p = emi - i;
      yP += p; yI += i; balance -= p;
    }
    yearly.push({ year: y, principal: yP, interest: yI, balance: Math.max(0, balance) });
  }
  return yearly;
}

// SIP: future value of monthly SIP
export function calcSip({ monthly, annualRate, years }: { monthly: number; annualRate: number; years: number }) {
  const n = years * 12;
  const r = annualRate / 12 / 100;
  const fv = r === 0 ? monthly * n : monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  const invested = monthly * n;
  return { futureValue: fv, invested, gains: fv - invested };
}

/** Solve for the monthly SIP needed to reach a target future value. */
export function sipRequired({ target, annualRate, years }: { target: number; annualRate: number; years: number }) {
  const n = Math.max(1, years * 12);
  const r = annualRate / 12 / 100;
  const monthly = r === 0 ? target / n : target / (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
  return { monthly: Math.max(0, monthly), months: n };
}

/** Solve for the lump-sum FD principal needed to mature to a target amount. */
export function fdPrincipalRequired({ target, annualRate, years, compounding = 4 }: { target: number; annualRate: number; years: number; compounding?: number }) {
  const r = annualRate / 100 / compounding;
  const n = compounding * years;
  const principal = r === 0 ? target : target / Math.pow(1 + r, n);
  return { principal: Math.max(0, principal) };
}


export function calcFd({ principal, annualRate, years, compounding = 4 }: { principal: number; annualRate: number; years: number; compounding?: number }) {
  const r = annualRate / 100;
  const maturity = principal * Math.pow(1 + r / compounding, compounding * years);
  return { maturity, interest: maturity - principal };
}

export function compoundInterest({ principal, annualRate, years, compounding = 1 }: { principal: number; annualRate: number; years: number; compounding?: number }) {
  const r = annualRate / 100;
  const amount = principal * Math.pow(1 + r / compounding, compounding * years);
  return { amount, interest: amount - principal };
}

export function inflationAdjusted({ amount, annualInflation, years }: { amount: number; annualInflation: number; years: number }) {
  const future = amount * Math.pow(1 + annualInflation / 100, years);
  const realValue = amount / Math.pow(1 + annualInflation / 100, years);
  return { future, realValue, lostPurchasingPower: amount - realValue };
}

export function retirementCorpus({
  currentAge, retireAge, monthlyExpense, inflation, postReturn, lifeExpectancy,
}: { currentAge: number; retireAge: number; monthlyExpense: number; inflation: number; postReturn: number; lifeExpectancy: number }) {
  const yearsToRetire = Math.max(0, retireAge - currentAge);
  const yearsInRetirement = Math.max(1, lifeExpectancy - retireAge);
  const futureMonthly = monthlyExpense * Math.pow(1 + inflation / 100, yearsToRetire);
  const realReturn = (1 + postReturn / 100) / (1 + inflation / 100) - 1;
  const months = yearsInRetirement * 12;
  const r = realReturn / 12;
  const corpus = r === 0 ? futureMonthly * months : futureMonthly * ((1 - Math.pow(1 + r, -months)) / r);
  return { corpus, futureMonthly, yearsToRetire, yearsInRetirement };
}

// GST calculator
export function gstBreakdown({ amount, rate, inclusive }: { amount: number; rate: number; inclusive: boolean }) {
  if (inclusive) {
    const base = amount / (1 + rate / 100);
    const gst = amount - base;
    return { base, gst, total: amount, cgst: gst / 2, sgst: gst / 2 };
  }
  const gst = (amount * rate) / 100;
  return { base: amount, gst, total: amount + gst, cgst: gst / 2, sgst: gst / 2 };
}

// India income tax (new regime FY 2024-25, simplified)
export function indiaTaxNewRegime(income: number) {
  const slabs = [
    { upto: 300000, rate: 0 },
    { upto: 700000, rate: 5 },
    { upto: 1000000, rate: 10 },
    { upto: 1200000, rate: 15 },
    { upto: 1500000, rate: 20 },
    { upto: Infinity, rate: 30 },
  ];
  let tax = 0, prev = 0;
  for (const s of slabs) {
    if (income > s.upto) { tax += ((s.upto - prev) * s.rate) / 100; prev = s.upto; }
    else { tax += ((income - prev) * s.rate) / 100; break; }
  }
  if (income <= 700000) tax = 0; // rebate 87A
  const cess = tax * 0.04;
  return { tax, cess, total: tax + cess, effectiveRate: income ? ((tax + cess) / income) * 100 : 0 };
}

// USA federal tax 2024 single
export function usaFederalTax(income: number) {
  const standardDeduction = 14600;
  const taxable = Math.max(0, income - standardDeduction);
  const brackets = [
    { upto: 11600, rate: 10 },
    { upto: 47150, rate: 12 },
    { upto: 100525, rate: 22 },
    { upto: 191950, rate: 24 },
    { upto: 243725, rate: 32 },
    { upto: 609350, rate: 35 },
    { upto: Infinity, rate: 37 },
  ];
  let tax = 0, prev = 0;
  for (const b of brackets) {
    if (taxable > b.upto) { tax += ((b.upto - prev) * b.rate) / 100; prev = b.upto; }
    else { tax += ((taxable - prev) * b.rate) / 100; break; }
  }
  return { tax, taxable, effectiveRate: income ? (tax / income) * 100 : 0, standardDeduction };
}

// UAE — no personal income tax
export function uaeTax(income: number) {
  return { tax: 0, taxable: income, effectiveRate: 0, note: "UAE levies no personal income tax." };
}

// Salary: net take-home (very simplified)
export function salaryBreakdown({ gross, country }: { gross: number; country: "IN" | "US" | "AE" }) {
  if (country === "IN") {
    const t = indiaTaxNewRegime(gross);
    const pf = Math.min(gross * 0.12, 21600);
    const net = gross - t.total - pf;
    return { gross, tax: t.total, deductions: pf, net, breakdown: { "Income Tax + Cess": t.total, "EPF": pf } };
  }
  if (country === "US") {
    const t = usaFederalTax(gross);
    const fica = gross * 0.0765;
    const net = gross - t.tax - fica;
    return { gross, tax: t.tax, deductions: fica, net, breakdown: { "Federal Tax": t.tax, "FICA (SS + Medicare)": fica } };
  }
  return { gross, tax: 0, deductions: 0, net: gross, breakdown: { "Tax": 0 } };
}

// Real estate — full property cost breakdown
export type PropertyInputs = {
  price: number;
  downPayment: number;
  annualRate: number;
  years: number;
  country: "IN" | "US" | "AE";
  state?: string;
};

export function propertyBreakdown(input: PropertyInputs) {
  const { price, downPayment, annualRate, years, country } = input;
  const loan = Math.max(0, price - downPayment);
  const emi = calcEmi({ principal: loan, annualRate, years });
  let stampDuty = 0, registration = 0, gst = 0, insurance = 0, propertyTax = 0;

  if (country === "IN") {
    stampDuty = price * 0.06;         // ~5-7% avg
    registration = price * 0.01;
    gst = price * 0.05;               // for under-construction
    insurance = price * 0.0005 * years;
    propertyTax = price * 0.001 * years;
  } else if (country === "US") {
    stampDuty = price * 0.011;        // transfer + recording ~1.1%
    registration = 500;
    insurance = price * 0.0035 * years;
    propertyTax = price * 0.011 * years;
  } else {
    stampDuty = price * 0.04;         // Dubai land dept 4%
    registration = 4000;
    insurance = price * 0.001 * years;
    propertyTax = 0;
  }

  const closing = stampDuty + registration + gst;
  const totalCost = downPayment + emi.total + closing + insurance + propertyTax;

  return {
    loan,
    emi: emi.emi,
    totalInterest: emi.interest,
    totalPayments: emi.total,
    stampDuty,
    registration,
    gst,
    insurance,
    propertyTax,
    closing,
    totalCost,
  };
}
