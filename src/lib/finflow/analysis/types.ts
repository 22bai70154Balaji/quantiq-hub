// Shared types describing a calculator's "analysis payload".
// Every calculator produces one; the shell reads it to power Save, AI, Export, Share, PDF, etc.

import type { Country } from "@/lib/finflow/countries";
import type { CalcSlug } from "@/lib/finflow/registry";

export type KpiTone = "primary" | "success" | "warning" | "destructive" | "neutral";

export type Kpi = {
  label: string;
  value: string;      // pre-formatted for display
  numericValue?: number; // for animated counters if desired
  sub?: string;
  tone?: KpiTone;
};

export type LabelledValue = { label: string; value: string };

export type BreakdownColumn = {
  key: string;
  label: string;
  align?: "left" | "right";
  numeric?: boolean;
};

export type BreakdownRow = Record<string, string | number>;

export type BreakdownTable = {
  columns: BreakdownColumn[];
  rows: BreakdownRow[];
  // Optional yearly rollup — if omitted, the shell shows only the rows array.
  yearlyRows?: BreakdownRow[];
};

export type ComparisonRow = {
  key: string;
  label: string;
  values: string[];        // one per option; index matches options
  numericValues?: number[];
  highlight?: "min" | "max"; // e.g. lowest EMI wins
};

export type ComparisonBlock = {
  title: string;
  options: string[];       // column headers
  rows: ComparisonRow[];
};

export type AnalysisPayload = {
  slug: CalcSlug;
  title: string;           // e.g. "Home Loan EMI Analysis"
  subtitle?: string;
  country: Country;
  inputs: LabelledValue[]; // human-readable inputs
  kpis: Kpi[];             // 3–6 KPIs
  breakdown?: BreakdownTable;
  assumptions?: string[];
  comparison?: ComparisonBlock;
  // Compact JSON of the underlying numbers, used by AI + share page rebuild.
  raw: {
    inputs: Record<string, unknown>;
    results: Record<string, unknown>;
  };
  // A short natural-language brief so the AI can produce insights without re-computing.
  aiBrief: string;
};
