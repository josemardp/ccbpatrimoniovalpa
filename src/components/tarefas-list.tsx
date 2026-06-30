"use client";

import { useState } from "react";
import { ClipboardList } from "lucide-react";
import { EstadoVazio } from "@/components/estado-vazio";
import { TarefaDialog, type TarefaView } from "@/components/tarefa-dialog";
import { useToast } from "@/components/toast";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}

function isOverdue(value: string | null, concluida: boolean) {
  if (!value || concluida) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const prazo = new Date(value);
  prazo.setHours(0, 0, 0, 0);

  return prazo < today;
}

async function fetchTarefas() {
  const response = await fetch("/api/tarefas", { cache: "no-store" });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error ?? "Falha ao carregar tarefas.");
  }

  return result.tarefas as TarefaView[];
}

function TarefaCard({
  tarefa,
  onChanged,
}: {
  tarefa: TarefaView;
  onChanged: () => Promise<void>;
}) {
  const { showToast } = useToast();
  const overdue = isOverdue(tarefa.prazo, tarefa.concluida);
  const actionLabel = tarefa.concluida ? "Reabrir" : "Concluir";

  async function updateConclusao(concluida: boolean) {
    try {
      const response = await fetch(`/api/tarefas/${tarefa.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concluida }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Falha ao atualizar tarefa.");
      }

      showToast(concluida ? "Tarefa concluída." : "Tarefa reaberta.");
      await onChanged();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Falha ao atualizar tarefa.", "erro");
    }
  }

  async function deleteTarefa() {
    if (!window.confirm("Confirma excluir esta tarefa?")) {
      return;
    }

    try {
      const response = await fetch(`/api/tarefas/${tarefa.id}`, { method: "DELETE" });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Falha ao excluir tarefa.");
      }

      showToast("Tarefa excluída com sucesso.");
      await onChanged();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Falha ao excluir tarefa.", "erro");
    }
  }

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h3 className={`text-base font-semibold ${tarefa.concluida ? "text-slate-500 line-through" : "text-slate-950"}`}>
            {tarefa.titulo}
          </h3>
          {tarefa.descricao ? (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{tarefa.descricao}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
            {tarefa.prazo ? (
              <span className={overdue ? "font-semibold text-red-700" : undefined}>
                Prazo: {formatDate(tarefa.prazo)}
              </span>
            ) : null}
            <span>Criada em: {formatDate(tarefa.createdAt)}</span>
            {tarefa.concluida && tarefa.concluidaEm ? <span>Concluída em: {formatDate(tarefa.concluidaEm)}</span> : null}
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            className={
              tarefa.concluida
                ? "rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                : "rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800"
            }
            onClick={() => updateConclusao(!tarefa.concluida)}
            type="button"
          >
            {actionLabel}
          </button>
          <TarefaDialog onSaved={onChanged} tarefa={tarefa} />
          <button
            className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
            onClick={deleteTarefa}
            type="button"
          >
            Excluir
          </button>
        </div>
      </div>
    </article>
  );
}

function TarefasSection({
  title,
  tarefas,
  onChanged,
  collapsible = false,
}: {
  title: string;
  tarefas: TarefaView[];
  onChanged: () => Promise<void>;
  collapsible?: boolean;
}) {
  const content = (
    <div className="space-y-3">
      {tarefas.map((tarefa) => (
        <TarefaCard key={tarefa.id} onChanged={onChanged} tarefa={tarefa} />
      ))}
    </div>
  );

  if (collapsible) {
    return (
      <details className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <summary className="cursor-pointer text-lg font-semibold text-slate-950">
          {title} ({tarefas.length})
        </summary>
        <div className="mt-4">{tarefas.length > 0 ? content : <p className="text-sm text-slate-500">Nenhuma tarefa concluída.</p>}</div>
      </details>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      {tarefas.length > 0 ? (
        content
      ) : (
        <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <EstadoVazio
            descricao="Use o botão Cadastrar tarefa para registrar lembretes e atividades manuais do gestor."
            icon={ClipboardList}
            titulo="Nenhuma tarefa em aberto."
          />
        </section>
      )}
    </section>
  );
}

export function TarefasList({ initialTarefas }: { initialTarefas: TarefaView[] }) {
  const { showToast } = useToast();
  const [tarefas, setTarefas] = useState(initialTarefas);

  async function reload() {
    try {
      setTarefas(await fetchTarefas());
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Falha ao carregar tarefas.", "erro");
    }
  }

  const abertas = tarefas.filter((tarefa) => !tarefa.concluida);
  const concluidas = tarefas.filter((tarefa) => tarefa.concluida);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Agenda livre</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">Tarefas manuais do gestor</h2>
            <p className="mt-1 text-sm text-slate-500">Lembretes avulsos que não são gerados automaticamente pelas rotinas.</p>
          </div>
          <TarefaDialog onSaved={reload} />
        </div>
      </section>

      <TarefasSection onChanged={reload} tarefas={abertas} title="Em aberto" />
      <TarefasSection collapsible onChanged={reload} tarefas={concluidas} title="Concluídas" />
    </div>
  );
}
