import Link from "next/link";
import { Church } from "lucide-react";
import { solicitarRecuperacao } from "./actions";

const STATUS_MESSAGES: Record<string, string> = {
  sent: "Se o e-mail estiver cadastrado, enviaremos um link de recuperação.",
  missing: "Informe o e-mail cadastrado.",
  error: "Não foi possível enviar o e-mail de recuperação.",
};

export default function RecuperarSenhaPage({ searchParams }: { searchParams: { status?: string } }) {
  const message = searchParams.status ? STATUS_MESSAGES[searchParams.status] : null;
  const isError = searchParams.status === "missing" || searchParams.status === "error";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-700 text-white">
            <Church className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-950">Recuperar senha</h1>
            <p className="text-sm text-slate-500">CCB Patrimônio</p>
          </div>
        </div>

        {message ? (
          <div
            className={`mb-5 rounded-md border px-4 py-3 text-sm ${
              isError ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"
            }`}
          >
            {message}
          </div>
        ) : null}

        <form action={solicitarRecuperacao} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">
              E-mail
            </label>
            <input
              autoComplete="email"
              className="focus-ring w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              id="email"
              name="email"
              required
              type="email"
            />
          </div>
          <button
            className="focus-ring w-full rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
            type="submit"
          >
            Enviar link de recuperação
          </button>
        </form>

        <Link className="mt-4 inline-block text-xs font-medium text-blue-700 hover:underline" href="/login">
          Voltar ao login
        </Link>
      </section>
    </main>
  );
}
