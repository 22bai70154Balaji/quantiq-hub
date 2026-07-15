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
import type { StockPrediction } from "@/lib/finflow/stock-prediction.functions";
import { getCatalogEntry } from "@/lib/finflow/stocks-catalog";
const calculyxLogoUrl = "/__l5e/assets-v1/eb2f4b7e-9a8a-4b5a-aee3-39f5dfd505be/calculyx-logo.png";

function fmtMoney(v: number, currency: string): string {
  if (!Number.isFinite(v)) return "—";
  if (currency === "INR") return `₹${Math.round(v).toLocaleString("en-IN")}`;
  return `$${Math.round(v).toLocaleString("en-US")}`;
}
function fmtMoney2(v: number, currency: string): string {
  if (!Number.isFinite(v)) return "—";
  const sym = currency === "INR" ? "₹" : "$";
  return `${sym}${v.toLocaleString(currency === "INR" ? "en-IN" : "en-US", { maximumFractionDigits: 2 })}`;
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

// -------- Image helpers (browser-only) --------
// jsPDF's addImage needs a data URL; logo.dev + our own asset both fetch fine.
async function urlToDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onerror = () => reject(new Error("read failed"));
      r.onload = () => resolve(String(r.result ?? ""));
      r.readAsDataURL(blob);
    });
  } catch { return null; }
}

const LOGO_DEV_TOKEN = (import.meta.env.VITE_LOVABLE_CONNECTOR_LOGO_DEV_API_KEY ?? "") as string;

function tickerLogoUrl(symbol: string): string | null {
  const cat = getCatalogEntry(symbol.toUpperCase());
  const upper = symbol.toUpperCase();
  const ticker = upper.replace(/\.(NS|BO)$/i, "");
  if (cat?.logoDomain) {
    return `https://img.logo.dev/${cat.logoDomain}?token=${LOGO_DEV_TOKEN}&size=80&format=png&fallback=404`;
  }
  return `https://img.logo.dev/ticker/${encodeURIComponent(ticker)}?token=${LOGO_DEV_TOKEN}&size=80&format=png&fallback=404`;
}

// -------- Branded header / footer --------

async function drawBrandedHeader(doc: jsPDF, subtitle: string): Promise<number> {
  const W = doc.internal.pageSize.getWidth();
  const margin = 40;
  // Deep navy header strip
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 86, "F");

  // Calculyx logo: the source asset is a wide wordmark, so keep its aspect
  // ratio and place it on a white badge for clean visibility in every PDF.
  const badgeX = margin;
  const badgeY = 18;
  const badgeW = 170;
  const badgeH = 50;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 10, 10, "F");
  const logo = await urlToDataUrl(calculyxLogoUrl);
  if (logo) {
    try { doc.addImage(logo, "PNG", badgeX + 10, badgeY + 9, 150, 44); } catch { /* ignore */ }
  } else {
    doc.setFont("helvetica", "bold").setFontSize(16).setTextColor(15, 23, 42);
    doc.text("Calculyx AI", badgeX + badgeW / 2, badgeY + 31, { align: "center" });
  }

  doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(255, 255, 255);
  doc.text(subtitle, margin + 190, 41);
  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(180, 200, 230);
  doc.text("Processed structured report", margin + 190, 58);
  // Timestamp on the right
  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(180, 200, 230);
  const ts = new Date().toLocaleString();
  doc.text(ts, W - margin, 42, { align: "right" });
  doc.setFontSize(7);
  doc.text("calculyxai.online", W - margin, 58, { align: "right" });
  return 108; // Y position where body should start
}

function drawFooter(doc: jsPDF, note = "Estimates only · Not financial advice · Data may be delayed") {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const margin = 40;
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(230).line(margin, H - 34, W - margin, H - 34);
    doc.setFont("helvetica", "italic").setFontSize(8).setTextColor(140);
    doc.text(`Calculyx AI · ${note}`, margin, H - 20);
    doc.text(`Page ${i} / ${pages}`, W - margin, H - 20, { align: "right" });
  }
}

// Reusable "labelled card" box for numeric grids.
function drawStatCard(doc: jsPDF, x: number, y: number, w: number, h: number, label: string, value: string) {
  doc.setDrawColor(226, 232, 240).setFillColor(248, 250, 252);
  doc.roundedRect(x, y, w, h, 6, 6, "FD");
  doc.setFont("helvetica", "normal").setFontSize(7).setTextColor(100, 116, 139);
  doc.text(label.toUpperCase(), x + 10, y + 14);
  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(15, 23, 42);
  // Truncate value if wider than box
  const maxTextWidth = w - 20;
  let text = value;
  while (doc.getTextWidth(text) > maxTextWidth && text.length > 3) {
    text = text.slice(0, -2) + "…";
  }
  doc.text(text, x + 10, y + h - 12);
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

export async function exportStockPdf(b: StockExportBundle): Promise<void> {
  const d = b.detail;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const margin = 40;
  const bodyW = W - margin * 2;

  let y = await drawBrandedHeader(doc, `Stock report · ${d.symbol}`);
  const ensure = (need: number) => { if (y + need > H - 50) { doc.addPage(); y = 50; } };

  // -------- Hero card with company logo, name, price, change --------
  const heroH = 90;
  doc.setDrawColor(226, 232, 240).setFillColor(255, 255, 255);
  doc.roundedRect(margin, y, bodyW, heroH, 10, 10, "FD");

  const logoData = await urlToDataUrl(tickerLogoUrl(d.symbol) ?? "");
  if (logoData) {
    try { doc.addImage(logoData, "PNG", margin + 16, y + 16, 58, 58); } catch { /* ignore */ }
  } else {
    // Initials tile
    doc.setFillColor(15, 23, 42).roundedRect(margin + 16, y + 16, 58, 58, 8, 8, "F");
    doc.setFont("helvetica", "bold").setFontSize(20).setTextColor(255, 255, 255);
    doc.text(d.symbol.slice(0, 2).toUpperCase(), margin + 45, y + 52, { align: "center" });
  }
  doc.setFont("helvetica", "bold").setFontSize(18).setTextColor(15, 23, 42);
  doc.text(d.name, margin + 90, y + 34);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(100, 116, 139);
  doc.text(`${d.symbol}  ·  ${d.region === "IN" ? "NSE / BSE" : "US Market"}  ·  ${d.sector || "—"}`, margin + 90, y + 52);
  // Price block on the right
  doc.setFont("helvetica", "bold").setFontSize(22).setTextColor(15, 23, 42);
  doc.text(fmtMoney2(d.price, d.currency), margin + bodyW - 16, y + 38, { align: "right" });
  const up = d.change >= 0;
  doc.setFillColor(up ? 220 : 254, up ? 252 : 226, up ? 231 : 226);
  doc.roundedRect(margin + bodyW - 116, y + 50, 100, 20, 10, 10, "F");
  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(up ? 20 : 180, up ? 130 : 40, up ? 60 : 40);
  doc.text(`${up ? "▲" : "▼"} ${up ? "+" : ""}${d.changePercent.toFixed(2)}%  (${up ? "+" : ""}${fmtMoney2(d.change, d.currency)})`, margin + bodyW - 66, y + 64, { align: "center" });
  y += heroH + 16;

  // -------- Quick stats grid (3x4) --------
  ensure(30);
  doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(15, 23, 42);
  doc.text("Quick stats", margin, y); y += 14;

  const stats: Array<[string, string]> = [
    ["Open", fmtMoney2(d.open, d.currency)],
    ["Prev close", fmtMoney2(d.prevClose, d.currency)],
    ["Day high", fmtMoney2(d.high, d.currency)],
    ["Day low", fmtMoney2(d.low, d.currency)],
    ["52w high", d.weekHigh52 != null ? fmtMoney2(d.weekHigh52, d.currency) : "—"],
    ["52w low", d.weekLow52 != null ? fmtMoney2(d.weekLow52, d.currency) : "—"],
    ["P/E", d.pe ? d.pe.toFixed(1) : "—"],
    ["Market cap", d.marketCap ? fmtMoney(d.marketCap, d.currency) : "—"],
    ["ROE %", d.roe != null ? `${d.roe.toFixed(1)}%` : "—"],
    ["D/E", d.debtToEquity != null ? d.debtToEquity.toFixed(2) : "—"],
    ["Div yield %", d.divYield != null ? `${d.divYield.toFixed(2)}%` : "—"],
    ["Beta", d.beta != null ? d.beta.toFixed(2) : "—"],
  ];
  const cols = 4;
  const gap = 8;
  const cardW = (bodyW - gap * (cols - 1)) / cols;
  const cardH = 42;
  stats.forEach((s, i) => {
    const col = i % cols;
    if (col === 0) ensure(cardH + 4);
    const x = margin + col * (cardW + gap);
    drawStatCard(doc, x, y, cardW, cardH, s[0], s[1]);
    if (col === cols - 1 || i === stats.length - 1) y += cardH + gap;
  });
  y += 4;

  // -------- Financial health --------
  ensure(60);
  doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(15, 23, 42);
  doc.text(`Financial health  ·  ${d.healthScore}/100`, margin, y); y += 10;
  // Score bar
  doc.setDrawColor(226, 232, 240).setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, bodyW, 8, 4, 4, "FD");
  const scoreW = Math.max(4, Math.min(bodyW, (d.healthScore / 100) * bodyW));
  const scoreColor: [number, number, number] = d.healthScore >= 70 ? [16, 185, 129] : d.healthScore >= 45 ? [234, 179, 8] : [239, 68, 68];
  doc.setFillColor(...scoreColor).roundedRect(margin, y, scoreW, 8, 4, 4, "F");
  y += 18;
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(51, 65, 85);
  (d.healthNotes ?? []).slice(0, 6).forEach((n) => {
    const lines = doc.splitTextToSize(`•  ${n}`, bodyW - 12) as string[];
    ensure(lines.length * 12);
    doc.text(lines, margin + 6, y);
    y += lines.length * 12;
  });
  y += 6;

  // -------- Latest news --------
  if (b.news?.length) {
    ensure(30);
    doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(15, 23, 42);
    doc.text("Latest news", margin, y); y += 14;
    b.news.slice(0, 8).forEach((n, i) => {
      const wrapped = doc.splitTextToSize(n.headline, bodyW - 40) as string[];
      const blockH = wrapped.length * 12 + 18;
      ensure(blockH + 6);
      doc.setDrawColor(233, 237, 242).setFillColor(250, 251, 253);
      doc.roundedRect(margin, y, bodyW, blockH, 6, 6, "FD");
      doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(15, 23, 42);
      doc.text(String(i + 1).padStart(2, "0"), margin + 10, y + 16);
      doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(30, 41, 59);
      doc.text(wrapped, margin + 28, y + 16);
      doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(120, 130, 148);
      doc.text(`${n.source} · ${new Date(n.ts).toLocaleDateString()}`, margin + 28, y + blockH - 8);
      y += blockH + 6;
    });
  }

  // -------- Earnings --------
  if (b.earnings?.length) {
    ensure(40);
    doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(15, 23, 42);
    doc.text("Earnings history", margin, y); y += 14;
    const cols2 = [
      { label: "Period", w: 100 },
      { label: "Estimate", w: (bodyW - 100) / 3, align: "right" as const },
      { label: "Actual", w: (bodyW - 100) / 3, align: "right" as const },
      { label: "Surprise", w: (bodyW - 100) / 3, align: "right" as const },
    ];
    doc.setFillColor(241, 245, 249).rect(margin, y, bodyW, 18, "F");
    doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(71, 85, 105);
    let x = margin + 8;
    cols2.forEach((c) => {
      if (c.align === "right") doc.text(c.label, x + c.w - 8, y + 12, { align: "right" });
      else doc.text(c.label, x, y + 12);
      x += c.w;
    });
    y += 20;
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(30, 41, 59);
    b.earnings.forEach((e, i) => {
      ensure(16);
      if (i % 2 === 1) { doc.setFillColor(249, 250, 252).rect(margin, y - 12, bodyW, 16, "F"); }
      let cx = margin + 8;
      doc.text(String(e.period), cx, y);
      cx += cols2[0].w;
      doc.text(e.estimate != null ? String(e.estimate) : "—", cx + cols2[1].w - 8, y, { align: "right" });
      cx += cols2[1].w;
      doc.text(e.actual != null ? String(e.actual) : "—", cx + cols2[2].w - 8, y, { align: "right" });
      cx += cols2[2].w;
      if (e.surprise != null) {
        doc.setTextColor(e.surprise >= 0 ? 20 : 180, e.surprise >= 0 ? 130 : 40, e.surprise >= 0 ? 60 : 40);
      }
      doc.text(e.surprise != null ? `${e.surprise >= 0 ? "+" : ""}${e.surprise.toFixed(2)}` : "—", cx + cols2[3].w - 8, y, { align: "right" });
      doc.setTextColor(30, 41, 59);
      y += 16;
    });
  }

  drawFooter(doc);
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

export async function exportTopStocksPdf(rows: TopStockRow[], marketLabel: string): Promise<void> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const margin = 40;
  const bodyW = W - margin * 2;

  let y = await drawBrandedHeader(doc, `${marketLabel} live top stocks · ${rows.length} tickers`);

  // Preload every logo in parallel (cheap since already cached by the browser).
  const logos = await Promise.all(rows.map((r) => urlToDataUrl(tickerLogoUrl(r.symbol) ?? "")));

  // Column layout — sizes chosen so text can never overflow the box.
  //  # | Logo | Symbol · Name | Price | Chg% | Open | Prev
  const colW = {
    num: 28,
    logo: 32,
    name: bodyW - 28 - 32 - 74 - 66 - 66 - 66,
    price: 74,
    chg: 66,
    open: 66,
    prev: 66,
  };
  const rowH = 34;

  // Header row
  const drawTableHead = () => {
    doc.setFillColor(15, 23, 42).rect(margin, y, bodyW, 22, "F");
    doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(226, 232, 240);
    let x = margin + 8;
    doc.text("#", x, y + 14); x += colW.num;
    x += colW.logo;
    doc.text("COMPANY", x, y + 14); x += colW.name;
    doc.text("PRICE", x + colW.price - 8, y + 14, { align: "right" }); x += colW.price;
    doc.text("CHG %", x + colW.chg - 8, y + 14, { align: "right" }); x += colW.chg;
    doc.text("OPEN", x + colW.open - 8, y + 14, { align: "right" }); x += colW.open;
    doc.text("PREV", x + colW.prev - 8, y + 14, { align: "right" });
    y += 22;
  };

  drawTableHead();

  rows.forEach((r, i) => {
    if (y + rowH > H - 50) {
      doc.addPage();
      y = 50;
      drawTableHead();
    }
    // Zebra stripe
    if (i % 2 === 1) {
      doc.setFillColor(248, 250, 252).rect(margin, y, bodyW, rowH, "F");
    }
    // Row border bottom
    doc.setDrawColor(233, 237, 242).line(margin, y + rowH, margin + bodyW, y + rowH);

    let x = margin + 8;

    // Number
    doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(100, 116, 139);
    doc.text(String(i + 1).padStart(2, "0"), x, y + rowH / 2 + 3);
    x += colW.num;

    // Logo
    const logo = logos[i];
    if (logo) {
      try { doc.addImage(logo, "PNG", x, y + 5, 24, 24); } catch { /* ignore */ }
    } else {
      doc.setFillColor(226, 232, 240).roundedRect(x, y + 5, 24, 24, 4, 4, "F");
      doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(71, 85, 105);
      doc.text(r.symbol.slice(0, 2).toUpperCase(), x + 12, y + 20, { align: "center" });
    }
    x += colW.logo;

    // Symbol + name (stacked, truncated)
    doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(15, 23, 42);
    doc.text(r.symbol, x, y + 14);
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(100, 116, 139);
    let name = r.name;
    while (doc.getTextWidth(name) > colW.name - 12 && name.length > 4) {
      name = name.slice(0, -2) + "…";
    }
    doc.text(name, x, y + 26);
    x += colW.name;

    // Price
    doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(15, 23, 42);
    doc.text(fmtMoney2(r.price, r.currency), x + colW.price - 8, y + rowH / 2 + 3, { align: "right" });
    x += colW.price;

    // Change % (pill-tinted)
    const up = r.changePercent >= 0;
    doc.setFont("helvetica", "bold").setFontSize(9);
    doc.setTextColor(up ? 20 : 180, up ? 130 : 40, up ? 60 : 40);
    doc.text(`${up ? "+" : ""}${r.changePercent.toFixed(2)}%`, x + colW.chg - 8, y + rowH / 2 + 3, { align: "right" });
    x += colW.chg;

    // Open / Prev
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(51, 65, 85);
    doc.text(fmtMoney2(r.open, r.currency), x + colW.open - 8, y + rowH / 2 + 3, { align: "right" });
    x += colW.open;
    doc.text(fmtMoney2(r.prevClose, r.currency), x + colW.prev - 8, y + rowH / 2 + 3, { align: "right" });

    y += rowH;
  });

  drawFooter(doc, "Live snapshot · Estimates only · Not financial advice");
  doc.save(`top_stocks_${marketLabel.toLowerCase()}.pdf`);
}

// ============================= AI PREDICTION PDF =============================

export type PredictionPdfBundle = {
  symbol: string;
  name: string;
  currency: string;
  price: number;
  region: "US" | "IN";
  sector?: string;
  prediction: StockPrediction;
};

export async function exportPredictionPdf(b: PredictionPdfBundle): Promise<void> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const margin = 40;
  const bodyW = W - margin * 2;

  let y = await drawBrandedHeader(doc, `AI stock report · ${b.symbol}`);
  const ensure = (need: number) => { if (y + need > H - 50) { doc.addPage(); y = 50; } };

  const p = b.prediction;
  const cur = b.currency;

  // -------- Hero card --------
  const heroH = 96;
  doc.setDrawColor(226, 232, 240).setFillColor(255, 255, 255);
  doc.roundedRect(margin, y, bodyW, heroH, 10, 10, "FD");
  const logoData = await urlToDataUrl(tickerLogoUrl(b.symbol) ?? "");
  if (logoData) {
    try { doc.addImage(logoData, "PNG", margin + 16, y + 18, 60, 60); } catch { /* ignore */ }
  }
  doc.setFont("helvetica", "bold").setFontSize(16).setTextColor(15, 23, 42);
  doc.text(b.name, margin + 92, y + 30);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(100, 116, 139);
  doc.text(`${b.symbol}  ·  ${b.region === "IN" ? "NSE / BSE" : "US Market"}  ·  ${b.sector || "—"}`, margin + 92, y + 46);
  const hLines = doc.splitTextToSize(p.headline, bodyW - 260) as string[];
  doc.setFont("helvetica", "italic").setFontSize(9).setTextColor(30, 41, 59);
  doc.text(hLines, margin + 92, y + 62);
  // Outlook pill on right
  const tint = p.outlook === "bullish"
    ? { bg: [220, 252, 231] as [number, number, number], fg: [20, 130, 60] as [number, number, number] }
    : p.outlook === "bearish"
      ? { bg: [254, 226, 226] as [number, number, number], fg: [180, 40, 40] as [number, number, number] }
      : { bg: [241, 245, 249] as [number, number, number], fg: [71, 85, 105] as [number, number, number] };
  doc.setFillColor(...tint.bg).roundedRect(margin + bodyW - 130, y + 20, 114, 24, 12, 12, "F");
  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...tint.fg);
  doc.text(p.outlook.toUpperCase(), margin + bodyW - 73, y + 36, { align: "center" });
  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(100, 116, 139);
  doc.text(`Confidence: ${p.confidence}`, margin + bodyW - 16, y + 58, { align: "right" });
  doc.text(`Timeframe: ${p.timeframe}`, margin + bodyW - 16, y + 72, { align: "right" });
  doc.setFont("helvetica", "bold").setFontSize(14).setTextColor(15, 23, 42);
  doc.text(fmtMoney2(b.price, cur), margin + bodyW - 16, y + heroH - 8, { align: "right" });
  y += heroH + 16;

  // -------- Summary --------
  ensure(60);
  doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(15, 23, 42);
  doc.text("Summary", margin, y); y += 14;
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(30, 41, 59);
  const sumLines = doc.splitTextToSize(p.summary, bodyW - 4) as string[];
  ensure(sumLines.length * 13);
  doc.text(sumLines, margin, y);
  y += sumLines.length * 13 + 10;

  // -------- Key levels grid --------
  ensure(90);
  doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(15, 23, 42);
  doc.text("Key price levels (predicted)", margin, y); y += 12;
  const kl = p.keyLevels;
  const items: Array<[string, string]> = [
    ["Predicted high", fmtMoney2(kl.predictedHigh, cur)],
    ["Predicted low", fmtMoney2(kl.predictedLow, cur)],
    ["Fair price", kl.fairPrice != null ? fmtMoney2(kl.fairPrice, cur) : "—"],
    ["Resistance", kl.resistance.length ? kl.resistance.map((n) => fmtMoney2(n, cur)).join(" · ") : "—"],
    ["Support", kl.support.length ? kl.support.map((n) => fmtMoney2(n, cur)).join(" · ") : "—"],
    ["RSI-14", p.technicals.rsi14.toFixed(1)],
  ];
  const kCols = 3;
  const kGap = 8;
  const kCardW = (bodyW - kGap * (kCols - 1)) / kCols;
  items.forEach((it, i) => {
    const col = i % kCols;
    if (col === 0) ensure(50);
    const x = margin + col * (kCardW + kGap);
    drawStatCard(doc, x, y, kCardW, 44, it[0], it[1]);
    if (col === kCols - 1 || i === items.length - 1) y += 44 + kGap;
  });
  y += 4;

  // -------- Scenarios --------
  ensure(120);
  doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(15, 23, 42);
  doc.text("Scenarios (30-day)", margin, y); y += 12;
  const scen = [
    { name: "Bull", data: p.scenarios.bull, color: [16, 185, 129] as [number, number, number] },
    { name: "Base", data: p.scenarios.base, color: [59, 130, 246] as [number, number, number] },
    { name: "Bear", data: p.scenarios.bear, color: [239, 68, 68] as [number, number, number] },
  ];
  const sCardW = (bodyW - kGap * 2) / 3;
  const sCardH = 92;
  scen.forEach((s, i) => {
    const x = margin + i * (sCardW + kGap);
    ensure(sCardH);
    doc.setDrawColor(226, 232, 240).setFillColor(255, 255, 255);
    doc.roundedRect(x, y, sCardW, sCardH, 8, 8, "FD");
    doc.setFillColor(...s.color).roundedRect(x, y, sCardW, 4, 2, 2, "F");
    doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...s.color);
    doc.text(s.name.toUpperCase(), x + 12, y + 22);
    doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(15, 23, 42);
    doc.text(`${s.data.probability}%`, x + sCardW - 12, y + 22, { align: "right" });
    doc.setFont("helvetica", "bold").setFontSize(16).setTextColor(15, 23, 42);
    doc.text(fmtMoney2(s.data.target, cur), x + 12, y + 46);
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(100, 116, 139);
    const nLines = doc.splitTextToSize(s.data.note || "", sCardW - 20) as string[];
    doc.text(nLines.slice(0, 3), x + 12, y + 60);
  });
  y += sCardH + 12;

  // Helper for bullet-list boxes
  const bulletBox = (title: string, list: string[], tint: [number, number, number]) => {
    if (!list.length) return;
    doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(15, 23, 42);
    ensure(20);
    doc.text(title, margin, y); y += 12;
    const inner = bodyW - 20;
    const wrapped = list.map((s) => doc.splitTextToSize(`•  ${s}`, inner) as string[]);
    const totalH = wrapped.reduce((a, l) => a + l.length * 12, 0) + 12;
    ensure(totalH);
    doc.setDrawColor(...tint).setFillColor(tint[0], tint[1], tint[2]);
    // light background — use alpha via lighter fill by mixing to near-white
    doc.setFillColor(Math.min(255, tint[0] + 200), Math.min(255, tint[1] + 200), Math.min(255, tint[2] + 200));
    doc.roundedRect(margin, y, bodyW, totalH, 6, 6, "FD");
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(30, 41, 59);
    let cy = y + 12;
    wrapped.forEach((lines) => { doc.text(lines, margin + 10, cy); cy += lines.length * 12; });
    y += totalH + 8;
  };

  bulletBox("Key drivers to watch", p.drivers, [16, 185, 129]);
  bulletBox("Recommended action plan", p.actionPlan, [59, 130, 246]);
  bulletBox("Risks", p.risks, [239, 68, 68]);

  // Technicals footer strip
  ensure(60);
  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(15, 23, 42);
  doc.text("Technical snapshot", margin, y); y += 12;
  const t = p.technicals;
  const tItems: Array<[string, string]> = [
    ["Last price", fmtMoney2(t.lastPrice, cur)],
    ["MA20", fmtMoney2(t.ma20, cur)],
    ["MA50", fmtMoney2(t.ma50, cur)],
    ["MA200", t.ma200 != null ? fmtMoney2(t.ma200, cur) : "—"],
    ["52w high", fmtMoney2(t.high52w, cur)],
    ["52w low", fmtMoney2(t.low52w, cur)],
    ["30d momentum", `${t.momentum30d.toFixed(2)}%`],
    ["Ann. vol.", `${t.volatilityPct.toFixed(1)}%`],
  ];
  const tCols = 4;
  const tCardW = (bodyW - kGap * (tCols - 1)) / tCols;
  tItems.forEach((it, i) => {
    const col = i % tCols;
    if (col === 0) ensure(44);
    const x = margin + col * (tCardW + kGap);
    drawStatCard(doc, x, y, tCardW, 40, it[0], it[1]);
    if (col === tCols - 1 || i === tItems.length - 1) y += 40 + kGap;
  });

  // Disclaimer band
  y += 6;
  ensure(30);
  doc.setFillColor(254, 249, 195).roundedRect(margin, y, bodyW, 22, 6, 6, "F");
  doc.setFont("helvetica", "italic").setFontSize(8).setTextColor(120, 80, 20);
  const dLines = doc.splitTextToSize(p.disclaimer, bodyW - 16) as string[];
  doc.text(dLines[0] ?? "Estimates only — not investment advice.", margin + 8, y + 14);

  drawFooter(doc, "AI-generated report · Estimates only · Not investment advice");
  doc.save(`${b.symbol}_ai_report.pdf`);
}

