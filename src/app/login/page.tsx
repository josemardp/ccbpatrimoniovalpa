import Link from "next/link";
import { redirect } from "next/navigation";
import { Church } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { signIn } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "E-mail ou senha inválidos.",
  missing: "Informe e-mail e senha.",
  unauthorized: "Este usuário não está habilitado como gestor_adm.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const currentUser = await getCurrentUser();

  if (currentUser?.profile.papel === "gestor_adm") {
    redirect("/dashboard");
  }

  const error = searchParams.error ? ERROR_MESSAGES[searchParams.error] : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-700 text-white">
            <Church className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-950">CCB Patrimônio</h1>
            <p className="text-sm text-slate-500">Bens Móveis — Adm. Valparaíso/SP</p>
          </div>
        </div>

        {error ? (
          <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <form action={signIn} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">
              E-mail
            </label>
            <input
              className="focus-ring w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="password">
              Senha
            </label>
            <input
              className="focus-ring w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <button
            className="focus-ring w-full rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
            type="submit"
          >
            Entrar
          </button>
        </form>

        <p className="mt-6 text-xs leading-5 text-slate-500">
          Acesso restrito aos gestores cadastrados com papel <code>gestor_adm</code>. Crie o usuário no
          Supabase Auth com o mesmo e-mail cadastrado pelo seed.
        </p>
        <Link className="mt-4 inline-block text-xs font-medium text-blue-700 hover:underline" href="/">
          Voltar ao início
        </Link>
      </section>
    </main>
  );
}
