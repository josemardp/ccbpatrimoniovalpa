"use client";

import { useRef } from "react";
import { atualizarBem, criarBem, desativarBem } from "@/actions/inventario";

export const CATEGORIAS_BEM = ["Móveis", "Eletrônicos", "Instrumentos Musicais", "Veículos", "Imóveis", "Outros"] as const;

export const ESTADOS_CONSERVACAO = [
  { id: "otimo", label: "Ótimo" },
  { id: "bom", label: "Bom" },
  { id: "regular", label: "Regular" },
  { id: "ruim", label: "Ruim" },
  { id: "descartado", label: "Descartado" },
] as const;

type CasaOption = {
  id: string;
  codigoSiga: string;
  nome: string;
};

export type BemFormData = {
  id: string;
  codigoInterno: string;
  casaOracaoId: string;
  descricao: string;
  categoria: string;
  marca: string;
  modelo: string;
  numeroSerie: string;
  dataAquisicao: string;
  valorAquisicao: string;
  estadoConservacao: string;
  observacoes: string;
};

function BemFields({ casas, bem }: { casas: CasaOption[]; bem?: BemFormData }) {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Descrição *
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            defaultValue={bem?.descricao ?? ""}
            name="descricao"
            required
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Categoria *
          <select
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            defaultValue={bem?.categoria ?? "Móveis"}
            name="categoria"
            required
          >
            {CATEGORIAS_BEM.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Casa de Oração *
          <select
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            defaultValue={bem?.casaOracaoId ?? ""}
            name="casaOracaoId"
            required
          >
            <option value="" disabled>
              Selecione
            </option>
            {casas.map((casa) => (
              <option key={casa.id} value={casa.id}>
                {casa.codigoSiga} · {casa.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Estado de conservação *
          <select
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            defaultValue={bem?.estadoConservacao ?? "bom"}
            name="estadoConservacao"
            required
          >
            {ESTADOS_CONSERVACAO.map((estado) => (
              <option key={estado.id} value={estado.id}>
                {estado.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Marca
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            defaultValue={bem?.marca ?? ""}
            name="marca"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Modelo
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            defaultValue={bem?.modelo ?? ""}
            name="modelo"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Nº série
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            defaultValue={bem?.numeroSerie ?? ""}
            name="numeroSerie"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Data aquisição
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            defaultValue={bem?.dataAquisicao ?? ""}
            name="dataAquisicao"
            type="date"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Valor aquisição
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            defaultValue={bem?.valorAquisicao ?? ""}
            min="0"
            name="valorAquisicao"
            step="0.01"
            type="number"
          />
        </label>
      </div>

      <label className="mt-4 block text-sm font-medium text-slate-700">
        Observações
        <textarea
          className="mt-1 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          defaultValue={bem?.observacoes ?? ""}
          name="observacoes"
        />
      </label>
    </>
  );
}

function DialogShell({
  children,
  dialogRef,
  kicker,
  title,
}: {
  children: React.ReactNode;
  dialogRef: React.RefObject<HTMLDialogElement>;
  kicker: string;
  title: string;
}) {
  return (
    <dialog className="w-full max-w-3xl rounded-lg border border-slate-200 p-0 shadow-xl backdrop:bg-slate-950/40" ref={dialogRef}>
      <div className="p-6">
        <div className="border-b border-slate-100 pb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{kicker}</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">{title}</h2>
        </div>
        {children}
      </div>
    </dialog>
  );
}

export function NovoBemDialog({ casas }: { casas: CasaOption[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        Cadastrar bem
      </button>
      <DialogShell dialogRef={dialogRef} kicker="Inventário" title="Cadastrar bem patrimonial">
        <form action={criarBem} className="mt-5">
          <BemFields casas={casas} />
          <div className="mt-6 flex justify-end gap-3">
            <button
              className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => dialogRef.current?.close()}
              type="button"
            >
              Cancelar
            </button>
            <button className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800">
              Salvar bem
            </button>
          </div>
        </form>
      </DialogShell>
    </>
  );
}

export function BemAcoes({ bem, casas }: { bem: BemFormData; casas: CasaOption[] }) {
  const editDialogRef = useRef<HTMLDialogElement>(null);
  const deactivateDialogRef = useRef<HTMLDialogElement>(null);

  return (
    <div className="flex justify-end gap-2">
      <button
        className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        onClick={() => editDialogRef.current?.showModal()}
        type="button"
      >
        Editar
      </button>
      <button
        className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        onClick={() => deactivateDialogRef.current?.showModal()}
        type="button"
      >
        Desativar
      </button>

      <DialogShell dialogRef={editDialogRef} kicker={bem.codigoInterno} title="Editar bem patrimonial">
        <form action={atualizarBem.bind(null, bem.id)} className="mt-5">
          <BemFields bem={bem} casas={casas} />
          <div className="mt-6 flex justify-end gap-3">
            <button
              className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => editDialogRef.current?.close()}
              type="button"
            >
              Cancelar
            </button>
            <button className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800">
              Salvar alterações
            </button>
          </div>
        </form>
      </DialogShell>

      <dialog className="w-full max-w-md rounded-lg border border-slate-200 p-0 shadow-xl backdrop:bg-slate-950/40" ref={deactivateDialogRef}>
        <form action={desativarBem.bind(null, bem.id)} className="p-6">
          <div className="border-b border-slate-100 pb-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">{bem.codigoInterno}</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">Desativar bem</h2>
          </div>
          <p className="mt-5 text-sm text-slate-600">
            Confirma desativar este bem do inventário ativo? O registro será preservado no histórico.
          </p>
          <p className="mt-3 text-sm font-medium text-slate-950">{bem.descricao}</p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => deactivateDialogRef.current?.close()}
              type="button"
            >
              Cancelar
            </button>
            <button className="rounded-md bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-800">
              Confirmar desativação
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
