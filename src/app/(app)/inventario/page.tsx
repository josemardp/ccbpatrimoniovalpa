import Link from "next/link";
import { listBens } from "@/actions/inventario";
import { AppShell } from "@/components/app-shell";
import { BemAcoes, NovoBemDialog, type BemFormData } from "@/components/bem-dialogs";
import { requireGestorAdm } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CATEGORIAS = ["Móveis", "Eletrônicos", "Instrumentos Musicais", "Veículos", "Imóveis", "Outros"] as const;

const ESTADOS = [
  { id: "otimo", label: "Ótimo" },
  { id: "bom", label: "Bom" },
  { id: "regular", label: "Regular" },
  { id: "ruim", label: "Ruim" },
  { id: "descartado", label: "Descartado" },
] as const;

const ESTADO_LABELS = {
  otimo: "Ótimo",
  bom: "Bom",
  regular: "Regular",
  ruim: "Ruim",
  descartado: "Descartado",
} as const;

const ESTADO_BADGE = {
  otimo: "border-green-200 bg-green-50 text-green-700",
  bom: "border-blue-200 bg-blue-50 text-blue-700",
  regular: "border-amber-200 bg-amber-50 text-amber-700",
  ruim: "border-orange-200 bg-orange-50 text-orange-700",
  descartado: "border-slate-200 bg-slate-100 text-slate-600",
} as const;

function parseFilters(searchParams: {
  busca?: string;
  casaId?: string;
  categoria?: string;
  estado?: string;
  page?: string;
}) {
  const page = Number(searchParams.page ?? 1);

  return {
    busca: searchParams.busca?.trim() || undefined,
    casaId: searchParams.casaId && searchParams.casaId !== "todas" ? searchParams.casaId : undefined,
    categoria: searchParams.categoria && searchParams.categoria !== "todas" ? searchParams.categoria : undefined,
    estado: searchParams.estado && searchParams.estado !== "todos" ? searchParams.estado : undefined,
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

function buildPageHref(filters: ReturnType<typeof parseFilters>, page: number) {
  const params = new URLSearchParams({ page: String(page) });

  if (filters.busca) params.set("busca", filters.busca);
  if (filters.casaId) params.set("casaId", filters.casaId);
  if (filters.categoria) params.set("categoria", filters.categoria);
  if (filters.estado) params.set("estado", filters.estado);

  return `/inventario?${params.toString()}`;
}

function formatMoney(value: { toNumber: () => number } | null) {
  if (!value) {
    return "-";
  }

  return value.toNumber().toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function toBemFormData(bem: Awaited<ReturnType<typeof listBens>>[number]): BemFormData {
  return {
    id: bem.id,
    codigoInterno: bem.codigoInterno,
    casaOracaoId: bem.casaOracaoId,
    descricao: bem.descricao,
    categoria: bem.categoria,
    marca: bem.marca ?? "",
    modelo: bem.modelo ?? "",
    numeroSerie: bem.numeroSerie ?? "",
    dataAquisicao: bem.dataAquisicao ? bem.dataAquisicao.toISOString().slice(0, 10) : "",
    valorAquisicao: bem.valorAquisicao?.toString() ?? "",
    estadoConservacao: bem.estadoConservacao,
    observacoes: bem.observacoes ?? "",
  };
}

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: { busca?: string; casaId?: string; categoria?: string; estado?: string; page?: string };
}) {
  const { profile } = await requireGestorAdm();
  const filters = parseFilters(searchParams);
  const [casas, bens] = await Promise.all([
    prisma.casaOracao.findMany({
      where: { administracaoId: profile.administracaoId, ativa: true },
      orderBy: { codigoSiga: "asc" },
      select: { id: true, codigoSiga: true, nome: true },
    }),
    listBens(filters),
  ]);

  return (
    <AppShell subtitle="Inventário" title="Inventário Patrimonial" userEmail={profile.email} userName={profile.nome}>
      <div className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <form className="grid flex-1 gap-3 md:grid-cols-[1fr_1fr_180px_180px_auto]" method="get">
              <label className="text-sm font-medium text-slate-700">
                Busca
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  defaultValue={filters.busca ?? ""}
                  name="busca"
                  placeholder="Descrição ou código"
                />
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
                Categoria
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  defaultValue={filters.categoria ?? "todas"}
                  name="categoria"
                >
                  <option value="todas">Todas</option>
                  {CATEGORIAS.map((categoria) => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Estado
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  defaultValue={filters.estado ?? "todos"}
                  name="estado"
                >
                  <option value="todos">Todos</option>
                  {ESTADOS.map((estado) => (
                    <option key={estado.id} value={estado.id}>
                      {estado.label}
                    </option>
                  ))}
                </select>
              </label>

              <button className="h-10 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 md:self-end">
                Filtrar
              </button>
            </form>

            <NovoBemDialog casas={casas} />
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-950">Bens patrimoniais ativos</h2>
            <p className="text-sm text-slate-500">Cadastro manual complementar ao SIGA até a importação Excel da Sprint 7.</p>
          </div>
          {bens.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1040px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Código</th>
                      <th className="px-5 py-3">Descrição</th>
                      <th className="px-5 py-3">Categoria</th>
                      <th className="px-5 py-3">Casa</th>
                      <th className="px-5 py-3">Estado</th>
                      <th className="px-5 py-3">Valor</th>
                      <th className="px-5 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bens.map((bem) => (
                      <tr key={bem.id}>
                        <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-950">{bem.codigoInterno}</td>
                        <td className="px-5 py-4">
                          <div className="font-medium text-slate-950">{bem.descricao}</div>
                          {[bem.marca, bem.modelo, bem.numeroSerie].filter(Boolean).length > 0 ? (
                            <div className="text-xs text-slate-500">
                              {[bem.marca, bem.modelo, bem.numeroSerie].filter(Boolean).join(" · ")}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-5 py-4 text-slate-600">{bem.categoria}</td>
                        <td className="px-5 py-4 text-slate-600">
                          {bem.casaOracao.codigoSiga} · {bem.casaOracao.nome}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${ESTADO_BADGE[bem.estadoConservacao]}`}
                          >
                            {ESTADO_LABELS[bem.estadoConservacao]}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">{formatMoney(bem.valorAquisicao)}</td>
                        <td className="px-5 py-4 text-right">
                          <BemAcoes bem={toBemFormData(bem)} casas={casas} />
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
                    bens.length < 25 ? "pointer-events-none opacity-40" : ""
                  }`}
                  href={buildPageHref(filters, filters.page + 1)}
                >
                  Próxima
                </Link>
              </div>
            </>
          ) : (
            <div className="px-5 py-8 text-sm text-slate-500">Nenhum bem ativo encontrado para os filtros atuais.</div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
