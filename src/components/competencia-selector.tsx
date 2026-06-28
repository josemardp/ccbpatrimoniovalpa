"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MESES_COMPLETOS } from "@/lib/sprint1";

const STORAGE_KEY = "ccb.competencia.trabalho";

export function CompetenciaSelector({ ano, mes }: { ano: number; mes: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState({ ano, mes });

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw || searchParams.has("ano") || searchParams.has("mes")) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as { year?: number; month?: number };
      if (parsed.year && parsed.month && (parsed.year !== ano || parsed.month !== mes)) {
        router.replace(`${pathname}?ano=${parsed.year}&mes=${parsed.month}`);
      }
    } catch {
      return;
    }
  }, [ano, mes, pathname, router, searchParams]);

  function changeCompetencia(next: { ano: number; mes: number }) {
    setSelected(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ year: next.ano, month: next.mes }));
    router.replace(`${pathname}?ano=${next.ano}&mes=${next.mes}`);
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Competência</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            {MESES_COMPLETOS[mes - 1]} de {ano}
          </h2>
          <p className="mt-1 text-sm text-slate-500">Mês de trabalho independente do calendário atual.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[160px_120px]">
          <label className="text-sm font-medium text-slate-700">
            Mês
            <select
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              onChange={(event) => changeCompetencia({ ano: selected.ano, mes: Number(event.target.value) })}
              value={selected.mes}
            >
              {MESES_COMPLETOS.map((monthName, index) => (
                <option key={monthName} value={index + 1}>
                  {monthName}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Ano
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              max={2100}
              min={2020}
              onChange={(event) => changeCompetencia({ ano: Number(event.target.value), mes: selected.mes })}
              type="number"
              value={selected.ano}
            />
          </label>
        </div>
      </div>
    </section>
  );
}
