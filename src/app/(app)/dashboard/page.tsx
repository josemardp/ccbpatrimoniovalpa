import { prisma } from "@/lib/prisma";
import { requireGestorAdm } from "@/lib/auth";

export default async function DashboardPage() {
  const { profile } = await requireGestorAdm();
  const administracao = await prisma.administracao.findUnique({
    where: { id: profile.administracaoId },
    include: { casas: { orderBy: { codigoSiga: "asc" } } },
  });

  if (!administracao) {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">Administração não encontrada.</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Administração</p>
        <div className="mt-2 grid gap-4 lg:grid-cols-4">
          <div>
            <div className="text-sm text-slate-500">Nome</div>
            <div className="font-semibold text-slate-950">{administracao.nome}</div>
          </div>
          <div>
            <div className="text-sm text-slate-500">CNPJ</div>
            <div className="font-semibold text-slate-950">{administracao.cnpj}</div>
          </div>
          <div>
            <div className="text-sm text-slate-500">Responsável</div>
            <div className="font-semibold text-slate-950">{administracao.responsavelPatrimonio}</div>
          </div>
          <div>
            <div className="text-sm text-slate-500">Regional</div>
            <div className="font-semibold text-slate-950">{administracao.regional}</div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-950">Casas de Oração cadastradas</h2>
          <p className="text-sm text-slate-500">Seed fixo da Sprint 0, conforme plano de sprints.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3">Código SIGA</th>
                <th className="px-6 py-3">Casa de Oração</th>
                <th className="px-6 py-3">Cidade</th>
                <th className="px-6 py-3">Ministério local</th>
                <th className="px-6 py-3">Resp. Patrimônio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {administracao.casas.map((casa) => (
                <tr key={casa.id}>
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-950">{casa.codigoSiga}</td>
                  <td className="px-6 py-4">{casa.nome}</td>
                  <td className="px-6 py-4">{casa.cidade}/{casa.uf}</td>
                  <td className="px-6 py-4">{casa.anciaoCooperador ?? "-"}</td>
                  <td className="px-6 py-4">{casa.responsavelPatrimonio ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
