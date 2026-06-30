"use client";

import { Download } from "lucide-react";

export function DownloadPdfButton() {
  return (
    <button
      className="flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20 print:hidden"
      onClick={() => window.print()}
      type="button"
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      Download PDF
    </button>
  );
}
