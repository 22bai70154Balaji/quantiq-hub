import * as XLSX from "xlsx";
import type { AnalysisPayload } from "@/lib/finflow/analysis/types";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 400);
}

export function exportCsv(payload: AnalysisPayload, reportId: string): void {
  const lines: string[] = [];
  const push = (row: (string | number)[]) =>
    lines.push(row.map((v) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(","));

  push([`FinFlow AI — ${payload.title}`]);
  push([`Report ID`, reportId]);
  push([`Generated`, new Date().toISOString()]);
  push([`Country`, payload.country]);
  push([]);

  push(["Inputs"]);
  push(["Field", "Value"]);
  payload.inputs.forEach((i) => push([i.label, i.value]));
  push([]);

  push(["KPIs"]);
  push(["Metric", "Value"]);
  payload.kpis.forEach((k) => push([k.label, k.value]));
  push([]);

  if (payload.breakdown) {
    push([payload.breakdown.columns.map((c) => c.label).join(" · ")]);
    push(payload.breakdown.columns.map((c) => c.label));
    payload.breakdown.rows.forEach((r) => push(payload.breakdown!.columns.map((c) => String(r[c.key] ?? ""))));
    push([]);
  }

  if (payload.assumptions?.length) {
    push(["Assumptions"]);
    payload.assumptions.forEach((a, i) => push([`${i + 1}`, a]));
    push([]);
  }

  push(["Disclaimer"]);
  push(["Results are estimates. Verify with the relevant bank or authority before making financial decisions."]);

  const csv = lines.join("\n");
  download(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${reportId}.csv`);
}

export function exportXlsx(payload: AnalysisPayload, reportId: string): void {
  const wb = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.aoa_to_sheet([
    ["FinFlow AI"],
    [payload.title],
    ["Report ID", reportId],
    ["Generated", new Date().toISOString()],
    ["Country", payload.country],
    [],
    ["KPI", "Value"],
    ...payload.kpis.map((k) => [k.label, k.value]),
    [],
    ["Disclaimer"],
    ["Results are estimates. Verify with the relevant bank or authority before making financial decisions."],
  ]);
  summarySheet["!cols"] = [{ wch: 32 }, { wch: 28 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

  const inputsSheet = XLSX.utils.aoa_to_sheet([
    ["Field", "Value"],
    ...payload.inputs.map((i) => [i.label, i.value]),
  ]);
  inputsSheet["!cols"] = [{ wch: 32 }, { wch: 32 }];
  XLSX.utils.book_append_sheet(wb, inputsSheet, "Inputs");

  if (payload.breakdown) {
    const bd = payload.breakdown;
    const rows = [
      bd.columns.map((c) => c.label),
      ...bd.rows.map((r) => bd.columns.map((c) => r[c.key] ?? "")),
    ];
    const bdSheet = XLSX.utils.aoa_to_sheet(rows);
    bdSheet["!cols"] = bd.columns.map(() => ({ wch: 18 }));
    XLSX.utils.book_append_sheet(wb, bdSheet, "Breakdown");
  }

  if (payload.assumptions?.length) {
    const aSheet = XLSX.utils.aoa_to_sheet([["#", "Assumption"], ...payload.assumptions.map((a, i) => [i + 1, a])]);
    aSheet["!cols"] = [{ wch: 4 }, { wch: 80 }];
    XLSX.utils.book_append_sheet(wb, aSheet, "Assumptions");
  }

  if (payload.comparison) {
    const c = payload.comparison;
    const rows = [
      [c.title, ...c.options],
      ...c.rows.map((r) => [r.label, ...r.values]),
    ];
    const cSheet = XLSX.utils.aoa_to_sheet(rows);
    cSheet["!cols"] = [{ wch: 26 }, ...c.options.map(() => ({ wch: 20 }))];
    XLSX.utils.book_append_sheet(wb, cSheet, "Compare");
  }

  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  download(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${reportId}.xlsx`);
}
