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
const FINFLOW_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="6 18.5 247 55"><defs><linearGradient id="a" x1="33.5" x2="91.3" y1="-577.1" y2="-577.1" gradientTransform="matrix(1 0 0 -1 0 -546)" gradientUnits="userSpaceOnUse"><stop stop-color="#014A92" offset="0"/><stop stop-color="#0BE8FB" offset="1"/></linearGradient><linearGradient id="b" x1="34.44" x2="99.4" y1="-586.7" y2="-586.7" gradientTransform="matrix(1 0 0 -1 0 -546)" gradientUnits="userSpaceOnUse"><stop stop-color="#015FA9" offset="0"/><stop stop-color="#0BE8FB" offset=".8465"/></linearGradient></defs><path d="m19 19c-0.9 0.6-1.6 1.8-1.6 3.1v50.2c0 1.8 1.4 3.1 3.2 3.1h13.4c4-0.7 6.3-3.5 7.6-4.4h-5.6c-0.6 0.1-1.2-0.4-1.2-1.1v-7.8c0-0.6 0.5-1.2 1.2-1.2h6.3l1.2-3.9h-6.5c-0.7 0-1.3-0.6-1.3-1.3v-5.6c0-0.6 0.5-1.1 1.2-1.1l11.5-0.1-1.2-3.8v-7.2l7.5-1.2c0.6-1.2 1.1-2.6 1.7-3.9 2.1-4.7 5.7-10.6 11.8-13.8h-47.7-1.5zm11.3 48.3c0 0.6-0.5 1.2-1.2 1.2h-6.1c-0.7 0-1.2-0.5-1.2-1.2v-5.3c0-0.6 0.5-1.2 1.2-1.2h6.2c0.6 0 1.2 0.5 1.2 1.2v5.3h-0.1zm0-11.6c0 0.6-0.5 1.2-1.2 1.2h-6.1c-0.7 0-1.2-0.5-1.2-1.2v-5.5c0-0.7 0.5-1.2 1.2-1.2h6.2c0.7 0 1.2 0.5 1.2 1.2v5.5h-0.1zm0-12.1c0 0.6-0.5 1.2-1.2 1.2h-6.1c-0.7 0-1.2-0.5-1.2-1.2v-5.6c0-0.7 0.5-1.2 1.1-1.2h6.1c0.7 0 1.3 0.5 1.3 1.2v5.6zm13.2 23.5c0 0.8-0.6 1.4-1.2 1.4h-6.4c-0.6 0-1.1-0.5-1.1-1.2v-5.3c0-0.7 0.5-1.2 1.2-1.2h6c0.8 0 1.5 0.6 1.5 1.3v5zm-0.4-10.3h-7.2l-0.4-0.5v-6.1l0.6-1.2h5.6c1.3 0 2.1 0.7 2.1 1.4l-0.1 6.1-0.6 0.3zm-0.3-11.8h-6.9l-0.6-0.7v-6.3l0.7-1.2h6l1.1 0.4 0.3 1v6.1l-0.6 0.7zm13.6-13.3c0 0.6-0.5 1.1-1 1.1h-32.7c-0.6 0-1.1-0.5-1.1-1.2v-7.1c0-0.6 0.4-1.1 1-1.1h32.7c0.6 0 1 0.5 1 1.1l0.1 7.2z" fill="#ffffff"/><path d="m89.9 23.9c-2.3-3-6-4.9-10.8-5-9.9-0.2-15.8 5.7-19.4 13.8-3.2 7.5-6.2 11.9-11.3 12.8-3.4 1.2-9.8 1.3-12.7 1v2.7l7.3 1.8 4.4-2.1 1.1 0.3h6.2l7.2 12.6 26.7-13.3c-4.9 0-9.5-3.1-10.6-7.2-1.4-5.2 2.9-9.9 7.5-10.3 2.9-0.2 5.6 1.2 7.6 3.8v-3.2c-0.1-3.3-1.7-6.1-3.2-7.7z" fill="url(#a)"/><path d="m85.3 45c-3.9-0.5-8.1-3.2-8.5-7.8-0.3-4.2 3-8.2 7.4-8.2 3.3 0 5.6 1.7 7.1 2.8-1.3-2.3-5-5.7-10.2-5.7-8.7 0-12 5-15.1 9.9-3.7 6.1-7.3 12.3-14 12.9-2.2 0.1-3.4 0-3.4 0l-3.1 8v7.4c-1.5 1.5-1.9 3.1-2.1 4.5-0.6 1.3-6.4 4.9-9 6.3h18.5c5.5 0 9-1.5 11.9-4 4.5-4.1 6.2-6.7 12.8-6.7h3.6c1.8 0 2.7-0.8 2.7-2.4s-0.9-2.1-2.6-2.1h-14.2l-0.1-3.5 11.3-1.4h4.2c1.5 0 2.5-0.6 2.5-2.2s-1-2.4-2.3-2.4h-8.1l12.4-1.5 10.9-1.9c1.5 0 1.6-2 0-2h-12.6z" fill="url(#b)"/><path d="m54.9 48.8h-6.1c-0.8 0-1.3 0.6-1.3 1.3v17.1c0 0.7 0.5 1.3 1.3 1.3h6c0.8 0 1.4-0.6 1.4-1.3l-0.1-17c0.1-0.7-0.5-1.4-1.2-1.4z" fill="#0CE8F8"/><path d="m83.3 52.6h-9.5c-1.1 0-1.8 0.7-1.8 1.7 0 1.1 0.7-1.5 1.6-1.7l-1.5-0.1c0.2 1 0.7 0.1 1.8 0.1h9.4c1 0 1.9 0.9 1.9 2s-0.9 1.9-1.9 1.9h-16.6c-0.8 0-1.6 0.8-1.6 1.8 0 0.9 0.8 1.7 1.6 1.7h13.7c1.2 0 2 0.8 2 2 0 1.1-0.8 1.9-2 1.9h-6c-5.8 0-7.2 1.8-10.9 5l4.5-4.4-3-2.5-0.5-0.8 0.6-4.2v-2l1.4-3.2 4.4-2.9 3.7 0.1h8.7c1.1 0 2 1 2 2s-1 1.6-2 1.6z" fill="#0CE8F8"/><path d="m86.2 60.3h4.2c1 0 1.7 0.8 1.7 1.9 0 1.2-0.8 1.9-1.7 1.9h-3.8c-1 0-1.9-0.8-1.9-1.9 0-0.9 0.7-1.9 1.5-1.9z" fill="#0D6BB2"/><path d="m88.2 54.1h4.2c1 0 2.7 0.7 2.6 2.1-0.1 1.7-1.3 0-2 0l-3 0.3-1.6-0.1-0.8-0.7v-1l0.6-0.6z" fill="#78DEB6"/><path d="m62.5 73c3.5-1.7 6.5-6.5 10.9-6.8h7.2c-1.3 1.7-6.4 6.7-14.3 6.9h-4.3l0.5-0.1z" fill="#78DEB6"/><path d="m84.9 48.9h12.9c1.2 0 1.3-3.9-0.9-3.9h-12v3.9z" fill="#0CE8F8"/><path d="m47.3 43.5v-5.5l1-1.4 5.6-0.1c-1.3 2.8-4.1 6-6.6 7z" fill="#78DEB6"/><path d="m91.5 34.6 1.7 2.1c-2.1 1.2-6.8 4.9-8.7 5.7h8.1l3.7-2.6 1.9 2.5 3.5-8.5-10.2 0.8z" fill="#78DEB6"/><path d="m88.5 52.6h4.5c1.1 0 2 0.9 2 1.9s-0.9 1.9-2 1.9h-3.5c-1.1 0-2-0.8-2-1.9s0.8-1.9 1-1.9z" fill="#78DEB6"/><g fill="#ffffff"><path d="m108.4 55.8v-19h13.6v3.6h-9.2v4.8h8.1v3.8h-8.1v6.8h-4.4z"/><path d="m126.3 35c1.3 0 2.3 1 2.3 2.3 0 1.4-1.1 2.3-2.3 2.3-1.4 0-2.3-1-2.3-2.3-0.1-1.3 0.9-2.3 2.3-2.3zm-1.9 20.8v-14.3h3.9v14.3h-3.9z"/><path d="m132 41.5h3.8l0.1 1.6c0.7-1 2.2-1.9 4.4-1.9 2.6 0 5.2 1.5 5.2 5.9v8.7h-3.9v-7.8c0-1.8-0.9-3.2-2.7-3.2-2 0-3.1 1.4-3.1 3.5v7.5h-3.9l0.1-14.3z"/><path d="m148.5 55.8v-19h13.3v3.6h-9v5.1h8.1v3.5h-8.1v6.8h-4.3z"/><path d="m164.4 55.8v-19.9h4v19.9h-4z"/><path d="m170.9 48.6c0-4.5 3.1-7.4 7.2-7.4 4.2 0 7.4 2.8 7.4 7.3s-3 7.6-7.3 7.6-7.3-2.9-7.3-7.5zm10.8 0c0-2.3-1.3-3.9-3.3-3.9-2.1 0-3.4 1.5-3.4 4 0 2.3 1.4 3.9 3.4 3.9s3.3-1.7 3.3-4z"/><path d="m205.1 41.5h3.9l-4 14.3h-4l-2.8-8.8-2.9 8.8h-3.9l-4.8-14.3h4l3 9.7 3-9.7h3.6l2.8 9.7 2.9-9.7h-0.8z"/><path d="m224.4 36.8h3.9l7.7 19h-4.2l-1.5-3.9h-7.8l-1.6 3.9h-4.3l7.8-19zm-1 11.8h5.5l-2.9-7.4-2.7 7.4h0.1z"/><path d="m237.3 36.8h4.1v19h-4.1v-19z"/></g></svg>`;

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
    // SVG viewBox is 247x55 => aspect ~4.49
    const ratio = 55 / 247;
    const canvas = document.createElement("canvas");
    canvas.width = pixelWidth;
    canvas.height = Math.round(pixelWidth * ratio);
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
