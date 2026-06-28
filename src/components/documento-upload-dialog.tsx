"use client";

import { useRef } from "react";
import { uploadDocumento } from "@/actions/documentos";

export function DocumentoUploadDialog({ casaId, ano, mes }: { casaId: string; ano: number; mes: number }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        Anexar formulário escaneado
      </button>
      <dialog className="w-full max-w-lg rounded-lg border border-slate-200 p-0 shadow-xl backdrop:bg-slate-950/40" ref={dialogRef}>
        <form action={uploadDocumento} className="p-6">
          <input name="casaId" type="hidden" value={casaId} />
          <input name="ano" type="hidden" value={ano} />
          <input name="mes" type="hidden" value={mes} />
          <input name="tipo" type="hidden" value="form148" />

          <div className="border-b border-slate-100 pb-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Form. 14.8</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">Anexar formulário escaneado</h2>
            <p className="mt-1 text-sm text-slate-500">
              Competência {String(mes).padStart(2, "0")}/{ano}. Apenas PDF até 10 MB.
            </p>
          </div>

          <label className="mt-5 block text-sm font-medium text-slate-700">
            Arquivo PDF
            <input
              accept=".pdf,application/pdf"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              name="arquivo"
              required
              type="file"
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
              Enviar PDF
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
