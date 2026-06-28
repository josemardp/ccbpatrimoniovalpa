"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { confirmarImportacao, parsearExcelSiga } from "@/actions/importacao";
import type { BemImportInput, ImportacaoErro } from "@/lib/importacao-types";

type CasaOption = {
  id: string;
  codigoSiga: string;
  nome: string;
};

type Preview = {
  validas: BemImportInput[];
  erros: ImportacaoErro[];
};

type Resultado = {
  importados: number;
  atualizados: number;
  ignorados: number;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function ImportacaoSigaDialog({ casas }: { casas: CasaOption[] }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [casaId, setCasaId] = useState(casas[0]?.id ?? "");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function reset() {
    setPreview(null);
    setResultado(null);
    setError(null);
    setLoading(false);
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  }

  async function handleValidate(formData: FormData) {
    setLoading(true);
    setError(null);

    try {
      const arquivo = formData.get("arquivo");
      if (!(arquivo instanceof File) || arquivo.size === 0) {
        setError("Selecione uma planilha Excel.");
        return;
      }

      if (arquivo.size > MAX_FILE_SIZE) {
        setError("Arquivo maior que 5 MB.");
        return;
      }

      formData.set("casaOracaoId", casaId);
      const parsed = await parsearExcelSiga(formData);
      setPreview(parsed);
      setResultado(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao validar arquivo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!preview) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await confirmarImportacao(preview.validas, casaId);
      setResultado(result);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao confirmar importação.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        onClick={() => {
          reset();
          dialogRef.current?.showModal();
        }}
        type="button"
      >
        Importar Excel do SIGA
      </button>

      <dialog
        aria-labelledby="importacao-siga-title"
        className="w-full max-w-4xl rounded-lg border border-slate-200 p-0 shadow-xl backdrop:bg-slate-950/40"
        ref={dialogRef}
      >
        <div className="max-h-[90vh] overflow-y-auto p-6">
          <div className="border-b border-slate-100 pb-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">SIGA</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950" id="importacao-siga-title">Importar Excel do SIGA</h2>
            <p className="mt-1 text-sm text-slate-500">Valide a planilha antes de gravar os bens patrimoniais.</p>
          </div>

          {error ? (
            <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}

          {!preview && !resultado ? (
            <form action={handleValidate} className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Casa de Oração da planilha
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  name="casaOracaoId"
                  onChange={(event) => setCasaId(event.currentTarget.value)}
                  required
                  value={casaId}
                >
                  {casas.map((casa) => (
                    <option key={casa.id} value={casa.id}>
                      {casa.codigoSiga} · {casa.nome}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Arquivo Excel
                <input
                  accept=".xlsx,.xls"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  name="arquivo"
                  ref={fileRef}
                  required
                  type="file"
                />
              </label>

              <div className="flex justify-end gap-3">
                <button
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  onClick={() => dialogRef.current?.close()}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? "Validando..." : "Validar arquivo"}
                </button>
              </div>
            </form>
          ) : null}

          {preview && !resultado ? (
            <div className="mt-5 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <p className="text-sm text-green-700">Linhas válidas</p>
                  <p className="mt-1 text-2xl font-semibold text-green-800">{preview.validas.length}</p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm text-amber-700">Linhas com erro</p>
                  <p className="mt-1 text-2xl font-semibold text-amber-800">{preview.erros.length}</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Código</th>
                      <th className="px-4 py-3">Descrição</th>
                      <th className="px-4 py-3">Categoria</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preview.validas.slice(0, 10).map((linha) => (
                      <tr key={linha.codigoInterno}>
                        <td className="px-4 py-3 font-medium text-slate-950">{linha.codigoInterno}</td>
                        <td className="px-4 py-3 text-slate-700">{linha.descricao}</td>
                        <td className="px-4 py-3 text-slate-600">{linha.categoria}</td>
                        <td className="px-4 py-3 text-slate-600">{linha.estadoConservacao}</td>
                        <td className="px-4 py-3 text-slate-600">{linha.valorAquisicao ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {preview.erros.length > 0 ? (
                <details className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
                  <summary className="cursor-pointer font-medium text-amber-800">Ver erros</summary>
                  <div className="mt-3 max-h-48 overflow-y-auto">
                    <table className="w-full text-left">
                      <thead className="text-xs uppercase tracking-wide text-amber-700">
                        <tr>
                          <th className="py-2 pr-3">Linha</th>
                          <th className="py-2">Motivo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-200">
                        {preview.erros.map((erro) => (
                          <tr key={`${erro.linha}-${erro.motivo}`}>
                            <td className="py-2 pr-3 font-medium text-amber-900">{erro.linha}</td>
                            <td className="py-2 text-amber-900">{erro.motivo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              ) : null}

              <div className="flex justify-end gap-3">
                <button
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    setPreview(null);
                    setResultado(null);
                  }}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={loading || preview.validas.length === 0}
                  onClick={handleConfirm}
                  type="button"
                >
                  {loading ? "Importando..." : "Confirmar importação"}
                </button>
              </div>
            </div>
          ) : null}

          {resultado ? (
            <div className="mt-5 space-y-5">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                Importação concluída: {resultado.importados} criados, {resultado.atualizados} atualizados,{" "}
                {resultado.ignorados} ignorados.
              </div>
              <div className="flex justify-end">
                <button
                  className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800"
                  onClick={() => {
                    dialogRef.current?.close();
                    reset();
                    router.refresh();
                  }}
                  type="button"
                >
                  Fechar
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </dialog>
    </>
  );
}
