import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import {
  createPdfCtx,
  ensureRoom,
  loadFinflowLogoPng,
  pdfFooter,
  pdfHeader,
  pdfKv,
  pdfSafe,
  pdfSection,
  pdfTable,
} from "@/lib/finflow/pdf";
import type { AnalysisPayload } from "@/lib/finflow/analysis/types";
import type { AnalysisInsights } from "@/lib/finflow/analysis/insights.functions";

async function chartsAsImages(nodeIds: string[]): Promise<string[]> {
  const out: string[] = [];
  for (const id of nodeIds) {
    const el = document.getElementById(id);
    if (!el) continue;
    try {
      const dataUrl = await toPng(el, {
        cacheBust: true,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        style: { background: "#ffffff" },
      });
      out.push(dataUrl);
    } catch {
      // skip that chart
    }
  }
  return out;
}

async function qrDataUrl(url: string): Promise<string | null> {
  try {
    return await QRCode.toDataURL(url, { margin: 1, width: 220, color: { dark: "#0b0d17", light: "#ffffff" } });
  } catch {
    return null;
  }
}

export type PdfExportOptions = {
  payload: AnalysisPayload;
  reportId: string;
  shareUrl?: string;
  chartNodeIds?: string[];
  insights?: AnalysisInsights | null;
};

export async function exportPdf({ payload, reportId, shareUrl, chartNodeIds, insights }: PdfExportOptions): Promise<void> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const ctx = createPdfCtx(doc, 40);
  const logo = await loadFinflowLogoPng();

  pdfHeader(ctx, pdfSafe(payload.title), `Report ID  ${reportId}`, logo);
  if (payload.subtitle) {
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(80);
    doc.text(pdfSafe(payload.subtitle), ctx.margin, ctx.y);
    ctx.y += 16;
  }

  // KPI grid
  pdfSection(ctx, "Summary");
  const cols = 3;
  const gap = 12;
  const cardW = (ctx.w - ctx.margin * 2 - gap * (cols - 1)) / cols;
  const cardH = 58;
  payload.kpis.slice(0, 6).forEach((k, i) => {
    const col = i % cols;
    if (col === 0) ensureRoom(ctx, cardH + 8);
    const x = ctx.margin + col * (cardW + gap);
    const y = ctx.y;
    doc.setDrawColor(220).setFillColor(248, 249, 252).roundedRect(x, y, cardW, cardH, 8, 8, "FD");
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(110);
    doc.text(pdfSafe(k.label.toUpperCase()), x + 10, y + 16);
    doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(20, 22, 34);
    doc.text(pdfSafe(k.value), x + 10, y + 36);
    if (k.sub) {
      doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(120);
      doc.text(pdfSafe(k.sub), x + 10, y + 50);
    }
    if (col === cols - 1 || i === payload.kpis.length - 1) ctx.y += cardH + 8;
  });

  // Inputs
  pdfSection(ctx, "Inputs");
  payload.inputs.forEach((i) => pdfKv(ctx, i.label, i.value));

  // Charts
  if (chartNodeIds?.length) {
    const images = await chartsAsImages(chartNodeIds);
    if (images.length) {
      pdfSection(ctx, "Visualisations");
      for (const img of images) {
        const imgW = ctx.w - ctx.margin * 2;
        const imgH = imgW * 0.5;
        ensureRoom(ctx, imgH + 16);
        try {
          doc.addImage(img, "PNG", ctx.margin, ctx.y, imgW, imgH);
          ctx.y += imgH + 12;
        } catch {
          // skip
        }
      }
    }
  }

  // Breakdown (first 40 rows, then a note)
  if (payload.breakdown) {
    pdfSection(ctx, "Breakdown");
    const bd = payload.breakdown;
    const rowsForPdf = (bd.yearlyRows?.length ? bd.yearlyRows : bd.rows).slice(0, 40);
    const colDefs = bd.columns.map((c, idx) => ({
      label: c.label,
      x: ctx.margin + idx * ((ctx.w - ctx.margin * 2) / bd.columns.length),
      align: c.align === "right" ? ("right" as const) : ("left" as const),
    }));
    pdfTable(
      ctx,
      colDefs,
      rowsForPdf.map((r) => bd.columns.map((c) => String(r[c.key] ?? ""))),
    );
    const total = bd.yearlyRows?.length ?? bd.rows.length;
    if (total > rowsForPdf.length) {
      doc.setFont("helvetica", "italic").setFontSize(9).setTextColor(120);
      ensureRoom(ctx, 14);
      doc.text(`Showing first ${rowsForPdf.length} of ${total} rows. Full data in the CSV/Excel export.`, ctx.margin, ctx.y);
      ctx.y += 14;
    }
  }

  // Comparison
  if (payload.comparison) {
    pdfSection(ctx, payload.comparison.title);
    const cmp = payload.comparison;
    const colWidth = (ctx.w - ctx.margin * 2) / (cmp.options.length + 1);
    const cd = [
      { label: "Metric", x: ctx.margin },
      ...cmp.options.map((o, i) => ({
        label: o,
        x: ctx.margin + colWidth * (i + 1),
        align: "right" as const,
      })),
    ];
    pdfTable(
      ctx,
      cd,
      cmp.rows.map((r) => [r.label, ...r.values]),
    );
  }

  // AI Insights — rendered inside a bordered card
  if (insights) {
    const pad = 16;
    const contentW = ctx.w - ctx.margin * 2 - pad * 2;
    const summaryLines = doc.splitTextToSize(pdfSafe(insights.summary), contentW);

    type Block = { title: string; items: string[] };
    const blocks: Block[] = [
      { title: "Recommendations", items: insights.recommendations ?? [] },
      { title: "Risks to watch", items: insights.risks ?? [] },
      { title: "Next steps", items: insights.nextSteps ?? [] },
    ].filter((b) => b.items.length > 0);

    const wrappedBlocks = blocks.map((b) => ({
      title: b.title,
      lines: b.items.map((it) => doc.splitTextToSize(`• ${pdfSafe(it)}`, contentW - 8) as string[]),
    }));

    // Measure total inner height
    const titleH = 22;
    const summaryH = summaryLines.length * 14 + 6;
    let blocksH = 0;
    wrappedBlocks.forEach((b) => {
      blocksH += 16; // block heading
      b.lines.forEach((ls) => { blocksH += ls.length * 13; });
      blocksH += 8;  // spacing after block
    });
    const confH = 18;
    const innerH = titleH + summaryH + blocksH + confH;
    const boxH = innerH + pad * 2;

    ensureRoom(ctx, boxH + 8);
    const boxX = ctx.margin;
    const boxY = ctx.y;
    const boxW = ctx.w - ctx.margin * 2;
    doc.setFillColor(246, 248, 252).setDrawColor(210, 216, 230).roundedRect(boxX, boxY, boxW, boxH, 10, 10, "FD");
    // Left accent bar
    doc.setFillColor(90, 96, 220).roundedRect(boxX, boxY, 4, boxH, 2, 2, "F");

    let iy = boxY + pad;
    doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(30, 30, 60);
    doc.text("AI Insights", boxX + pad, iy + 10);
    iy += titleH;

    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(35, 35, 45);
    doc.text(summaryLines, boxX + pad, iy);
    iy += summaryH;

    wrappedBlocks.forEach((b) => {
      doc.setFont("helvetica", "bold").setFontSize(10.5).setTextColor(20, 22, 34);
      doc.text(pdfSafe(b.title), boxX + pad, iy);
      iy += 14;
      doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(35, 35, 45);
      b.lines.forEach((ls) => {
        doc.text(ls, boxX + pad + 8, iy);
        iy += ls.length * 13;
      });
      iy += 8;
    });

    doc.setFont("helvetica", "italic").setFontSize(9).setTextColor(120);
    doc.text(`Confidence: ${insights.confidence}`, boxX + pad, iy + 4);

    ctx.y = boxY + boxH + 14;
  }

  // Assumptions
  if (payload.assumptions?.length) {
    pdfSection(ctx, "Assumptions used");
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(30);
    payload.assumptions.forEach((a) => {
      const wrapped = doc.splitTextToSize(`• ${pdfSafe(a)}`, ctx.w - ctx.margin * 2 - 8);
      ensureRoom(ctx, wrapped.length * 13 + 2);
      doc.text(wrapped, ctx.margin + 8, ctx.y);
      ctx.y += wrapped.length * 13;
    });
  }

  // QR + share URL
  if (shareUrl) {
    pdfSection(ctx, "Shareable link");
    const qr = await qrDataUrl(shareUrl);
    ensureRoom(ctx, 130);
    const qrSize = 110;
    if (qr) {
      try { doc.addImage(qr, "PNG", ctx.margin, ctx.y, qrSize, qrSize); } catch { /* skip */ }
    }
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(30);
    doc.text("Scan or open:", ctx.margin + qrSize + 16, ctx.y + 22);
    doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(20, 22, 34);
    const wrappedUrl = doc.splitTextToSize(pdfSafe(shareUrl), ctx.w - ctx.margin - (ctx.margin + qrSize + 16));
    doc.text(wrappedUrl, ctx.margin + qrSize + 16, ctx.y + 40);
    ctx.y += qrSize + 12;
  }

  pdfFooter(
    ctx,
    "Calculyx AI · Estimates only, not financial advice. Verify with your bank or advisor.",
  );

  doc.save(`${reportId}.pdf`);
}
