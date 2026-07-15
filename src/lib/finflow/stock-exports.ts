// Stock-page and 15-calculator export helpers.
// - exportStockPdf / exportStockXlsx: live-data report for a single stock.
// - runAll15 + exportAll15Pdf / exportAll15Xlsx: computes every investing
//   calculator with sane defaults sourced from the stock, and emits a
//   polished PDF and multi-sheet workbook.

import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import {
  sip, lumpsum, cagr, dividend, calcBrokerage, stockAverage,
  positionSize, profitLoss, compareAssets, fire, goalPlanner,
  portfolioAllocation, rebalance, swp, dca,
} from "@/lib/finflow/investing-calcs";
import type { StockDetail, Candle, NewsItem, AnalystRating, EarningsRow } from "@/lib/finflow/stock-detail.functions";

function fmtMoney(v: number, currency: string): string {
  if (!Number.isFinite(v)) return "—";
  if (currency === "INR") return `₹${Math.round(v).toLocaleString("en-IN")}`;
  return `$${Math.round(v).toLocaleString("en-US")}`;
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

// ============================= STOCK DATA EXPORTS =============================

export type StockExportBundle = {
  detail: StockDetail;
  candles?: Candle[];
  news?: NewsItem[];
  analyst?: AnalystRating[];
  earnings?: EarningsRow[];
};

export function exportStockXlsx(b: StockExportBundle): void {
  const d = b.detail;
  const wb = XLSX.utils.book_new();

  const overview = XLSX.utils.aoa_to_sheet([
    ["Calculyx AI — Stock report"],
    [d.name, d.symbol],
    ["Generated", new Date().toISOString()],
    [],
    ["Metric", "Value"],
    ["Region", d.region],
    ["Sector", d.sector],
    ["Currency", d.currency],
    ["Price", d.price],
    ["Change", d.change],
    ["Change %", d.changePercent],
    ["Open", d.open],
    ["Previous close", d.prevClose],
    ["Day high", d.high],
    ["Day low", d.low],
    ["52-week high", d.weekHigh52 ?? ""],
    ["52-week low", d.weekLow52 ?? ""],
    ["Market cap", d.marketCap ?? ""],
    ["P/E", d.pe ?? ""],
    ["P/B", d.pb ?? ""],
    ["EPS", d.eps ?? ""],
    ["Dividend yield %", d.divYield ?? ""],
    ["Beta", d.beta ?? ""],
    ["ROE %", d.roe ?? ""],
    ["ROCE %", d.roce ?? ""],
    ["Debt/Equity", d.debtToEquity ?? ""],
    ["Revenue growth %", d.revenueGrowth ?? ""],
    ["Profit growth %", d.profitGrowth ?? ""],
    ["Health score (0-100)", d.healthScore],
    [],
    ["Health notes"],
    ...d.healthNotes.map((n) => [n]),
    [],
    ["Disclaimer"],
    ["Data may be delayed. Estimates only, not financial advice."],
  ]);
  overview["!cols"] = [{ wch: 30 }, { wch: 32 }];
  XLSX.utils.book_append_sheet(wb, overview, "Overview");

  if (b.candles?.length) {
    const rows = [["Date", "Close", "Open", "High", "Low"] as (string | number)[]];
    b.candles.forEach((c) => rows.push([new Date(c.t).toISOString().slice(0, 10), c.c, c.o ?? "", c.h ?? "", c.l ?? ""]));
    const s = XLSX.utils.aoa_to_sheet(rows);
    s["!cols"] = [{ wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, s, "Price history");
  }
  if (b.news?.length) {
    const rows = [["Date", "Source", "Headline", "URL"] as string[]];
    b.news.forEach((n) => rows.push([new Date(n.ts).toISOString().slice(0, 10), n.source, n.headline, n.url]));
    const s = XLSX.utils.aoa_to_sheet(rows);
    s["!cols"] = [{ wch: 12 }, { wch: 16 }, { wch: 60 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, s, "News");
  }
  if (b.analyst?.length) {
    const rows = [["Period", "Strong Buy", "Buy", "Hold", "Sell", "Strong Sell"] as (string | number)[]];
    b.analyst.forEach((r) => rows.push([r.period, r.strongBuy, r.buy, r.hold, r.sell, r.strongSell]));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "Analyst ratings");
  }
  if (b.earnings?.length) {
    const rows = [["Period", "Estimate", "Actual", "Surprise"] as (string | number)[]];
    b.earnings.forEach((r) => rows.push([r.period, r.estimate ?? "", r.actual ?? "", r.surprise ?? ""]));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "Earnings");
  }

  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  download(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${d.symbol}_stock_report.xlsx`);
}

export function exportStockPdf(b: StockExportBundle): void {
  const d = b.detail;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;
  const ensure = (need: number) => { if (y + need > H - margin) { doc.addPage(); y = margin; } };
  const line = (h = 14) => { y += h; };

  // Header
  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(120);
  doc.text("CALCULYX AI · STOCK REPORT", margin, y); line(6);
  doc.setDrawColor(220).line(margin, y, W - margin, y); line(18);
  doc.setFont("helvetica", "bold").setFontSize(20).setTextColor(20);
  doc.text(d.name, margin, y); line(24);
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(90);
  doc.text(`${d.symbol}  ·  ${d.region === "IN" ? "🇮🇳 NSE" : "🇺🇸 US"}  ·  ${d.sector}`.replace(/🇮🇳|🇺🇸/g, ""), margin, y); line(16);
  doc.setFont("helvetica", "bold").setFontSize(24).setTextColor(20);
  doc.text(fmtMoney(d.price, d.currency), margin, y);
  doc.setFontSize(11).setTextColor(d.change >= 0 ? 32 : 200, d.change >= 0 ? 140 : 40, 60);
  doc.text(`  ${d.change >= 0 ? "▲" : "▼"} ${d.changePercent.toFixed(2)}%`, margin + 120, y);
  line(24);

  // Quick stats grid
  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(20); doc.text("Quick stats", margin, y); line(14);
  const stats: Array<[string, string]> = [
    ["Open", fmtMoney(d.open, d.currency)],
    ["Prev close", fmtMoney(d.prevClose, d.currency)],
    ["Day high", fmtMoney(d.high, d.currency)],
    ["Day low", fmtMoney(d.low, d.currency)],
    ["52w high", d.weekHigh52 != null ? fmtMoney(d.weekHigh52, d.currency) : "—"],
    ["52w low", d.weekLow52 != null ? fmtMoney(d.weekLow52, d.currency) : "—"],
    ["P/E", d.pe ? d.pe.toFixed(1) : "—"],
    ["Market cap", d.marketCap ? fmtMoney(d.marketCap, d.currency) : "—"],
    ["ROE %", d.roe != null ? d.roe.toFixed(1) : "—"],
    ["D/E", d.debtToEquity != null ? d.debtToEquity.toFixed(2) : "—"],
    ["Div yield %", d.divYield != null ? d.divYield.toFixed(2) : "—"],
    ["Beta", d.beta != null ? d.beta.toFixed(2) : "—"],
  ];
  const cardW = (W - margin * 2 - 8 * 3) / 4;
  stats.forEach((s, i) => {
    const col = i % 4;
    if (col === 0) ensure(46);
    const x = margin + col * (cardW + 8);
    doc.setDrawColor(230).setFillColor(248, 250, 252).roundedRect(x, y, cardW, 40, 5, 5, "FD");
    doc.setFont("helvetica", "normal").setFontSize(7).setTextColor(120);
    doc.text(s[0].toUpperCase(), x + 8, y + 12);
    doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(20);
    doc.text(s[1], x + 8, y + 28);
    if (col === 3 || i === stats.length - 1) y += 46;
  });
  line(6);

  // Health
  ensure(50);
  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(20); doc.text(`Financial health · ${d.healthScore}/100`, margin, y); line(14);
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(50);
  d.healthNotes.slice(0, 6).forEach((n) => { ensure(14); doc.text(`• ${n}`, margin + 8, y); line(13); });

  // News
  if (b.news?.length) {
    line(4); ensure(30);
    doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(20); doc.text("Latest news", margin, y); line(14);
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(50);
    b.news.slice(0, 8).forEach((n) => {
      const wrapped = doc.splitTextToSize(`• ${n.headline}`, W - margin * 2 - 8) as string[];
      ensure(wrapped.length * 12 + 4);
      doc.text(wrapped, margin + 8, y); y += wrapped.length * 12;
      doc.setTextColor(140).setFontSize(8);
      doc.text(`   ${n.source} · ${new Date(n.ts).toLocaleDateString()}`, margin + 8, y);
      doc.setTextColor(50).setFontSize(9);
      line(12);
    });
  }

  // Earnings
  if (b.earnings?.length) {
    line(6); ensure(60);
    doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(20); doc.text("Earnings history", margin, y); line(14);
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(50);
    b.earnings.forEach((e) => {
      ensure(13);
      doc.text(`${e.period}   Est ${e.estimate ?? "—"} → Act ${e.actual ?? "—"}   Surprise ${e.surprise ?? "—"}`, margin + 8, y);
      line(13);
    });
  }

  // Footer
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "italic").setFontSize(8).setTextColor(140);
    doc.text("Calculyx AI · Estimates only, not financial advice. Data may be delayed.", margin, H - 20);
    doc.text(`Page ${i} / ${pages}`, W - margin - 50, H - 20);
  }

  doc.save(`${d.symbol}_stock_report.pdf`);
}

// ============================= RUN ALL 15 =============================

export type Calc15Meta = {
  symbol: string;
  name: string;
  currency: string;
  price: number;
  assumedReturn: number;
  divYield?: number;
  isIndian: boolean;
};

export type Calc15Bundle = {
  meta: Calc15Meta;
  sip: ReturnType<typeof sip>;
  lumpsum: ReturnType<typeof lumpsum>;
  cagr: ReturnType<typeof cagr>;
  dividend: ReturnType<typeof dividend>;
  brokerage: ReturnType<typeof calcBrokerage>;
  average: ReturnType<typeof stockAverage>;
  position: ReturnType<typeof positionSize>;
  pl: ReturnType<typeof profitLoss>;
  compare: ReturnType<typeof compareAssets>;
  fire: ReturnType<typeof fire>;
  goal: ReturnType<typeof goalPlanner>;
  allocator: ReturnType<typeof portfolioAllocation>;
  rebalance: ReturnType<typeof rebalance>;
  swp: ReturnType<typeof swp>;
  dca: ReturnType<typeof dca>;
};

export function runAll15(meta: Calc15Meta): Calc15Bundle {
  const bigAmount = meta.currency === "INR" ? 100_000 : 10_000;
  const monthly = meta.currency === "INR" ? 5_000 : 500;
  const portfolio = meta.currency === "INR" ? 1_000_000 : 100_000;
  const dps = meta.divYield ? (meta.price * meta.divYield) / 100 : meta.currency === "INR" ? 15 : 1;
  const buy = meta.price;
  const sellUp = meta.price * 1.15;

  return {
    meta,
    sip: sip({ monthly, rate: meta.assumedReturn, years: 10 }),
    lumpsum: lumpsum({ principal: bigAmount, rate: meta.assumedReturn, years: 10 }),
    cagr: cagr({ start: buy * 0.5, end: buy, years: 5 }),
    dividend: dividend({ shares: 100, dps, priceForYield: meta.price }),
    brokerage: calcBrokerage({
      broker: meta.isIndian ? "zerodha" : "robinhood",
      buyPrice: buy, sellPrice: sellUp, qty: 50,
      tradeType: "delivery", market: meta.isIndian ? "IN" : "US",
    }),
    average: stockAverage([{ qty: 10, price: buy * 1.1 }, { qty: 20, price: buy * 0.95 }]),
    position: positionSize({ portfolio, riskPct: 2, stopLossPct: 5, entryPrice: buy }),
    pl: profitLoss({ buy, sell: sellUp, qty: 50, taxRate: meta.isIndian ? 12.5 : 15 }),
    compare: compareAssets({ amount: bigAmount, years: 10, stockCagr: meta.assumedReturn }),
    fire: fire({ annualExpense: meta.currency === "INR" ? 600_000 : 40_000, withdrawalRate: 4 }),
    goal: goalPlanner({ target: meta.currency === "INR" ? 20_000_000 : 500_000, years: 15, rate: meta.assumedReturn }),
    allocator: portfolioAllocation({ age: 30, risk: "balanced" }),
    rebalance: rebalance(
      { Equity: 70, Bonds: 15, Gold: 10, Cash: 5 },
      { Equity: 60, Bonds: 25, Gold: 10, Cash: 5 },
      portfolio,
    ),
    swp: swp({ corpus: portfolio * 10, monthly: monthly * 10, rate: 9 }),
    dca: dca([
      { amount: monthly, price: buy * 1.1 },
      { amount: monthly, price: buy * 0.95 },
      { amount: monthly, price: buy },
    ]),
  };
}

export function exportAll15Xlsx(b: Calc15Bundle): void {
  const wb = XLSX.utils.book_new();
  const m = b.meta;
  const fm = (v: number) => fmtMoney(v, m.currency);

  const summary = XLSX.utils.aoa_to_sheet([
    ["Calculyx AI — 15 investing calculators"],
    [`${m.name} (${m.symbol})`],
    ["Generated", new Date().toISOString()],
    ["Assumed return %", m.assumedReturn],
    ["Live price", m.price],
    [],
    ["Calculator", "Headline result"],
    ["SIP (₹" + Math.round(b.sip.invested / (10 * 12)) + "/mo × 10y)", fm(b.sip.futureValue)],
    ["Lumpsum (10y)", fm(b.lumpsum.futureValue)],
    ["CAGR (5y sample)", `${b.cagr.cagr.toFixed(2)}%`],
    ["Dividend (100 shares)", `${fm(b.dividend.annual)} / yr · ${b.dividend.yieldPct.toFixed(2)}%`],
    ["Brokerage (50 qty)", `${fm(b.brokerage.totalCharges)} charges · net ${fm(b.brokerage.netPL)}`],
    ["Stock Average", fm(b.average.avg)],
    ["Position Size (2% risk)", `${b.position.qty} shares`],
    ["Profit / Loss", `Net ${fm(b.pl.net)} · ROI ${b.pl.roi.toFixed(2)}%`],
    ["Compare (10y)", `Stock ${fm(b.compare.stock)} · FD ${fm(b.compare.fd)}`],
    ["FIRE number", fm(b.fire.fireNumber)],
    ["Goal — SIP needed", `${fm(b.goal.sipMonthly)}/mo`],
    ["Portfolio Allocator", `IN ${b.allocator.india}% · US ${b.allocator.us}% · Gold ${b.allocator.gold}%`],
    ["Rebalance actions", b.rebalance.map((r) => `${r.asset}: ${r.action}`).join(", ")],
    ["SWP", b.swp.exhausted ? `Lasts ${b.swp.years.toFixed(1)} yrs` : "Never exhausts"],
    ["DCA average", fm(b.dca.avg)],
    [],
    ["Disclaimer"],
    ["Estimates only. Verify with your bank/advisor before investing."],
  ]);
  summary["!cols"] = [{ wch: 32 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, summary, "Summary");

  // Individual sheets, one per calc
  const addKv = (name: string, kv: Array<[string, string | number]>) => {
    const s = XLSX.utils.aoa_to_sheet([["Metric", "Value"], ...kv]);
    s["!cols"] = [{ wch: 26 }, { wch: 26 }];
    XLSX.utils.book_append_sheet(wb, s, name);
  };

  addKv("SIP", [
    ["Monthly", 5000], ["Years", 10], ["Rate %", m.assumedReturn],
    ["Invested", b.sip.invested], ["Future value", b.sip.futureValue], ["Gains", b.sip.gains],
  ]);
  addKv("Lumpsum", [
    ["Amount", b.lumpsum.invested], ["Years", 10], ["Rate %", m.assumedReturn],
    ["Future value", b.lumpsum.futureValue], ["Gains", b.lumpsum.gains],
  ]);
  addKv("CAGR", [["CAGR %", b.cagr.cagr], ["Multiplier", b.cagr.multiplier]]);
  addKv("Dividend", [["Shares", 100], ["DPS", (b.dividend.annual / 100)], ["Annual", b.dividend.annual], ["Monthly", b.dividend.monthly], ["Yield %", b.dividend.yieldPct]]);
  addKv("Brokerage", [
    ["Broker", m.isIndian ? "Zerodha" : "Robinhood"], ["Buy", m.price], ["Sell", m.price * 1.15], ["Qty", 50],
    ["Brokerage", b.brokerage.brokerage], ["Total charges", b.brokerage.totalCharges],
    ["Gross P/L", b.brokerage.grossPL], ["Net P/L", b.brokerage.netPL],
    ["Breakeven %", b.brokerage.breakevenPct],
  ]);
  addKv("Stock Average", [["Total qty", b.average.totalQty], ["Total cost", b.average.totalCost], ["Average", b.average.avg]]);
  addKv("Position Size", [["Portfolio", m.currency === "INR" ? 1_000_000 : 100_000], ["Risk %", 2], ["Stop %", 5], ["Qty", b.position.qty], ["Risk amount", b.position.riskAmount], ["Capital deployed", b.position.capitalDeployed]]);
  addKv("Profit-Loss", [["Buy", m.price], ["Sell", m.price * 1.15], ["Qty", 50], ["Gross", b.pl.gross], ["Tax", b.pl.tax], ["Net", b.pl.net], ["ROI %", b.pl.roi]]);
  addKv("Compare", [["Stock", b.compare.stock], ["Nifty/SIP 12%", b.compare.nifty], ["Gold 9%", b.compare.gold], ["FD 7%", b.compare.fd]]);
  addKv("FIRE", [["FIRE number", b.fire.fireNumber], ["Lean FIRE", b.fire.leanFire], ["Fat FIRE", b.fire.fatFire]]);
  addKv("Goal", [["Target", m.currency === "INR" ? 20_000_000 : 500_000], ["Years", 15], ["SIP needed", b.goal.sipMonthly], ["Lumpsum needed", b.goal.lumpsumNeeded]]);
  addKv("Allocator", [["India equity %", b.allocator.india], ["US equity %", b.allocator.us], ["Gold %", b.allocator.gold], ["Bonds %", b.allocator.bonds], ["Cash %", b.allocator.cash]]);
  const rbRows: (string | number)[][] = [["Asset", "Current %", "Target %", "Delta value", "Action"]];
  b.rebalance.forEach((r) => rbRows.push([r.asset, r.current, r.target, Math.round(r.deltaValue), r.action]));
  const rb = XLSX.utils.aoa_to_sheet(rbRows); rb["!cols"] = [{ wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, rb, "Rebalance");
  addKv("SWP", [["Corpus", (m.currency === "INR" ? 1_000_000 : 100_000) * 10], ["Monthly withdrawal", (m.currency === "INR" ? 50_000 : 5_000)], ["Years lasts", b.swp.years], ["Exhausted", b.swp.exhausted ? "Yes" : "No"]]);
  addKv("DCA", [["Total invested", b.dca.totalInvested], ["Total shares", Number(b.dca.totalShares.toFixed(4))], ["Average price", b.dca.avg]]);

  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  download(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${m.symbol}_15_calculators.xlsx`);
}

export function exportAll15Pdf(b: Calc15Bundle): void {
  const m = b.meta;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;
  const ensure = (need: number) => { if (y + need > H - margin) { doc.addPage(); y = margin; } };
  const fm = (v: number) => fmtMoney(v, m.currency);

  // Cover
  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(120);
  doc.text("CALCULYX AI · 15 INVESTING CALCULATORS", margin, y); y += 6;
  doc.setDrawColor(220).line(margin, y, W - margin, y); y += 22;
  doc.setFont("helvetica", "bold").setFontSize(22).setTextColor(20);
  doc.text(m.name, margin, y); y += 22;
  doc.setFont("helvetica", "normal").setFontSize(11).setTextColor(90);
  doc.text(`${m.symbol}  ·  live price ${fm(m.price)}  ·  assumed return ${m.assumedReturn}% p.a.`, margin, y);
  y += 24;

  const section = (title: string, rows: Array<[string, string]>) => {
    ensure(24 + rows.length * 14 + 8);
    doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(30, 30, 60);
    doc.text(title, margin, y); y += 6;
    doc.setDrawColor(230).line(margin, y, W - margin, y); y += 12;
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(30);
    rows.forEach(([k, v]) => {
      doc.setTextColor(110); doc.text(k, margin + 4, y);
      doc.setTextColor(20).setFont("helvetica", "bold");
      doc.text(v, W - margin - 4, y, { align: "right" });
      doc.setFont("helvetica", "normal");
      y += 14;
    });
    y += 8;
  };

  section("1. SIP Calculator", [
    ["Monthly investment × 10 years", `${fm(b.sip.invested / (10 * 12))}/mo`],
    ["Invested", fm(b.sip.invested)],
    ["Future value", fm(b.sip.futureValue)],
    ["Gains", fm(b.sip.gains)],
  ]);
  section("2. Lumpsum Calculator", [
    ["Amount invested", fm(b.lumpsum.invested)],
    ["Future value (10y)", fm(b.lumpsum.futureValue)],
    ["Gains", fm(b.lumpsum.gains)],
  ]);
  section("3. CAGR Calculator", [
    ["Sample: 50% price → current, 5 years", ""],
    ["CAGR", `${b.cagr.cagr.toFixed(2)}%`],
    ["Multiplier", `${b.cagr.multiplier.toFixed(2)}x`],
  ]);
  section("4. Dividend Calculator", [
    ["Assumed 100 shares", ""],
    ["Annual income", fm(b.dividend.annual)],
    ["Monthly income", fm(b.dividend.monthly)],
    ["Yield at current price", `${b.dividend.yieldPct.toFixed(2)}%`],
  ]);
  section("5. Brokerage Calculator", [
    ["Broker", m.isIndian ? "Zerodha (delivery)" : "Robinhood"],
    ["Total charges", fm(b.brokerage.totalCharges)],
    ["Gross P/L", fm(b.brokerage.grossPL)],
    ["Net P/L", fm(b.brokerage.netPL)],
    ["Breakeven", `${b.brokerage.breakevenPct.toFixed(2)}%`],
  ]);
  section("6. Stock Average", [
    ["Total quantity", String(b.average.totalQty)],
    ["Total invested", fm(b.average.totalCost)],
    ["Average price", fm(b.average.avg)],
  ]);
  section("7. Position Size (2% risk, 5% stop)", [
    ["Suggested quantity", String(b.position.qty)],
    ["Risk amount", fm(b.position.riskAmount)],
    ["Capital deployed", fm(b.position.capitalDeployed)],
  ]);
  section("8. Profit / Loss", [
    ["Gross P/L", fm(b.pl.gross)],
    ["Tax", fm(b.pl.tax)],
    ["Net P/L", fm(b.pl.net)],
    ["ROI", `${b.pl.roi.toFixed(2)}%`],
  ]);
  section("9. Stock vs FD / Gold / SIP (10 years)", [
    ["Stock", fm(b.compare.stock)],
    ["Nifty / SIP (12%)", fm(b.compare.nifty)],
    ["Gold (9%)", fm(b.compare.gold)],
    ["FD (7%)", fm(b.compare.fd)],
  ]);
  section("10. FIRE Calculator", [
    ["FIRE number", fm(b.fire.fireNumber)],
    ["Lean FIRE", fm(b.fire.leanFire)],
    ["Fat FIRE", fm(b.fire.fatFire)],
  ]);
  section("11. Goal Planner (15 years)", [
    ["Required monthly SIP", fm(b.goal.sipMonthly)],
    ["Or lumpsum today", fm(b.goal.lumpsumNeeded)],
  ]);
  section("12. Portfolio Allocator (age 30, balanced)", [
    ["India equity", `${b.allocator.india}%`],
    ["US equity", `${b.allocator.us}%`],
    ["Gold", `${b.allocator.gold}%`],
    ["Bonds", `${b.allocator.bonds}%`],
    ["Cash", `${b.allocator.cash}%`],
  ]);
  section("13. Rebalancing", b.rebalance.map((r) => [`${r.asset} ${r.current}% → ${r.target}%`, `${r.action} ${fm(Math.abs(r.deltaValue))}`]));
  section("14. SWP", [
    ["Corpus lasts", b.swp.exhausted ? `${b.swp.years.toFixed(1)} years` : "Corpus never depletes"],
  ]);
  section("15. Dollar-Cost Averaging", [
    ["Total invested", fm(b.dca.totalInvested)],
    ["Total shares", b.dca.totalShares.toFixed(4)],
    ["Average price", fm(b.dca.avg)],
  ]);

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "italic").setFontSize(8).setTextColor(140);
    doc.text(`Calculyx AI · ${m.symbol} · Estimates only, not financial advice.`, margin, H - 20);
    doc.text(`Page ${i} / ${pages}`, W - margin - 50, H - 20);
  }
  doc.save(`${m.symbol}_15_calculators.pdf`);
}

// ============================= TOP-LIST EXPORTS (bulk) =============================
// Bulk exports for the /stocks page toolbar. Takes the currently loaded
// StockQuote[] and emits a PDF or XLSX with every row.

export type TopStockRow = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  currency: string;
  region: "US" | "IN";
};

export function exportTopStocksXlsx(rows: TopStockRow[], marketLabel: string): void {
  const wb = XLSX.utils.book_new();
  const header = ["Symbol", "Name", "Region", "Currency", "Price", "Change", "Change %", "Open", "Prev close", "Day high", "Day low"];
  const body = rows.map((r) => [
    r.symbol, r.name, r.region, r.currency,
    r.price, r.change, r.changePercent, r.open, r.prevClose, r.high, r.low,
  ]);
  const ws = XLSX.utils.aoa_to_sheet([
    [`Calculyx AI — ${marketLabel} live top stocks`],
    ["Generated", new Date().toISOString()],
    [],
    header,
    ...body,
  ]);
  ws["!cols"] = [{ wch: 12 }, { wch: 28 }, { wch: 8 }, { wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws, marketLabel.slice(0, 28));
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  download(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `top_stocks_${marketLabel.toLowerCase()}.xlsx`);
}

export function exportTopStocksPdf(rows: TopStockRow[], marketLabel: string): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const margin = 40;

  doc.setFont("helvetica", "bold").setFontSize(20).setTextColor(20);
  doc.text(`Calculyx AI — ${marketLabel} live top stocks`, margin, 60);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(120);
  doc.text(new Date().toLocaleString(), margin, 78);
  doc.text(`${rows.length} tickers`, W - margin - 80, 78);

  // Table header
  let y = 110;
  const cols = [
    { label: "Symbol", w: 70 },
    { label: "Name", w: 170 },
    { label: "Price", w: 70, align: "right" as const },
    { label: "Chg %", w: 55, align: "right" as const },
    { label: "Open", w: 60, align: "right" as const },
    { label: "Prev", w: 60, align: "right" as const },
    { label: "High", w: 60, align: "right" as const },
  ];
  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(40);
  let x = margin;
  cols.forEach((c) => {
    if (c.align === "right") doc.text(c.label, x + c.w - 4, y, { align: "right" });
    else doc.text(c.label, x, y);
    x += c.w;
  });
  y += 6;
  doc.setDrawColor(200).line(margin, y, W - margin, y);
  y += 12;

  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(40);
  for (const r of rows) {
    if (y > H - 60) {
      doc.addPage();
      y = 60;
    }
    x = margin;
    const cur = r.currency === "INR" ? "₹" : "$";
    const fields: Array<{ text: string; align?: "right" }> = [
      { text: r.symbol },
      { text: r.name.length > 32 ? r.name.slice(0, 30) + "…" : r.name },
      { text: `${cur}${r.price.toLocaleString("en", { maximumFractionDigits: 2 })}`, align: "right" },
      { text: `${r.changePercent >= 0 ? "+" : ""}${r.changePercent.toFixed(2)}%`, align: "right" },
      { text: `${cur}${r.open.toLocaleString("en", { maximumFractionDigits: 2 })}`, align: "right" },
      { text: `${cur}${r.prevClose.toLocaleString("en", { maximumFractionDigits: 2 })}`, align: "right" },
      { text: `${cur}${r.high.toLocaleString("en", { maximumFractionDigits: 2 })}`, align: "right" },
    ];
    if (r.changePercent >= 0) doc.setTextColor(20, 130, 60); else doc.setTextColor(180, 40, 40);
    fields.forEach((f, i) => {
      const c = cols[i];
      // colour only the change% cell
      if (i !== 3) doc.setTextColor(40);
      else doc.setTextColor(r.changePercent >= 0 ? 20 : 180, r.changePercent >= 0 ? 130 : 40, r.changePercent >= 0 ? 60 : 40);
      if (f.align === "right") doc.text(f.text, x + c.w - 4, y, { align: "right" });
      else doc.text(f.text, x, y);
      x += c.w;
    });
    y += 16;
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "italic").setFontSize(8).setTextColor(140);
    doc.text(`Calculyx AI · Live snapshot · Not financial advice.`, margin, H - 20);
    doc.text(`Page ${i} / ${pages}`, W - margin - 50, H - 20);
  }
  doc.save(`top_stocks_${marketLabel.toLowerCase()}.pdf`);
}
