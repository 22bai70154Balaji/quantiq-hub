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

// Inline SVG of the FinFlow AI wordmark logo, rasterized on demand for PDFs.
// Wordmark rendered white for placement on the dark PDF header band.
const FINFLOW_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 199.5 58"><defs><linearGradient id="ffpdf" x1="11.69" x2="44.13" y1="40.4" y2="13.8" gradientUnits="userSpaceOnUse"><stop stop-color="#00B3DE" offset="0.1"/><stop stop-color="#1F5AF4" offset="1"/></linearGradient></defs><g fill="#FFFFFF"><path d="m57.6 19h14.3v3.6h-10.2v5h8.8v3.7h-8.8v8.2h-4.1v-20.5z"/><path d="m74.1 19h4.1v4h-4.2l0.1-4zm0 5.5h4.1v15h-4.1v-15z"/><path d="m81.5 24.5h3.5l0.1 1.7c0.7-0.9 2-2 4.3-2 3.9 0 5.8 2.3 5.8 6v9.3h-3.8v-8.6c0-1.9-1.1-3.1-2.9-3.1s-2.9 1.4-3.1 3v8.8h-3.9v-15.1z"/><path d="m98.5 19h13.6v3.6h-9.6v5.2h8.7v3.5h-8.7v8.2h-4v-20.5z"/><path d="m114.8 18.8h3.9v20.6h-3.9v-20.6z"/><path d="m129.3 24.2c4.5-0.1 8.2 3.1 8.3 7.6s-2.8 7.9-7.8 7.9c-4.1 0-8.2-2.5-8.3-7.7 0-4 3-7.6 7.8-7.8zm0.2 12.1c2.1 0 4.1-1.4 4.1-4.2 0-2.5-1.7-4.4-4-4.4-2 0-4.1 1.6-4 4.3 0 2.6 1.9 4.3 3.9 4.3z"/><path d="m138.5 24.5h4.3l2.9 9.3 3.3-9.3h3.8l3 9.3 2.8-9.3h4.3l-5.3 15h-3.6l-3.1-9.8-3.5 9.8h-3.6l-5.3-15z"/></g><g fill="#B9C0C7"><path d="m175.5 19h2.8l7.3 20.5h-2.6l-1.8-5.2h-9.1l-2 5.2h-2.7l8.1-20.5zm-2.7 13.2h7.6l-3.5-10.4-4.1 10.4z"/><path d="m188.2 19h2.5v20.5h-2.5v-20.5z"/></g><path d="m20.8 17.4c1.4-3.1 4.2-6.3 6.9-8h-5.3c-7 0-13.2 5.2-13.2 13.1v11.3c1.9-3 4.7-5.8 7.5-7.6l-0.1-3.6c0-2.3 1.9-4.8 4.2-5.2z" fill="#1F5AF4"/><path d="m22.2 38.6v9.8c4.3 0 7.4-3.2 7.4-7.1v-5.2h-0.8c-2.3-0.2-5 1-6.6 2.5z" fill="#00B3DA"/><path d="m37.6 9.6c-7.6 0-15.4 6.2-15.4 15.3v1.8c-5 1.3-13 6.8-13 17.4v4.4h7.4v-3.6c0-7.3 5.9-11.5 11.8-11.5h6.8c2.7 0.1 6.4-3.2 6.5-7.6h-11.9v-0.8c0-4.4 3.5-7.8 7.6-7.8h4.1c3.7 0 7.6-2.8 7.6-7.6h-11.5z" fill="url(#ffpdf)"/></svg>`;

const LOGO_ASPECT = 199.5 / 58;

let logoPngCache: string | null = null;

/** Rasterize the FinFlow logo SVG to a PNG data URL for embedding in PDFs. Browser-only. */
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
    // Draw logo at native aspect ratio (247:55). Height ~28pt.
    const logoH = 28;
    const logoW = logoH * (247 / 55);
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
