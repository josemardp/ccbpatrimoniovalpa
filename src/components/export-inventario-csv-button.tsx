"use client";

import { useState } from "react";
import { exportarInventarioCSV } from "@/actions/relatorios";

export function ExportInventarioCsvButton() {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const csv = await exportarInventarioCSV();
      const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "inventario-ccb-patrimonio.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
      data-print-hide
      disabled={loading}
      onClick={handleExport}
      type="button"
    >
      {loading ? "Gerando CSV..." : "Exportar CSV"}
    </button>
  );
}
