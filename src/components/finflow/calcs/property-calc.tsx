import { useMemo, useState } from "react";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { propertyBreakdown } from "@/lib/finflow/calculators";
import { formatMoney, COUNTRIES } from "@/lib/finflow/countries";
import { useCountry } from "@/lib/finflow/country-store";
import { CalcShell, InputRow, NumberInput, StatCard } from "../calc-shell";
import { CALC_BY_SLUG } from "@/lib/finflow/registry";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { createPdfCtx, pdfHeader, pdfSection, pdfKv, pdfFooter, pdfMoney, loadFinflowLogoPng } from "@/lib/finflow/pdf";
import type { AnalysisPayload } from "@/lib/finflow/analysis/types";

const CITIES: Record<string, string[]> = {
  IN: ["Mumbai", "Delhi", "Bengaluru", "Pune", "Hyderabad", "Chennai", "Kolkata"],
  US: ["New York, NY", "San Francisco, CA", "Austin, TX", "Seattle, WA", "Miami, FL"],
  AE: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman"],
};

export function PropertyCalc() {
  const meta = CALC_BY_SLUG["property"];
  const [country] = useCountry();
  const [price, setPrice] = useState(country === "US" ? 500_000 : country === "AE" ? 1_500_000 : 15_000_000);
  const [down, setDown] = useState(country === "US" ? 100_000 : country === "AE" ? 300_000 : 3_000_000);
  const [rate, setRate] = useState(country === "US" ? 6.8 : country === "AE" ? 4.5 : 8.5);
  const [years, setYears] = useState(country === "US" ? 30 : 20);
  const [city, setCity] = useState(CITIES[country][0]);

  const r = useMemo(() => propertyBreakdown({ price, downPayment: down, annualRate: rate, years, country }), [price, down, rate, years, country]);

  const pie = [
    { name: "Down payment", value: down, color: "oklch(0.72 0.18 262)" },
    { name: "Loan payments", value: r.totalPayments, color: "oklch(0.7 0.18 190)" },
    { name: "Stamp duty + reg", value: r.stampDuty + r.registration + r.gst, color: "oklch(0.7 0.22 320)" },
    { name: "Insurance", value: r.insurance, color: "oklch(0.75 0.15 75)" },
    { name: "Property tax", value: r.propertyTax, color: "oklch(0.7 0.16 155)" },
  ].filter((p) => p.value > 0);

  const exportPdf = async () => {
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const ctx = createPdfCtx(doc);
      const c = COUNTRIES[country];
      const logo = await loadFinflowLogoPng();
      pdfHeader(ctx, "Property Cost Breakdown Report", undefined, logo);

      pdfSection(ctx, "Property details");
      pdfKv(ctx, "Location", `${city}, ${c.name}`);
      pdfKv(ctx, "Property price", pdfMoney(price, country));
      pdfKv(ctx, "Down payment", pdfMoney(down, country));
      pdfKv(ctx, "Loan amount", pdfMoney(r.loan, country));
      pdfKv(ctx, "Interest rate", `${rate}% p.a.`);
      pdfKv(ctx, "Tenure", `${years} years`);

      ctx.y += 10;
      pdfSection(ctx, "Monthly & interest");
      pdfKv(ctx, "Monthly EMI", pdfMoney(r.emi, country));
      pdfKv(ctx, "Total interest paid", pdfMoney(r.totalInterest, country));
      pdfKv(ctx, "Total loan payments", pdfMoney(r.totalPayments, country));

      ctx.y += 10;
      pdfSection(ctx, "Charges & taxes");
      pdfKv(ctx, "Stamp duty", pdfMoney(r.stampDuty, country));
      pdfKv(ctx, "Registration", pdfMoney(r.registration, country));
      pdfKv(ctx, "GST / VAT", pdfMoney(r.gst, country));
      pdfKv(ctx, `Insurance (${years} yrs)`, pdfMoney(r.insurance, country));
      pdfKv(ctx, `Property tax (${years} yrs)`, pdfMoney(r.propertyTax, country));

      ctx.y += 20;
      doc.setDrawColor(200).line(ctx.margin, ctx.y, ctx.w - ctx.margin, ctx.y);
      ctx.y += 22;
      doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(20, 22, 34);
      doc.text("Total cost of ownership", ctx.margin, ctx.y);
      doc.text(pdfMoney(r.totalCost, country), ctx.w - ctx.margin, ctx.y, { align: "right" });

      pdfFooter(ctx, "Estimates only - consult a licensed advisor.");
      doc.save(`Calculyx-Property-${city.replace(/\W+/g, "-")}.pdf`);
      toast.success("PDF report downloaded");
    } catch (e) {
      toast.error("Could not generate PDF");
      console.error(e);
    }
  };

  const payload: AnalysisPayload = useMemo(() => ({
    slug: "property",
    country,
    title: "Property cost analysis",
    subtitle: `${city}, ${COUNTRIES[country].name}`,
    inputs: [
      { label: "Location", value: `${city}, ${COUNTRIES[country].name}` },
      { label: "Property price", value: formatMoney(price, country) },
      { label: "Down payment", value: formatMoney(down, country) },
      { label: "Loan amount", value: formatMoney(r.loan, country) },
      { label: "Interest rate", value: `${rate}% p.a.` },
      { label: "Tenure", value: `${years} years` },
    ],
    kpis: [
      { label: "Monthly EMI", value: formatMoney(r.emi, country), tone: "primary" },
      { label: "Total interest", value: formatMoney(r.totalInterest, country), tone: "warning" },
      { label: "Charges & taxes", value: formatMoney(r.stampDuty + r.registration + r.gst + r.insurance + r.propertyTax, country), tone: "neutral" },
      { label: "Total ownership cost", value: formatMoney(r.totalCost, country), tone: "destructive" },
    ],
    breakdown: {
      columns: [
        { key: "item", label: "Item" },
        { key: "amount", label: "Amount", align: "right" },
      ],
      rows: [
        { item: "Loan principal", amount: formatMoney(r.loan, country) },
        { item: "Down payment", amount: formatMoney(down, country) },
        { item: "Stamp duty", amount: formatMoney(r.stampDuty, country) },
        { item: "Registration", amount: formatMoney(r.registration, country) },
        { item: "GST / VAT", amount: formatMoney(r.gst, country) },
        { item: `Insurance (${years}y)`, amount: formatMoney(r.insurance, country) },
        { item: `Property tax (${years}y)`, amount: formatMoney(r.propertyTax, country) },
        { item: "Total loan payments", amount: formatMoney(r.totalPayments, country) },
        { item: "Total ownership cost", amount: formatMoney(r.totalCost, country) },
      ],
    },
    assumptions: [
      `Fixed ${rate}% interest rate across the ${years}-year tenure.`,
      "Stamp duty, registration and GST/VAT modeled per country baseline; actual rates vary by state/emirate and project.",
      "Insurance and property tax approximated as flat annual charges.",
      "Excludes maintenance, brokerage, HOA/community fees, and resale value.",
    ],
    raw: {
      inputs: { price, down, rate, years, city, country },
      results: { emi: r.emi, totalCost: r.totalCost, totalInterest: r.totalInterest, loan: r.loan },
    },
    aiBrief: `Property ${formatMoney(price, country)} in ${city} (${COUNTRIES[country].name}), ${formatMoney(down, country)} down, ${formatMoney(r.loan, country)} loan @ ${rate}% for ${years}y. EMI ${formatMoney(r.emi, country)}, total cost ${formatMoney(r.totalCost, country)}.`,
  }), [country, city, price, down, rate, years, r]);

  return (
    <CalcShell title={meta.name} tagline={meta.tagline} accent={meta.accent} icon={meta.icon}
      saveType="property" analysisPayload={payload}>
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <div className="space-y-5 rounded-2xl border bg-card p-6 shadow-soft">
          <InputRow label={`Property price (${COUNTRIES[country].symbol})`}><NumberInput value={price} onChange={setPrice} step={10000} /></InputRow>
          <InputRow label="Down payment"><NumberInput value={down} onChange={setDown} step={10000} /></InputRow>
          <InputRow label="Interest rate (% p.a.)"><NumberInput value={rate} onChange={setRate} step={0.1} /></InputRow>
          <InputRow label="Tenure (years)"><NumberInput value={years} onChange={setYears} step={1} min={1} max={40} /></InputRow>
          <InputRow label="City">
            <select value={city} onChange={(e) => setCity(e.target.value)} className="h-11 w-full rounded-xl border bg-background px-3">
              {CITIES[country].map((c) => <option key={c}>{c}</option>)}
            </select>
          </InputRow>
          <Button onClick={exportPdf} className="w-full rounded-xl">
            <Download className="mr-2 h-4 w-4" /> Export professional PDF report
          </Button>
        </div>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Monthly EMI" value={formatMoney(r.emi, country)} tone="primary" />
            <StatCard label="Total interest" value={formatMoney(r.totalInterest, country)} tone="warning" />
            <StatCard label="Total ownership cost" value={formatMoney(r.totalCost, country)} tone="destructive" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border bg-card p-6 shadow-soft">
              <div className="text-sm font-medium">Cost composition</div>
              <div className="mt-2 h-64">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={95} paddingAngle={3}>
                      {pie.map((d) => <Cell key={d.name} fill={d.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatMoney(v, country)} contentStyle={{ background: "oklch(0.14 0.014 260)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                {pie.map((p) => (
                  <span key={p.name} className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />{p.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border bg-card p-6 shadow-soft space-y-2 text-sm">
              <div className="font-medium">Full charges breakdown</div>
              <Row k="Loan principal" v={formatMoney(r.loan, country)} />
              <Row k="Down payment" v={formatMoney(down, country)} />
              <Row k="Stamp duty" v={formatMoney(r.stampDuty, country)} />
              <Row k="Registration" v={formatMoney(r.registration, country)} />
              <Row k="GST / VAT" v={formatMoney(r.gst, country)} />
              <Row k={`Insurance (${years}y)`} v={formatMoney(r.insurance, country)} />
              <Row k={`Property tax (${years}y)`} v={formatMoney(r.propertyTax, country)} />
              <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                <span>Total ownership cost</span><span>{formatMoney(r.totalCost, country)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CalcShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between text-muted-foreground"><span>{k}</span><span className="font-mono text-foreground">{v}</span></div>;
}
