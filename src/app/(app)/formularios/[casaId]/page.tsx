import Link from "next/link";
import { getDocumentoUrl, listDocumentos } from "@/actions/documentos";
import { AppShell } from "@/components/app-shell";
import { DocumentoUploadDialog } from "@/components/documento-upload-dialog";
import { Form148HistoryTable } from "@/components/form148-history-table";
import { requireGestorAdm } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function parseCompetencia(searchParams: { ano?: string; mes?: string }) {
  const now = new Date();
  const ano = Number(searchParams.ano ?? now.getFullYear());
  const mes = Number(searchParams.mes ?? now.getMonth() + 1);

  return {
    ano: Number.isInteger(ano) && ano >= 2020 && ano <= 2100 ? ano : now.getFullYear(),
    mes: Number.isInteger(mes) && mes >= 1 && mes <= 12 ? mes : now.getMonth() + 1,
  };
}

function ultimasCompetencias(ano: number, mes: number) {
  const competencias: { ano: number; mes: number }[] = [];
  let cursorAno = ano;
  let cursorMes = mes;

  for (let index = 0; index < 12; index += 1) {
    competencias.push({ ano: cursorAno, mes: cursorMes });
    cursorMes -= 1;

    if (cursorMes === 0) {
      cursorMes = 12;
      cursorAno -= 1;
    }
  }

  return competencias;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function FormularioCasaPage({
  params,
  searchParams,
}: {
  params: { casaId: string };
  searchParams: { ano?: string; mes?: string };
}) {
  const { profile } = await requireGestorAdm();
  const competencia = parseCompetencia(searchParams);
  const competencias = ultimasCompetencias(competencia.ano, competencia.mes);
  const oldest = competencias[competencias.length - 1];
  const [casa, statuses, documentos] = await Promise.all([
    prisma.casaOracao.findFirst({
      where: { id: params.casaId, administracaoId: profile.administracaoId },
      select: { id: true, codigoSiga: true, nome: true, cidade: true },
    }),
    prisma.form148Status.findMany({
      where: {
        administracaoId: profile.administracaoId,
        casaOracaoId: params.casaId,
        OR: [
          {
            competenciaAno: competencia.ano,
            competenciaMes: { lte: competencia.mes },
          },
          {
            competenciaAno: oldest.ano,
            competenciaMes: { gte: oldest.mes },
          },
        ],
      },
      select: { competenciaAno: true, competenciaMes: true, etapa: true, status: true },
    }),
    listDocumentos(params.casaId, competencia.ano, competencia.mes),
  ]);
  const documentosComUrl = await Promise.allSettled(
    documentos.map(async (documento) => ({
      ...documento,
      signedUrl: await getDocumentoUrl(documento.storagePath),
    })),
  );
  const documentosResolvidos = documentosComUrl
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);

  if (!casa) {
    return (
      <AppShell subtitle="Formulários" title="Casa de Oração não encontrada" userEmail={profile.email} userName={profile.nome}>
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">A Casa de Oração solicitada não pertence a esta Administração.</p>
          <Link className="mt-4 inline-flex rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" href="/formularios">
            Voltar
          </Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      subtitle="Formulários"
      title={`Form. 14.8 — ${casa.codigoSiga}`}
      userEmail={profile.email}
      userName={profile.nome}
    >
      <div className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{casa.codigoSiga}</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">{casa.nome}</h2>
              <p className="mt-1 text-sm text-slate-500">{casa.cidade}</p>
            </div>
            <Link
              className="inline-flex w-fit rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              href={`/formularios?ano=${competencia.ano}&mes=${competencia.mes}`}
            >
              Voltar aos formulários
            </Link>
          </div>
        </section>

        <Form148HistoryTable casaId={casa.id} competencias={competencias} statuses={statuses} />

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Documentos</h2>
              <p className="text-sm text-slate-500">
                Formulários escaneados da competência {String(competencia.mes).padStart(2, "0")}/{competencia.ano}.
              </p>
            </div>
            <DocumentoUploadDialog casaId={casa.id} ano={competencia.ano} mes={competencia.mes} />
          </div>
          {documentosResolvidos.length > 0 ? (
            <div className="overflow-x-auto">
              <table aria-label="Documentos escaneados do Formulário 14.8" className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Documento</th>
                    <th className="px-5 py-3">Tipo</th>
                    <th className="px-5 py-3">Data</th>
                    <th className="px-5 py-3">Tamanho</th>
                    <th className="px-5 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documentosResolvidos.map((documento) => (
                    <tr key={documento.id}>
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-950">{documento.nomeOriginal}</div>
                        <div className="text-xs text-slate-500">
                          Enviado por {documento.uploadadoPor?.nome ?? documento.uploadadoPor?.email ?? "gestor"}
                        </div>
                      </td>
                      <td className="px-5 py-4 uppercase text-slate-600">{documento.tipo}</td>
                      <td className="px-5 py-4 text-slate-600">
                        {documento.createdAt.toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-5 py-4 text-slate-600">{formatBytes(documento.tamanhoBytes)}</td>
                      <td className="px-5 py-4 text-right">
                        <a
                          className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          href={documento.signedUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Visualizar
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 py-8 text-sm text-slate-500">
              Nenhum documento enviado para esta competência.
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
