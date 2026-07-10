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

export function pdfHeader(ctx: PdfCtx, subtitle: string, meta?: string): void {
  const { doc, w } = ctx;
  doc.setFillColor(17, 24, 39).rect(0, 0, w, 90, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold").setFontSize(22).text("FinFlow AI", 40, 42);
  doc.setFont("helvetica", "normal").setFontSize(11).text(pdfSafe(subtitle), 40, 62);
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
