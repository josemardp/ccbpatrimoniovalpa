"use client";

import { useState, useTransition } from "react";
import { alterarSenha, atualizarPerfil, encerrarSessao, encerrarTodasSessoes } from "@/actions/perfil";
import { useToast } from "@/components/toast";

export function PerfilNomeForm({ nome }: { nome: string }) {
  const [name, setName] = useState(nome);
  const [pending, startTransition] = useTransition();
  const { showToast } = useToast();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await atualizarPerfil(name);
      showToast(result.message, result.ok ? "sucesso" : "erro");
    });
  }

  return (
    <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
      <label className="block text-sm font-medium text-slate-700">
        Nome
        <input
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          minLength={3}
          onChange={(event) => setName(event.currentTarget.value)}
          required
          value={name}
        />
      </label>
      <button
        className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
      >
        {pending ? "Salvando..." : "Salvar nome"}
      </button>
    </form>
  );
}

export function AlterarSenhaForm() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [pending, startTransition] = useTransition();
  const { showToast } = useToast();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (novaSenha === senhaAtual) {
      showToast("A nova senha deve ser diferente da senha atual.", "erro");
      return;
    }

    if (novaSenha !== confirmacao) {
      showToast("A confirmação não confere com a nova senha.", "erro");
      return;
    }

    startTransition(async () => {
      const result = await alterarSenha(novaSenha);
      showToast(result.message, result.ok ? "sucesso" : "erro");

      if (result.ok) {
        setSenhaAtual("");
        setNovaSenha("");
        setConfirmacao("");
      }
    });
  }

  return (
    <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
      <label className="block text-sm font-medium text-slate-700">
        Senha atual
        <input
          autoComplete="current-password"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          onChange={(event) => setSenhaAtual(event.currentTarget.value)}
          required
          type="password"
          value={senhaAtual}
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Nova senha
        <input
          autoComplete="new-password"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          minLength={8}
          onChange={(event) => setNovaSenha(event.currentTarget.value)}
          required
          type="password"
          value={novaSenha}
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Confirmar nova senha
        <input
          autoComplete="new-password"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          minLength={8}
          onChange={(event) => setConfirmacao(event.currentTarget.value)}
          required
          type="password"
          value={confirmacao}
        />
      </label>
      <button
        className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
      >
        {pending ? "Alterando..." : "Alterar senha"}
      </button>
    </form>
  );
}

export function SessaoActions() {
  return (
    <div className="mt-5 flex flex-wrap gap-3">
      <form action={encerrarSessao}>
        <button className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Encerrar sessão
        </button>
      </form>
      <form action={encerrarTodasSessoes}>
        <button className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Encerrar todas as sessões
        </button>
      </form>
    </div>
  );
}
