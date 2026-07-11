import type { ComponentType, SVGProps } from "react";
import {
  CurrencyIcon, MortgageIcon, HomeLoanIcon, IncomeTaxIcon, GstIcon, SalaryIcon,
  SipIcon, FdIcon, CompoundIcon, InflationIcon, RetirementIcon, PropertyIcon,
} from "@/components/finflow/calc-icons";

export type CalcSlug =
  | "currency" | "mortgage" | "home-loan" | "income-tax" | "gst"
  | "salary" | "sip" | "fd" | "compound-interest" | "inflation"
  | "retirement" | "property";

export type CalcIcon = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

export const CALCULATORS: Array<{
  slug: CalcSlug;
  name: string;
  tagline: string;
  icon: CalcIcon;
  category: "Currency" | "Loans" | "Tax" | "Investment" | "Real Estate" | "Planning";
  accent: string;
}> = [
  { slug: "currency", name: "Currency Converter", tagline: "Live rates across INR, USD, AED, and 30+ currencies", icon: CurrencyIcon, category: "Currency", accent: "from-sky-500 to-cyan-400" },
  { slug: "mortgage", name: "Mortgage Calculator", tagline: "Monthly payments, interest, and amortization", icon: MortgageIcon, category: "Loans", accent: "from-violet-500 to-fuchsia-500" },
  { slug: "home-loan", name: "Home Loan EMI", tagline: "EMI schedule for your dream home", icon: HomeLoanIcon, category: "Loans", accent: "from-indigo-500 to-violet-500" },
  { slug: "income-tax", name: "Income Tax", tagline: "IN new regime · USA federal · UAE (nil)", icon: IncomeTaxIcon, category: "Tax", accent: "from-emerald-500 to-teal-500" },
  { slug: "gst", name: "GST Calculator", tagline: "Inclusive / exclusive with CGST + SGST split", icon: GstIcon, category: "Tax", accent: "from-amber-500 to-orange-500" },
  { slug: "salary", name: "Salary Take-Home", tagline: "Net pay after taxes and statutory deductions", icon: SalaryIcon, category: "Tax", accent: "from-lime-500 to-emerald-500" },
  { slug: "sip", name: "SIP Calculator", tagline: "Wealth from monthly systematic investments", icon: SipIcon, category: "Investment", accent: "from-fuchsia-500 to-pink-500" },
  { slug: "fd", name: "FD Calculator", tagline: "Fixed deposit maturity with quarterly compounding", icon: FdIcon, category: "Investment", accent: "from-rose-500 to-red-500" },
  { slug: "compound-interest", name: "Compound Interest", tagline: "The eighth wonder — visualised", icon: CompoundIcon, category: "Investment", accent: "from-cyan-500 to-blue-500" },
  { slug: "inflation", name: "Inflation Impact", tagline: "What your money will be worth", icon: InflationIcon, category: "Planning", accent: "from-orange-500 to-red-500" },
  { slug: "retirement", name: "Retirement Planner", tagline: "Corpus to retire comfortably", icon: RetirementIcon, category: "Planning", accent: "from-yellow-500 to-amber-500" },
  { slug: "property", name: "Property Cost Breakdown", tagline: "EMI + stamp duty + taxes + insurance", icon: PropertyIcon, category: "Real Estate", accent: "from-teal-500 to-emerald-500" },
];

export const CALC_BY_SLUG = Object.fromEntries(CALCULATORS.map((c) => [c.slug, c])) as Record<CalcSlug, (typeof CALCULATORS)[number]>;
