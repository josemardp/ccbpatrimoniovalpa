import Link from "next/link";
import { redirect } from "next/navigation";
import { Church } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "E-mail ou senha inválidos.",
  missing: "Informe e-mail e senha.",
  unauthorized: "Este usuário não está habilitado como gestor_adm.",
};

const STATUS_MESSAGES: Record<string, string> = {
  "password-updated": "Senha atualizada. Entre novamente com a nova senha.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; status?: string };
}) {
  const currentUser = await getCurrentUser();

  if (currentUser?.profile.papel === "gestor_adm") {
    redirect("/dashboard");
  }

  const error = searchParams.error ? ERROR_MESSAGES[searchParams.error] : null;
  const status = searchParams.status ? STATUS_MESSAGES[searchParams.status] : null;

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
        {status ? (
          <div className="mb-5 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {status}
          </div>
        ) : null}

        <LoginForm />

        <Link className="mt-4 inline-block text-xs font-medium text-blue-700 hover:underline" href="/login/recuperar">
          Esqueci minha senha
        </Link>

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
