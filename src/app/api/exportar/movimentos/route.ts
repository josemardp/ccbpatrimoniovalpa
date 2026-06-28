import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getIpFromHeaders } from "@/lib/rate-limit";

const XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export const dynamic = "force-dynamic";

const TIPO_LABELS = {
  entrada: "Entrada",
  saida: "Saída",
  transferencia: "Transferência",
  baixa: "Baixa",
} as const;

function parseCompetencia(params: URLSearchParams) {
  const anoParam = params.get("ano");
  const mesParam = params.get("mes");

  if (!anoParam || !mesParam) {
    return null;
  }

  const ano = Number(anoParam);
  const mes = Number(mesParam);

  if (!Number.isInteger(ano) || ano < 2020 || ano > 2100 || !Number.isInteger(mes) || mes < 1 || mes > 12) {
    return null;
  }

  return { ano, mes };
}

function casaLabel(casa?: { codigoSiga: string; nome: string } | null) {
  return casa ? `${casa.codigoSiga} · ${casa.nome}` : "";
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
  if (!checkRateLimit(`export:movimentos:${currentUser.profile.id}:${ip}`, 30, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Muitas exportações. Tente novamente mais tarde." }, { status: 429 });
  }

  const competencia = parseCompetencia(request.nextUrl.searchParams);
  const where = {
    administracaoId: currentUser.profile.administracaoId,
    ...(competencia
      ? {
          dataMovimento: {
            gte: new Date(competencia.ano, competencia.mes - 1, 1),
            lt: new Date(competencia.ano, competencia.mes, 1),
          },
        }
      : {}),
  };

  const movimentos = await prisma.movimento.findMany({
    where,
    orderBy: { dataMovimento: "desc" },
    include: {
      casaOrigem: { select: { codigoSiga: true, nome: true } },
      casaDestino: { select: { codigoSiga: true, nome: true } },
      registradoPor: { select: { nome: true, email: true } },
    },
  });

  const rows = movimentos.map((movimento) => ({
    Data: movimento.dataMovimento.toLocaleDateString("pt-BR"),
    Tipo: TIPO_LABELS[movimento.tipo],
    Descrição: movimento.descricao,
    "Casa Origem": casaLabel(movimento.casaOrigem),
    "Casa Destino": casaLabel(movimento.casaDestino),
    "Registrado por": movimento.registradoPor?.nome ?? movimento.registradoPor?.email ?? "",
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Movimentos");

  const buffer = workbookBuffer(workbook);
  const suffix = competencia ? `${competencia.ano}-${String(competencia.mes).padStart(2, "0")}` : "todos";
  const filename = `movimentos-${suffix}.xlsx`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": XLSX_CONTENT_TYPE,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
