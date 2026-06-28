import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { CompetenciaSelector } from "@/components/competencia-selector";
import { StatusRotinaBadge } from "@/components/status-rotina-badge";
import { requireGestorAdm } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FORM_148_ETAPAS, type Form148EtapaKey, type StatusRotinaKey } from "@/lib/sprint1";

function parseCompetencia(searchParams: { ano?: string; mes?: string }) {
  const now = new Date();
  const ano = Number(searchParams.ano ?? now.getFullYear());
  const mes = Number(searchParams.mes ?? now.getMonth() + 1);

  return {
    ano: Number.isInteger(ano) && ano >= 2020 && ano <= 2100 ? ano : now.getFullYear(),
    mes: Number.isInteger(mes) && mes >= 1 && mes <= 12 ? mes : now.getMonth() + 1,
  };
}

function statusKey(casaId: string, etapa: string) {
  return `${casaId}:${etapa}`;
}

export default async function FormulariosPage({ searchParams }: { searchParams: { ano?: string; mes?: string } }) {
  const { profile } = await requireGestorAdm();
  const competencia = parseCompetencia(searchParams);
  const [casas, statuses] = await Promise.all([
    prisma.casaOracao.findMany({
      where: { administracaoId: profile.administracaoId, ativa: true },
      orderBy: { codigoSiga: "asc" },
      select: { id: true, codigoSiga: true, nome: true, cidade: true },
    }),
    prisma.form148Status.findMany({
      where: {
        administracaoId: profile.administracaoId,
        competenciaAno: competencia.ano,
        competenciaMes: competencia.mes,
      },
      select: { casaOracaoId: true, etapa: true, status: true },
    }),
  ]);
  const statusMap = new Map(
    statuses.map((status) => [
      statusKey(status.casaOracaoId, status.etapa as Form148EtapaKey),
      status.status as StatusRotinaKey,
    ]),
  );

  return (
    <AppShell subtitle="Formulários" title="Formulários Form 14.8" userEmail={profile.email} userName={profile.nome}>
      <div className="space-y-6">
        <CompetenciaSelector ano={competencia.ano} mes={competencia.mes} />

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-950">Status dos Formulários 14.8</h2>
            <p className="text-sm text-slate-500">
              Competência {String(competencia.mes).padStart(2, "0")}/{competencia.ano}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table aria-label="Status dos Formulários 14.8 por Casa de Oração" className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Casa</th>
                  {FORM_148_ETAPAS.map((etapa) => (
                    <th className="px-3 py-3 text-center" key={etapa.id}>
                      {etapa.id === "ass_min" ? "Ass. Ministro" : etapa.label}
                    </th>
                  ))}
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {casas.map((casa) => (
                  <tr key={casa.id}>
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-950">
                        {casa.codigoSiga} · {casa.nome}
                      </div>
                      <div className="text-xs text-slate-500">{casa.cidade}</div>
                    </td>
                    {FORM_148_ETAPAS.map((etapa) => {
                      const status = statusMap.get(statusKey(casa.id, etapa.id)) ?? "vazio";
                      return (
                        <td className="px-3 py-4 text-center" key={etapa.id}>
                          <StatusRotinaBadge status={status} />
                        </td>
                      );
                    })}
                    <td className="px-5 py-4 text-right">
                      <Link
                        className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        href={`/formularios/${casa.id}?ano=${competencia.ano}&mes=${competencia.mes}`}
                      >
                        Ver detalhes
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
