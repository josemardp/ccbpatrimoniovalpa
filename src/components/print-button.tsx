"use client";

export function PrintButton() {
  return (
    <button
      className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      data-print-hide
      onClick={() => window.print()}
      type="button"
    >
      Imprimir / Exportar PDF
    </button>
  );
}
