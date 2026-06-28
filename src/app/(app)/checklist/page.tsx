import { AppShell } from "@/components/app-shell";
import { CasaEditDialog } from "@/components/casa-edit-dialog";
import { requireGestorAdm } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ChecklistPage() {
  const { profile } = await requireGestorAdm();
  const casas = await prisma.casaOracao.findMany({
    where: { administracaoId: profile.administracaoId },
    orderBy: { codigoSiga: "asc" },
  });

  return (
    <AppShell subtitle="Checklist" title="Checklist SIGA" userEmail={profile.email} userName={profile.nome}>
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-950">Casas de Oração</h2>
          <p className="text-sm text-slate-500">Dados operacionais usados pelos checklists e formulários.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Código SIGA</th>
                <th className="px-5 py-3">Casa</th>
                <th className="px-5 py-3">Ancião / Cooperador</th>
                <th className="px-5 py-3">Responsável Patrimônio</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {casas.map((casa) => (
                <tr key={casa.id}>
                  <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-950">{casa.codigoSiga}</td>
                  <td className="px-5 py-4">{casa.nome}</td>
                  <td className="px-5 py-4">{casa.anciaoCooperador ?? "-"}</td>
                  <td className="px-5 py-4">{casa.responsavelPatrimonio ?? "-"}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${casa.ativa ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {casa.ativa ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <CasaEditDialog casa={casa} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
