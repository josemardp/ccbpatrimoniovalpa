"use client";

import { useRef, useState } from "react";
import { useToast } from "@/components/toast";

export type TarefaView = {
  id: string;
  titulo: string;
  descricao: string | null;
  prazo: string | null;
  concluida: boolean;
  concluidaEm: string | null;
  createdAt: string;
  updatedAt: string;
};

type TarefaDialogProps = {
  tarefa?: TarefaView;
  onSaved: () => Promise<void> | void;
};

function dateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

export function TarefaDialog({ tarefa, onSaved }: TarefaDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { showToast } = useToast();
  const [titulo, setTitulo] = useState(tarefa?.titulo ?? "");
  const [descricao, setDescricao] = useState(tarefa?.descricao ?? "");
  const [prazo, setPrazo] = useState(dateInputValue(tarefa?.prazo));
  const [saving, setSaving] = useState(false);
  const editing = Boolean(tarefa);

  function openDialog() {
    setTitulo(tarefa?.titulo ?? "");
    setDescricao(tarefa?.descricao ?? "");
    setPrazo(dateInputValue(tarefa?.prazo));
    dialogRef.current?.showModal();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(editing ? `/api/tarefas/${tarefa?.id}` : "/api/tarefas", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo,
          descricao,
          prazo,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Falha ao salvar tarefa.");
      }

      showToast(editing ? "Tarefa atualizada com sucesso." : "Tarefa cadastrada com sucesso.");
      dialogRef.current?.close();
      await onSaved();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Falha ao salvar tarefa.", "erro");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        className={
          editing
            ? "rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            : "rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800"
        }
        onClick={openDialog}
        type="button"
      >
        {editing ? "Editar" : "Cadastrar tarefa"}
      </button>
      <dialog
        aria-labelledby={`tarefa-dialog-title-${tarefa?.id ?? "nova"}`}
        className="w-full max-w-2xl rounded-lg border border-slate-200 p-0 shadow-xl backdrop:bg-slate-950/40"
        ref={dialogRef}
      >
        <form className="max-h-[90vh] overflow-y-auto p-6" onSubmit={handleSubmit}>
          <div className="border-b border-slate-100 pb-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Agenda do gestor</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950" id={`tarefa-dialog-title-${tarefa?.id ?? "nova"}`}>
              {editing ? "Editar tarefa" : "Cadastrar tarefa"}
            </h2>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Título *
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                maxLength={200}
                onChange={(event) => setTitulo(event.currentTarget.value)}
                required
                type="text"
                value={titulo}
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Descrição
              <textarea
                className="mt-1 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                maxLength={1000}
                onChange={(event) => setDescricao(event.currentTarget.value)}
                value={descricao}
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Prazo
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                onChange={(event) => setPrazo(event.currentTarget.value)}
                type="date"
                value={prazo}
              />
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => dialogRef.current?.close()}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving}
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
