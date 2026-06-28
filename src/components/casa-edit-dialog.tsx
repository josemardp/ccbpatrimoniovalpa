"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { updateCasa } from "@/actions/casas";
import { useToast } from "@/components/toast";

export function CasaEditDialog({
  casa,
}: {
  casa: {
    id: string;
    codigoSiga: string;
    nome: string;
    anciaoCooperador: string | null;
    responsavelPatrimonio: string | null;
  };
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const { showToast } = useToast();

  async function handleUpdate(formData: FormData) {
    try {
      await updateCasa(casa.id, formData);
      showToast("Casa de Oração atualizada com sucesso.");
      dialogRef.current?.close();
      router.refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Falha ao atualizar Casa de Oração.", "erro");
    }
  }

  return (
    <>
      <button
        className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        Editar
      </button>
      <dialog
        aria-labelledby={`casa-edit-title-${casa.id}`}
        className="w-full max-w-lg rounded-lg border border-slate-200 p-0 shadow-xl backdrop:bg-slate-950/40"
        ref={dialogRef}
      >
        <form action={handleUpdate} className="p-6">
          <div className="border-b border-slate-100 pb-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{casa.codigoSiga}</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950" id={`casa-edit-title-${casa.id}`}>
              {casa.nome}
            </h2>
          </div>
          <div className="mt-5 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Ancião / Cooperador
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                defaultValue={casa.anciaoCooperador ?? ""}
                name="anciaoCooperador"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Responsável Patrimônio
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                defaultValue={casa.responsavelPatrimonio ?? ""}
                name="responsavelPatrimonio"
              />
            </label>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              formMethod="dialog"
              type="button"
              onClick={() => dialogRef.current?.close()}
            >
              Cancelar
            </button>
            <button className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800">
              Salvar
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
