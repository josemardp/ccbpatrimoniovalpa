import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Form148HistoryTable } from "@/components/form148-history-table";
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

function ultimasCompetencias(ano: number, mes: number) {
  const competencias: { ano: number; mes: number }[] = [];
  let cursorAno = ano;
  let cursorMes = mes;

  for (let index = 0; index < 12; index += 1) {
    competencias.push({ ano: cursorAno, mes: cursorMes });
    cursorMes -= 1;

    if (cursorMes === 0) {
      cursorMes = 12;
      cursorAno -= 1;
    }
  }

  return competencias;
}

export default async function FormularioCasaPage({
  params,
  searchParams,
}: {
  params: { casaId: string };
  searchParams: { ano?: string; mes?: string };
}) {
  const { profile } = await requireGestorAdm();
  const competencia = parseCompetencia(searchParams);
  const competencias = ultimasCompetencias(competencia.ano, competencia.mes);
  const oldest = competencias[competencias.length - 1];
  const [casa, statuses] = await Promise.all([
    prisma.casaOracao.findFirst({
      where: { id: params.casaId, administracaoId: profile.administracaoId },
      select: { id: true, codigoSiga: true, nome: true, cidade: true },
    }),
    prisma.form148Status.findMany({
      where: {
        administracaoId: profile.administracaoId,
        casaOracaoId: params.casaId,
        OR: [
          {
            competenciaAno: competencia.ano,
            competenciaMes: { lte: competencia.mes },
          },
          {
            competenciaAno: oldest.ano,
            competenciaMes: { gte: oldest.mes },
          },
        ],
      },
      select: { competenciaAno: true, competenciaMes: true, etapa: true, status: true },
    }),
  ]);

  if (!casa) {
    return (
      <AppShell subtitle="Formulários" title="Casa de Oração não encontrada" userEmail={profile.email} userName={profile.nome}>
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">A Casa de Oração solicitada não pertence a esta Administração.</p>
          <Link className="mt-4 inline-flex rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" href="/formularios">
            Voltar
          </Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      subtitle="Formulários"
      title={`Form. 14.8 — ${casa.codigoSiga}`}
      userEmail={profile.email}
      userName={profile.nome}
    >
      <div className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{casa.codigoSiga}</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">{casa.nome}</h2>
              <p className="mt-1 text-sm text-slate-500">{casa.cidade}</p>
            </div>
            <Link
              className="inline-flex w-fit rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              href={`/formularios?ano=${competencia.ano}&mes=${competencia.mes}`}
            >
              Voltar aos formulários
            </Link>
          </div>
        </section>

        <Form148HistoryTable casaId={casa.id} competencias={competencias} statuses={statuses} />
      </div>
    </AppShell>
  );
}
