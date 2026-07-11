import type { Country } from "./countries";

export type TaxTip = {
  title: string;
  detail: string;
  potentialSavingLabel?: string;
};

/**
 * Rules-based tax-saving suggestions. Not tax advice — informational only.
 * Amounts are annualised local currency.
 */
export function taxSavingTips(country: Country, annualIncome: number): TaxTip[] {
  if (country === "IN") {
    const tips: TaxTip[] = [];
    if (annualIncome > 700000) {
      tips.push({
        title: "NPS Tier-1 (§80CCD(1B))",
        detail: "Contribute up to ₹50,000 in NPS Tier-1 for an exclusive additional deduction — available even under the New Regime for employer-routed contributions (§80CCD(2)).",
        potentialSavingLabel: "Up to ₹15,000/yr tax saved at 30% slab",
      });
    }
    if (annualIncome > 500000) {
      tips.push({
        title: "Employer NPS (§80CCD(2))",
        detail: "Employer contribution up to 14% of basic salary is deductible under the New Regime. Check with payroll to enable this.",
      });
    }
    if (annualIncome > 1000000) {
      tips.push({
        title: "Home loan interest on let-out property",
        detail: "Interest on a loan for a let-out property remains deductible against rental income even in the New Regime. Structure investments accordingly.",
      });
    }
    tips.push({
      title: "Compare Old vs New Regime",
      detail: "If you claim > ₹4L in deductions (80C ₹1.5L + 80D + HRA + home loan interest), the Old Regime may still be cheaper. Run both.",
    });
    return tips;
  }

  if (country === "US") {
    const tips: TaxTip[] = [];
    tips.push({
      title: "401(k) pre-tax contribution",
      detail: "Contribute up to $23,000 in 2024 ($30,500 if 50+). Reduces taxable income dollar-for-dollar and grows tax-deferred.",
      potentialSavingLabel: "Up to $5,060/yr saved at 22% bracket",
    });
    tips.push({
      title: "HSA (if HDHP)",
      detail: "Triple tax-advantaged: pre-tax in, tax-free growth, tax-free withdrawals for qualified medical. 2024 limit: $4,150 self / $8,300 family.",
    });
    if (annualIncome < 161000) {
      tips.push({
        title: "Roth IRA",
        detail: "Contribute up to $7,000 post-tax; qualified withdrawals are tax-free. Phase-out for single filers begins at $146,000 MAGI.",
      });
    } else {
      tips.push({
        title: "Backdoor Roth IRA",
        detail: "Above the Roth income limit — consider a non-deductible Traditional IRA contribution converted to Roth. Watch the pro-rata rule.",
      });
    }
    if (annualIncome > 100000) {
      tips.push({
        title: "Tax-loss harvesting",
        detail: "Realise capital losses in taxable brokerage accounts to offset gains, plus up to $3,000 of ordinary income annually.",
      });
    }
    return tips;
  }

  // UAE
  return [
    {
      title: "No personal income tax",
      detail: "The UAE levies no personal income tax. Focus tax planning on your country of tax residence or any foreign-source obligations.",
    },
    {
      title: "Corporate Tax (9%) for business owners",
      detail: "If you own a business, taxable profits above AED 375,000 are taxed at 9%. Small Business Relief may apply for revenue ≤ AED 3M through 2026.",
    },
    {
      title: "VAT registration threshold",
      detail: "Mandatory VAT registration at AED 375,000 taxable supplies; voluntary at AED 187,500. Recover input VAT where eligible.",
    },
  ];
}
