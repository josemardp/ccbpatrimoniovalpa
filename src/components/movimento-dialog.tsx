"use client";

import { useRef } from "react";
import { criarMovimento } from "@/actions/movimentos";

type CasaOption = {
  id: string;
  codigoSiga: string;
  nome: string;
};

export function MovimentoDialog({ casas, hoje }: { casas: CasaOption[]; hoje: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        Registrar movimento
      </button>
      <dialog className="w-full max-w-2xl rounded-lg border border-slate-200 p-0 shadow-xl backdrop:bg-slate-950/40" ref={dialogRef}>
        <form action={criarMovimento} className="p-6">
          <div className="border-b border-slate-100 pb-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Movimento patrimonial</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">Registrar movimento</h2>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Tipo
              <select className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" name="tipo" required>
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
                <option value="transferencia">Transferência</option>
                <option value="baixa">Baixa</option>
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Data
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                defaultValue={hoje}
                name="dataMovimento"
                required
                type="date"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Casa origem
              <select className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" name="casaOrigemId">
                <option value="">Sem origem</option>
                {casas.map((casa) => (
                  <option key={casa.id} value={casa.id}>
                    {casa.codigoSiga} · {casa.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Casa destino
              <select className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" name="casaDestinoId">
                <option value="">Sem destino</option>
                {casas.map((casa) => (
                  <option key={casa.id} value={casa.id}>
                    {casa.codigoSiga} · {casa.nome}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="mt-4 block text-sm font-medium text-slate-700">
            Descrição
            <textarea
              className="mt-1 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              name="descricao"
              required
            />
          </label>

          <label className="mt-4 block text-sm font-medium text-slate-700">
            Documento / referência
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              name="documento"
              placeholder="NF, Form. 14.2, Form. 14.3..."
            />
          </label>

          <div className="mt-6 flex justify-end gap-3">
            <button
              className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => dialogRef.current?.close()}
              type="button"
            >
              Cancelar
            </button>
            <button className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800">
              Salvar movimento
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
