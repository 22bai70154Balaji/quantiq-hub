import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Loader2, X } from "lucide-react";
import type jsPDF from "jspdf";
import { buildPdfPreviewUrl, type PdfExportOptions } from "./export-pdf";

type Props = {
  open: boolean;
  onClose: () => void;
  options: PdfExportOptions | null;
};

export function PdfPreviewModal({ open, onClose, options }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [doc, setDoc] = useState<jsPDF | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !options) return;
    let cancelled = false;
    let localUrl: string | null = null;
    setLoading(true);
    setError(null);
    setUrl(null);
    setDoc(null);
    buildPdfPreviewUrl(options)
      .then((r) => {
        if (cancelled) {
          URL.revokeObjectURL(r.url);
          return;
        }
        localUrl = r.url;
        setUrl(r.url);
        setDoc(r.doc);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not build preview");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      if (localUrl) URL.revokeObjectURL(localUrl);
    };
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

  if (!open || typeof document === "undefined") return null;

  const download = () => {
    if (!doc || !options) return;
    doc.save(`${options.reportId}.pdf`);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/70 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-white/10 bg-background/95 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">Preview</div>
          <div className="truncate font-display text-lg font-semibold tracking-tight">
            {options?.payload.title ?? "Report"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={download}
            disabled={!doc || loading}
            className="cta-glow inline-flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
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

      <div className="relative flex-1 overflow-hidden bg-neutral-900">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Building report…
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-destructive">
            {error}
          </div>
        )}
        {url && (
          <iframe
            title="Report preview"
            src={`${url}#toolbar=1&navpanes=0&view=FitH`}
            className="h-full w-full"
          />
        )}
      </div>
    </div>,
    document.body,
  );
}
