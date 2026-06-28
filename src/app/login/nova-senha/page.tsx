import Link from "next/link";
import { Church } from "lucide-react";
import { atualizarSenha } from "./actions";

const STATUS_MESSAGES: Record<string, string> = {
  short: "A nova senha deve ter pelo menos 8 caracteres.",
  error: "Não foi possível atualizar a senha. Abra novamente o link de recuperação.",
};

export default function NovaSenhaPage({ searchParams }: { searchParams: { status?: string } }) {
  const message = searchParams.status ? STATUS_MESSAGES[searchParams.status] : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-700 text-white">
            <Church className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-950">Nova senha</h1>
            <p className="text-sm text-slate-500">Defina uma nova senha de acesso</p>
          </div>
        </div>

        {message ? (
          <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {message}
          </div>
        ) : null}

        <form action={atualizarSenha} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="password">
              Nova senha
            </label>
            <input
              autoComplete="new-password"
              className="focus-ring w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              id="password"
              minLength={8}
              name="password"
              required
              type="password"
            />
          </div>
          <button
            className="focus-ring w-full rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
            type="submit"
          >
            Atualizar senha
          </button>
        </form>

        <Link className="mt-4 inline-block text-xs font-medium text-blue-700 hover:underline" href="/login">
          Voltar ao login
        </Link>
      </section>
    </main>
  );
}
