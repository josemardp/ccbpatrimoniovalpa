import { AppShell } from "@/components/app-shell";
import { TarefasList } from "@/components/tarefas-list";
import type { TarefaView } from "@/components/tarefa-dialog";
import { requireGestorAdm } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function toTarefaView(tarefa: {
  id: string;
  titulo: string;
  descricao: string | null;
  prazo: Date | null;
  concluida: boolean;
  concluidaEm: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): TarefaView {
  return {
    id: tarefa.id,
    titulo: tarefa.titulo,
    descricao: tarefa.descricao,
    prazo: tarefa.prazo?.toISOString() ?? null,
    concluida: tarefa.concluida,
    concluidaEm: tarefa.concluidaEm?.toISOString() ?? null,
    createdAt: tarefa.createdAt.toISOString(),
    updatedAt: tarefa.updatedAt.toISOString(),
  };
}

export default async function TarefasPage() {
  const { profile } = await requireGestorAdm();
  const tarefas = await prisma.tarefaAdm.findMany({
    where: { administracaoId: profile.administracaoId },
    orderBy: [
      { concluida: "asc" },
      { prazo: { sort: "asc", nulls: "last" } },
      { createdAt: "desc" },
    ],
  });

  return (
    <AppShell subtitle="Tarefas" title="Tarefas" userEmail={profile.email} userName={profile.nome}>
      <TarefasList initialTarefas={tarefas.map(toTarefaView)} />
    </AppShell>
  );
}
