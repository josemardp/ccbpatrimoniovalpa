"use client";

import { useEffect, useOptimistic, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CalendarDays } from "lucide-react";
import { updateControleMensal, updateForm148Status } from "@/actions/rotinas";
import { useToast } from "@/components/toast";
import {
  CONTROLE_TAREFAS,
  FORM_148_ETAPAS,
  MESES,
  MESES_COMPLETOS,
  STATUS_LABELS,
  type StatusRotinaKey,
} from "@/lib/sprint1";

type Casa = {
  id: string;
  codigoSiga: string;
  nome: string;
  cidade: string;
};

type FormStatusRow = {
  casaOracaoId: string;
  competenciaMes: number;
  etapa: string;
  status: string;
};

type ControleRow = {
  tarefaId: string;
  competenciaMes: number;
  status: string;
};

const STATUS_OPTIONS: StatusRotinaKey[] = ["vazio", "ok", "pendente", "nao", "na"];

function statusClass(status: StatusRotinaKey) {
  switch (status) {
    case "ok":
      return "border-green-200 bg-green-50 text-green-700";
    case "pendente":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "nao":
      return "border-red-200 bg-red-50 text-red-700";
    case "na":
      return "border-slate-200 bg-slate-50 text-slate-500";
    default:
      return "border-slate-200 bg-white text-slate-500";
  }
}

function formKey(casaId: string, mes: number, etapa: string) {
  return `${casaId}:${mes}:${etapa}`;
}

function controleKey(tarefaId: string, mes: number) {
  return `${tarefaId}:${mes}`;
}

function makeFormMap(rows: FormStatusRow[]) {
  return Object.fromEntries(
    rows.map((row) => [formKey(row.casaOracaoId, row.competenciaMes, row.etapa), row.status as StatusRotinaKey]),
  ) as Record<string, StatusRotinaKey>;
}

function makeControleMap(rows: ControleRow[]) {
  return Object.fromEntries(
    rows.map((row) => [controleKey(row.tarefaId, row.competenciaMes), row.status as StatusRotinaKey]),
  ) as Record<string, StatusRotinaKey>;
}

function StatusSelectForm({
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
  const { showToast } = useToast();
  return (
    <form action={action}>
      <select
        aria-label={label}
        className={`w-full min-w-16 rounded-md border px-2 py-1 text-center text-xs font-semibold ${statusClass(value)}`}
        name="status"
        onChange={(event) => {
          addOptimistic({ key: optimisticKey, status: event.currentTarget.value as StatusRotinaKey });
          event.currentTarget.form?.requestSubmit();
          showToast("Status atualizado.", "sucesso");
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

export function RotinasBoard({
  ano,
  mes,
  casas,
  form148Statuses,
  controlesMensais,
}: {
  ano: number;
  mes: number;
  casas: Casa[];
  form148Statuses: FormStatusRow[];
  controlesMensais: ControleRow[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState({ ano, mes });
  const [optimisticForm, addOptimisticForm] = useOptimistic(
    makeFormMap(form148Statuses),
    (state, update: { key: string; status: StatusRotinaKey }) => ({ ...state, [update.key]: update.status }),
  );
  const [optimisticControle, addOptimisticControle] = useOptimistic(
    makeControleMap(controlesMensais),
    (state, update: { key: string; status: StatusRotinaKey }) => ({ ...state, [update.key]: update.status }),
  );

  useEffect(() => {
    const raw = localStorage.getItem("ccb.competencia.trabalho");
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as { year?: number; month?: number };
      if (
        parsed.year &&
        parsed.month &&
        (parsed.year !== ano || parsed.month !== mes) &&
        !new URLSearchParams(window.location.search).has("ano")
      ) {
        router.replace(`/rotinas?ano=${parsed.year}&mes=${parsed.month}`);
      }
    } catch {
      return;
    }
  }, [ano, mes, router]);

  function changeCompetencia(next: { ano: number; mes: number }) {
    setSelected(next);
    localStorage.setItem("ccb.competencia.trabalho", JSON.stringify({ year: next.ano, month: next.mes }));
    router.replace(`/rotinas?ano=${next.ano}&mes=${next.mes}`);
  }

  const alertas: string[] = [];
  for (let month = 1; month < mes; month += 1) {
    for (const casa of casas) {
      for (const etapa of FORM_148_ETAPAS) {
        const status = optimisticForm[formKey(casa.id, month, etapa.id)] ?? "vazio";
        if (status === "vazio" || status === "pendente") {
          alertas.push(`${MESES[month - 1]} · Form. 14.8 · ${casa.codigoSiga} ${casa.nome} · ${etapa.label}`);
        }
      }
    }

    for (const tarefa of CONTROLE_TAREFAS) {
      const status = optimisticControle[controleKey(tarefa.id, month)] ?? "vazio";
      if (status === "vazio" || status === "pendente") {
        alertas.push(`${MESES[month - 1]} · Controle Geral · ${tarefa.label}`);
      }
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Mês de trabalho</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">
              {MESES_COMPLETOS[mes - 1]} de {ano}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Competência independente do calendário atual. A seleção é salva neste navegador.
            </p>
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

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-950">Status do Form. 14.8 por Casa de Oração</h2>
          <p className="text-sm text-slate-500">Competência {String(mes).padStart(2, "0")}/{ano}</p>
        </div>
        <div className="overflow-x-auto">
          <table aria-label="Status do Formulário 14.8 por Casa de Oração" className="w-full min-w-[840px] text-left text-sm">
            <caption className="sr-only">Status do Formulário 14.8 por Casa de Oração</caption>
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Casa de Oração</th>
                {FORM_148_ETAPAS.map((etapa) => (
                  <th className="px-3 py-3 text-center" key={etapa.id}>
                    {etapa.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {casas.map((casa) => (
                <tr key={casa.id}>
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-950">{casa.codigoSiga} · {casa.nome}</div>
                    <div className="text-xs text-slate-500">{casa.cidade}</div>
                  </td>
                  {FORM_148_ETAPAS.map((etapa) => {
                    const key = formKey(casa.id, mes, etapa.id);
                    const value = optimisticForm[key] ?? "vazio";
                    return (
                      <td className="px-3 py-3" key={etapa.id}>
                        <StatusSelectForm
                          action={updateForm148Status.bind(null, casa.id, ano, mes, etapa.id)}
                          addOptimistic={addOptimisticForm}
                          label={`${casa.nome} ${etapa.label}`}
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

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-950">Controle Geral</h2>
          <p className="text-sm text-slate-500">7 tarefas fixas × 12 meses. A coluna ativa está destacada.</p>
        </div>
        <div className="overflow-x-auto">
          <table aria-label="Controle Geral mensal com sete tarefas fixas" className="w-full min-w-[1120px] text-left text-sm">
            <caption className="sr-only">Controle Geral mensal com sete tarefas fixas</caption>
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="sticky left-0 z-10 min-w-64 bg-slate-50 px-5 py-3">Tarefa</th>
                {MESES.map((monthName, index) => (
                  <th
                    className={`px-3 py-3 text-center ${index + 1 === mes ? "bg-blue-50 text-blue-700" : ""}`}
                    key={monthName}
                  >
                    {monthName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {CONTROLE_TAREFAS.map((tarefa) => (
                <tr key={tarefa.id}>
                  <td className="sticky left-0 z-10 bg-white px-5 py-3 font-medium text-slate-950">{tarefa.label}</td>
                  {MESES.map((monthName, index) => {
                    const month = index + 1;
                    const key = controleKey(tarefa.id, month);
                    const value = optimisticControle[key] ?? "vazio";
                    return (
                      <td className={`px-3 py-3 ${month === mes ? "bg-blue-50/60" : ""}`} key={monthName}>
                        <StatusSelectForm
                          action={updateControleMensal.bind(null, tarefa.id, ano, month)}
                          addOptimistic={addOptimisticControle}
                          label={`${tarefa.label} ${monthName}`}
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

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Alertas</h2>
            <p className="text-sm text-slate-500">Itens vazios ou pendentes em meses anteriores à competência ativa.</p>
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">{alertas.length}</span>
        </div>
        {alertas.length > 0 ? (
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {alertas.map((alerta) => (
              <div className="flex items-start gap-3 px-5 py-3 text-sm" key={alerta}>
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" aria-hidden="true" />
                <span className="text-slate-700">{alerta}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-8 text-sm text-slate-500">Nenhum alerta para meses anteriores nesta competência.</div>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
        <div className="flex items-start gap-3">
          <CalendarDays className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-700" aria-hidden="true" />
          <p>As alterações são persistidas imediatamente no banco via Server Actions e revalidação da rota.</p>
        </div>
      </section>
    </div>
  );
}
