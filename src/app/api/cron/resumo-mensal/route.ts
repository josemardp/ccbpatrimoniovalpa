import { NextResponse, type NextRequest } from "next/server";
import { enviarResumoMensal, type ResumoPendencias } from "@/lib/email";
import { previousCompetencia } from "@/lib/pendencias";
import { prisma } from "@/lib/prisma";
import { CONTROLE_TAREFAS, FORM_148_ETAPAS } from "@/lib/sprint1";

export const dynamic = "force-dynamic";

function appUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

async function montarResumo(administracaoId: string, ano: number, mes: number): Promise<ResumoPendencias> {
  const [formPendencias, controlePendencias, totalBensRegistrados] = await Promise.all([
    prisma.form148Status.findMany({
      where: {
        administracaoId,
        competenciaAno: ano,
        competenciaMes: mes,
        status: { in: ["pendente", "vazio"] },
      },
      include: { casaOracao: { select: { codigoSiga: true, nome: true } } },
      orderBy: [{ casaOracao: { codigoSiga: "asc" } }, { etapa: "asc" }],
    }),
    prisma.controleMensal.findMany({
      where: {
        administracaoId,
        competenciaAno: ano,
        competenciaMes: mes,
        status: { in: ["pendente", "vazio"] },
      },
      orderBy: { tarefaId: "asc" },
    }),
    prisma.bemPatrimonial.count({ where: { administracaoId, ativo: true } }),
  ]);

  return {
    ano,
    mes,
    totalBensRegistrados,
    appUrl: appUrl(),
    form148: formPendencias.map((item) => ({
      casa: `${item.casaOracao.codigoSiga} · ${item.casaOracao.nome}`,
      competenciaAno: item.competenciaAno,
      competenciaMes: item.competenciaMes,
      descricao: FORM_148_ETAPAS.find((etapa) => etapa.id === item.etapa)?.label ?? item.etapa,
      status: item.status,
    })),
    controleGeral: controlePendencias.map((item) => ({
      competenciaAno: item.competenciaAno,
      competenciaMes: item.competenciaMes,
      descricao: CONTROLE_TAREFAS.find((tarefa) => tarefa.id === item.tarefaId)?.label ?? item.tarefaId,
      status: item.status,
    })),
  };
}

export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!expected || authorization !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const anterior = previousCompetencia();
  const gestores = await prisma.usuario.findMany({
    where: { papel: "gestor_adm", ativo: true, email: { not: "" } },
    select: { email: true, administracaoId: true },
  });
  let enviados = 0;
  const erros: { email: string; erro: string }[] = [];

  for (const gestor of gestores) {
    try {
      const resumo = await montarResumo(gestor.administracaoId, anterior.ano, anterior.mes);
      await enviarResumoMensal(gestor.email, resumo);
      enviados += 1;
    } catch (error) {
      erros.push({ email: gestor.email, erro: error instanceof Error ? error.message : "Erro desconhecido" });
    }
  }

  return NextResponse.json({ enviados, erros });
}
