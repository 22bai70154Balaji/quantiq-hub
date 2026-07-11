import type jsPDF from "jspdf";
import type { Country } from "./countries";
import { COUNTRIES } from "./countries";

// Standard jsPDF fonts (Helvetica) don't support ₹ or د.إ,
// so we format money with an ISO code prefix that is 100% ASCII-safe.
export function pdfMoney(amount: number, country: Country): string {
  const { currency, locale } = COUNTRIES[country];
  const n = Number.isFinite(amount) ? amount : 0;
  const formatted = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n);
  return `${currency} ${formatted}`;
}

// Strip characters outside jsPDF's WinAnsi range to prevent �-style glyphs.
export function pdfSafe(s: string): string {
  return s.replace(/[^\x20-\x7E]/g, "").trim();
}

export type PdfCtx = {
  doc: jsPDF;
  w: number;
  h: number;
  margin: number;
  y: number;
};

export function createPdfCtx(doc: jsPDF, margin = 40): PdfCtx {
  return {
    doc,
    w: doc.internal.pageSize.getWidth(),
    h: doc.internal.pageSize.getHeight(),
    margin,
    y: margin,
  };
}

export function ensureRoom(ctx: PdfCtx, needed: number): void {
  if (ctx.y + needed > ctx.h - ctx.margin) {
    ctx.doc.addPage();
    ctx.y = ctx.margin;
  }
}

export function pdfSection(ctx: PdfCtx, title: string): void {
  ensureRoom(ctx, 40);
  ctx.doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(20, 22, 34).text(pdfSafe(title), ctx.margin, ctx.y);
  ctx.y += 6;
  ctx.doc.setDrawColor(220).line(ctx.margin, ctx.y, ctx.w - ctx.margin, ctx.y);
  ctx.y += 16;
  ctx.doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(30, 30, 30);
}

export function pdfKv(ctx: PdfCtx, k: string, v: string, lineHeight = 15): void {
  ensureRoom(ctx, lineHeight + 2);
  const { doc, w, margin, y } = ctx;
  const rightX = w - margin;
  const valueMax = rightX - margin - 200; // reserve room for key
  const safeV = pdfSafe(v);
  const wrapped = doc.splitTextToSize(safeV, Math.max(120, valueMax));
  doc.text(pdfSafe(k), margin, y);
  doc.text(wrapped, rightX, y, { align: "right" });
  ctx.y = y + Math.max(lineHeight, wrapped.length * lineHeight);
}

// Inline SVG of the Calculyx AI wordmark logo, rasterized on demand for PDFs.
// Wordmark rendered white for placement on the dark PDF header band.
const FINFLOW_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 166.8 49"><defs><linearGradient id="cxpdf0" x1="9.781" x2="39.36" y1="32.13" y2="14.81" gradientUnits="userSpaceOnUse"><stop stop-color="#1AE1F3" offset="0.1844"/><stop stop-color="#346DF1" offset="1"/></linearGradient><linearGradient id="cxpdf1" x1="21.33" x2="43.74" y1="36.36" y2="36.36" gradientUnits="userSpaceOnUse"><stop stop-color="#1A4CB7" offset="0"/><stop stop-color="#346CF1" offset="0.932"/></linearGradient><linearGradient id="cxpdf2" x1="28.56" x2="43.51" y1="14.38" y2="14.38" gradientUnits="userSpaceOnUse"><stop stop-color="#1B92E8" offset="0"/><stop stop-color="#346BF1" offset="0.9902"/></linearGradient></defs><path d="m39.4 28-8.6 8.5c-2.3 2.3-5.7 2.3-7.7 0.3l-1.8-1.9c-0.5 2-0.1 4.6 1.7 6.5 1.5 1.6 3.7 2.6 6.4 2.4 2.1-0.4 4.1-1.2 5.6-2.6l8.8-8.7-4.4-4.5zm-2.9-18.6c-2.6-3-5.6-4.9-9.6-4.9-3.2 0-6 1-8.4 3.2l-8.2 8.2c-4.7 4.7-4.7 12.3-0.1 17l7.7 7.5c3 3 6.7 4.1 10.5 3.5-1.9-0.1-3.8-1.1-4.9-2.4-1.9-2.1-2.7-5.8-0.9-8.9l2.7-3c2 0.5 4.1 0.1 5.4-1.3s1.8-3.3 1.3-5l4.4-4.4 4.6 4.5 2.5-15.5-7 1.5zm-7.9 16.9c-1 0.9-2.5 0.9-3.6 0-0.9-1-1.1-2.4-0.1-3.5 0.9-0.9 2.5-1.3 3.7-0.1 1.1 1 1 2.7 0 3.6zm-0.4-15.1 4 3.9-4 4.3c-1.7-0.7-3.6-0.1-4.9 1.1-1.4 1.2-2.1 3.1-1.7 5l-4.9 4.8-2.1-2.1c-1.9-2.1-2.1-5.5-0.1-7.5l8.1-8c2-2 4.2-2.1 6-1.5z" fill="url(#cxpdf0)"/><path d="m29.4 43.8c-2.3 0.2-4.9-0.8-6.4-2.4-1.7-1.8-2.3-4.5-1.7-6.5l1.7 1.5c2 2 5.4 2.3 7.7 0l8.7-8.4 4.3 4.5-8.6 8.5c-1.5 1.4-3.7 2.4-5.7 2.8z" fill="url(#cxpdf1)"/><path d="m28.6 11.2 7.9-1.8 7-1.5-2.5 15.5-4.6-4.4-4.5 4.4-3.7-4 4.3-4.3-3.9-3.9z" fill="url(#cxpdf2)"/><g fill="#FFFFFF"><path d="m49.5 24c0-4.4 3.3-7.9 8.2-7.9 2.7 0 5.1 1.3 6.6 3.7l-2.1 1.3c-0.9-1.5-2.5-2.5-4.5-2.5-3.1 0-5.5 2.3-5.5 5.4 0 3 2.1 5.4 5.3 5.4 2.1 0 3.7-0.9 4.5-2.5l2.3 1.3c-1.3 2.3-3.4 3.6-6.7 3.7-4.4 0-8.1-3.2-8.1-7.9z"/><path d="m65.6 26.1c0-3.6 2.6-5.7 5.5-5.7 1.5 0 2.8 0.5 3.6 1.6v-1.4h2.3v11h-2.3v-1.4c-0.8 1.1-2.2 1.6-3.6 1.6-2.9 0-5.5-2.2-5.5-5.7zm9.1 0c0-2-1.4-3.4-3.3-3.4s-3.2 1.4-3.2 3.4 1.3 3.4 3.2 3.4 3.3-1.4 3.3-3.4z"/><path d="m79.6 15.8h2.5v15.8h-2.5v-15.8z"/><path d="m84.1 26.1c0-3.3 2.5-5.7 5.8-5.7 2 0 3.9 0.9 5 2.9l-2 1.2c-0.5-1-1.6-1.8-3-1.8-1.9 0-3.3 1.4-3.3 3.4 0 1.8 1.2 3.3 3.2 3.3 1.3 0 2.5-0.5 3.1-1.7l2 1.1c-0.8 1.9-2.7 3-5.1 3-3.1 0-5.7-2.2-5.7-5.7z"/><path d="m96.6 27.1v-6.5h2.5v6.3c0 1.7 0.8 2.7 2.4 2.7 1.4 0 2.6-1 2.6-3v-6h2.5v10.9h-2.4v-1.3c-0.7 1-1.8 1.6-3.3 1.6-2.9 0-4.3-1.7-4.3-4.7z"/><path d="m109.4 15.8h2.5v15.7h-2.5v-15.7z"/><path d="m117.8 31.1-4.3-10.5h2.8l3.1 7.8 3-7.8h2.6l-4.4 11.4c-1 2.7-2.7 3.8-5.6 3.8v-2.2c1.5 0 2.4-0.5 3.1-2.1l0.1-0.4z"/><path d="m129.2 25.9-3.7-5.3h3l2.4 3.5 2.5-3.5h3l-3.9 5.3 4 5.6h-3l-2.6-3.8-2.7 3.8h-3l4-5.6z"/></g><g fill="#B9C0C7"><path d="m148.5 16.4h1.6l6.3 15.2h-2l-1.4-3.8h-6.9l-1.4 3.8h-2.1l5.9-15.2zm3.9 9.7-2.5-6.5-0.5-1.1-0.2 1.1-2.5 6.5h5.7z"/><path d="m158.1 16.4h2v15.1h-1.9l-0.1-15.1z"/></g></svg>`;

const LOGO_ASPECT = 166.8 / 49;

let logoPngCache: string | null = null;

/** Rasterize the Calculyx logo SVG to a PNG data URL for embedding in PDFs. Browser-only. */
export async function loadFinflowLogoPng(pixelWidth = 640): Promise<string | null> {
  if (typeof window === "undefined" || typeof document === "undefined") return null;
  if (logoPngCache) return logoPngCache;
  try {
    const svgBlob = new Blob([FINFLOW_LOGO_SVG], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.crossOrigin = "anonymous";
    const loaded = new Promise<HTMLImageElement>((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = reject;
    });
    img.src = url;
    await loaded;
    const canvas = document.createElement("canvas");
    canvas.width = pixelWidth;
    canvas.height = Math.round(pixelWidth / LOGO_ASPECT);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    logoPngCache = canvas.toDataURL("image/png");
    return logoPngCache;
  } catch {
    return null;
  }
}

export function pdfHeader(ctx: PdfCtx, subtitle: string, meta?: string, logoPng?: string | null): void {
  const { doc, w } = ctx;
  doc.setFillColor(17, 24, 39).rect(0, 0, w, 90, "F");
  doc.setTextColor(255, 255, 255);
  if (logoPng) {
    // Draw logo at native aspect (199.5:58). Height ~30pt.
    const logoH = 30;
    const logoW = logoH * LOGO_ASPECT;
    try {
      doc.addImage(logoPng, "PNG", 40, 24, logoW, logoH);
    } catch {
      doc.setFont("helvetica", "bold").setFontSize(22).text("FinFlow AI", 40, 42);
    }
  } else {
    doc.setFont("helvetica", "bold").setFontSize(22).text("FinFlow AI", 40, 42);
  }
  doc.setFont("helvetica", "normal").setFontSize(11).text(pdfSafe(subtitle), 40, 72);
  doc.setFontSize(9).text(new Date().toLocaleString(), w - 40, 42, { align: "right" });
  if (meta) doc.text(pdfSafe(meta), w - 40, 58, { align: "right" });
  doc.setTextColor(30, 30, 30);
  ctx.y = 120;
}

export function pdfFooter(ctx: PdfCtx, note: string): void {
  const { doc, w, h } = ctx;
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "italic").setFontSize(8).setTextColor(120);
    doc.text(pdfSafe(note), 40, h - 24);
    doc.text(`Page ${p} of ${pageCount}`, w - 40, h - 24, { align: "right" });
  }
}

export function pdfTable(
  ctx: PdfCtx,
  cols: { label: string; x: number; align?: "left" | "right" }[],
  rows: string[][],
  lineHeight = 14,
): void {
  const { doc, w, margin } = ctx;
  ensureRoom(ctx, lineHeight * 2);
  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(60, 60, 70);
  cols.forEach((c) => {
    const x = c.align === "right" ? w - margin : c.x;
    doc.text(pdfSafe(c.label), x, ctx.y, c.align === "right" ? { align: "right" } : undefined);
  });
  ctx.y += lineHeight;
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(30, 30, 30);
  rows.forEach((row) => {
    ensureRoom(ctx, lineHeight);
    row.forEach((val, idx) => {
      const c = cols[idx];
      if (!c) return;
      const x = c.align === "right" ? w - margin : c.x;
      const maxWidth = (cols[idx + 1]?.x ?? w - margin) - c.x - 4;
      const wrapped = doc.splitTextToSize(pdfSafe(val), Math.max(60, maxWidth));
      doc.text(wrapped, x, ctx.y, c.align === "right" ? { align: "right" } : undefined);
    });
    ctx.y += lineHeight;
  });
}
