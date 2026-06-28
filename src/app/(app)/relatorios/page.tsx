import Link from "next/link";
import {
  relatorioForm148,
  relatorioInventario,
  relatorioMovimentos,
  relatorioPendencias,
} from "@/actions/relatorios";
import { AppShell } from "@/components/app-shell";
import { CompetenciaSelector } from "@/components/competencia-selector";
import { ExportInventarioCsvButton } from "@/components/export-inventario-csv-button";
import { PrintButton } from "@/components/print-button";
import { requireGestorAdm } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FORM_148_ETAPAS, MESES, STATUS_LABELS, type StatusRotinaKey } from "@/lib/sprint1";

const TABS = [
  { id: "form148", label: "Form 14.8" },
  { id: "inventario", label: "Inventário" },
  { id: "movimentos", label: "Movimentos" },
  { id: "pendencias", label: "Pendências" },
] as const;

type RelatorioTab = (typeof TABS)[number]["id"];

const CATEGORIAS = ["Móveis", "Eletrônicos", "Instrumentos Musicais", "Veículos", "Imóveis", "Outros"] as const;

const ESTADO_LABELS = {
  otimo: "Ótimo",
  bom: "Bom",
  regular: "Regular",
  ruim: "Ruim",
  descartado: "Descartado",
} as const;

const TIPO_LABELS = {
  entrada: "Entrada",
  saida: "Saída",
  transferencia: "Transferência",
  baixa: "Baixa",
} as const;

const TIPO_BADGE = {
  entrada: "border-green-200 bg-green-50 text-green-700",
  saida: "border-amber-200 bg-amber-50 text-amber-700",
  transferencia: "border-blue-200 bg-blue-50 text-blue-700",
  baixa: "border-red-200 bg-red-50 text-red-700",
} as const;

function parseCompetencia(searchParams: { ano?: string; mes?: string }) {
  const now = new Date();
  const ano = Number(searchParams.ano ?? now.getFullYear());
  const mes = Number(searchParams.mes ?? now.getMonth() + 1);

  return {
    ano: Number.isInteger(ano) && ano >= 2020 && ano <= 2100 ? ano : now.getFullYear(),
    mes: Number.isInteger(mes) && mes >= 1 && mes <= 12 ? mes : now.getMonth() + 1,
  };
}

function parseTab(tab?: string): RelatorioTab {
  return TABS.some((item) => item.id === tab) ? (tab as RelatorioTab) : "form148";
}

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function casaLabel(casa?: { codigoSiga: string; nome: string } | null) {
  return casa ? `${casa.codigoSiga} · ${casa.nome}` : "-";
}

function PrintHeader({ title }: { title: string }) {
  return (
    <div className="hidden pb-4" data-print-show>
      <div className="text-sm font-semibold text-slate-950">CCB Patrimônio — Administração Valparaíso/SP</div>
      <div className="text-xs text-slate-600">{title}</div>
    </div>
  );
}

function TabNav({ activeTab }: { activeTab: RelatorioTab }) {
  return (
    <nav className="flex flex-wrap gap-2" data-print-hide>
      {TABS.map((tab) => (
        <Link
          className={`rounded-md border px-3 py-2 text-sm font-medium ${
            activeTab === tab.id
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
          href={`/relatorios?tab=${tab.id}`}
          key={tab.id}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

function statusCell(status: string) {
  return STATUS_LABELS[(status as StatusRotinaKey) ?? "vazio"] ?? status;
}

async function Form148Tab({ ano, mes }: { ano: number; mes: number }) {
  const rows = await relatorioForm148(ano, mes);
  const concluidas = rows.filter((row) => row.concluido).length;

  return (
    <div className="space-y-6">
      <div data-print-hide>
        <CompetenciaSelector ano={ano} mes={mes} />
      </div>
      <PrintHeader title={`Relatório Form. 14.8 — ${String(mes).padStart(2, "0")}/${ano}`} />

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Form. 14.8 por Casa de Oração</h2>
            <p className="text-sm text-slate-500">
              Competência {String(mes).padStart(2, "0")}/{ano}
            </p>
          </div>
          <PrintButton />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Casa</th>
                {FORM_148_ETAPAS.map((etapa) => (
                  <th className="px-3 py-3 text-center" key={etapa.id}>
                    {etapa.label}
                  </th>
                ))}
                <th className="px-5 py-3 text-right">% Concluído</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr
                  className={row.concluido ? "bg-green-50/60" : row.vazio ? "bg-slate-50/60" : "bg-amber-50/60"}
                  key={row.casa.id}
                >
                  <td className="px-5 py-4 font-medium text-slate-950">
                    {row.casa.codigoSiga} · {row.casa.nome}
                  </td>
                  {FORM_148_ETAPAS.map((etapa) => (
                    <td className="px-3 py-4 text-center" key={etapa.id}>
                      {statusCell(String(row.etapas[etapa.id]))}
                    </td>
                  ))}
                  <td className="px-5 py-4 text-right font-semibold text-slate-950">{row.percentual}%</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-slate-200 bg-slate-50 text-sm font-semibold text-slate-950">
              <tr>
                <td className="px-5 py-3" colSpan={FORM_148_ETAPAS.length + 2}>
                  {concluidas} de {rows.length} Casas de Oração concluídas
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}

async function InventarioTab({ casaId, categoria }: { casaId?: string; categoria?: string }) {
  const { profile } = await requireGestorAdm();
  const [casas, relatorio] = await Promise.all([
    prisma.casaOracao.findMany({
      where: { administracaoId: profile.administracaoId, ativa: true },
      orderBy: { codigoSiga: "asc" },
      select: { id: true, codigoSiga: true, nome: true },
    }),
    relatorioInventario({ casaId, categoria }),
  ]);

  return (
    <div className="space-y-6">
      <form className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:p-5" data-print-hide method="get">
        <input name="tab" type="hidden" value="inventario" />
        <div className="grid gap-3 md:grid-cols-[1fr_220px_auto_auto]">
          <label className="text-sm font-medium text-slate-700">
            Casa de Oração
            <select className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" defaultValue={casaId ?? "todas"} name="casaId">
              <option value="todas">Todas</option>
              {casas.map((casa) => (
                <option key={casa.id} value={casa.id}>
                  {casa.codigoSiga} · {casa.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Categoria
            <select className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" defaultValue={categoria ?? "todas"} name="categoria">
              <option value="todas">Todas</option>
              {CATEGORIAS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <button className="h-10 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 md:self-end">
            Filtrar
          </button>
          <div className="flex gap-2 md:self-end">
            <ExportInventarioCsvButton />
            <PrintButton />
          </div>
        </div>
      </form>

      <PrintHeader title="Relatório de Inventário" />

      <section className="grid gap-4 lg:grid-cols-2">
        {relatorio.porCasa.map((row) => (
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" key={row.casa.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  {row.casa.codigoSiga} · {row.casa.nome}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{row.totalBens} bem(ns) ativo(s)</p>
              </div>
              <div className="text-right text-sm font-semibold text-slate-950">{formatMoney(row.valorTotal)}</div>
            </div>
            <table className="mt-4 w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {Object.entries(ESTADO_LABELS).map(([estado, label]) => (
                  <tr key={estado}>
                    <td className="py-2 text-slate-600">{label}</td>
                    <td className="py-2 text-right font-medium text-slate-950">
                      {row.breakdown[estado as keyof typeof ESTADO_LABELS]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Total geral da Administração</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500">Total de bens</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">{relatorio.totalGeral.totalBens}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Valor total</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">{formatMoney(relatorio.totalGeral.valorTotal)}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

async function MovimentosTab({ ano, mes }: { ano: number; mes: number }) {
  const relatorio = await relatorioMovimentos(ano, mes);

  return (
    <div className="space-y-6">
      <div data-print-hide>
        <CompetenciaSelector ano={ano} mes={mes} />
      </div>
      <PrintHeader title={`Relatório de Movimentos — ${String(mes).padStart(2, "0")}/${ano}`} />

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex justify-end">
          <PrintButton />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Object.entries(TIPO_LABELS).map(([tipo, label]) => (
            <div className="rounded-lg border border-slate-200 p-4" key={tipo}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{relatorio.resumo[tipo as keyof typeof TIPO_LABELS]}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-950">Movimentos do período</h2>
        </div>
        {relatorio.movimentos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Data</th>
                  <th className="px-5 py-3">Tipo</th>
                  <th className="px-5 py-3">Descrição</th>
                  <th className="px-5 py-3">Origem → Destino</th>
                  <th className="px-5 py-3">Registrado por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {relatorio.movimentos.map((movimento) => (
                  <tr key={movimento.id}>
                    <td className="px-5 py-4 text-slate-600">{movimento.dataMovimento.toLocaleDateString("pt-BR")}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${TIPO_BADGE[movimento.tipo]}`}>
                        {TIPO_LABELS[movimento.tipo]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-950">{movimento.descricao}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {casaLabel(movimento.casaOrigem)} → {casaLabel(movimento.casaDestino)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {movimento.registradoPor?.nome ?? movimento.registradoPor?.email ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-8 text-sm text-slate-500">Nenhum movimento no período.</div>
        )}
      </section>
    </div>
  );
}

async function PendenciasTab() {
  const relatorio = await relatorioPendencias();
  const totalForm = relatorio.porCasa.reduce((sum, casa) => sum + casa.itens.length, 0);
  const total = totalForm + relatorio.controleGeral.length;

  return (
    <div className="space-y-6">
      <PrintHeader title="Relatório de Pendências" />
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Situação atual</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">{total} pendência(s)</h2>
            <p className="mt-1 text-sm text-slate-500">Inclui status pendente e registros vazios do mês anterior.</p>
          </div>
          <div className="flex gap-2" data-print-hide>
            <Link className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800" href="/pendencias">
              Ir para pendências
            </Link>
            <PrintButton />
          </div>
        </div>
      </section>

      {relatorio.porCasa
        .filter((grupo) => grupo.itens.length > 0)
        .map((grupo) => (
          <section className="rounded-lg border border-slate-200 bg-white shadow-sm" key={grupo.casa.id}>
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-950">
                {grupo.casa.codigoSiga} · {grupo.casa.nome}
              </h2>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                {grupo.itens.length}
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {grupo.itens.map((item) => (
                <div className="px-5 py-4 text-sm" key={item.id}>
                  <div className="font-medium text-slate-950">
                    {MESES[item.competenciaMes - 1]}/{item.competenciaAno} · {item.tipo} · {item.descricao}
                  </div>
                  <div className="text-slate-500">Status: {item.status}</div>
                </div>
              ))}
            </div>
          </section>
        ))}

      {relatorio.controleGeral.length > 0 ? (
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-950">Administração · Controle Geral</h2>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
              {relatorio.controleGeral.length}
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {relatorio.controleGeral.map((item) => (
              <div className="px-5 py-4 text-sm" key={item.id}>
                <div className="font-medium text-slate-950">
                  {MESES[item.competenciaMes - 1]}/{item.competenciaAno} · {item.descricao}
                </div>
                <div className="text-slate-500">Status: {item.status}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {total === 0 ? (
        <section className="rounded-lg border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
          Nenhuma pendência aberta encontrada.
        </section>
      ) : null}
    </div>
  );
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: { tab?: string; ano?: string; mes?: string; casaId?: string; categoria?: string };
}) {
  const { profile } = await requireGestorAdm();
  const tab = parseTab(searchParams.tab);
  const competencia = parseCompetencia(searchParams);
  const casaId = searchParams.casaId && searchParams.casaId !== "todas" ? searchParams.casaId : undefined;
  const categoria = searchParams.categoria && searchParams.categoria !== "todas" ? searchParams.categoria : undefined;

  return (
    <AppShell subtitle="Relatórios" title="Relatórios" userEmail={profile.email} userName={profile.nome}>
      <div className="space-y-6">
        <TabNav activeTab={tab} />
        {tab === "form148" ? <Form148Tab ano={competencia.ano} mes={competencia.mes} /> : null}
        {tab === "inventario" ? <InventarioTab casaId={casaId} categoria={categoria} /> : null}
        {tab === "movimentos" ? <MovimentosTab ano={competencia.ano} mes={competencia.mes} /> : null}
        {tab === "pendencias" ? <PendenciasTab /> : null}
      </div>
    </AppShell>
  );
}
