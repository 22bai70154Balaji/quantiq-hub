import { useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, Download, Share2, Sparkles, Printer, FileText, FileSpreadsheet, FileType2, Loader2, Link2, Check, X, Globe } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import type { AnalysisPayload } from "@/lib/finflow/analysis/types";
import type { AnalysisInsights } from "@/lib/finflow/analysis/insights.functions";
import { toggleCalculationShare } from "@/lib/finflow/analysis/calculations.functions";
import { exportCsv, exportXlsx } from "@/lib/finflow/analysis/export-data";
import { type PdfExportOptions } from "@/lib/finflow/analysis/export-pdf";
import { PdfPreviewModal } from "@/lib/finflow/analysis/pdf-preview";

export type SavedState = {
  id: string;
  reportId: string;
  shareSlug: string | null;
  isPublic: boolean;
};

export function AnalysisActions({
  payload,
  chartNodeIds,
  insights,
  saved,
  onSaved,
  signedIn,
  saving,
  aiLoading,
  onRunAi,
  onEnsureSaved,
}: {
  payload: AnalysisPayload;
  chartNodeIds: string[];
  insights: AnalysisInsights | null;
  saved: SavedState | null;
  onSaved: (s: SavedState) => void;
  signedIn: boolean | null;
  saving: boolean;
  aiLoading: boolean;
  onRunAi: () => void;
  onEnsureSaved: () => Promise<SavedState | null>;
}) {
  void signedIn;
  const [exporting, setExporting] = useState<null | "pdf" | "csv" | "xlsx">(null);
  const [copied, setCopied] = useState(false);
  const [togglingShare, setTogglingShare] = useState(false);
  const [openExport, setOpenExport] = useState(false);
  const [openShare, setOpenShare] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<PdfExportOptions | null>(null);
  const toggleShare = useServerFn(toggleCalculationShare);

  const shareUrl = saved?.shareSlug ? `${typeof window !== "undefined" ? window.location.origin : ""}/r/${saved.shareSlug}` : null;

  async function doExport(kind: "pdf" | "csv" | "xlsx") {
    if (exporting) return;
    setExporting(kind);
    setOpenExport(false);
    try {
      let s = saved;
      let url: string | undefined;
      if (kind === "pdf") {
        s = await onEnsureSaved();
        if (s && !s.shareSlug) {
          try {
            const updated = await toggleShare({ data: { id: s.id, makePublic: true } });
            s = { ...s, isPublic: !!updated.is_public, shareSlug: updated.share_slug ?? null };
            onSaved(s);
          } catch { /* PDF still works without QR */ }
        }
        url = s?.shareSlug ? `${window.location.origin}/r/${s.shareSlug}` : undefined;
      }
      const reportId = s?.reportId || `FF-${new Date().getFullYear()}-DRAFT`;

      if (kind === "csv") exportCsv(payload, reportId);
      else if (kind === "xlsx") exportXlsx(payload, reportId);
      else {
        // Open preview instead of downloading immediately
        setPdfPreview({ payload, reportId, shareUrl: url, chartNodeIds, insights });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(null);
    }
  }

  async function copyShare() {
    const s = await onEnsureSaved();
    if (!s) return;
    let publicSlug = s.shareSlug;
    if (!publicSlug || !s.isPublic) {
      setTogglingShare(true);
      try {
        const updated = await toggleShare({ data: { id: s.id, makePublic: true } });
        publicSlug = updated.share_slug ?? null;
        onSaved({ ...s, shareSlug: publicSlug, isPublic: !!updated.is_public });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Share failed");
        return;
      } finally {
        setTogglingShare(false);
      }
    }
    if (!publicSlug) return;
    const url = `${window.location.origin}/r/${publicSlug}`;
    try {
      if (typeof navigator !== "undefined" && "share" in navigator) {
        try {
          await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share({ title: payload.title, url });
          return;
        } catch { /* fall through to clipboard */ }
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Share link copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy link");
    }
  }

  async function makePrivate() {
    if (!saved) return;
    setTogglingShare(true);
    try {
      const updated = await toggleShare({ data: { id: saved.id, makePublic: false } });
      onSaved({ ...saved, isPublic: !!updated.is_public });
      toast.success("Report is now private");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setTogglingShare(false);
    }
  }

  return (
    <>
    <PdfPreviewModal open={!!pdfPreview} onClose={() => setPdfPreview(null)} options={pdfPreview} />
    <motion.div
      initial={{ y: 6, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex flex-wrap items-center justify-end gap-2 print:hidden"
    >
      <button
        onClick={onEnsureSaved}
        disabled={saving}
        className="inline-flex items-center gap-1.5 rounded-full border border-sheen glass px-4 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bookmark className="h-3.5 w-3.5" />}
        {saved ? "Saved" : "Save"}
      </button>

      <button
        data-ai-run
        onClick={onRunAi}
        disabled={aiLoading}
        className="inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-4 py-1.5 text-sm font-medium text-primary-foreground shadow-elegant hover:opacity-90 disabled:opacity-60"
      >
        {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        AI Insights
      </button>

      <div className="relative">
        <button
          onClick={() => setOpenExport((o) => !o)}
          disabled={!!exporting}
          className="inline-flex items-center gap-1.5 rounded-full border border-sheen glass px-4 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-60"
        >
          {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          Export
        </button>
        {openExport && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpenExport(false)} />
            <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-sheen glass p-1 shadow-elegant">
              <ExportItem icon={FileType2} label="Premium PDF" hint="Branded report + QR" onClick={() => doExport("pdf")} />
              <ExportItem icon={FileSpreadsheet} label="Excel workbook" hint="Multi-sheet .xlsx" onClick={() => doExport("xlsx")} />
              <ExportItem icon={FileText} label="CSV data" hint="Rows + inputs" onClick={() => doExport("csv")} />
              <div className="my-1 h-px bg-border/60" />
              <ExportItem icon={Printer} label="Print" hint="Uses browser print" onClick={() => { setOpenExport(false); window.print(); }} />
            </div>
          </>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => setOpenShare((o) => !o)}
          className="inline-flex items-center gap-1.5 rounded-full border border-sheen glass px-4 py-1.5 text-sm font-medium hover:bg-muted"
        >
          <Share2 className="h-3.5 w-3.5" /> Share
        </button>
        {openShare && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpenShare(false)} />
            <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-sheen glass p-3 shadow-elegant text-sm">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Globe className="h-3.5 w-3.5" />
                {saved?.isPublic ? "This report is publicly shareable" : "Sharing creates a public read-only link"}
              </div>
              <button
                onClick={copyShare}
                disabled={togglingShare}
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-1.5 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {togglingShare ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                {copied ? "Copied" : saved?.isPublic ? "Copy public link" : "Publish & copy link"}
              </button>
              {shareUrl && (
                <div className="mt-3 space-y-2">
                  <SocialLinks url={shareUrl} title={payload.title} />
                  {saved?.isPublic && (
                    <button
                      onClick={makePrivate}
                      disabled={togglingShare}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border px-4 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                    >
                      <X className="h-3 w-3" /> Make private
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
    </>
  );
}


function ExportItem({ icon: Icon, label, hint, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; hint: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-muted"
    >
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-muted"><Icon className="h-4 w-4" /></div>
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="truncate text-xs text-muted-foreground">{hint}</div>
      </div>
    </button>
  );
}

function SocialLinks({ url, title }: { url: string; title: string }) {
  const enc = encodeURIComponent;
  const shares: { label: string; href: string }[] = [
    { label: "WhatsApp", href: `https://wa.me/?text=${enc(`${title} — ${url}`)}` },
    { label: "X (Twitter)", href: `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}` },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}` },
    { label: "Email", href: `mailto:?subject=${enc(title)}&body=${enc(url)}` },
  ];
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {shares.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border bg-card/60 px-3 py-1.5 text-center text-xs hover:bg-muted"
        >
          {s.label}
        </a>
      ))}
    </div>
  );
}
