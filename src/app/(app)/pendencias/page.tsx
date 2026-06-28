import { AppShell } from "@/components/app-shell";
import { updateControleMensal, updateForm148Status } from "@/actions/rotinas";
import { requireGestorAdm } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CONTROLE_TAREFAS, FORM_148_ETAPAS, MESES } from "@/lib/sprint1";

function previousCompetencia() {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return { ano: date.getFullYear(), mes: date.getMonth() + 1 };
}

export default async function PendenciasPage() {
  const { profile } = await requireGestorAdm();
  const anterior = previousCompetencia();
  const [formPendencias, controlePendencias] = await Promise.all([
    prisma.form148Status.findMany({
      where: {
        administracaoId: profile.administracaoId,
        OR: [
          { status: "pendente" },
          { competenciaAno: anterior.ano, competenciaMes: anterior.mes, status: "vazio" },
        ],
      },
      include: { casaOracao: { select: { id: true, codigoSiga: true, nome: true } } },
      orderBy: [{ competenciaAno: "desc" }, { competenciaMes: "desc" }],
    }),
    prisma.controleMensal.findMany({
      where: {
        administracaoId: profile.administracaoId,
        OR: [
          { status: "pendente" },
          { competenciaAno: anterior.ano, competenciaMes: anterior.mes, status: "vazio" },
        ],
      },
      orderBy: [{ competenciaAno: "desc" }, { competenciaMes: "desc" }],
    }),
  ]);

  const grouped = formPendencias.reduce<Record<string, typeof formPendencias>>((acc, item) => {
    const key = `${item.casaOracao.codigoSiga} · ${item.casaOracao.nome}`;
    acc[key] = [...(acc[key] ?? []), item];
    return acc;
  }, {});

  return (
    <AppShell subtitle="Pendências" title="Pendências e Acompanhamento" userEmail={profile.email} userName={profile.nome}>
      <div className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Pendências abertas</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            {formPendencias.length + controlePendencias.length} item(ns)
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Lista formada por status pendente em qualquer competência e registros vazios do mês anterior.
          </p>
        </section>

        {Object.entries(grouped).map(([casa, itens]) => (
          <section className="rounded-lg border border-slate-200 bg-white shadow-sm" key={casa}>
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-950">{casa}</h2>
              <p className="text-sm text-slate-500">Form. 14.8</p>
            </div>
            <div className="divide-y divide-slate-100">
              {itens.map((item) => {
                const etapa = FORM_148_ETAPAS.find((row) => row.id === item.etapa);
                return (
                  <div className="grid gap-3 px-5 py-4 text-sm md:grid-cols-[1fr_auto]" key={item.id}>
                    <div>
                      <div className="font-medium text-slate-950">
                        {MESES[item.competenciaMes - 1]}/{item.competenciaAno} · {etapa?.label ?? item.etapa}
                      </div>
                      <div className="text-slate-500">Status: {item.status}</div>
                    </div>
                    <form action={updateForm148Status.bind(null, item.casaOracaoId, item.competenciaAno, item.competenciaMes, item.etapa, "ok")}>
                      <button className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800">
                        Marcar resolvido
                      </button>
                    </form>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {controlePendencias.length > 0 ? (
          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-950">Administração · Controle Geral</h2>
              <p className="text-sm text-slate-500">Itens sem Casa de Oração vinculada.</p>
            </div>
            <div className="divide-y divide-slate-100">
              {controlePendencias.map((item) => {
                const tarefa = CONTROLE_TAREFAS.find((row) => row.id === item.tarefaId);
                return (
                  <div className="grid gap-3 px-5 py-4 text-sm md:grid-cols-[1fr_auto]" key={item.id}>
                    <div>
                      <div className="font-medium text-slate-950">
                        {MESES[item.competenciaMes - 1]}/{item.competenciaAno} · {tarefa?.label ?? item.tarefaId}
                      </div>
                      <div className="text-slate-500">Status: {item.status}</div>
                    </div>
                    <form action={updateControleMensal.bind(null, item.tarefaId, item.competenciaAno, item.competenciaMes, "ok")}>
                      <button className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800">
                        Marcar resolvido
                      </button>
                    </form>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {formPendencias.length === 0 && controlePendencias.length === 0 ? (
          <section className="rounded-lg border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
            Nenhuma pendência aberta encontrada.
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
