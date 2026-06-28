import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { AlterarSenhaForm, PerfilNomeForm, SessaoActions } from "@/components/perfil-forms";
import { requireGestorAdm } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function formatDate(date: Date | null) {
  if (!date) {
    return "-";
  }

  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function metadataDescricao(metadata: unknown) {
  if (metadata && typeof metadata === "object" && "descricao" in metadata) {
    return String((metadata as { descricao?: unknown }).descricao ?? "-");
  }

  return "-";
}

function parsePage(value?: string) {
  const page = Number(value ?? 1);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const { profile } = await requireGestorAdm();
  const page = parsePage(searchParams.page);
  const logs = await prisma.auditLog.findMany({
    where: { administracaoId: profile.administracaoId },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * 50,
    take: 50,
  });

  return (
    <AppShell subtitle="Perfil" title="Perfil de Usuário" userEmail={profile.email} userName={profile.nome}>
      <div className="space-y-6">
        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Dados pessoais</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">{profile.nome}</h2>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-slate-500">E-mail</dt>
                <dd className="font-medium text-slate-950">{profile.email}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Papel</dt>
                <dd className="font-medium text-slate-950">Gestor Administrativo</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Último login</dt>
                <dd className="font-medium text-slate-950">{formatDate(profile.lastLoginAt)}</dd>
              </div>
            </dl>
            <PerfilNomeForm nome={profile.nome} />
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Minha Administração</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">{profile.administracao.nome}</h2>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-slate-500">Cidade/UF</dt>
                <dd className="font-medium text-slate-950">
                  {profile.administracao.cidade}/{profile.administracao.uf}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">CNPJ</dt>
                <dd className="font-medium text-slate-950">{profile.administracao.cnpj}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Responsável patrimônio</dt>
                <dd className="font-medium text-slate-950">{profile.administracao.responsavelPatrimonio}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Regional</dt>
                <dd className="font-medium text-slate-950">{profile.administracao.regional}</dd>
              </div>
            </dl>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Alterar senha</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">Segurança da conta</h2>
            <AlterarSenhaForm />
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Sessão</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">Acesso ativo</h2>
            <p className="mt-2 text-sm text-slate-500">
              Encerre apenas esta sessão ou todas as sessões abertas com a mesma conta Supabase.
            </p>
            <SessaoActions />
          </article>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-950">Auditoria</h2>
            <p className="text-sm text-slate-500">Últimos 50 registros da Administração. Página {page}.</p>
          </div>
          {logs.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Data/hora</th>
                      <th className="px-5 py-3">Ação</th>
                      <th className="px-5 py-3">Entidade</th>
                      <th className="px-5 py-3">Descrição</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">{formatDate(log.createdAt)}</td>
                        <td className="px-5 py-4 font-medium text-slate-950">{log.action}</td>
                        <td className="px-5 py-4 text-slate-600">{log.entity}</td>
                        <td className="px-5 py-4 text-slate-600">{metadataDescricao(log.metadata)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm">
                <Link
                  className={`rounded-md border border-slate-200 px-3 py-2 font-medium text-slate-700 hover:bg-slate-50 ${
                    page <= 1 ? "pointer-events-none opacity-40" : ""
                  }`}
                  href={`/perfil?page=${Math.max(1, page - 1)}`}
                >
                  Anterior
                </Link>
                <Link
                  className={`rounded-md border border-slate-200 px-3 py-2 font-medium text-slate-700 hover:bg-slate-50 ${
                    logs.length < 50 ? "pointer-events-none opacity-40" : ""
                  }`}
                  href={`/perfil?page=${page + 1}`}
                >
                  Ver mais
                </Link>
              </div>
            </>
          ) : (
            <div className="px-5 py-8 text-sm text-slate-500">Nenhum registro de auditoria encontrado.</div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
