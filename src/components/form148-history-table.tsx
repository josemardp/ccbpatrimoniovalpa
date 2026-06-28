"use client";

import { useOptimistic } from "react";
import { updateForm148Status } from "@/actions/rotinas";
import { FORM_148_ETAPAS, MESES, STATUS_LABELS, type StatusRotinaKey } from "@/lib/sprint1";
import { statusBadgeClass } from "@/components/status-rotina-badge";

type Competencia = {
  ano: number;
  mes: number;
};

type StatusRow = {
  competenciaAno: number;
  competenciaMes: number;
  etapa: string;
  status: string;
};

const STATUS_OPTIONS: StatusRotinaKey[] = ["vazio", "ok", "pendente", "nao", "na"];

function statusKey(ano: number, mes: number, etapa: string) {
  return `${ano}:${mes}:${etapa}`;
}

function makeStatusMap(rows: StatusRow[]) {
  return Object.fromEntries(
    rows.map((row) => [
      statusKey(row.competenciaAno, row.competenciaMes, row.etapa),
      row.status as StatusRotinaKey,
    ]),
  ) as Record<string, StatusRotinaKey>;
}

function StatusSelect({
  action,
  label,
  value,
  optimisticKey,
  addOptimistic,
}: {
  action: (formData: FormData) => void;
  label: string;
  value: StatusRotinaKey;
  optimisticKey: string;
  addOptimistic: (update: { key: string; status: StatusRotinaKey }) => void;
}) {
  return (
    <form action={action}>
      <select
        aria-label={label}
        className={`w-full min-w-24 rounded-md border px-2 py-1 text-center text-xs font-semibold ${statusBadgeClass(value)}`}
        name="status"
        onChange={(event) => {
          addOptimistic({ key: optimisticKey, status: event.currentTarget.value as StatusRotinaKey });
          event.currentTarget.form?.requestSubmit();
        }}
        value={value}
      >
        {STATUS_OPTIONS.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABELS[status]}
          </option>
        ))}
      </select>
    </form>
  );
}

export function Form148HistoryTable({
  casaId,
  competencias,
  statuses,
}: {
  casaId: string;
  competencias: Competencia[];
  statuses: StatusRow[];
}) {
  const [optimisticStatuses, addOptimisticStatus] = useOptimistic(
    makeStatusMap(statuses),
    (state, update: { key: string; status: StatusRotinaKey }) => ({ ...state, [update.key]: update.status }),
  );

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-950">Histórico dos últimos 12 meses</h2>
        <p className="text-sm text-slate-500">Atualização inline por etapa do Form. 14.8.</p>
      </div>
      <div className="overflow-x-auto">
        <table aria-label="Histórico de status do Formulário 14.8" className="w-full min-w-[940px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Competência</th>
              {FORM_148_ETAPAS.map((etapa) => (
                <th className="px-3 py-3 text-center" key={etapa.id}>
                  {etapa.id === "ass_min" ? "Ass. Ministro" : etapa.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {competencias.map((competencia) => (
              <tr key={`${competencia.ano}-${competencia.mes}`}>
                <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-950">
                  {MESES[competencia.mes - 1]}/{competencia.ano}
                </td>
                {FORM_148_ETAPAS.map((etapa) => {
                  const key = statusKey(competencia.ano, competencia.mes, etapa.id);
                  const value = optimisticStatuses[key] ?? "vazio";
                  return (
                    <td className="px-3 py-4" key={etapa.id}>
                      <StatusSelect
                        action={updateForm148Status.bind(null, casaId, competencia.ano, competencia.mes, etapa.id)}
                        addOptimistic={addOptimisticStatus}
                        label={`Atualizar status ${MESES[competencia.mes - 1]}/${competencia.ano} ${etapa.label}`}
                        optimisticKey={key}
                        value={value}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
