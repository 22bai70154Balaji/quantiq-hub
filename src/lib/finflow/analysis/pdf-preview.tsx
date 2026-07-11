import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Loader2, X } from "lucide-react";
import { exportPdf, chartsAsImages, type PdfExportOptions } from "./export-pdf";

type Props = {
  open: boolean;
  onClose: () => void;
  options: PdfExportOptions | null;
};

/**
 * PDF preview modal.
 * Renders an HTML representation of the report (identical data to the PDF)
 * instead of embedding the PDF blob in an iframe — Chrome blocks blob-PDF
 * iframes on many setups. Clicking "Download PDF" builds and saves the
 * real jsPDF file.
 */
export function PdfPreviewModal({ open, onClose, options }: Props) {
  const [chartImages, setChartImages] = useState<string[]>([]);
  const [buildingPreview, setBuildingPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const timestamp = useMemo(() => new Date().toLocaleString(), [options?.reportId]);

  useEffect(() => {
    if (!open || !options) {
      setChartImages([]);
      return;
    }
    let cancelled = false;
    setBuildingPreview(true);
    setChartImages([]);
    (async () => {
      const ids = options.chartNodeIds ?? [];
      if (!ids.length) {
        if (!cancelled) setBuildingPreview(false);
        return;
      }
      try {
        const imgs = await chartsAsImages(ids);
        if (!cancelled) setChartImages(imgs);
      } finally {
        if (!cancelled) setBuildingPreview(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, options]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !options || typeof document === "undefined") return null;

  const { payload, reportId, shareUrl, insights } = options;

  const download = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await exportPdf(options);
    } finally {
      setDownloading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/70 backdrop-blur-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-background/95 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">Report preview</div>
          <div className="truncate font-display text-lg font-semibold tracking-tight">{payload.title}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={download}
            disabled={downloading || buildingPreview}
            className="cta-glow inline-flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Download PDF
          </button>
          <button
            onClick={onClose}
            aria-label="Close preview"
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card/60 text-muted-foreground transition hover:bg-card"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body: HTML replica of the PDF */}
      <div className="flex-1 overflow-y-auto bg-neutral-200 p-4 sm:p-8 dark:bg-neutral-900">
        <div className="mx-auto max-w-3xl">
          <article className="rounded-md bg-white p-8 text-neutral-900 shadow-2xl sm:p-12">
            {/* Header */}
            <header className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-5">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-500">Calculyx AI</div>
                <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-neutral-900">
                  {payload.title}
                </h1>
                {payload.subtitle && (
                  <p className="mt-1 text-sm text-neutral-600">{payload.subtitle}</p>
                )}
              </div>
              <div className="text-right text-[11px] leading-relaxed text-neutral-500">
                <div><span className="font-mono">Report ID</span></div>
                <div className="font-mono text-neutral-900">{reportId}</div>
                <div className="mt-2 font-mono">{timestamp}</div>
              </div>
            </header>

            {/* Inputs */}
            {payload.inputs?.length > 0 && (
              <section className="mt-6">
                <SectionHeading>Your inputs</SectionHeading>
                <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                  {payload.inputs.map((i, idx) => (
                    <div key={idx} className="flex items-baseline justify-between gap-3 border-b border-dashed border-neutral-200 py-1.5">
                      <dt className="text-xs text-neutral-500">{i.label}</dt>
                      <dd className="font-mono text-sm text-neutral-900 tabular-nums">{String(i.value)}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            {/* KPIs */}
            {payload.kpis?.length > 0 && (
              <section className="mt-6">
                <SectionHeading>Results</SectionHeading>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {payload.kpis.map((k, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg border p-3 ${
                        k.tone === "primary" ? "border-indigo-200 bg-indigo-50"
                        : k.tone === "success" ? "border-emerald-200 bg-emerald-50"
                        : k.tone === "warning" ? "border-amber-200 bg-amber-50"
                        : k.tone === "destructive" ? "border-rose-200 bg-rose-50"
                        : "border-neutral-200 bg-neutral-50"
                      }`}
                    >
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">{k.label}</div>
                      <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-neutral-900">{String(k.value)}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Charts */}
            {(chartImages.length > 0 || buildingPreview) && (
              <section className="mt-6">
                <SectionHeading>Charts</SectionHeading>
                {buildingPreview && chartImages.length === 0 ? (
                  <div className="mt-3 flex h-40 items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-xs text-neutral-500">
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Capturing charts…
                  </div>
                ) : (
                  <div className="mt-3 grid grid-cols-1 gap-4">
                    {chartImages.map((src, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={src} alt={`Chart ${i + 1}`} className="w-full rounded-md border border-neutral-200" />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* AI Insights */}
            {insights && (insights.summary || (insights.recommendations && insights.recommendations.length > 0)) && (
              <section className="mt-6">
                <SectionHeading>AI Insights</SectionHeading>
                <div className="mt-3 rounded-lg border-l-4 border-indigo-500 bg-indigo-50/60 p-4">
                  {insights.summary && (
                    <p className="text-sm leading-relaxed text-neutral-800">{insights.summary}</p>
                  )}
                  {insights.recommendations && insights.recommendations.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {insights.recommendations.map((r, i) => (
                        <li key={i} className="flex gap-2 text-sm text-neutral-800">
                          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-indigo-500" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            )}

            {/* Assumptions */}
            {payload.assumptions && payload.assumptions.length > 0 && (
              <section className="mt-6">
                <SectionHeading>Assumptions & notes</SectionHeading>
                <ul className="mt-3 space-y-1.5">
                  {payload.assumptions.map((a, i) => (
                    <li key={i} className="flex gap-2 text-xs text-neutral-600">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neutral-400" />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Footer */}
            <footer className="mt-8 border-t border-neutral-200 pt-4 text-[10px] text-neutral-500">
              <div>Calculyx AI · Estimates only, not financial advice. Verify with your bank or advisor.</div>
              {shareUrl && <div className="mt-1 font-mono break-all">{shareUrl}</div>}
            </footer>
          </article>
          <p className="mx-auto mt-4 max-w-3xl text-center text-[11px] text-neutral-400">
            This is a preview. Click <span className="font-semibold text-neutral-200">Download PDF</span> to save the fully-formatted report.
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-500">
      {children}
    </h2>
  );
}
