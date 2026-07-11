import { useMemo, useState } from "react";
import {
  calcFd, compoundInterest, inflationAdjusted, retirementCorpus, gstBreakdown,
  indiaTaxNewRegime, usaFederalTax, uaeTax, salaryBreakdown,
} from "@/lib/finflow/calculators";
import { formatMoney, COUNTRIES } from "@/lib/finflow/countries";
import { useCountry } from "@/lib/finflow/country-store";
import { CalcShell, InputRow, NumberInput, StatCard } from "../calc-shell";
import { CALC_BY_SLUG, type CalcSlug } from "@/lib/finflow/registry";
import type { AnalysisPayload, Kpi, LabelledValue } from "@/lib/finflow/analysis/types";
import { taxRulesFor } from "@/lib/finflow/tax-rules";
import { taxSavingTips } from "@/lib/finflow/tax-tips";
import { TaxRulesPanel } from "../tax-rules-panel";

export function SimpleCalc({ slug }: { slug: CalcSlug }) {
  const meta = CALC_BY_SLUG[slug];
  const [country] = useCountry();

  const [p, setP] = useState(100000);
  const [rate, setRate] = useState(7);
  const [years, setYears] = useState(5);

  // GST
  const [gstAmt, setGstAmt] = useState(10000);
  const [gstRate, setGstRate] = useState(18);
  const [gstIncl, setGstIncl] = useState(false);

  // Inflation
  const [inflAmount, setInflAmount] = useState(100000);
  const [inflRate, setInflRate] = useState(6);
  const [inflYears, setInflYears] = useState(10);

  // Retirement
  const [age, setAge] = useState(30);
  const [rAge, setRAge] = useState(60);
  const [monthlyExp, setMonthlyExp] = useState(50000);
  const [inflR, setInflR] = useState(6);
  const [postR, setPostR] = useState(8);
  const [life, setLife] = useState(85);

  // Tax
  const [income, setIncome] = useState(1500000);

  // Salary
  const [gross, setGross] = useState(1200000);

  const money = (n: number) => formatMoney(n, country);
  const cName = COUNTRIES[country].name;

  const payload: AnalysisPayload = useMemo(() => {
    const base = (inputs: LabelledValue[], kpis: Kpi[], extras: Partial<AnalysisPayload> = {}): AnalysisPayload => ({
      slug,
      country,
      title: `${meta.name} analysis`,
      subtitle: meta.tagline,
      inputs,
      kpis,
      raw: extras.raw ?? { inputs: {}, results: {} },
      aiBrief: extras.aiBrief ?? `${meta.name} for ${cName}.`,
      assumptions: extras.assumptions,
      breakdown: extras.breakdown,
      comparison: extras.comparison,
    });

    if (slug === "fd") {
      const r = calcFd({ principal: p, annualRate: rate, years, compounding: 4 });
      return base(
        [
          { label: "Principal", value: money(p) },
          { label: "Interest rate", value: `${rate}% p.a.` },
          { label: "Tenure", value: `${years} years` },
        ],
        [
          { label: "Principal", value: money(p), tone: "neutral" },
          { label: "Interest earned", value: money(r.interest), tone: "success" },
          { label: "Maturity value", value: money(r.maturity), tone: "primary" },
        ],
        {
          assumptions: [
            `Quarterly compounding at ${rate}% p.a. over ${years} years.`,
            "Interest may be taxed as per country and tax bracket (e.g. TDS in India, ordinary income in USA).",
            "Early withdrawal penalties, if any, are not modelled.",
          ],
          raw: { inputs: { principal: p, rate, years }, results: { interest: r.interest, maturity: r.maturity } },
          aiBrief: `FD of ${money(p)} at ${rate}% for ${years} years (quarterly). Interest ${money(r.interest)}, maturity ${money(r.maturity)}.`,
        }
      );
    }

    if (slug === "compound-interest") {
      const r = compoundInterest({ principal: p, annualRate: rate, years, compounding: 1 });
      return base(
        [
          { label: "Principal", value: money(p) },
          { label: "Rate", value: `${rate}%` },
          { label: "Years", value: `${years}` },
        ],
        [
          { label: "Principal", value: money(p), tone: "neutral" },
          { label: "Compound interest", value: money(r.interest), tone: "success" },
          { label: "Final amount", value: money(r.amount), tone: "primary" },
        ],
        {
          assumptions: [`Annual compounding at ${rate}% over ${years} years.`, "No additional contributions or withdrawals."],
          raw: { inputs: { principal: p, rate, years }, results: { interest: r.interest, amount: r.amount } },
          aiBrief: `Compound interest on ${money(p)} at ${rate}% for ${years}y = ${money(r.amount)}.`,
        }
      );
    }

    if (slug === "inflation") {
      const r = inflationAdjusted({ amount: inflAmount, annualInflation: inflRate, years: inflYears });
      return base(
        [
          { label: "Today's amount", value: money(inflAmount) },
          { label: "Inflation rate", value: `${inflRate}% p.a.` },
          { label: "Years ahead", value: `${inflYears}` },
        ],
        [
          { label: "Future nominal cost", value: money(r.future), tone: "warning" },
          { label: "Real value of today's money", value: money(r.realValue), tone: "neutral" },
          { label: "Purchasing power lost", value: money(r.lostPurchasingPower), tone: "destructive" },
        ],
        {
          assumptions: [`Constant inflation at ${inflRate}% p.a. over ${inflYears} years.`, "Excludes wage growth, tax drag, and asset-class returns."],
          raw: { inputs: { amount: inflAmount, inflation: inflRate, years: inflYears }, results: r },
          aiBrief: `${money(inflAmount)} today ≈ ${money(r.realValue)} in ${inflYears} years at ${inflRate}% inflation.`,
        }
      );
    }

    if (slug === "retirement") {
      const r = retirementCorpus({ currentAge: age, retireAge: rAge, monthlyExpense: monthlyExp, inflation: inflR, postReturn: postR, lifeExpectancy: life });
      return base(
        [
          { label: "Current age", value: `${age}` },
          { label: "Retirement age", value: `${rAge}` },
          { label: "Life expectancy", value: `${life}` },
          { label: "Monthly expense today", value: money(monthlyExp) },
          { label: "Inflation", value: `${inflR}%` },
          { label: "Post-retirement return", value: `${postR}%` },
        ],
        [
          { label: "Corpus needed", value: money(r.corpus), tone: "primary" },
          { label: "Future monthly expense", value: money(r.futureMonthly), tone: "warning" },
          { label: "Years in retirement", value: `${r.yearsInRetirement}`, sub: `${r.yearsToRetire} yrs to prepare` },
        ],
        {
          assumptions: [
            `Inflation constant at ${inflR}% pre and during retirement.`,
            `Post-retirement portfolio compounds at ${postR}% net of taxes.`,
            "Excludes healthcare shocks, pension income, or lump-sum needs.",
          ],
          raw: { inputs: { age, rAge, life, monthlyExp, inflR, postR }, results: r },
          aiBrief: `Retire at ${rAge} from ${age} in ${cName}. Corpus needed ~${money(r.corpus)} for spend ${money(monthlyExp)}/mo today.`,
        }
      );
    }

    if (slug === "gst") {
      const r = gstBreakdown({ amount: gstAmt, rate: gstRate, inclusive: gstIncl });
      return base(
        [
          { label: "Amount", value: money(gstAmt) },
          { label: "GST rate", value: `${gstRate}%` },
          { label: "Type", value: gstIncl ? "Inclusive" : "Exclusive" },
        ],
        [
          { label: "Base amount", value: money(r.base), tone: "neutral" },
          { label: "GST", value: money(r.gst), tone: "warning", sub: `CGST ${money(r.cgst)} + SGST ${money(r.sgst)}` },
          { label: "Total", value: money(r.total), tone: "primary" },
        ],
        {
          assumptions: ["Split CGST/SGST assumes intra-state supply; use IGST for inter-state.", "Excludes cess and reverse charge scenarios."],
          raw: { inputs: { amount: gstAmt, rate: gstRate, inclusive: gstIncl }, results: r },
          aiBrief: `GST at ${gstRate}% on ${money(gstAmt)} (${gstIncl ? "incl." : "excl."}). Total ${money(r.total)}.`,
        }
      );
    }

    if (slug === "income-tax") {
      const r = country === "IN" ? indiaTaxNewRegime(income) : country === "US" ? usaFederalTax(income) : uaeTax(income);
      const total = "total" in r ? r.total : "tax" in r ? r.tax : 0;
      const rules = taxRulesFor(country);
      const tips = taxSavingTips(country, income);
      const tipLines = tips.map((t) => `${t.title}: ${t.detail}`);
      return base(
        [
          { label: "Annual income", value: money(income) },
          { label: "Rules", value: rules.regime },
          ...(rules.standardDeduction ? [{ label: rules.standardDeduction.label, value: money(rules.standardDeduction.amount) }] : []),
        ],
        [
          { label: "Estimated tax", value: money(total), tone: "destructive" },
          { label: "Effective rate", value: `${r.effectiveRate.toFixed(2)}%`, tone: "warning" },
          { label: "Take home", value: money(income - total), tone: "primary" },
        ],
        {
          assumptions: [
            `${rules.regime}. Effective ${rules.effectiveFrom}.`,
            ...rules.notes,
            "Tax-saving ideas below are informational and depend on individual circumstances.",
            ...tipLines,
          ],
          raw: { inputs: { income, country }, results: { tax: total, effectiveRate: r.effectiveRate } },
          aiBrief: `${rules.regime}. Income ${money(income)} → tax ~${money(total)} (${r.effectiveRate.toFixed(2)}%). ${tips.length} country-specific tax-saving ideas available: ${tips.map((t) => t.title).join(", ")}.`,
        }
      );
    }



    if (slug === "salary") {
      const r = salaryBreakdown({ gross, country });
      const kpis: Kpi[] = [
        { label: "Gross", value: money(r.gross), tone: "neutral" },
        { label: "Total deductions", value: money(r.tax + r.deductions), tone: "destructive" },
        { label: "Net take-home", value: money(r.net), tone: "primary" },
      ];
      const inputs: LabelledValue[] = [
        { label: "Annual gross salary", value: money(gross) },
        { label: "Country", value: cName },
      ];
      Object.entries(r.breakdown).forEach(([k, v]) => inputs.push({ label: k, value: money(v) }));
      return base(inputs, kpis, {
        assumptions: [
          "Uses country-specific statutory deductions and simplified tax rules.",
          "Excludes voluntary contributions, HRA specifics, benefits-in-kind, and one-time bonuses.",
        ],
        raw: { inputs: { gross, country }, results: r },
        aiBrief: `Salary ${money(gross)} in ${cName}. Net ${money(r.net)} after deductions ${money(r.tax + r.deductions)}.`,
      });
    }

    return base([], []);
  }, [slug, country, cName, meta.name, meta.tagline, p, rate, years, inflAmount, inflRate, inflYears, age, rAge, monthlyExp, inflR, postR, life, gstAmt, gstRate, gstIncl, income, gross]);

  const renderBody = () => {
    if (slug === "fd") {
      const r = calcFd({ principal: p, annualRate: rate, years, compounding: 4 });
      return (
        <Layout inputs={
          <>
            <InputRow label="Principal"><NumberInput value={p} onChange={setP} step={1000} /></InputRow>
            <InputRow label="Interest rate (% p.a.)"><NumberInput value={rate} onChange={setRate} step={0.1} /></InputRow>
            <InputRow label="Tenure (years)"><NumberInput value={years} onChange={setYears} step={1} /></InputRow>
          </>
        } stats={
          <>
            <StatCard label="Principal" value={money(p)} />
            <StatCard label="Interest earned" value={money(r.interest)} tone="success" />
            <StatCard label="Maturity" value={money(r.maturity)} tone="primary" />
          </>
        } />
      );
    }
    if (slug === "compound-interest") {
      const r = compoundInterest({ principal: p, annualRate: rate, years, compounding: 1 });
      return (
        <Layout inputs={
          <>
            <InputRow label="Principal"><NumberInput value={p} onChange={setP} step={1000} /></InputRow>
            <InputRow label="Rate (%)"><NumberInput value={rate} onChange={setRate} step={0.1} /></InputRow>
            <InputRow label="Years"><NumberInput value={years} onChange={setYears} step={1} /></InputRow>
          </>
        } stats={
          <>
            <StatCard label="Principal" value={money(p)} />
            <StatCard label="Compound interest" value={money(r.interest)} tone="success" />
            <StatCard label="Final amount" value={money(r.amount)} tone="primary" />
          </>
        } />
      );
    }
    if (slug === "inflation") {
      const r = inflationAdjusted({ amount: inflAmount, annualInflation: inflRate, years: inflYears });
      return (
        <Layout inputs={
          <>
            <InputRow label="Today's amount"><NumberInput value={inflAmount} onChange={setInflAmount} step={1000} /></InputRow>
            <InputRow label="Inflation rate (% p.a.)"><NumberInput value={inflRate} onChange={setInflRate} step={0.1} /></InputRow>
            <InputRow label="Years ahead"><NumberInput value={inflYears} onChange={setInflYears} step={1} /></InputRow>
          </>
        } stats={
          <>
            <StatCard label="Future cost of today's purchase" value={money(r.future)} tone="warning" />
            <StatCard label="Today's money is worth (in future terms)" value={money(r.realValue)} />
            <StatCard label="Purchasing power lost" value={money(r.lostPurchasingPower)} tone="destructive" />
          </>
        } />
      );
    }
    if (slug === "retirement") {
      const r = retirementCorpus({ currentAge: age, retireAge: rAge, monthlyExpense: monthlyExp, inflation: inflR, postReturn: postR, lifeExpectancy: life });
      return (
        <Layout inputs={
          <>
            <InputRow label="Current age"><NumberInput value={age} onChange={setAge} /></InputRow>
            <InputRow label="Retirement age"><NumberInput value={rAge} onChange={setRAge} /></InputRow>
            <InputRow label="Life expectancy"><NumberInput value={life} onChange={setLife} /></InputRow>
            <InputRow label="Monthly expense today"><NumberInput value={monthlyExp} onChange={setMonthlyExp} step={1000} /></InputRow>
            <InputRow label="Inflation (%)"><NumberInput value={inflR} onChange={setInflR} step={0.1} /></InputRow>
            <InputRow label="Post-retirement return (%)"><NumberInput value={postR} onChange={setPostR} step={0.1} /></InputRow>
          </>
        } stats={
          <>
            <StatCard label="Corpus needed at retirement" value={money(r.corpus)} tone="primary" />
            <StatCard label="Future monthly expense" value={money(r.futureMonthly)} />
            <StatCard label="Years in retirement" value={`${r.yearsInRetirement}`} sub={`${r.yearsToRetire} yrs to prepare`} />
          </>
        } />
      );
    }
    if (slug === "gst") {
      const r = gstBreakdown({ amount: gstAmt, rate: gstRate, inclusive: gstIncl });
      return (
        <Layout inputs={
          <>
            <InputRow label="Amount"><NumberInput value={gstAmt} onChange={setGstAmt} step={100} /></InputRow>
            <InputRow label="GST rate (%)">
              <select value={gstRate} onChange={(e) => setGstRate(Number(e.target.value))} className="h-11 w-full rounded-xl border bg-background px-3">
                {[0, 3, 5, 12, 18, 28].map((r) => <option key={r} value={r}>{r}%</option>)}
              </select>
            </InputRow>
            <InputRow label="Amount type">
              <div className="flex gap-2">
                <button onClick={() => setGstIncl(false)} className={`flex-1 rounded-xl border px-3 py-2 text-sm ${!gstIncl ? "bg-primary text-primary-foreground" : ""}`}>Exclusive</button>
                <button onClick={() => setGstIncl(true)} className={`flex-1 rounded-xl border px-3 py-2 text-sm ${gstIncl ? "bg-primary text-primary-foreground" : ""}`}>Inclusive</button>
              </div>
            </InputRow>
          </>
        } stats={
          <>
            <StatCard label="Base amount" value={money(r.base)} />
            <StatCard label="GST" value={money(r.gst)} tone="warning" sub={`CGST ${money(r.cgst)} + SGST ${money(r.sgst)}`} />
            <StatCard label="Total" value={money(r.total)} tone="primary" />
          </>
        } />
      );
    }
    if (slug === "income-tax") {
      const r = country === "IN" ? indiaTaxNewRegime(income) : country === "US" ? usaFederalTax(income) : uaeTax(income);
      const total = "total" in r ? r.total : "tax" in r ? r.tax : 0;
      return (
        <>
          <Layout inputs={
            <>
              <InputRow label="Annual income"><NumberInput value={income} onChange={setIncome} step={10000} /></InputRow>
              <div className="text-xs text-muted-foreground">Change country in the top nav to switch tax rules.</div>
            </>
          } stats={
            <>
              <StatCard label="Estimated tax" value={money(total)} tone="destructive" />
              <StatCard label="Effective rate" value={`${r.effectiveRate.toFixed(2)}%`} />
              <StatCard label="Take home" value={money(income - total)} tone="primary" />
            </>
          } />
          <TaxRulesPanel country={country} income={income} />
        </>
      );
    }

    if (slug === "salary") {
      const r = salaryBreakdown({ gross, country });
      return (
        <Layout inputs={
          <>
            <InputRow label="Annual gross salary"><NumberInput value={gross} onChange={setGross} step={10000} /></InputRow>
            <div className="text-xs text-muted-foreground">Country: {country}. Change in top nav for different rules.</div>
          </>
        } stats={
          <>
            <StatCard label="Gross" value={money(r.gross)} />
            <StatCard label="Total deductions" value={money(r.tax + r.deductions)} tone="destructive" />
            <StatCard label="Net take-home" value={money(r.net)} tone="primary" />
            {Object.entries(r.breakdown).map(([k, v]) => (
              <StatCard key={k} label={k} value={money(v)} />
            ))}
          </>
        } />
      );
    }
    return null;
  };

  return (
    <CalcShell title={meta.name} tagline={meta.tagline} accent={meta.accent} icon={meta.icon}
      saveType={slug} analysisPayload={payload}>
      {renderBody()}
    </CalcShell>
  );
}

function Layout({ inputs, stats }: { inputs: React.ReactNode; stats: React.ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <div className="space-y-5 rounded-2xl border bg-card p-6 shadow-soft">{inputs}</div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 h-fit">{stats}</div>
    </div>
  );
}
