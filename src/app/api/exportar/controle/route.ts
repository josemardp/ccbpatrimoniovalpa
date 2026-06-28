import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getIpFromHeaders } from "@/lib/rate-limit";
import { CONTROLE_TAREFAS, FORM_148_ETAPAS, STATUS_LABELS, type StatusRotinaKey } from "@/lib/sprint1";

const XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseCompetencia(params: URLSearchParams) {
  const now = new Date();
  const ano = Number(params.get("ano") ?? now.getFullYear());
  const mes = Number(params.get("mes") ?? now.getMonth() + 1);

  return {
    ano: Number.isInteger(ano) && ano >= 2020 && ano <= 2100 ? ano : now.getFullYear(),
    mes: Number.isInteger(mes) && mes >= 1 && mes <= 12 ? mes : now.getMonth() + 1,
  };
}

function statusLabel(status?: string) {
  return STATUS_LABELS[(status as StatusRotinaKey) ?? "vazio"] ?? "—";
}

function workbookBuffer(workbook: XLSX.WorkBook) {
  return Buffer.from(XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer);
}

export async function GET(request: NextRequest) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.profile.papel !== "gestor_adm") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const ip = getIpFromHeaders(request.headers);
  if (!checkRateLimit(`export:controle:${currentUser.profile.id}:${ip}`, 30, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Muitas exportações. Tente novamente mais tarde." }, { status: 429 });
  }

  const { ano, mes } = parseCompetencia(request.nextUrl.searchParams);
  const [casas, form148Statuses, controles] = await Promise.all([
    prisma.casaOracao.findMany({
      where: { administracaoId: currentUser.profile.administracaoId, ativa: true },
      orderBy: { codigoSiga: "asc" },
      select: { id: true, codigoSiga: true, nome: true },
    }),
    prisma.form148Status.findMany({
      where: {
        administracaoId: currentUser.profile.administracaoId,
        competenciaAno: ano,
        competenciaMes: mes,
      },
      select: { casaOracaoId: true, etapa: true, status: true },
    }),
    prisma.controleMensal.findMany({
      where: {
        administracaoId: currentUser.profile.administracaoId,
        competenciaAno: ano,
        competenciaMes: mes,
      },
      select: { tarefaId: true, status: true },
    }),
  ]);

  const formRows = casas.map((casa) => {
    const row: Record<string, string> = { Casa: `${casa.codigoSiga} · ${casa.nome}` };
    FORM_148_ETAPAS.forEach((etapa) => {
      row[etapa.label] = statusLabel(
        form148Statuses.find((status) => status.casaOracaoId === casa.id && status.etapa === etapa.id)?.status,
      );
    });
    return row;
  });
  const controleRows = CONTROLE_TAREFAS.map((tarefa) => ({
    Tarefa: tarefa.label,
    Status: statusLabel(controles.find((controle) => controle.tarefaId === tarefa.id)?.status),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(formRows), "Form. 14.8");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(controleRows), "Controle Geral");

  const buffer = workbookBuffer(workbook);
  const filename = `controle-mensal-${ano}-${String(mes).padStart(2, "0")}.xlsx`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": XLSX_CONTENT_TYPE,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
