// Pure calculation utilities for the investing/stock calculator suite.
// All functions take plain numbers and return plain numbers/objects — safe for
// both client (React) and server usage.

export function sip({ monthly, rate, years }: { monthly: number; rate: number; years: number }) {
  const n = Math.max(0, Math.round(years * 12));
  const r = rate / 12 / 100;
  const fv = r === 0 ? monthly * n : monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  const invested = monthly * n;
  return { futureValue: fv, invested, gains: fv - invested };
}

export function lumpsum({ principal, rate, years }: { principal: number; rate: number; years: number }) {
  const fv = principal * Math.pow(1 + rate / 100, years);
  return { futureValue: fv, invested: principal, gains: fv - principal };
}

export function cagr({ start, end, years }: { start: number; end: number; years: number }) {
  if (start <= 0 || years <= 0) return { cagr: 0, multiplier: 0 };
  const c = Math.pow(end / start, 1 / years) - 1;
  return { cagr: c * 100, multiplier: end / start };
}

export function dividend({ shares, dps, priceForYield }: { shares: number; dps: number; priceForYield?: number }) {
  const annual = shares * dps;
  const yieldPct = priceForYield && priceForYield > 0 ? (dps / priceForYield) * 100 : 0;
  return { annual, monthly: annual / 12, yieldPct };
}

export function stockAverage(lots: Array<{ qty: number; price: number }>) {
  const totalQty = lots.reduce((s, l) => s + Math.max(0, l.qty), 0);
  const totalCost = lots.reduce((s, l) => s + Math.max(0, l.qty) * Math.max(0, l.price), 0);
  const avg = totalQty > 0 ? totalCost / totalQty : 0;
  return { avg, totalQty, totalCost };
}

export function positionSize({ portfolio, riskPct, stopLossPct, entryPrice }: { portfolio: number; riskPct: number; stopLossPct: number; entryPrice: number }) {
  const riskAmount = (portfolio * riskPct) / 100;
  const perShareRisk = (entryPrice * stopLossPct) / 100;
  const qty = perShareRisk > 0 ? Math.floor(riskAmount / perShareRisk) : 0;
  return { qty, riskAmount, capitalDeployed: qty * entryPrice };
}

export function profitLoss({ buy, sell, qty, taxRate = 0 }: { buy: number; sell: number; qty: number; taxRate?: number }) {
  const invested = buy * qty;
  const proceeds = sell * qty;
  const gross = proceeds - invested;
  const tax = gross > 0 ? (gross * taxRate) / 100 : 0;
  const net = gross - tax;
  const roi = invested > 0 ? (net / invested) * 100 : 0;
  return { gross, tax, net, roi, invested, proceeds };
}

export function swp({ corpus, monthly, rate }: { corpus: number; monthly: number; rate: number }) {
  const r = rate / 12 / 100;
  let bal = corpus;
  let months = 0;
  const max = 600; // 50 years cap
  while (bal > 0 && months < max) {
    bal = bal * (1 + r) - monthly;
    months++;
  }
  return { months, years: months / 12, exhausted: bal <= 0 };
}

export function dca(purchases: Array<{ amount: number; price: number }>) {
  const totalInvested = purchases.reduce((s, p) => s + p.amount, 0);
  const totalShares = purchases.reduce((s, p) => (p.price > 0 ? s + p.amount / p.price : s), 0);
  const avg = totalShares > 0 ? totalInvested / totalShares : 0;
  return { avg, totalShares, totalInvested };
}

export function fire({ annualExpense, withdrawalRate = 4 }: { annualExpense: number; withdrawalRate?: number }) {
  const number = (annualExpense * 100) / withdrawalRate;
  return { fireNumber: number, leanFire: number * 0.6, fatFire: number * 2 };
}

export function goalPlanner({ target, years, rate }: { target: number; years: number; rate: number }) {
  const n = Math.max(1, years * 12);
  const r = rate / 12 / 100;
  const sipMonthly = r === 0 ? target / n : target / (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
  const lumpsumNeeded = target / Math.pow(1 + rate / 100, years);
  return { sipMonthly, lumpsumNeeded };
}

// Portfolio allocator — simple age + risk based split.
export function portfolioAllocation({ age, risk }: { age: number; risk: "conservative" | "balanced" | "aggressive" }) {
  const eq = risk === "aggressive" ? 100 - Math.max(20, age * 0.7)
    : risk === "balanced" ? 100 - age
    : Math.max(20, 80 - age);
  const equity = Math.max(20, Math.min(90, Math.round(eq)));
  const gold = 10;
  const bonds = Math.round((100 - equity - gold) * 0.7);
  const cash = 100 - equity - gold - bonds;
  // Split equity 60/40 India/US default
  return {
    india: Math.round(equity * 0.6),
    us: equity - Math.round(equity * 0.6),
    gold,
    bonds,
    cash,
  };
}

export function rebalance(current: Record<string, number>, target: Record<string, number>, portfolioValue: number) {
  const rows: Array<{ asset: string; current: number; target: number; deltaValue: number; action: "Buy" | "Sell" | "Hold" }> = [];
  const assets = new Set([...Object.keys(current), ...Object.keys(target)]);
  for (const a of assets) {
    const c = current[a] ?? 0;
    const t = target[a] ?? 0;
    const deltaPct = t - c;
    const deltaValue = (deltaPct / 100) * portfolioValue;
    rows.push({
      asset: a,
      current: c,
      target: t,
      deltaValue,
      action: Math.abs(deltaValue) < 1 ? "Hold" : deltaValue > 0 ? "Buy" : "Sell",
    });
  }
  return rows;
}

// Compare stock CAGR against FD / Gold / SIP (all as fixed-rate assumptions)
export function compareAssets({ amount, years, stockCagr }: { amount: number; years: number; stockCagr: number }) {
  const stock = amount * Math.pow(1 + stockCagr / 100, years);
  const fd = amount * Math.pow(1 + 7 / 100, years);
  const gold = amount * Math.pow(1 + 9 / 100, years);
  const nifty = amount * Math.pow(1 + 12 / 100, years);
  return { stock, fd, gold, nifty };
}

// -------------------- Brokerage --------------------

export type BrokerId = "zerodha" | "groww" | "angelone" | "kotakneo" | "robinhood" | "ibkr";
export type TradeType = "intraday" | "delivery";

export type BrokerageInput = {
  broker: BrokerId;
  buyPrice: number;
  sellPrice: number;
  qty: number;
  tradeType: TradeType;
  market: "IN" | "US";
};

export function calcBrokerage(input: BrokerageInput) {
  const { broker, buyPrice, sellPrice, qty, tradeType, market } = input;
  const buyTurnover = buyPrice * qty;
  const sellTurnover = sellPrice * qty;
  const turnover = buyTurnover + sellTurnover;
  let brokerage = 0;

  if (market === "IN") {
    // Zerodha: 0 delivery, 0.03% or ₹20 intraday
    // Groww: ₹20 or 0.1% delivery, ₹20 or 0.05% intraday
    // Angel One: ₹0 delivery, ₹20 or 0.25% intraday
    // Kotak Neo: ₹0 delivery, ₹20 or 0.05% intraday
    if (broker === "zerodha") {
      brokerage = tradeType === "delivery" ? 0 : Math.min(20, buyTurnover * 0.0003) + Math.min(20, sellTurnover * 0.0003);
    } else if (broker === "groww") {
      brokerage = tradeType === "delivery"
        ? Math.min(20, buyTurnover * 0.001) + Math.min(20, sellTurnover * 0.001)
        : Math.min(20, buyTurnover * 0.0005) + Math.min(20, sellTurnover * 0.0005);
    } else if (broker === "angelone") {
      brokerage = tradeType === "delivery" ? 0 : Math.min(20, buyTurnover * 0.0025) + Math.min(20, sellTurnover * 0.0025);
    } else if (broker === "kotakneo") {
      brokerage = tradeType === "delivery" ? 0 : Math.min(20, buyTurnover * 0.0005) + Math.min(20, sellTurnover * 0.0005);
    }
    // STT
    const stt = tradeType === "delivery" ? turnover * 0.001 : sellTurnover * 0.00025;
    // Exchange txn charges (NSE ~0.00297%)
    const exch = turnover * 0.0000297;
    // SEBI ₹10 per crore
    const sebi = turnover * 0.000001;
    // Stamp duty (buy side): delivery 0.015%, intraday 0.003%
    const stamp = tradeType === "delivery" ? buyTurnover * 0.00015 : buyTurnover * 0.00003;
    // GST 18% on brokerage + exch + sebi
    const gst = (brokerage + exch + sebi) * 0.18;
    const totalCharges = brokerage + stt + exch + sebi + stamp + gst;
    const gross = sellTurnover - buyTurnover;
    const net = gross - totalCharges;
    return {
      brokerage, stt, exchange: exch, sebi, stamp, gst,
      totalCharges, grossPL: gross, netPL: net,
      breakevenPct: buyTurnover > 0 ? (totalCharges / buyTurnover) * 100 : 0,
    };
  }

  // US brokers
  if (broker === "robinhood") brokerage = 0;
  else if (broker === "ibkr") brokerage = Math.max(1, Math.min(qty * 0.005, turnover * 0.01)); // tiered pro ~$0.005/share
  const secFee = sellTurnover * 0.0000278; // ~$27.80 per $1M
  const finra = Math.min(sellTurnover * 0.000166, 8.30);
  const totalCharges = brokerage + secFee + finra;
  const gross = sellTurnover - buyTurnover;
  const net = gross - totalCharges;
  return {
    brokerage, stt: 0, exchange: 0, sebi: 0, stamp: 0, gst: 0,
    secFee, finra,
    totalCharges, grossPL: gross, netPL: net,
    breakevenPct: buyTurnover > 0 ? (totalCharges / buyTurnover) * 100 : 0,
  };
}

export const BROKERS_IN: Array<{ id: BrokerId; name: string }> = [
  { id: "zerodha", name: "Zerodha" },
  { id: "groww", name: "Groww" },
  { id: "angelone", name: "Angel One" },
  { id: "kotakneo", name: "Kotak Neo" },
];
export const BROKERS_US: Array<{ id: BrokerId; name: string }> = [
  { id: "robinhood", name: "Robinhood" },
  { id: "ibkr", name: "Interactive Brokers" },
];
