"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { AlertTriangle, CalendarDays, ClipboardCheck, FileCheck2, ListChecks, Package, RefreshCw } from "lucide-react";
import {
  getSprint1Data,
  updateControleMensal,
  updateForm148Status,
} from "@/app/(app)/dashboard/actions";
import {
  CONTROLE_TAREFAS,
  FORM_148_ETAPAS,
  MESES,
  MESES_COMPLETOS,
  STATUS_LABELS,
  type Form148EtapaKey,
  type StatusRotinaKey,
} from "@/lib/sprint1";

type Sprint1Data = Awaited<ReturnType<typeof getSprint1Data>>;
type Casa = Sprint1Data["casas"][number];

const FORM_STATUS_OPTIONS: StatusRotinaKey[] = ["vazio", "ok", "pendente", "nao"];
const CONTROLE_STATUS_OPTIONS: StatusRotinaKey[] = ["vazio", "ok", "pendente", "nao", "na"];
const CHECKLIST_TASK_ID = "t6_checklist_siga";

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

function formKey(casaOracaoId: string, month: number, etapa: string) {
  return `${casaOracaoId}:${month}:${etapa}`;
}

function controleKey(tarefaId: string, month: number) {
  return `${tarefaId}:${month}`;
}

function getStoredCompetencia(fallback: { year: number; month: number }) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = localStorage.getItem("ccb.competencia.trabalho");
  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw) as { year?: number; month?: number };
    if (
      Number.isInteger(parsed.year) &&
      Number.isInteger(parsed.month) &&
      parsed.year! >= 2020 &&
      parsed.month! >= 1 &&
      parsed.month! <= 12
    ) {
      return { year: parsed.year!, month: parsed.month! };
    }
  } catch {
    return fallback;
  }

  return fallback;
}

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof FileCheck2;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <div className="mt-2 text-2xl font-semibold text-slate-950">{value}</div>
          <p className="mt-1 text-xs text-slate-500">{hint}</p>
        </div>
        <div className="rounded-md bg-blue-50 p-2 text-blue-700">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

function StatusSelect({
  value,
  options,
  label,
  onChange,
}: {
  value: StatusRotinaKey;
  options: StatusRotinaKey[];
  label: string;
  onChange: (status: StatusRotinaKey) => void;
}) {
  return (
    <select
      aria-label={label}
      className={`w-full min-w-16 rounded-md border px-2 py-1 text-center text-xs font-semibold ${statusClass(value)}`}
      onChange={(event) => onChange(event.target.value as StatusRotinaKey)}
      value={value}
    >
      {options.map((status) => (
        <option key={status} value={status}>
          {STATUS_LABELS[status]}
        </option>
      ))}
    </select>
  );
}

export function Sprint1Dashboard({
  initialData,
  initialYear,
  initialMonth,
}: {
  initialData: Sprint1Data;
  initialYear: number;
  initialMonth: number;
}) {
  const [data, setData] = useState(initialData);
  const [competencia, setCompetencia] = useState({ year: initialYear, month: initialMonth });
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const stored = getStoredCompetencia({ year: initialYear, month: initialMonth });
    if (stored.year !== initialYear || stored.month !== initialMonth) {
      void changeCompetencia(stored.year, stored.month);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formStatusMap = useMemo(() => {
    const map = new Map<string, StatusRotinaKey>();
    for (const row of data.form148Statuses) {
      map.set(formKey(row.casaOracaoId, row.competenciaMes, row.etapa), row.status as StatusRotinaKey);
    }
    return map;
  }, [data.form148Statuses]);

  const controleStatusMap = useMemo(() => {
    const map = new Map<string, StatusRotinaKey>();
    for (const row of data.controlesMensais) {
      map.set(controleKey(row.tarefaId, row.competenciaMes), row.status as StatusRotinaKey);
    }
    return map;
  }, [data.controlesMensais]);

  const kpis = useMemo(() => {
    const recebidos = data.casas.filter(
      (casa) => formStatusMap.get(formKey(casa.id, competencia.month, "elaborado")) === "ok",
    ).length;
    const tarefasOk = CONTROLE_TAREFAS.filter(
      (tarefa) => controleStatusMap.get(controleKey(tarefa.id, competencia.month)) === "ok",
    ).length;
    const checklistStatus = (() => {
      const status = controleStatusMap.get(controleKey(CHECKLIST_TASK_ID, competencia.month)) ?? "vazio";
      if (status === "ok") return "Fechado";
      if (status === "vazio") return "Aberto";
      return "Respondido";
    })();

    return {
      recebidos,
      tarefasPercentual: Math.round((tarefasOk / CONTROLE_TAREFAS.length) * 100),
      checklistStatus,
    };
  }, [competencia.month, controleStatusMap, data.casas, formStatusMap]);

  const alertas = useMemo(() => {
    const rows: string[] = [];

    for (let month = 1; month < competencia.month; month += 1) {
      for (const casa of data.casas) {
        for (const etapa of FORM_148_ETAPAS) {
          const status = formStatusMap.get(formKey(casa.id, month, etapa.id)) ?? "vazio";
          if (status === "vazio" || status === "pendente") {
            rows.push(`${MESES[month - 1]} · Form. 14.8 · ${casa.codigoSiga} ${casa.nome} · ${etapa.label}`);
          }
        }
      }

      for (const tarefa of CONTROLE_TAREFAS) {
        const status = controleStatusMap.get(controleKey(tarefa.id, month)) ?? "vazio";
        if (status === "vazio" || status === "pendente") {
          rows.push(`${MESES[month - 1]} · Controle Geral · ${tarefa.label}`);
        }
      }
    }

    return rows;
  }, [competencia.month, controleStatusMap, data.casas, formStatusMap]);

  async function changeCompetencia(year: number, month: number) {
    setCompetencia({ year, month });
    localStorage.setItem("ccb.competencia.trabalho", JSON.stringify({ year, month }));
    setMessage(null);
    startTransition(async () => {
      const fresh = await getSprint1Data(year, month);
      setData(fresh);
    });
  }

  async function handleFormStatus(casa: Casa, etapa: Form148EtapaKey, status: StatusRotinaKey) {
    const key = formKey(casa.id, competencia.month, etapa);
    setPendingKey(key);
    setMessage(null);
    setData((current) => ({
      ...current,
      form148Statuses: [
        ...current.form148Statuses.filter(
          (row) => !(row.casaOracaoId === casa.id && row.competenciaMes === competencia.month && row.etapa === etapa),
        ),
        {
          casaOracaoId: casa.id,
          competenciaMes: competencia.month,
          etapa,
          status,
        },
      ],
    }));

    try {
      await updateForm148Status({
        casaOracaoId: casa.id,
        year: competencia.year,
        month: competencia.month,
        etapa,
        status,
      });
      setMessage("Status do Form. 14.8 salvo.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao salvar status do Form. 14.8.");
    } finally {
      setPendingKey(null);
    }
  }

  async function handleControleStatus(tarefaId: string, month: number, status: StatusRotinaKey) {
    const key = controleKey(tarefaId, month);
    setPendingKey(key);
    setMessage(null);
    setData((current) => ({
      ...current,
      controlesMensais: [
        ...current.controlesMensais.filter((row) => !(row.tarefaId === tarefaId && row.competenciaMes === month)),
        {
          tarefaId,
          competenciaMes: month,
          status,
        },
      ],
    }));

    try {
      await updateControleMensal({
        tarefaId,
        year: competencia.year,
        month,
        status,
      });
      setMessage("Controle mensal salvo.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao salvar controle mensal.");
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Mês de trabalho</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">
              {MESES_COMPLETOS[competencia.month - 1]} de {competencia.year}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Competência independente do calendário atual. A seleção é salva neste navegador.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[160px_120px_auto]">
            <label className="text-sm font-medium text-slate-700">
              Mês
              <select
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                onChange={(event) => void changeCompetencia(competencia.year, Number(event.target.value))}
                value={competencia.month}
              >
                {MESES_COMPLETOS.map((mes, index) => (
                  <option key={mes} value={index + 1}>
                    {mes}
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
                onChange={(event) => void changeCompetencia(Number(event.target.value), competencia.month)}
                type="number"
                value={competencia.year}
              />
            </label>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:self-end"
              disabled={isPending}
              onClick={() => void changeCompetencia(competencia.year, competencia.month)}
              type="button"
            >
              <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} aria-hidden="true" />
              Atualizar
            </button>
          </div>
        </div>
        {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          hint="Conta apenas a etapa Elaborado marcada como OK"
          icon={FileCheck2}
          label="Form. 14.8"
          value={`${kpis.recebidos} de ${data.casas.length}`}
        />
        <KpiCard
          hint="Tabela de movimentações entra na Sprint 2"
          icon={Package}
          label="Movimentações"
          value="0"
        />
        <KpiCard
          hint="Tabela de pendências entra na Sprint 5"
          icon={AlertTriangle}
          label="Pendências abertas"
          value="0"
        />
        <KpiCard
          hint="Status OK nas 7 tarefas do mês"
          icon={ListChecks}
          label="Controle geral"
          value={`${kpis.tarefasPercentual}%`}
        />
        <KpiCard
          hint="Derivado da tarefa T6 até a Sprint 4"
          icon={ClipboardCheck}
          label="Checklist SIGA"
          value={kpis.checklistStatus}
        />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-950">Status do Form. 14.8 por Casa de Oração</h2>
          <p className="text-sm text-slate-500">Competência {String(competencia.month).padStart(2, "0")}/{competencia.year}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-left text-sm">
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
              {data.casas.map((casa) => (
                <tr key={casa.id}>
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-950">{casa.codigoSiga} · {casa.nome}</div>
                    <div className="text-xs text-slate-500">{casa.cidade}</div>
                  </td>
                  {FORM_148_ETAPAS.map((etapa) => {
                    const key = formKey(casa.id, competencia.month, etapa.id);
                    const value = formStatusMap.get(key) ?? "vazio";
                    return (
                      <td className="px-3 py-3" key={etapa.id}>
                        <StatusSelect
                          label={`${casa.nome} ${etapa.label}`}
                          onChange={(status) => void handleFormStatus(casa, etapa.id, status)}
                          options={FORM_STATUS_OPTIONS}
                          value={value}
                        />
                        {pendingKey === key ? <div className="mt-1 text-center text-[10px] text-slate-400">Salvando</div> : null}
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
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="sticky left-0 z-10 min-w-64 bg-slate-50 px-5 py-3">Tarefa</th>
                {MESES.map((mes, index) => (
                  <th
                    className={`px-3 py-3 text-center ${index + 1 === competencia.month ? "bg-blue-50 text-blue-700" : ""}`}
                    key={mes}
                  >
                    {mes}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {CONTROLE_TAREFAS.map((tarefa) => (
                <tr key={tarefa.id}>
                  <td className="sticky left-0 z-10 bg-white px-5 py-3 font-medium text-slate-950">{tarefa.label}</td>
                  {MESES.map((mes, index) => {
                    const month = index + 1;
                    const key = controleKey(tarefa.id, month);
                    const value = controleStatusMap.get(key) ?? "vazio";
                    return (
                      <td className={`px-3 py-3 ${month === competencia.month ? "bg-blue-50/60" : ""}`} key={mes}>
                        <StatusSelect
                          label={`${tarefa.label} ${mes}`}
                          onChange={(status) => void handleControleStatus(tarefa.id, month, status)}
                          options={CONTROLE_STATUS_OPTIONS}
                          value={value}
                        />
                        {pendingKey === key ? <div className="mt-1 text-center text-[10px] text-slate-400">Salvando</div> : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
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

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Pendências abertas</h2>
              <p className="text-sm text-slate-500">Top 4 pendências do módulo Pendências.</p>
            </div>
            <Link className="text-sm font-medium text-blue-700 hover:underline" href="/pendencias">
              Ver todas
            </Link>
          </div>
          <div className="px-5 py-8 text-sm text-slate-500">
            Nenhuma pendência aberta. A tabela de pendências será implementada na Sprint 5.
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
        <div className="flex items-start gap-3">
          <CalendarDays className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-700" aria-hidden="true" />
          <p>
            Movimentações e pendências permanecem zeradas nesta sprint por decisão de escopo. Os componentes já recebem valores
            por props/estado para conexão futura às tabelas das Sprints 2 e 5.
          </p>
        </div>
      </section>
    </div>
  );
}

