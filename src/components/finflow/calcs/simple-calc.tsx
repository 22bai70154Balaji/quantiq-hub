import { useState } from "react";
import { calcFd, compoundInterest, inflationAdjusted, retirementCorpus, gstBreakdown, indiaTaxNewRegime, usaFederalTax, uaeTax, salaryBreakdown } from "@/lib/finflow/calculators";
import { formatMoney } from "@/lib/finflow/countries";
import { useCountry } from "@/lib/finflow/country-store";
import { CalcShell, InputRow, NumberInput, StatCard } from "../calc-shell";
import { CALC_BY_SLUG, type CalcSlug } from "@/lib/finflow/registry";

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
            <StatCard label="Principal" value={formatMoney(p, country)} />
            <StatCard label="Interest earned" value={formatMoney(r.interest, country)} tone="success" />
            <StatCard label="Maturity" value={formatMoney(r.maturity, country)} tone="primary" />
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
            <StatCard label="Principal" value={formatMoney(p, country)} />
            <StatCard label="Compound interest" value={formatMoney(r.interest, country)} tone="success" />
            <StatCard label="Final amount" value={formatMoney(r.amount, country)} tone="primary" />
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
            <StatCard label="Future cost of today's purchase" value={formatMoney(r.future, country)} tone="warning" />
            <StatCard label="Today's money is worth (in future terms)" value={formatMoney(r.realValue, country)} />
            <StatCard label="Purchasing power lost" value={formatMoney(r.lostPurchasingPower, country)} tone="destructive" />
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
            <StatCard label="Corpus needed at retirement" value={formatMoney(r.corpus, country)} tone="primary" />
            <StatCard label="Future monthly expense" value={formatMoney(r.futureMonthly, country)} />
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
            <StatCard label="Base amount" value={formatMoney(r.base, country)} />
            <StatCard label="GST" value={formatMoney(r.gst, country)} tone="warning" sub={`CGST ${formatMoney(r.cgst, country)} + SGST ${formatMoney(r.sgst, country)}`} />
            <StatCard label="Total" value={formatMoney(r.total, country)} tone="primary" />
          </>
        } />
      );
    }
    if (slug === "income-tax") {
      const r = country === "IN" ? indiaTaxNewRegime(income) : country === "US" ? usaFederalTax(income) : uaeTax(income);
      const total = "total" in r ? r.total : "tax" in r ? r.tax : 0;
      return (
        <Layout inputs={
          <>
            <InputRow label="Annual income"><NumberInput value={income} onChange={setIncome} step={10000} /></InputRow>
            <div className="text-xs text-muted-foreground">Using {country === "IN" ? "India (New Regime FY24-25)" : country === "US" ? "USA Federal (Single, 2024)" : "UAE (no personal income tax)"} rules. Change country in the top nav.</div>
          </>
        } stats={
          <>
            <StatCard label="Estimated tax" value={formatMoney(total, country)} tone="destructive" />
            <StatCard label="Effective rate" value={`${r.effectiveRate.toFixed(2)}%`} />
            <StatCard label="Take home" value={formatMoney(income - total, country)} tone="primary" />
          </>
        } />
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
            <StatCard label="Gross" value={formatMoney(r.gross, country)} />
            <StatCard label="Total deductions" value={formatMoney(r.tax + r.deductions, country)} tone="destructive" />
            <StatCard label="Net take-home" value={formatMoney(r.net, country)} tone="primary" />
            {Object.entries(r.breakdown).map(([k, v]) => (
              <StatCard key={k} label={k} value={formatMoney(v, country)} />
            ))}
          </>
        } />
      );
    }
    return null;
  };

  return (
    <CalcShell title={meta.name} tagline={meta.tagline} accent={meta.accent} icon={meta.icon} saveType={slug}>
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
