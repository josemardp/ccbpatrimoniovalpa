import { AppShell } from "@/components/app-shell";
import { RotinasBoard } from "@/components/rotinas-board";
import { requireGestorAdm } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function parseCompetencia(searchParams: { ano?: string; mes?: string }) {
  const now = new Date();
  const ano = Number(searchParams.ano ?? now.getFullYear());
  const mes = Number(searchParams.mes ?? now.getMonth() + 1);

  return {
    ano: Number.isInteger(ano) && ano >= 2020 && ano <= 2100 ? ano : now.getFullYear(),
    mes: Number.isInteger(mes) && mes >= 1 && mes <= 12 ? mes : now.getMonth() + 1,
  };
}

export default async function RotinasPage({ searchParams }: { searchParams: { ano?: string; mes?: string } }) {
  const { profile } = await requireGestorAdm();
  const competencia = parseCompetencia(searchParams);
  const [casas, form148Statuses, controlesMensais] = await Promise.all([
    prisma.casaOracao.findMany({
      where: { administracaoId: profile.administracaoId, ativa: true },
      orderBy: { codigoSiga: "asc" },
      select: { id: true, codigoSiga: true, nome: true, cidade: true },
    }),
    prisma.form148Status.findMany({
      where: {
        administracaoId: profile.administracaoId,
        competenciaAno: competencia.ano,
        competenciaMes: { lte: competencia.mes },
      },
      select: { casaOracaoId: true, competenciaMes: true, etapa: true, status: true },
    }),
    prisma.controleMensal.findMany({
      where: { administracaoId: profile.administracaoId, competenciaAno: competencia.ano },
      select: { tarefaId: true, competenciaMes: true, status: true },
    }),
  ]);

  return (
    <AppShell
      subtitle="Rotinas Mensais"
      title="Controle Geral e Form. 14.8"
      userEmail={profile.email}
      userName={profile.nome}
    >
      <div className="mb-4 flex justify-end">
        <a
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          download
          href={`/api/exportar/controle?ano=${competencia.ano}&mes=${competencia.mes}`}
        >
          Exportar competência
        </a>
      </div>
      <RotinasBoard
        ano={competencia.ano}
        casas={casas}
        controlesMensais={controlesMensais}
        form148Statuses={form148Statuses}
        mes={competencia.mes}
      />
    </AppShell>
  );
}
