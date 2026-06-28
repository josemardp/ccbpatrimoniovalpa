import { cache } from "react";
import { AppShell } from "@/components/app-shell";
import { requireGestorAdm } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CONTROLE_TAREFAS, FORM_148_ETAPAS, MESES_COMPLETOS } from "@/lib/sprint1";
import { AlertTriangle, ClipboardCheck, FileCheck2, ListChecks, Package } from "lucide-react";

const CHECKLIST_TASK_ID = "t6_checklist_siga";

const getDashboardData = cache(async (administracaoId: string, ano: number, mes: number) => {
  const [casas, formMesAtual, pendenciasForm, pendenciasControle, formulariosConcluidos, controlesMes] =
    await Promise.all([
      prisma.casaOracao.findMany({
        where: { administracaoId, ativa: true },
        orderBy: { codigoSiga: "asc" },
        select: { id: true, codigoSiga: true, nome: true, cidade: true },
      }),
      prisma.form148Status.findMany({
        where: { administracaoId, competenciaAno: ano, competenciaMes: mes },
        select: { casaOracaoId: true, etapa: true, status: true },
      }),
      prisma.form148Status.count({
        where: { administracaoId, status: "pendente" },
      }),
      prisma.controleMensal.count({
        where: { administracaoId, status: "pendente" },
      }),
      prisma.form148Status.count({
        where: { administracaoId, etapa: "escaneado", status: "ok" },
      }),
      prisma.controleMensal.findMany({
        where: { administracaoId, competenciaAno: ano, competenciaMes: mes },
        select: { tarefaId: true, status: true },
      }),
    ]);

  const casasEmDia = casas.filter((casa) =>
    FORM_148_ETAPAS.every((etapa) =>
      formMesAtual.some((row) => row.casaOracaoId === casa.id && row.etapa === etapa.id && row.status === "ok"),
    ),
  ).length;

  const tarefasOk = CONTROLE_TAREFAS.filter((tarefa) =>
    controlesMes.some((row) => row.tarefaId === tarefa.id && row.status === "ok"),
  ).length;

  const checklistStatus = (() => {
    const row = controlesMes.find((item) => item.tarefaId === CHECKLIST_TASK_ID);
    if (!row || row.status === "vazio") return "Aberto";
    if (row.status === "ok") return "Fechado";
    return "Respondido";
  })();

  return {
    casas,
    casasEmDia,
    pendenciasAbertas: pendenciasForm + pendenciasControle,
    formulariosConcluidos,
    tarefasPercentual: Math.round((tarefasOk / CONTROLE_TAREFAS.length) * 100),
    checklistStatus,
  };
});

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

export default async function DashboardPage() {
  const { profile } = await requireGestorAdm();
  const now = new Date();
  const ano = now.getFullYear();
  const mes = now.getMonth() + 1;
  const dashboard = await getDashboardData(profile.administracaoId, ano, mes);

  return (
    <AppShell
      subtitle="Dashboard"
      title="Painel do Gestor"
      userEmail={profile.email}
      userName={profile.nome}
    >
      <div className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Competência atual</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            {MESES_COMPLETOS[mes - 1]} de {ano}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            KPIs calculados diretamente do PostgreSQL/Prisma. Ajustes operacionais ficam em Rotinas.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <KpiCard
            hint="Todas as 5 etapas do Form. 14.8 marcadas como OK"
            icon={FileCheck2}
            label="Casas em dia"
            value={`${dashboard.casasEmDia} de ${dashboard.casas.length}`}
          />
          <KpiCard
            hint="Soma de pendentes em Form. 14.8 e Controle Geral"
            icon={AlertTriangle}
            label="Pendências abertas"
            value={String(dashboard.pendenciasAbertas)}
          />
          <KpiCard
            hint="Etapa Escaneado marcada como OK"
            icon={ClipboardCheck}
            label="Formulários concluídos"
            value={String(dashboard.formulariosConcluidos)}
          />
          <KpiCard
            hint="Status OK nas 7 tarefas da competência atual"
            icon={ListChecks}
            label="Controle geral"
            value={`${dashboard.tarefasPercentual}%`}
          />
          <KpiCard
            hint="Derivado da tarefa T6 até a Sprint 4"
            icon={Package}
            label="Checklist SIGA"
            value={dashboard.checklistStatus}
          />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-950">Casas de Oração cadastradas</h2>
            <p className="text-sm text-slate-500">Base real seedada no banco da Administração.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">Código SIGA</th>
                  <th className="px-6 py-3">Casa de Oração</th>
                  <th className="px-6 py-3">Cidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dashboard.casas.map((casa) => (
                  <tr key={casa.id}>
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-950">{casa.codigoSiga}</td>
                    <td className="px-6 py-4">{casa.nome}</td>
                    <td className="px-6 py-4">{casa.cidade}</td>
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
