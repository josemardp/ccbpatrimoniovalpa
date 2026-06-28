"use server";

import type { Prisma, TipoMovimento } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TIPOS_MOVIMENTO = ["entrada", "saida", "transferencia", "baixa"] as const;

type MovimentoFiltros = {
  tipo?: string;
  casaId?: string;
  mes?: number;
  ano?: number;
  page?: number;
};

async function requireGestorForAction() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error("Sessão ausente. Faça login novamente.");
  }

  if (currentUser.profile.papel !== "gestor_adm") {
    throw new Error("Apenas usuários gestor_adm podem gerenciar movimentos.");
  }

  return currentUser.profile;
}

function validateTipo(tipo: string): TipoMovimento {
  if (!TIPOS_MOVIMENTO.includes(tipo as TipoMovimento)) {
    throw new Error("Tipo de movimento inválido.");
  }

  return tipo as TipoMovimento;
}

function parseOptionalCasaId(value: FormDataEntryValue | null) {
  const parsed = String(value ?? "").trim();
  return parsed.length > 0 ? parsed : null;
}

function parseDate(value: FormDataEntryValue | null) {
  const raw = String(value ?? "");
  const date = new Date(`${raw}T12:00:00`);

  if (!raw || Number.isNaN(date.getTime())) {
    throw new Error("Data do movimento inválida.");
  }

  return date;
}

async function ensureCasaBelongsToAdmin(casaId: string | null, administracaoId: string) {
  if (!casaId) {
    return;
  }

  const casa = await prisma.casaOracao.findFirst({
    where: { id: casaId, administracaoId, ativa: true },
    select: { id: true },
  });

  if (!casa) {
    throw new Error("Casa de Oração inválida para esta Administração.");
  }
}

function validateCasasPorTipo(tipo: TipoMovimento, casaOrigemId: string | null, casaDestinoId: string | null) {
  if (tipo === "entrada" && !casaDestinoId) {
    throw new Error("Movimento de entrada exige Casa de destino.");
  }

  if ((tipo === "saida" || tipo === "baixa") && !casaOrigemId) {
    throw new Error("Movimento de saída/baixa exige Casa de origem.");
  }

  if (tipo === "transferencia" && (!casaOrigemId || !casaDestinoId)) {
    throw new Error("Transferência exige Casa de origem e destino.");
  }

  if (tipo === "transferencia" && casaOrigemId === casaDestinoId) {
    throw new Error("Transferência exige Casas diferentes.");
  }
}

export async function listMovimentos(filtros: MovimentoFiltros = {}) {
  const profile = await requireGestorForAction();
  const page = Number.isInteger(filtros.page) && filtros.page && filtros.page > 0 ? filtros.page : 1;
  const where: Prisma.MovimentoWhereInput = { administracaoId: profile.administracaoId };

  if (filtros.tipo) {
    where.tipo = validateTipo(filtros.tipo);
  }

  if (filtros.casaId) {
    where.OR = [{ casaOrigemId: filtros.casaId }, { casaDestinoId: filtros.casaId }];
  }

  if (filtros.ano && filtros.mes && filtros.mes >= 1 && filtros.mes <= 12) {
    const start = new Date(filtros.ano, filtros.mes - 1, 1);
    const end = new Date(filtros.ano, filtros.mes, 1);
    where.dataMovimento = { gte: start, lt: end };
  }

  return prisma.movimento.findMany({
    where,
    orderBy: { dataMovimento: "desc" },
    skip: (page - 1) * 20,
    take: 20,
    include: {
      casaOrigem: { select: { codigoSiga: true, nome: true } },
      casaDestino: { select: { codigoSiga: true, nome: true } },
      registradoPor: { select: { nome: true, email: true } },
    },
  });
}

export async function criarMovimento(dados: FormData) {
  const profile = await requireGestorForAction();
  const tipo = validateTipo(String(dados.get("tipo") ?? ""));
  const descricao = String(dados.get("descricao") ?? "").trim();
  const dataMovimento = parseDate(dados.get("dataMovimento"));
  const casaOrigemId = parseOptionalCasaId(dados.get("casaOrigemId"));
  const casaDestinoId = parseOptionalCasaId(dados.get("casaDestinoId"));
  const documento = String(dados.get("documento") ?? "").trim() || null;

  if (descricao.length < 3) {
    throw new Error("Descrição do movimento é obrigatória.");
  }

  validateCasasPorTipo(tipo, casaOrigemId, casaDestinoId);
  await Promise.all([
    ensureCasaBelongsToAdmin(casaOrigemId, profile.administracaoId),
    ensureCasaBelongsToAdmin(casaDestinoId, profile.administracaoId),
  ]);

  const movimento = await prisma.movimento.create({
    data: {
      administracaoId: profile.administracaoId,
      tipo,
      descricao,
      dataMovimento,
      casaOrigemId,
      casaDestinoId,
      documento,
      registradoPorId: profile.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      usuarioId: profile.id,
      administracaoId: profile.administracaoId,
      action: "movimento.create",
      entity: "Movimento",
      entityId: movimento.id,
      metadata: {
        tipo,
        casaOrigemId,
        casaDestinoId,
        dataMovimento: dataMovimento.toISOString(),
      },
    },
  });

  revalidatePath("/movimentos");
}
