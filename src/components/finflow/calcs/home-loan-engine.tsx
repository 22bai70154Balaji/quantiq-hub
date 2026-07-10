import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts";
import { Download, ChevronLeft, ChevronRight, Sparkles, Check, X, Trophy, Zap, ShieldCheck, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { CalcShell, InputRow, NumberInput, StatCard } from "../calc-shell";
import { CALC_BY_SLUG } from "@/lib/finflow/registry";
import { useCountry } from "@/lib/finflow/country-store";
import { COUNTRIES, formatMoney } from "@/lib/finflow/countries";
import { computeHomeLoan, type HomeLoanInputs, type PropertyType, type EmploymentType, type RateType } from "@/lib/finflow/home-loan";
import { banksForCountry, bankLogoUrl, processingFeeAmount, RATES_LAST_UPDATED, type Bank } from "@/lib/finflow/banks";
import { calcEmi } from "@/lib/finflow/calculators";
import { analyzeHomeLoan } from "@/lib/finflow/home-loan-ai.functions";

const STATES: Record<string, string[]> = {
  IN: ["Maharashtra", "Karnataka", "Delhi", "Tamil Nadu", "Telangana", "Gujarat", "West Bengal", "Uttar Pradesh"],
  US: ["California", "Texas", "New York", "Florida", "Washington", "Massachusetts", "Illinois"],
  AE: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah"],
};

const CITIES: Record<string, string[]> = {
  IN: ["Mumbai", "Bengaluru", "Pune", "Delhi", "Hyderabad", "Chennai", "Kolkata", "Ahmedabad"],
  US: ["San Francisco", "New York", "Austin", "Seattle", "Boston", "Miami", "Los Angeles"],
  AE: ["Dubai Marina", "Downtown Dubai", "Abu Dhabi Corniche", "Sharjah", "Business Bay"],
};

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "independent", label: "Independent House" },
  { value: "commercial", label: "Commercial" },
  { value: "land", label: "Land" },
];

const EMPLOYMENT: { value: EmploymentType; label: string }[] = [
  { value: "salaried", label: "Salaried" },
  { value: "self_employed", label: "Self-employed" },
  { value: "business", label: "Business owner" },
  { value: "professional", label: "Professional (Doctor/CA/Lawyer)" },
];

function defaultsFor(country: "IN" | "US" | "AE"): HomeLoanInputs {
  if (country === "US") return {
    country, state: "California", city: "San Francisco", propertyType: "apartment",
    propertyPrice: 750_000, downPayment: 150_000, additionalInitialCosts: 5000, areaSqft: 1200,
    interestRate: 6.85, tenureYears: 30, rateType: "fixed", existingLoans: 0, processingFee: 0, insuranceCost: 0,
    monthlyIncome: 12000, coApplicantIncome: 0, existingEmis: 0, creditScore: 740, employmentType: "salaried", age: 32,
  };
  if (country === "AE") return {
    country, state: "Dubai", city: "Dubai Marina", propertyType: "apartment",
    propertyPrice: 2_500_000, downPayment: 500_000, additionalInitialCosts: 15_000, areaSqft: 1400,
    interestRate: 4.49, tenureYears: 25, rateType: "fixed", existingLoans: 0, processingFee: 0, insuranceCost: 0,
    monthlyIncome: 45_000, coApplicantIncome: 0, existingEmis: 0, creditScore: 720, employmentType: "salaried", age: 34,
  };
  return {
    country, state: "Maharashtra", city: "Mumbai", propertyType: "apartment",
    propertyPrice: 15_000_000, downPayment: 3_000_000, additionalInitialCosts: 50_000, areaSqft: 1000,
    interestRate: 8.75, tenureYears: 20, rateType: "floating", existingLoans: 0, processingFee: 0, insuranceCost: 0,
    monthlyIncome: 250_000, coApplicantIncome: 0, existingEmis: 0, creditScore: 750, employmentType: "salaried", age: 32,
  };
}

export function HomeLoanEngine() {
  const meta = CALC_BY_SLUG["home-loan"];
  const [country] = useCountry();
  const [step, setStep] = useState(0);
  const [i, setI] = useState<HomeLoanInputs>(() => defaultsFor(country));
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const analyzeFn = useServerFn(analyzeHomeLoan);

  // Sync country changes
  useMemo(() => {
    if (i.country !== country) setI(defaultsFor(country));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country]);

  const set = <K extends keyof HomeLoanInputs>(k: K, v: HomeLoanInputs[K]) => setI((s) => ({ ...s, [k]: v }));
  const r = useMemo(() => computeHomeLoan(i), [i]);
  const banks = useMemo(() => banksForCountry(i.country), [i.country]);
  const currency = COUNTRIES[i.country].currency;

  const bankRows = useMemo(() => banks.map((b) => {
    const rate = Math.max(b.minRate, Math.min(b.maxRate, i.interestRate));
    // Adjust for credit score: cheaper if score > 750, expensive if <650
    const adjusted = i.creditScore >= 780 ? b.minRate : i.creditScore < 650 ? b.maxRate : rate;
    const emi = calcEmi({ principal: r.loanAmount, annualRate: adjusted, years: Math.min(i.tenureYears, b.maxTenureYears) }).emi;
    const totalInt = emi * Math.min(i.tenureYears, b.maxTenureYears) * 12 - r.loanAmount;
    const eligible = i.creditScore >= b.minCreditScore && (r.loanAmount / i.propertyPrice) * 100 <= b.maxLtv;
    const fee = processingFeeAmount(b, r.loanAmount);
    return { bank: b, rate: adjusted, emi, totalInt, totalPayable: emi * Math.min(i.tenureYears, b.maxTenureYears) * 12, eligible, fee };
  }), [banks, i.interestRate, i.creditScore, i.propertyPrice, i.tenureYears, r.loanAmount]);

  const bestEmi = bankRows.reduce((best, r) => r.emi < best.emi ? r : best, bankRows[0]);
  const bestRate = bankRows.reduce((best, r) => r.rate < best.rate ? r : best, bankRows[0]);
  const bestValue = bankRows.reduce((best, r) => (r.totalPayable + r.fee) < (best.totalPayable + best.fee) ? r : best, bankRows[0]);

  const runAI = async () => {
    setAiLoading(true);
    setAiAnalysis("");
    try {
      const res = await analyzeFn({ data: {
        country: i.country, currency, propertyPrice: i.propertyPrice, downPayment: i.downPayment,
        loanAmount: r.loanAmount, interestRate: i.interestRate, tenureYears: i.tenureYears, emi: r.emi,
        totalInterest: r.totalInterest, dti: r.dti, ltv: r.ltv, affordabilityScore: r.affordabilityScore,
        creditScore: i.creditScore, monthlyIncome: r.totalMonthlyIncome, monthlyBudgetRemaining: r.monthlyBudgetRemaining,
        bestBank: bestValue ? { name: bestValue.bank.name, rate: bestValue.rate, emi: bestValue.emi } : undefined,
      }});
      setAiAnalysis(res.analysis);
      toast.success("AI analysis ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI analysis failed");
    } finally {
      setAiLoading(false);
    }
  };

  const exportPdf = async () => {
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const w = doc.internal.pageSize.getWidth();
      const h = doc.internal.pageSize.getHeight();

      // Header
      doc.setFillColor(17, 24, 39);
      doc.rect(0, 0, w, 100, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold").setFontSize(24).text("FinFlow AI", 40, 46);
      doc.setFont("helvetica", "normal").setFontSize(11).text("Home Loan Analysis Report", 40, 68);
      doc.setFontSize(9).text(new Date().toLocaleString(), w - 40, 46, { align: "right" });
      doc.text(`Rates as of ${RATES_LAST_UPDATED}`, w - 40, 62, { align: "right" });
      doc.setTextColor(0, 0, 0);

      let y = 130;
      const section = (title: string) => {
        if (y > h - 100) { doc.addPage(); y = 60; }
        doc.setFont("helvetica", "bold").setFontSize(13).text(title, 40, y);
        y += 8; doc.setDrawColor(220); doc.line(40, y, w - 40, y); y += 16;
        doc.setFont("helvetica", "normal").setFontSize(10);
      };
      const kv = (k: string, v: string) => {
        if (y > h - 60) { doc.addPage(); y = 60; }
        doc.text(k, 40, y); doc.text(v, w - 40, y, { align: "right" }); y += 15;
      };

      section("Applicant summary");
      kv("Location", `${i.city}, ${i.state}, ${COUNTRIES[i.country].name}`);
      kv("Age", `${i.age}`);
      kv("Employment", EMPLOYMENT.find((e) => e.value === i.employmentType)?.label ?? i.employmentType);
      kv("Credit score", `${i.creditScore}`);
      kv("Monthly income", formatMoney(i.monthlyIncome, i.country));
      kv("Co-applicant income", formatMoney(i.coApplicantIncome, i.country));
      kv("Existing EMIs", formatMoney(i.existingEmis, i.country));

      y += 10; section("Property & loan");
      kv("Property type", PROPERTY_TYPES.find((p) => p.value === i.propertyType)?.label ?? i.propertyType);
      kv("Property price", formatMoney(i.propertyPrice, i.country));
      kv("Down payment", formatMoney(i.downPayment, i.country));
      kv("Loan amount", formatMoney(r.loanAmount, i.country));
      kv("LTV", `${r.ltv.toFixed(1)}%`);
      kv("Interest rate", `${i.interestRate}% (${i.rateType})`);
      kv("Tenure", `${i.tenureYears} years`);

      y += 10; section("Loan summary");
      kv("Monthly EMI", formatMoney(r.emi, i.country));
      kv("Total interest", formatMoney(r.totalInterest, i.country));
      kv("Total payable", formatMoney(r.totalPayable, i.country));
      kv("Processing fee", formatMoney(r.processingFee, i.country));
      kv("DTI ratio", `${r.dti.toFixed(1)}%`);
      kv("Affordability score", `${r.affordabilityScore}/100`);
      kv("Max eligible loan", formatMoney(r.maxEligibleLoan, i.country));
      kv("Prepay 10%/mo saves", formatMoney(r.prepaymentSavings, i.country));

      y += 10; section(`Government & country charges (${COUNTRIES[i.country].name})`);
      const ch = r.charges;
      if (ch.stampDuty) kv("Stamp duty", formatMoney(ch.stampDuty, i.country));
      if (ch.registration) kv("Registration", formatMoney(ch.registration, i.country));
      if (ch.gst) kv("GST", formatMoney(ch.gst, i.country));
      if (ch.dld) kv("DLD fees (4%)", formatMoney(ch.dld, i.country));
      if (ch.agencyCommission) kv("Agency commission (2%)", formatMoney(ch.agencyCommission, i.country));
      if (ch.mortgageRegistration) kv("Mortgage registration", formatMoney(ch.mortgageRegistration, i.country));
      if (ch.pmi) kv("Annual PMI", formatMoney(ch.pmi, i.country));
      if (ch.hoa) kv("Annual HOA", formatMoney(ch.hoa, i.country));
      kv("Legal charges", formatMoney(ch.legal, i.country));
      kv("Annual property tax", formatMoney(ch.yearlyPropertyTax, i.country));
      kv("Annual insurance", formatMoney(ch.propertyInsurance, i.country));
      kv("Total upfront", formatMoney(r.totalUpfrontCost, i.country));

      y += 10; section("Bank comparison");
      doc.setFont("helvetica", "bold").setFontSize(9);
      doc.text("Bank", 40, y); doc.text("Rate", 220, y); doc.text("EMI", 300, y);
      doc.text("Total interest", 390, y); doc.text("Eligible", w - 40, y, { align: "right" });
      y += 12; doc.setFont("helvetica", "normal");
      bankRows.forEach((row) => {
        if (y > h - 60) { doc.addPage(); y = 60; }
        doc.text(row.bank.name, 40, y);
        doc.text(`${row.rate.toFixed(2)}%`, 220, y);
        doc.text(formatMoney(row.emi, i.country), 300, y);
        doc.text(formatMoney(row.totalInt, i.country), 390, y);
        doc.text(row.eligible ? "Yes" : "No", w - 40, y, { align: "right" });
        y += 14;
      });

      y += 10; section("Amortization (yearly)");
      doc.setFont("helvetica", "bold").setFontSize(9);
      doc.text("Year", 40, y); doc.text("Principal", 140, y); doc.text("Interest", 280, y); doc.text("Balance", w - 40, y, { align: "right" });
      y += 12; doc.setFont("helvetica", "normal");
      r.amortization.forEach((a) => {
        if (y > h - 80) { doc.addPage(); y = 60; }
        doc.text(String(a.year), 40, y);
        doc.text(formatMoney(a.principal, i.country), 140, y);
        doc.text(formatMoney(a.interest, i.country), 280, y);
        doc.text(formatMoney(a.balance, i.country), w - 40, y, { align: "right" });
        y += 13;
      });

      if (aiAnalysis) {
        doc.addPage(); y = 60;
        section("AI advisor analysis");
        const plain = aiAnalysis.replace(/[#*_`]/g, "");
        const wrapped = doc.splitTextToSize(plain, w - 80);
        doc.setFontSize(10);
        wrapped.forEach((line: string) => {
          if (y > h - 60) { doc.addPage(); y = 60; }
          doc.text(line, 40, y); y += 13;
        });
      }

      // QR code at footer of last page
      try {
        const qrUrl = typeof window !== "undefined" ? window.location.href : "https://finflow.ai";
        const qrData = await QRCode.toDataURL(qrUrl, { margin: 1, width: 128 });
        doc.setPage(doc.getNumberOfPages());
        doc.addImage(qrData, "PNG", w - 100, h - 100, 60, 60);
        doc.setFontSize(8).setTextColor(120).text("Scan to open", w - 100, h - 30);
      } catch { /* qr optional */ }

      doc.setFontSize(8).setTextColor(140);
      const pageCount = doc.getNumberOfPages();
      for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p);
        doc.text(`FinFlow AI  •  Page ${p} of ${pageCount}  •  Not financial advice`, 40, h - 20);
      }

      doc.save(`FinFlow-HomeLoan-${i.city.replace(/\W+/g, "-")}.pdf`);
      toast.success("PDF report downloaded");
    } catch (e) {
      console.error(e);
      toast.error("Could not generate PDF");
    }
  };

  return (
    <CalcShell title="Home Loan Comparison & Affordability" tagline="Multi-step engine with real-time bank comparison and AI insights"
      accent={meta.accent} icon={meta.icon}
      saveType="home-loan" saveInputs={i as unknown as Record<string, unknown>}
      saveResults={{ emi: r.emi, ltv: r.ltv, dti: r.dti, affordabilityScore: r.affordabilityScore }}>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
        {/* LEFT — multi-step form */}
        <div className="rounded-2xl border bg-card/60 p-6 shadow-soft backdrop-blur-xl">
          <StepIndicator step={step} />
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="mt-6 space-y-4">
              {step === 0 && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <InputRow label="State / Emirate">
                      <select value={i.state} onChange={(e) => set("state", e.target.value)} className="h-11 w-full rounded-xl border bg-background px-3 text-sm">
                        {STATES[i.country].map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </InputRow>
                    <InputRow label="City">
                      <select value={i.city} onChange={(e) => set("city", e.target.value)} className="h-11 w-full rounded-xl border bg-background px-3 text-sm">
                        {CITIES[i.country].map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </InputRow>
                  </div>
                  <InputRow label="Property type">
                    <div className="grid grid-cols-3 gap-2">
                      {PROPERTY_TYPES.map((p) => (
                        <button key={p.value} onClick={() => set("propertyType", p.value)}
                          className={`rounded-xl border px-3 py-2 text-xs transition ${i.propertyType === p.value ? "border-primary bg-primary/10 text-primary" : "hover:border-foreground/30"}`}>
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </InputRow>
                  <InputRow label={`Property price (${COUNTRIES[i.country].symbol})`}>
                    <NumberInput value={i.propertyPrice} onChange={(v) => set("propertyPrice", v)} step={10000} />
                  </InputRow>
                  <div className="grid grid-cols-2 gap-3">
                    <InputRow label="Down payment"><NumberInput value={i.downPayment} onChange={(v) => set("downPayment", v)} step={10000} /></InputRow>
                    <InputRow label="Additional costs"><NumberInput value={i.additionalInitialCosts} onChange={(v) => set("additionalInitialCosts", v)} step={1000} /></InputRow>
                  </div>
                  <InputRow label="Area (sq ft, optional)"><NumberInput value={i.areaSqft ?? 0} onChange={(v) => set("areaSqft", v)} step={50} /></InputRow>
                </>
              )}
              {step === 1 && (
                <>
                  <InputRow label="Loan amount (auto)" hint="Calculated from price − down payment">
                    <div className="rounded-xl border bg-muted/30 px-3 py-2.5 font-mono text-base">{formatMoney(r.loanAmount, i.country)}</div>
                  </InputRow>
                  <div className="grid grid-cols-2 gap-3">
                    <InputRow label="Interest rate (%)"><NumberInput value={i.interestRate} onChange={(v) => set("interestRate", v)} step={0.05} /></InputRow>
                    <InputRow label="Tenure (years)"><NumberInput value={i.tenureYears} onChange={(v) => set("tenureYears", v)} step={1} min={1} max={35} /></InputRow>
                  </div>
                  <InputRow label="Rate type">
                    <div className="grid grid-cols-2 gap-2">
                      {(["fixed", "floating"] as RateType[]).map((rt) => (
                        <button key={rt} onClick={() => set("rateType", rt)}
                          className={`rounded-xl border px-3 py-2 text-sm capitalize transition ${i.rateType === rt ? "border-primary bg-primary/10 text-primary" : "hover:border-foreground/30"}`}>
                          {rt}
                        </button>
                      ))}
                    </div>
                  </InputRow>
                  <InputRow label="Existing loans (outstanding)"><NumberInput value={i.existingLoans} onChange={(v) => set("existingLoans", v)} step={10000} /></InputRow>
                  <div className="grid grid-cols-2 gap-3">
                    <InputRow label="Processing fee override" hint="0 = auto"><NumberInput value={i.processingFee} onChange={(v) => set("processingFee", v)} step={1000} /></InputRow>
                    <InputRow label="Insurance cost/yr"><NumberInput value={i.insuranceCost} onChange={(v) => set("insuranceCost", v)} step={1000} /></InputRow>
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <InputRow label="Monthly income"><NumberInput value={i.monthlyIncome} onChange={(v) => set("monthlyIncome", v)} step={5000} /></InputRow>
                    <InputRow label="Co-applicant income"><NumberInput value={i.coApplicantIncome} onChange={(v) => set("coApplicantIncome", v)} step={5000} /></InputRow>
                  </div>
                  <InputRow label="Existing EMIs (per month)"><NumberInput value={i.existingEmis} onChange={(v) => set("existingEmis", v)} step={1000} /></InputRow>
                  <div className="grid grid-cols-2 gap-3">
                    <InputRow label="Credit score"><NumberInput value={i.creditScore} onChange={(v) => set("creditScore", v)} step={5} min={300} max={900} /></InputRow>
                    <InputRow label="Age"><NumberInput value={i.age} onChange={(v) => set("age", v)} step={1} min={18} max={70} /></InputRow>
                  </div>
                  <InputRow label="Employment type">
                    <select value={i.employmentType} onChange={(e) => set("employmentType", e.target.value as EmploymentType)}
                      className="h-11 w-full rounded-xl border bg-background px-3 text-sm">
                      {EMPLOYMENT.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                    </select>
                  </InputRow>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="rounded-full">
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            {step < 2 ? (
              <Button size="sm" onClick={() => setStep((s) => Math.min(2, s + 1))} className="rounded-full">
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" onClick={exportPdf} className="rounded-full">
                <Download className="mr-1 h-4 w-4" /> Download PDF
              </Button>
            )}
          </div>
        </div>

        {/* RIGHT — results */}
        <div className="space-y-4">
          <StatGrid r={r} country={i.country} />
          <ChartsRow r={r} country={i.country} />
          <BankComparison rows={bankRows} country={i.country} bestEmi={bestEmi} bestRate={bestRate} bestValue={bestValue} />
          <ChargesCard r={r} country={i.country} />
          <AiSection onRun={runAI} loading={aiLoading} analysis={aiAnalysis} />
        </div>
      </div>
    </CalcShell>
  );
}

function StepIndicator({ step }: { step: number }) {
  const labels = ["Property", "Loan", "Applicant"];
  return (
    <div className="flex items-center gap-2">
      {labels.map((l, idx) => (
        <div key={l} className="flex flex-1 items-center gap-2">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition ${idx === step ? "border-primary bg-primary text-primary-foreground" : idx < step ? "border-primary/50 bg-primary/20 text-primary" : "text-muted-foreground"}`}>
            {idx < step ? <Check className="h-4 w-4" /> : idx + 1}
          </div>
          <div className="text-xs font-medium">{l}</div>
          {idx < labels.length - 1 && <div className={`h-px flex-1 ${idx < step ? "bg-primary/50" : "bg-border"}`} />}
        </div>
      ))}
    </div>
  );
}

function StatGrid({ r, country }: { r: ReturnType<typeof computeHomeLoan>; country: "IN" | "US" | "AE" }) {
  const scoreTone: "success" | "warning" | "destructive" = r.affordabilityScore >= 75 ? "success" : r.affordabilityScore >= 50 ? "warning" : "destructive";
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Monthly EMI" value={formatMoney(r.emi, country)} tone="primary" />
      <StatCard label="LTV" value={`${r.ltv.toFixed(1)}%`} sub={r.ltv > 90 ? "high" : "ok"} />
      <StatCard label="DTI" value={`${r.dti.toFixed(1)}%`} sub={r.dti > 45 ? "high" : "healthy"} tone={r.dti > 45 ? "warning" : undefined} />
      <StatCard label="Affordability" value={`${r.affordabilityScore}/100`} tone={scoreTone} />
      <StatCard label="Total interest" value={formatMoney(r.totalInterest, country)} tone="warning" />
      <StatCard label="Total payable" value={formatMoney(r.totalPayable, country)} />
      <StatCard label="Upfront cost" value={formatMoney(r.totalUpfrontCost, country)} />
      <StatCard label="Max eligible loan" value={formatMoney(r.maxEligibleLoan, country)} tone="success" />
    </div>
  );
}

const CHART_TOOLTIP = { background: "oklch(0.14 0.014 260)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8 };

function ChartsRow({ r, country }: { r: ReturnType<typeof computeHomeLoan>; country: "IN" | "US" | "AE" }) {
  const pieData = [
    { name: "Principal", value: r.loanAmount, color: "oklch(0.72 0.18 262)" },
    { name: "Interest", value: r.totalInterest, color: "oklch(0.7 0.22 320)" },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border bg-card/60 p-5 shadow-soft backdrop-blur-xl">
        <div className="text-sm font-medium">Principal vs Interest</div>
        <div className="mt-2 h-56">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={82} paddingAngle={4}>
                {pieData.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={(v: number) => formatMoney(v, country)} contentStyle={CHART_TOOLTIP} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-2xl border bg-card/60 p-5 shadow-soft backdrop-blur-xl">
        <div className="text-sm font-medium">Outstanding balance by year</div>
        <div className="mt-2 h-56">
          <ResponsiveContainer>
            <AreaChart data={r.amortization}>
              <defs>
                <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.72 0.18 262)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="oklch(0.72 0.18 262)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
              <XAxis dataKey="year" fontSize={11} stroke="oklch(0.65 0.02 260)" />
              <YAxis fontSize={11} stroke="oklch(0.65 0.02 260)" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatMoney(v, country)} contentStyle={CHART_TOOLTIP} />
              <Area type="monotone" dataKey="balance" stroke="oklch(0.72 0.18 262)" fill="url(#balGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-2xl border bg-card/60 p-5 shadow-soft backdrop-blur-xl md:col-span-2">
        <div className="text-sm font-medium">Yearly principal vs interest</div>
        <div className="mt-2 h-64">
          <ResponsiveContainer>
            <BarChart data={r.amortization}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
              <XAxis dataKey="year" fontSize={11} stroke="oklch(0.65 0.02 260)" />
              <YAxis fontSize={11} stroke="oklch(0.65 0.02 260)" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatMoney(v, country)} contentStyle={CHART_TOOLTIP} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="principal" stackId="a" fill="oklch(0.72 0.18 262)" />
              <Bar dataKey="interest" stackId="a" fill="oklch(0.7 0.22 320)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

type BankRow = { bank: Bank; rate: number; emi: number; totalInt: number; totalPayable: number; eligible: boolean; fee: number };

function BankComparison({ rows, country, bestEmi, bestRate, bestValue }: {
  rows: BankRow[]; country: "IN" | "US" | "AE"; bestEmi?: BankRow; bestRate?: BankRow; bestValue?: BankRow;
}) {
  return (
    <div className="rounded-2xl border bg-card/60 p-6 shadow-soft backdrop-blur-xl">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <div className="font-display text-lg font-semibold">Bank comparison</div>
          <div className="text-xs text-muted-foreground">Rates updated {RATES_LAST_UPDATED}. Illustrative — confirm with the bank.</div>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {rows.map((row) => {
          const badges: { icon: React.ReactNode; label: string; tone: string }[] = [];
          if (bestRate && row.bank.id === bestRate.bank.id) badges.push({ icon: <Zap className="h-3 w-3" />, label: "Lowest rate", tone: "bg-emerald-500/15 text-emerald-500" });
          if (bestEmi && row.bank.id === bestEmi.bank.id) badges.push({ icon: <Trophy className="h-3 w-3" />, label: "Lowest EMI", tone: "bg-amber-500/15 text-amber-500" });
          if (bestValue && row.bank.id === bestValue.bank.id) badges.push({ icon: <ShieldCheck className="h-3 w-3" />, label: "Best value", tone: "bg-primary/15 text-primary" });
          return (
            <motion.div key={row.bank.id} whileHover={{ y: -2 }} className="rounded-2xl border bg-background/60 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <div
                    className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border bg-white shadow-sm"
                    style={{ boxShadow: `inset 0 0 0 1px ${row.bank.color}22` }}
                  >
                    <img
                      src={bankLogoUrl(row.bank)}
                      alt={`${row.bank.name} logo`}
                      loading="lazy"
                      onError={(e) => {
                        const t = e.currentTarget;
                        t.style.display = "none";
                        (t.nextElementSibling as HTMLElement | null)?.style.setProperty("display", "grid");
                      }}
                      className="h-full w-full object-contain p-1"
                    />
                    <span
                      className="hidden h-full w-full place-items-center text-lg"
                      style={{ background: row.bank.color, color: "#fff" }}
                      aria-hidden
                    >
                      {row.bank.name.slice(0, 1)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{row.bank.name}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{COUNTRIES[row.bank.country].name}</div>
                  </div>
                </div>
                <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${row.eligible ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500"}`}>
                  {row.eligible ? <><Check className="h-3 w-3" /> Eligible</> : <><X className="h-3 w-3" /> Not eligible</>}
                </span>
              </div>
              {badges.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {badges.map((b, idx) => (
                    <span key={idx} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${b.tone}`}>
                      {b.icon}{b.label}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <Kv k="Rate" v={`${row.rate.toFixed(2)}%`} />
                {row.bank.apr && <Kv k="APR" v={`${row.bank.apr}%`} />}
                <Kv k="EMI" v={formatMoney(row.emi, country)} />
                <Kv k="Processing" v={formatMoney(row.fee, country)} />
                <Kv k="Max tenure" v={`${row.bank.maxTenureYears}y`} />
                <Kv k="Max LTV" v={`${row.bank.maxLtv}%`} />
                <Kv k="Total interest" v={formatMoney(row.totalInt, country)} />
                <Kv k="Total payable" v={formatMoney(row.totalPayable, country)} />
              </div>
              <div className="mt-3 flex gap-2">
                <a href={row.bank.website} target="_blank" rel="noreferrer" className="flex-1">
                  <Button size="sm" variant="outline" className="w-full rounded-lg text-xs">
                    Apply <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                </a>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function Kv({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 min-w-0">
      <span className="shrink-0 text-muted-foreground">{k}</span>
      <span className="min-w-0 truncate text-right font-mono font-medium tabular-nums">{v}</span>
    </div>
  );
}

function ChargesCard({ r, country }: { r: ReturnType<typeof computeHomeLoan>; country: "IN" | "US" | "AE" }) {
  const ch = r.charges;
  const rows: [string, number][] = [];
  if (country === "IN") {
    rows.push(["Stamp duty (~6%)", ch.stampDuty], ["Registration (1%)", ch.registration]);
    if (ch.gst) rows.push(["GST (5%, under-construction)", ch.gst]);
    rows.push(["Legal charges", ch.legal], ["Annual property tax", ch.yearlyPropertyTax], ["Annual insurance", ch.propertyInsurance]);
  } else if (country === "US") {
    rows.push(["Closing costs (~1.1%)", ch.stampDuty], ["Recording fees", ch.registration], ["Legal", ch.legal],
      ["Annual property tax", ch.yearlyPropertyTax], ["Annual homeowners insurance", ch.propertyInsurance],
      ["Annual HOA", ch.hoa]);
    if (ch.pmi) rows.push(["Annual PMI", ch.pmi]);
  } else {
    rows.push(["DLD fees (4%)", ch.dld], ["Registration", ch.registration], ["Agency commission (2%)", ch.agencyCommission],
      ["Mortgage registration", ch.mortgageRegistration], ["Legal", ch.legal], ["Annual insurance", ch.propertyInsurance]);
  }
  return (
    <div className="rounded-2xl border bg-card/60 p-6 shadow-soft backdrop-blur-xl">
      <div className="font-display text-lg font-semibold">Country-specific charges — {COUNTRIES[country].name}</div>
      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between rounded-lg bg-muted/30 px-3 py-2">
            <span className="text-muted-foreground">{k}</span>
            <span className="font-mono font-medium">{formatMoney(v, country)}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-2 text-sm">
        <div className="flex justify-between border-t pt-3">
          <span className="font-medium">Total upfront cost</span>
          <span className="font-mono font-semibold text-primary">{formatMoney(r.totalUpfrontCost, country)}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Total cost of ownership ({r.amortization.length}y)</span>
          <span className="font-mono font-semibold">{formatMoney(r.totalCostOfOwnership, country)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Prepay 10% of EMI monthly → save</span>
          <span className="font-mono font-medium text-emerald-500">{formatMoney(r.prepaymentSavings, country)}</span>
        </div>
      </div>
    </div>
  );
}

function AiSection({ onRun, loading, analysis }: { onRun: () => void; loading: boolean; analysis: string }) {
  return (
    <div className="rounded-2xl border bg-gradient-to-br from-primary/5 via-card/60 to-card/60 p-6 shadow-soft backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="font-display text-lg font-semibold">AI advisor</div>
            <div className="text-xs text-muted-foreground">Powered by Groq · llama-3.3-70b</div>
          </div>
        </div>
        <Button size="sm" onClick={onRun} disabled={loading} className="rounded-full">
          {loading ? "Analyzing…" : analysis ? "Re-run" : "Run analysis"}
        </Button>
      </div>
      {analysis ? (
        <div className="prose prose-sm mt-4 max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: mdLite(analysis) }} />
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Get a personalized affordability review, risks, and specific actions to reduce interest.</p>
      )}
    </div>
  );
}

// Minimal safe markdown → HTML for headings/bold/lists
function mdLite(src: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = esc(src).split("\n");
  const out: string[] = [];
  let inList = false;
  for (const raw of lines) {
    const line = raw.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    if (/^### /.test(line)) { if (inList) { out.push("</ul>"); inList = false; } out.push(`<h3>${line.slice(4)}</h3>`); }
    else if (/^## /.test(line)) { if (inList) { out.push("</ul>"); inList = false; } out.push(`<h2>${line.slice(3)}</h2>`); }
    else if (/^-\s+/.test(line)) { if (!inList) { out.push("<ul>"); inList = true; } out.push(`<li>${line.replace(/^-\s+/, "")}</li>`); }
    else if (line.trim() === "") { if (inList) { out.push("</ul>"); inList = false; } }
    else { if (inList) { out.push("</ul>"); inList = false; } out.push(`<p>${line}</p>`); }
  }
  if (inList) out.push("</ul>");
  return out.join("");
}
