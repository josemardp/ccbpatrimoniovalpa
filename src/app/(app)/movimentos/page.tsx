import Link from "next/link";
import { listMovimentos } from "@/actions/movimentos";
import { AppShell } from "@/components/app-shell";
import { EstadoVazio } from "@/components/estado-vazio";
import { MovimentoDialog } from "@/components/movimento-dialog";
import { requireGestorAdm } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MESES_COMPLETOS } from "@/lib/sprint1";
import { ArrowLeftRight } from "lucide-react";

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

function parseFilters(searchParams: { tipo?: string; casaId?: string; mes?: string; ano?: string; page?: string }) {
  const now = new Date();
  const ano = Number(searchParams.ano ?? now.getFullYear());
  const mes = Number(searchParams.mes ?? now.getMonth() + 1);
  const page = Number(searchParams.page ?? 1);

  return {
    tipo: searchParams.tipo && searchParams.tipo !== "todos" ? searchParams.tipo : undefined,
    casaId: searchParams.casaId && searchParams.casaId !== "todas" ? searchParams.casaId : undefined,
    ano: Number.isInteger(ano) && ano >= 2020 && ano <= 2100 ? ano : now.getFullYear(),
    mes: Number.isInteger(mes) && mes >= 1 && mes <= 12 ? mes : now.getMonth() + 1,
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

function casaLabel(casa?: { codigoSiga: string; nome: string } | null) {
  return casa ? `${casa.codigoSiga} · ${casa.nome}` : "-";
}

function buildPageHref(filters: ReturnType<typeof parseFilters>, page: number) {
  const params = new URLSearchParams({
    ano: String(filters.ano),
    mes: String(filters.mes),
    page: String(page),
  });

  if (filters.tipo) {
    params.set("tipo", filters.tipo);
  }

  if (filters.casaId) {
    params.set("casaId", filters.casaId);
  }

  return `/movimentos?${params.toString()}`;
}

export default async function MovimentosPage({
  searchParams,
}: {
  searchParams: { tipo?: string; casaId?: string; mes?: string; ano?: string; page?: string };
}) {
  const { profile } = await requireGestorAdm();
  const filters = parseFilters(searchParams);
  const [casas, movimentos] = await Promise.all([
    prisma.casaOracao.findMany({
      where: { administracaoId: profile.administracaoId, ativa: true },
      orderBy: { codigoSiga: "asc" },
      select: { id: true, codigoSiga: true, nome: true },
    }),
    listMovimentos(filters),
  ]);
  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <AppShell subtitle="Movimentos" title="Movimentos Patrimoniais" userEmail={profile.email} userName={profile.nome}>
      <div className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <form className="grid flex-1 gap-3 md:grid-cols-[160px_1fr_160px_120px_auto]" method="get">
              <label className="text-sm font-medium text-slate-700">
                Tipo
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  defaultValue={filters.tipo ?? "todos"}
                  name="tipo"
                >
                  <option value="todos">Todos</option>
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                  <option value="transferencia">Transferência</option>
                  <option value="baixa">Baixa</option>
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Casa de Oração
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  defaultValue={filters.casaId ?? "todas"}
                  name="casaId"
                >
                  <option value="todas">Todas</option>
                  {casas.map((casa) => (
                    <option key={casa.id} value={casa.id}>
                      {casa.codigoSiga} · {casa.nome}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Mês
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  defaultValue={filters.mes}
                  name="mes"
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
                  defaultValue={filters.ano}
                  max={2100}
                  min={2020}
                  name="ano"
                  type="number"
                />
              </label>

              <button className="h-10 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 md:self-end">
                Filtrar
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              <a
                className="flex h-10 items-center rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                download
                href={`/api/exportar/movimentos?ano=${filters.ano}&mes=${filters.mes}`}
              >
                Exportar
              </a>
              <MovimentoDialog casas={casas} hoje={hoje} />
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-950">Base de movimentos</h2>
            <p className="text-sm text-slate-500">
              Competência {String(filters.mes).padStart(2, "0")}/{filters.ano}. Exibição de 20 registros por página.
            </p>
          </div>
          {movimentos.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <caption className="sr-only">Movimentos patrimoniais do período filtrado</caption>
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
                    {movimentos.map((movimento) => (
                      <tr key={movimento.id}>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {movimento.dataMovimento.toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${TIPO_BADGE[movimento.tipo]}`}
                          >
                            {TIPO_LABELS[movimento.tipo]}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-medium text-slate-950">{movimento.descricao}</div>
                          {movimento.documento ? (
                            <div className="text-xs text-slate-500">{movimento.documento}</div>
                          ) : null}
                        </td>
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
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm">
                <Link
                  className={`rounded-md border border-slate-200 px-3 py-2 font-medium text-slate-700 hover:bg-slate-50 ${
                    filters.page <= 1 ? "pointer-events-none opacity-40" : ""
                  }`}
                  href={buildPageHref(filters, Math.max(1, filters.page - 1))}
                >
                  Anterior
                </Link>
                <span className="text-slate-500">Página {filters.page}</span>
                <Link
                  className={`rounded-md border border-slate-200 px-3 py-2 font-medium text-slate-700 hover:bg-slate-50 ${
                    movimentos.length < 20 ? "pointer-events-none opacity-40" : ""
                  }`}
                  href={buildPageHref(filters, filters.page + 1)}
                >
                  Próxima
                </Link>
              </div>
            </>
          ) : (
            <div className="px-5 py-8">
              <EstadoVazio
                descricao="Registre entradas, saídas, transferências ou baixas para acompanhar a movimentação patrimonial."
                icon={ArrowLeftRight}
                titulo="Nenhum movimento registrado no período."
              />
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
