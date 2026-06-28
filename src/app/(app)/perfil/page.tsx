import { AppShell } from "@/components/app-shell";
import { requireGestorAdm } from "@/lib/auth";

export default async function PerfilPage() {
  const { profile } = await requireGestorAdm();

  return (
    <AppShell subtitle="Perfil" title="Perfil de Usuário" userEmail={profile.email} userName={profile.nome}>
      <section className="max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Perfil de usuário</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-950">{profile.nome}</h2>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">E-mail</dt>
            <dd className="font-medium text-slate-950">{profile.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Papel</dt>
            <dd className="font-medium text-slate-950">{profile.papel}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Administração</dt>
            <dd className="font-medium text-slate-950">{profile.administracao.nome}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Casa vinculada</dt>
            <dd className="font-medium text-slate-950">
              {profile.casaOracao?.nome ?? "Não se aplica no MVP: usuários são apenas gestores da ADM."}
            </dd>
          </div>
        </dl>
      </section>
    </AppShell>
  );
}
